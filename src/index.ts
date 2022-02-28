import * as Discord from 'discord.js';
import * as ElementRefresher from './refreshElements';
import * as logger from './logger';

const token = process.env.DAO_BOT_TOKEN;

const botClient = new Discord.Client({
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Discord.Intents.FLAGS.GUILD_PRESENCES,
		Discord.Intents.FLAGS.GUILD_MEMBERS,
		Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING
	]
});

botClient.on('ready', (client) => {
	logger.log("Heavenly Dao Bot is ready to cultivate!");
});

function delayedDeleteMessage(message: Discord.Message) {
	message.fetch().then(msg => msg.delete());
}

async function onNewMember(member: Discord.GuildMember) {
	let guild = await member.guild.fetch();
	let channel = await guild.systemChannel?.fetch()
	if (channel) {
		channel.send("Welcome fellow daoist <@" + member.id + ">! Pay your respects to your senior brothers/sisters :smile:");
	}
}

const commands = new Map();

commands.set("hello", async function (msg: Discord.Message, args: string[]) {
	let channel = msg.channel;
	let user = msg.author;
	if (msg.deletable) {
		setTimeout(() => { delayedDeleteMessage(msg) }, 500);
	}
	channel.send("Hello fellow daoist <@" + user.id + ">!");
	return;
});

commands.set("broadhello", async function (msg: Discord.Message, args: string[]) {
	let channel = msg.channel;
	let userId = msg.author.id;
	let guildId = msg.guildId;
	let guild = await botClient.guilds.fetch(guildId as Discord.Snowflake);
	let user = await guild.members.fetch(userId);
	if (user.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
		let time = new Date(msg.createdTimestamp);
		let hours = time.getUTCHours() - 4;
		if (hours < 0) {
			hours += 24;
		}
		let returnMessage = "Good morning fellow daoists!";
		if (hours >= 12) {
			returnMessage = "Good afternoon fellow daoists!"
		}
		else if (hours >= 18) {
			returnMessage = "Good evening fellow daoists!"
		}
		else if (hours >= 23 || hours < 5) {
			returnMessage = "Good night fellow daoists!"
		}
		channel.send(returnMessage);
		if (msg.deletable) {
			setTimeout(() => { delayedDeleteMessage(msg) }, 500);
		}
	}
	return;
});

commands.set("refresh", async function (msg: Discord.Message, args: string[]) {
	let userId = msg.author.id;
	let guildId = msg.guildId;
	let guild = await botClient.guilds.fetch(guildId as Discord.Snowflake);
	let user = await guild.members.fetch(userId);
	if (msg.guild) ElementRefresher.refreshElements(botClient, msg.guild.id);
	if (msg.deletable) {
		if (user.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
			setTimeout(() => { delayedDeleteMessage(msg) }, 500);
		}
	}
	return;
});

commands.set("help", async function (msg: Discord.Message, args: string[]) {
	let channel = msg.channel;
	let user = msg.author;
	if (msg.deletable) {
		setTimeout(() => { delayedDeleteMessage(msg) }, 500);
	}
	channel.sendTyping();
	setTimeout(async () => {
		await channel.send("I can't do much for you <@" + user.id + ">!");
		await channel.sendTyping();
		setTimeout(async () => {
			await channel.send("All I can do is respond to you if you do `dao!hello`");
			await channel.sendTyping();
			setTimeout(async () => {
				await channel.send("Or ask for help like `dao!help`");
				await channel.sendTyping();
				setTimeout(async () => {
					await channel.send("I can do much more, but it's limited to the administrators.");
				}, 1000);
			}, 1000);
		}, 1200);
	}, 600);
	return;
});

commands.set("aspect", async function (msg: Discord.Message, args: string[]) {
	let embed = new Discord.MessageEmbed();
	let authored = false;
	let author = "";
	let imaged = false;
	let image = "";
	let titled = false;
	let title = "";
	let modifiedArgs = args;
	if (msg.deletable) {
		setTimeout(() => { delayedDeleteMessage(msg) }, 500);
	}
	let channel = msg.channel;
	channel.sendTyping();
	if (modifiedArgs.length > 0 && args[0].startsWith("<@")) {
		authored = true;
		author = modifiedArgs.splice(0, 1)[0];
	}
	if (modifiedArgs.length > 0 && modifiedArgs[0].startsWith("image.")) {
		imaged = true;
		image = modifiedArgs.splice(0,1)[0];
	}
	if(modifiedArgs.includes("=")) {
		let index = modifiedArgs.indexOf("=");
		titled = true;
		title = modifiedArgs.splice(0, index).join(" ");
		modifiedArgs.splice(0, 1); //removes the =
	}
	let message = modifiedArgs.join(" ");
	if(titled) {
		embed.addField(title, message);
	} else {
		embed.addField("Aspect", message);
	}
	if(authored) {
		embed.addField("Author", author);
	}
	if(imaged) {
		embed.setThumbnail(image);
	}
	await channel.send({embeds: [embed]});
});

async function onMessage(msg: Discord.Message) {
	if (msg.content.startsWith("dao!")) {
		logger.log("Got a message from a cultivator. So exciting!");
		logger.log(">" + msg.author.tag + ": " + msg.content);
		let followup = msg.content.substring(4);
		let parts = followup.split(" ");
		let command = parts[0];
		parts.splice(0, 1);
		if (commands.has(command)) {
			logger.log("Performing command: " + command + " with args: " + parts);
			let behavior = commands.get(command);
			behavior(msg, parts);
		}
	}
}

botClient.on('messageCreate', onMessage);
botClient.on('guildMemberAdd', onNewMember);

botClient.login(token);

