import * as Discord from 'discord.js';
import * as ElementRefresher from './refreshElements';

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
	console.log("Heavenly Dao Bot is ready to cultivate!");
});

function delayedDeleteMessage(message : Discord.Message) {
	message.fetch().then(msg => msg.delete());
}

async function onNewMember(member: Discord.GuildMember) {
	let guild = await member.guild.fetch();
	let channel = await guild.systemChannel?.fetch()
	if(channel) {
		channel.send("Welcome fellow daoist <@" + member.id + ">! Pay your respects to your senior brothers/sisters :smile:");
	}
}

async function onMessage(msg: Discord.Message) {
	if (msg.content.startsWith("dao!")) {
		console.log("Got a message from a cultivator. So exciting!");
		console.log("\t" + msg.author.tag + ": " + msg.content);
	}
	if (msg.content === "dao!hello") {
		let channel = msg.channel;
		let user = msg.author;
		if (msg.editable) {
			msg.edit("Hello Heavenly Dao Bot!");
		}
		channel.send("Hello fellow daoist <@" + user.id + ">!");
		return;
	}
	let channel = msg.channel;
	let userId = msg.author.id;
	let guildId = msg.guildId;
	let guild = await botClient.guilds.fetch(guildId as Discord.Snowflake);
	let user = await guild.members.fetch(userId);
	if (msg.content === "dao!broadhello") {
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
				setTimeout(() => {delayedDeleteMessage(msg)}, 500);
			}
		}
		return;
	}
	if (msg.content === "dao!refresh") {
		if(msg.guild) ElementRefresher.refreshElements(botClient, msg.guild.id);
		if (msg.deletable) {
			if (user.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
				setTimeout(() => {delayedDeleteMessage(msg)}, 500);
			}
		}
		return;
	}
}

botClient.on('messageCreate', onMessage);
botClient.on('guildMemberAdd', onNewMember);



botClient.login(token);

