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
const db = new Datastore({ filename: path.normalize(__dirname + '/../notify.db' ) });
db.loadDatabase(function (err) {    // Callback is optional
  // Now commands will be executed
});

console.log(path.normalize(__dirname + '/../../notify.db' ));


exports.coinmarketcap = {
	usage: "<coin> <currency>",
	description: "Fetch coin from ***Coin Market Cap***",
	process: function(bot, msg, suffix) {
		suffix = _.reject(suffix.toUpperCase().split(" "),function (value) {
			return value === null || value === '';
		});
		
		let baseCoin = coins.length > 1 ? coins[0] : 'BTC';  
		let coin = coins.length > 1 ? coins[1] : coins[0];
		var xCoin = [baseCoin, coin].join('_');

		msg.channel.send('Loading...').then(response => {
			getTicker().then(result => {
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
					try {
						request.get('https://api.coinmarketcap.com/v1/ticker/?convert=' + currency, { timeout: 30000 }, function(err, result) {
							if (err) {
								reject(err.message);
							} else {
								result = JSON.parse(result.body);
								coinmarketcapCache.set('coinmarketcapCache' + currency, result)
								resolve(result);
							}
						});
					} catch(e) {
						if (_.contains(['ETIMEDOUT', 'ESOCKETTIMEDOUT'], e.message)) {
							reject('Request timed out');
						} else {
							reject(e.message);
						}
					}
				} else {
					resolve(value);
				}
			}
		});
	});
}
