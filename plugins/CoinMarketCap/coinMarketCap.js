exports.commands = [
	"coinmarketcap",
	"coinmarketcap_notify"
]

const NodeCache = require("node-cache");
const coinmarketcapCache = new NodeCache({ stdTTL: 30, checkperiod: 40 });
const request = require('request');
const _ = require('underscore');
const path = require('path');
const Datastore = require('nedb');
const db = new Datastore({ filename: path.normalize(__dirname + '/../../notify.db' ) });
db.loadDatabase(function (err) {    // Callback is optional
  // Now commands will be executed
});

const currencies = ["AUD", "BRL", "CAD", "CHF", "CNY", "EUR", "GBP", "HKD", "IDR", "INR", "JPY", "KRW", "MXN", "RUB"]

exports.coinmarketcap = {
	usage: "<coin> <currency>",
	description: "Fetch coin from ***Coin Market Cap***\nAvailable Currency: " + currencies.join(', '),
	process: function(bot, msg, suffix) {
		suffix = _.reject(suffix.toUpperCase().split(" "),function (value) {
			return value === null || value === '';
		});
		
		let coin = suffix[0];
		let currency = suffix.length > 1 ? suffix[1] : 'USD';  
		
		if (typeof coin === 'undefined') {
			return response.edit('Please define a coin');
		}

		msg.channel.send('Loading...').then(response => {
			let lcurrency = currency.toLowerCase();
			getTicker(currency).then(result => {
				result = _.find(result, (x) => {
					return x.symbol === coin;
				});

				if (result.length > 0) {
					result = result[0];
					response.edit({
						embed: {
							color: '3447003',
							title: "Coin Market Cap ("+ result.name +") :chart_with_upwards_trend:",
							fields: [
								{
									name: currency,
									value: result['price_' + lcurrency],
									inline: true
								},
								{
									name: "BTC",
									value: result['price_btc'],
									inline: true
								},
								{
									name: "Rank",
									value: result.rank,
									inline: true
								},
								{
									name: "1 Hour %",
									value: getThumb(result.percent_change_1h),
									inline: true
								},
								{
									name: "12 Hours %",
									value: getThumb(result.percent_change_24h),
									inline: true
								},
								{
									name: "7 Days %",
									value: getThumb(result.percent_change_7d),
									inline: true
								}
							],
							timestamp: new Date()
						}
					});
					console.log(result.percent_change_7d);
				} else {
					response.edit('Invalid Coin');
				}
			}, error => {
				console.log('Oops! ' + error);
			});
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

function getTicker(currency) {
	return new Promise((resolve, reject) => {
		coinmarketcapCache.get('coinmarketcapCache' + currency, function (err, value) {
			if (!err) {
				if (value == undefined) {
						request.get('https://api.coinmarketcap.com/v1/ticker/?limit=200&convert=' + currency, { timeout: 30000 }, (err, result) => {
							if (err) {
								reject(err.message);
							} else {
								result = JSON.parse(result.body);
								coinmarketcapCache.set('coinmarketcapCache' + currency, result)
								resolve(result);
							}
						}, (error) => {
							if (_.contains(['ETIMEDOUT', 'ESOCKETTIMEDOUT'], error.code)) {
								reject('Request Timeout');
							} else {
								reject(error.code);
							}
						});
				} else {
					resolve(value);
				}
			}
		});
	});
}
