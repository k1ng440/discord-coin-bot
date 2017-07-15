exports.commands = [
	"poloniex"
]


try {
	var Auth = require("../../auth.json");
} catch (e) {
	console.log("Couldn't load auth.json. error: " + e);
}

const Poloniex = require('poloniex-api-node');
const poloniex = new Poloniex(Auth.poloniex_api, Auth.poloniex_secret, { socketTimeout: 130000 });
const NodeCache = require("node-cache");
const poloniexCache = new NodeCache({ stdTTL: 60, checkperiod: 60 });
const _ = require('underscore');

exports.poloniex = {
	usage: "<Coin> <Coin>",
	description: "Fetch coin market value. from ***Poloniex***",
	process: function (bot, msg, suffix) {
		let coins = _.reject(suffix.toUpperCase().split(" "),function (value) {
			return value === null || value === '';
		});
		
		let baseCoin = coins.length > 1 ? coins[0] : 'BTC';  
		let coin = coins.length > 1 ? coins[1] : coins[0];
		var xCoin = [baseCoin, coin].join('_');
		
		if (baseCoin === coin) {
			return response.edit('Cannot compare ' + baseCoin + ' to itself');
		} else if (typeof coin === 'undefined') {
			return response.edit('Please define a coin');
		}

		msg.channel.send('Loading...').then(response => {
			if (baseCoin === coin) {
				return response.edit('Cannot compare ' + baseCoin + ' to itself');
			}

			getTicker().then(result => {
				
				if (result[xCoin]) {
					result = result[xCoin];
					response.edit({
						embed: {
							color: 3447003,
							title: "Poloniex ("+ baseCoin + ":" + coin + ")",
							fields: [
								{
									name: "Last",
									value: result.last,
								},
								{
									name: "Percent Change",
									value: result.percentChange,
									inline: true
								},
								{
									name: "High 24 Hours",
									value: result.high24hr,
									inline: true
								},
								{
									name: "Low 24 Hours",
									value: result.low24hr,
									inline: true
								}
							]
						}
					});
				} else {
					response.edit('Invalid Coin');
				}
			}, error => {
				response.edit('Oops! recieved an error:' + error);
			});
		});
	}
}



function getTicker() {
	return new Promise((resolve, reject) => {
		poloniexCache.get('poloniexCache', function (err, value) {
			if (!err) {
				if (value == undefined) {
					try {
						poloniex.returnTicker((err, ticker) => {
							if (err) {
								reject(err.message);
							} else {
								poloniexCache.set('poloniexCache', ticker)
								resolve(ticker);
							}
						});
					} catch(e) {
						if (e.code == 'ETIMEDOUT') {
							reject('Timed out');
						}
					}
				} else {
					resolve(value);
				}
			}
		});
	});
}
