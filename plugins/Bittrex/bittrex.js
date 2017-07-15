exports.commands = [
	"bittrex"
]


try {
	var Auth = require("../../auth.json");
} catch (e) {
	console.log("Couldn't load auth.json. error: " + e);
}

const bittrexApi = require("node.bittrex.api");
const _ = require('underscore');

bittrexApi.options({
    'stream': false,
    'verbose': true,
    'cleartext': true,
    'baseUrl': 'https://bittrex.com/api/v1.1'
});

const NodeCache = require("node-cache");
const bittrexCache = new NodeCache({ stdTTL: 60, checkperiod: 60 });

exports.bittrex = {
	usage: "<Coin> <Coin>",
	description: "Fetch coin market value from ***Bittrex***",
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
			getTicker([baseCoin, coin].join('-')).then(result => {
				response.edit({
					embed: {
						color: 3447003,
						title: "Bittrex ("+ baseCoin + ":" + coin + ") :bar_chart:",
						fields: [
							{
								name: "Bid",
								value: "" + result.Bid,
								inline: true
							},
							{
								name: "Ask",
								value: "" + result.Ask,
								inline: true
							},
							{
								name: "Last",
								value: "" + result.Last,
								inline: true
							},
						]
					}
				});
			}, error => {
				response.edit('Oops! recieved an error:' + error);
			});
		});
	}
}

function getTicker(marketName) {
	return new Promise((resolve, reject) => {
		try {
			bittrexApi.getticker({market: marketName}, (ticker) => {
				ticker = JSON.parse(ticker);
				if (ticker.success === false) {
					reject(success.message);
				} else {
					console.log(ticker.result);
					resolve(ticker.result);
				}
			});
		} catch(e) {
			if (e.code == 'ETIMEDOUT') {
				reject('Timed out');
			}
		}
	});
}
