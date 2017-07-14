exports.commands = [
	"create",
	"servers",
	"topic"
]

exports.create = {
	usage: "<channel name>",
	description: "creates a new text channel with the given name.",
	process: function(bot,msg,suffix) {
		msg.channel.guild.createChannel(suffix,"text").then(function(channel) {
			msg.channel.sendMessage("created " + channel);
		}).catch(function(error){
			msg.channel.sendMessage("failed to create channel: " + error);
		});
	}
}

exports.servers = {
	description: "Tells you what servers the bot is in",
	process: function(bot,msg) {
		msg.channel.sendMessage(`__**${bot.user.username} is currently on the following servers:**__ \n\n${bot.guilds.map(g => `${g.name} - **${g.memberCount} Members**`).join(`\n`)}`, {split: true});
	}
};

exports.topic = {
	usage: "[topic]",
	description: 'Sets the topic for the channel. No topic removes the topic.',
	process: function(bot,msg,suffix) {
		msg.channel.setTopic(suffix);
	}
}
