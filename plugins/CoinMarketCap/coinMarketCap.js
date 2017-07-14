exports.commands = [
	"coinmarketcap",
	"coinmarketcap_notify"
]

const NodeCache = require("node-cache");
const coinmarketcapCache = new NodeCache({ stdTTL: 60, checkperiod: 60 });
const request = require('request');
const cheerio = require("cheerio");
const _ = require('underscore');
const path = require('path');
const Datastore = require('nedb');
const db = new Datastore({ filename: path.normalize(__dirname + '/../../notify.db') });
const CMC = require('./coinMarketCapApi');

// db.loadDatabase(function (err) {    // Callback is optional
// 	// Now commands will be executed
// });

const currencies = [ "USD", "BTC", "AUD", "BRL", "CAD", "CHF", "CNY", "EUR", "GBP", "HKD", "IDR", "INR", "JPY", "KRW", "MXN", "RUB" ]


const cmc = new CMC(10);

exports.coinmarketcap = {
	usage: "<coin> <currency>",
	description: "Fetch coin from ***Coin Market Cap***\n    *Available Currency: " + currencies.join(', ') + "*",
	process: function (bot, msg, suffix) {
		suffix = _.reject(suffix.toUpperCase().split(" "), function (value) {
			return value === null || value === '';
		});

		let coin = suffix[ 0 ];
		let currency = suffix.length > 1 ? suffix[ 1 ] : 'USD';

		if (typeof coin === 'undefined') {
			return response.edit('Please define a coin');
		}

		msg.channel.send('Loading...').then(response => {
			let lcurrency = currency.toLowerCase();
			result = cmc.getPrice(coin, currency);
			if (result) {
				response.edit({
					embed: {
						color: '3447003',
						url: result.url,
						title: "Coin Market Cap (" + result.name + ") :chart_with_upwards_trend:",
						fields: [
							{
								name: 'Price',
								value: result.price,
								inline: true
							},
							{
								name: "Bitcoin",
								value: result[ 'price_btc' ],
								inline: true
							},
							{
								name: "Etherum",
								value: result[ 'price_eth' ],
								inline: true
							},
							{
								name: "Rank",
								value: result.rank,
								inline: true
							},
							{
								name: "Market Cap",
								value: result.market_cap,
								inline: true
							},
							{
								name: "Total Supply",
								value: result.supply,
								inline: true
							},
							{
								name: "1 Hour %",
								value: getThumb(result.change[ '1h' ]),
								inline: true
							},
							{
								name: "12 Hours %",
								value: getThumb(result.change[ '24h' ]),
								inline: true
							},
							{
								name: "7 Days %",
								value: getThumb(result.change[ '7d' ]),
								inline: true
							}
						],
						footer: {
							icon_url: result.icon,
							text: "Last Update: " + result.last_update
						}
					}
				});
			} else {
				response.edit('Invalid Coin');
			}
		});
	}
}

exports.coinmarketcap_notify = {

}

function getThumb(value) {
	if (value.charAt(0) === '-') {
		return value.substring(1) + ':small_red_triangle_down:'
	} else {
		return value + ':small_red_triangle:'
	}
}
