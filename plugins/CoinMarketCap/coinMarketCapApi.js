const request = require('request');
const cheerio = require("cheerio");
const _ = require('underscore');
const NodeCache = require("node-cache");
const moment = require('moment');

module.exports = class CoinMarketCap {
    constructor(fetchEverySecond) {
        this.cache = new NodeCache({ stdTTL: 60, checkperiod: 60 });
        this.fetching = false;
        this.lastUpdate = null;
        this.data = [];
        this.currencyExchangeRates = [];
        this.currencySymbols = {
            "eth": "Ξ",
            "btc": "Ƀ",
            "usd": "$",
            "eur": "€",
            "cny": "¥",
            "gbp": "£",
            "cad": "$",
            "rub": "rub",
            "hkd": "$",
            "jpy": "¥",
            "aud": "$",
            "brl": "R$",
            "inr": "₹",
            "krw": "₩",
            "mxn": "$",
            "idr": "Rp",
            "chf": "Fr",
        };

        if (fetchEverySecond) {
            this.fetchAll();
            setInterval(() => {
                if (this.fetching === false) {
                    this.fetchAll();
                }
            }, fetchEverySecond * 1000);
        }
    }

    getPrice(coin, currency) {
        currency = currency.toLowerCase();
        let currentTime = moment.utc();
        let result = _.find(this.data, (x) => {
            return _.contains([ x.symbol, x.name ], coin);
        });

        if (!result) {
            return false;
        } else {
            return {
                "rank": result.rank,
                "name": result.name,
                "symbol": result.symbol,
                "url": result.url,
                "icon": result.icon,
                "market_cap": result.market_cap[currency],
                "price": result.price[currency],
                "price_btc": result.price['btc'],
                "price_eth": result.price['eth'],
                "supply": result.supply,
                "volume": result.volume[currency],
                "change": {
                    "1h": result.change['1h'],
                    "24h": result.change['24h'],
                    "7d": result.change['7d']
                },
                'last_update': moment(new Date(this.lastUpdate)).fromNow()
            };
        }
    }

    fetchAll() {
        const self = this;
        return new Promise((resolve, reject) => {
            this.cache.get('coinmarketcapCache', function (err, value) {
                if (!err) {
                    if (value == undefined) {
                        self.fetching = true;
                        request('https://coinmarketcap.com/all/views/all/', { timeout: 30000 }, (error, response, body) => {
                            self.fetching = false;
                            self.data = [];

                            if (!error && response.statusCode == 200) {
                                const $ = cheerio.load(body);

                                self.lastUpdate = moment(new Date($("p.small").text().replace('Last updated: ', '')));
                                self.currencyExchangeRates = $("#currency-exchange-rates").data();
                                $("table#currencies-all tr").each(function (i) {
                                    if (i > 0) {
                                        var td = $(this).find("td");
                                        var rank = td.eq(0).text().trim();
                                        var icon = $(this).find("img.currency-logo").attr("src");
                                        var name = $(this).find('td.currency-name a').text().replace("/", "").trim();
                                        var url = 'https://coinmarketcap.com' + $(this).find('td.currency-name a').attr('href');
                                        var symbol = td.eq(2).text().trim();
                                        var marketCap = self.currencyDictionary($(this).find('td.market-cap'));
                                        var price = self.currencyDictionary($(this).find("a.price"));
                                        var supply = self.format_crypto_volume(parseInt(td.eq(5).find('a').data('supply')));
                                        var volume = self.currencyDictionary($(this).find("a.volume"));
                                        var change1h = td.eq(7).text().replace("%", "").trim();
                                        var change24h = td.eq(8).text().replace("%", "").trim();
                                        var change7d = td.eq(9).text().replace("%", "").trim();
                                        var timestamp = Date.now() / 1000;
                                        self.data.push({
                                            "rank": rank,
                                            "name": name,
                                            "url": url,
                                            "symbol": symbol,
                                            "icon": icon,
                                            "market_cap": marketCap,
                                            "price": price,
                                            "supply": supply,
                                            "volume": volume,
                                            "change": {
                                                "1h": change1h,
                                                "24h": change24h,
                                                "7d": change7d
                                            }
                                        });
                                    }
                                });

                                self.cache.set('coinmarketcapCache', self.data);
                                resolve(self.data);
                            }
                        });
                    } else {
                        resolve(value);
                    }
                } else {
                    resolve(value);
                }
            });
        });
    }

    currencyDictionary(item) {
        let resultArray = {};
        Object.keys(this.currencyExchangeRates).forEach((currency) => {
            let currency_lowercase = currency.toLowerCase();

            if (currency == "btc") {
                var result = "btc" + parseFloat(item.data("btc"));
            } else {
                let amount = item.data("usd");
                let foreign_amount = parseFloat(this.currencyExchangeRates[ currency_lowercase ]);

                if (amount === "None") {
                    amount = "?";
                }
                if (amount != "?") {
                    amount = parseFloat(amount) / foreign_amount
                    amount = this.currencySymbols[ currency_lowercase ] + this.format_fiat(amount);
                }

                var result = amount;
            }

            resultArray[ currency ] = result;
        });
        
        resultArray["btc"] = "btc" + parseFloat(item.data("btc"));

        return resultArray;
    }

    format_market_cap(val) {
        return Math.round(val).toLocaleString();
    }

    format_fiat(val) {
        if (val >= 1) {
            if (val >= 100000) {
                val = Math.round(val).toLocaleString();
            } else {
                val = val.toFixed(2);
            }
        } else {
            if (val < 0.000001) {
                val = val.toPrecision(2)
            } else {
                val = val.toFixed(6);
            }
        }
        return val;
    }

    format_crypto(val) {
        if (val >= 1000) {
            val = Math.round(val).toLocaleString();
        } else if (val >= 1) {
            val = val.toFixed(8);
        } else {
            if (val < 0.00000001) {
                val = val.toPrecision(4)
            } else {
                val = val.toFixed(8);
            }
        }
        return val;
    }

    format_crypto_volume(val) {
        if (val >= 1) {
            val = Math.round(val).toLocaleString();
        } else {
            val = val.toFixed(2);
        }
        return val;
    }
}
