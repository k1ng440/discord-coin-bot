const Api = require('./cryptocompareApi');
const _ = require('underscore');

exports.commands = [
    "cryptocompare",
    // "cryptocompare_notify"
]

const currencySymbols = {
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


exports.cryptocompare = {
    usage: "<From currency / coin> <To currency / coin> <exchange>",
    description: "Fetch coin from ***CryptoCompare***",
    process: function (bot, msg, suffix) {
        suffix = _.reject(suffix.toUpperCase().split(" "), function (value) {
            return value === null || value === '';
        });

        let fromSymbol = suffix[ 0 ];
        let toSymbol = suffix.length > 1 ? suffix[ 1 ] : 'USD';
        let exchange = suffix.length > 2 ? suffix[ 2 ] : null;

        let options = {
            exchange: exchange
        };

        if (typeof fromSymbol === 'undefined') {
            return msg.channel.send('Please define a coin');
        }

        if (!/^[a-zA-Z]*$/g.test(fromSymbol)) {
            return msg.channel.send('Please define a valid <From currency / coin>');
        }

        if (!/^[a-zA-Z]*$/g.test(toSymbol)) {
            return msg.channel.send('Please define a valid <To currency / coin>');
        }

        msg.channel.send('Loading...').then(response => {
            try {
                Api.priceFull(fromSymbol, toSymbol, options).then(result => {

                    const displayResult = result.DISPLAY[ fromSymbol ][ toSymbol ];
                    const rawResult = result.RAW[ fromSymbol ][ toSymbol ];
                    response.edit({
                        embed: {
                            color: '3447003',
                            title: "CryptoCompare (" + rawResult.FROMSYMBOL + " => " + rawResult.TOSYMBOL + ")",
                            fields: [
                                {
                                    name: 'Price',
                                    value: displayResult.PRICE,
                                    inline: true
                                },
                                {
                                    name: "Market Cap",
                                    value: displayResult.MKTCAP,
                                    inline: true
                                },
                                {
                                    name: "Total Supply",
                                    value: displayResult.SUPPLY,
                                    inline: true
                                },
                                {
                                    name: "Open 24 hours",
                                    value: displayResult.OPEN24HOUR,
                                    inline: true
                                },
                                {
                                    name: "High 24 hours",
                                    value: displayResult.HIGH24HOUR,
                                    inline: true
                                },
                                {
                                    name: "Low 24 hours",
                                    value: displayResult.LOW24HOUR,
                                    inline: true
                                },
                            ],
                            footer: {
                                text: "Last Update: " + displayResult.LASTUPDATE
                            }
                        }
                    });
                }, error => {
                    if (error.indexOf('There is no data for any of the') !== -1) {
                        return response.edit('Invalid coin / currency.');
                    } else {
                        return response.edit(error);
                    }
                });
            } catch (e) {
                return response.edit('Invalid coin / currency.');
            }
        });
    }
};
