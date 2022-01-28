import * as Discord from 'discord.js';
import axios, * as Axios from 'axios';

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

type ElementProperties = 'entryId' | 'description' | 'texturePath' | 'name' | 'author' | 'lsitBegets' | 'listOpposes';
type ElementData = { [key in ElementProperties as string]?: string };
type Dictionary<T> = { [key: string]: T };

async function buildEmbedElementMessage(data: ElementData) {
	if (!data.entryId) return null;
	let embed = new Discord.MessageEmbed();
	if (data.name) {
		embed.setTitle(data.name);
	}
	if (data.description) {
		embed.addField("Description", data.description);
	}
	if (data.author) {
		embed.addField("Author", data.author);
	}
	if (data.texturePath) {
		//embed.setImage("https://github.com/airesnoronha/wuxiacraft/raw/0.0.10.0-1.18.1/src/main/resources/assets/wuxiacraft/" + data.texturePath);
		embed.setThumbnail("https://github.com/airesnoronha/wuxiacraft/raw/0.0.10.0-1.18.1/src/main/resources/assets/wuxiacraft/" + data.texturePath);
		console.log(embed.image);
	}
	if (data.listBegets) {
		embed.addField("Begets", data.listBegets);
	}
	if (data.listOpposes) {
		embed.addField("Opposes", data.listOpposes);
	}
	embed.setTimestamp();
	return embed;
}

async function refreshElements(guildId:string) {
	let elementsResponse = await axios.get("https://github.com/airesnoronha/wuxiacraft/raw/0.0.10.0-1.18.1/src/main/java/wuxiacraft/init/WuxiaElements.java");
	const elementVars: ElementData = {
		"entryId": "=elements.",
		"description": "* desc=\"",
		"texturePath": "* image=\"",
		"name": "ELEMENTS.register(\"",
		"author": "* author="
	} as ElementData;
	if (typeof elementsResponse.data === "string") {
		let rawData = elementsResponse.data;
		let modifiedData = rawData;
		let searchResult = modifiedData.split("* elementEntry");
		let embedMessages: Discord.MessageEmbed[] = [];
		let embedMessagesIndex: Dictionary<number> = {};
		for (let entry of searchResult) {
			if (!entry.startsWith("=elements.")) continue; //probably the first is not gonna be an entry
			let elementData: ElementData = {} as ElementData;
			for (let varName in elementVars) {
				let searchParameter = elementVars[varName];
				if (!searchParameter) continue;
				let startId = entry.indexOf(searchParameter);
				if(startId == -1) continue;
				startId += searchParameter.length;
				let endParamenter = "\"";
				if (varName === "entryId" || varName === "author") {
					endParamenter = "\n";
				}
				let endId = entry.indexOf(endParamenter, startId);
				let varValue = entry.substring(startId, endId);
				elementData[varName] = varValue;
				if(varName === "texturePath") console.log("elementData["+varName+"]: " + varValue);
			}
			let begetsSplits = entry.split(".begets(new ResourceLocation(WuxiaCraft.MOD_ID, \"");
			let opposesSplits = entry.split(".suppresses(new ResourceLocation(WuxiaCraft.MOD_ID, \"");
			let begetsMsg = "";
			let opposesMSG = "";
			for(var splits of begetsSplits) {
				if(begetsSplits.indexOf(splits) == 0) continue;
					let endParameter = "\"";
					let endId = splits.indexOf(endParameter);
					begetsMsg += splits.substring(0, endId) + "\n";
			}
			if(begetsSplits.length > 0) elementData['listBegets'] = begetsMsg;
			for(var splits of opposesSplits) {
				if(opposesSplits.indexOf(splits) == 0) continue;
				let endParameter = "\"";
				let endId = splits.indexOf(endParameter);
				opposesMSG += splits.substring(0, endId) + "\n";
			}
			if(opposesSplits.length > 0) elementData['listOpposes'] = opposesMSG;
			let embed = await buildEmbedElementMessage(elementData);
			let entryId = elementData.entryId;
			if (entryId == null || embed == null) continue;
			embed.setFooter({ text: entryId });
			console.log("Creting embed for: " + entryId);
			embedMessagesIndex[entryId] = embedMessages.push(embed)-1;
		}
		let guild = await botClient.guilds.fetch(guildId as Discord.Snowflake);
		let channels = await guild.channels.fetch();
		let elementChannel = channels.find(ch => ch.name === "elements");
		if (elementChannel instanceof Discord.TextChannel) {
			let messages = await elementChannel.messages.fetch();
			for(let msg of messages) {
				console.log("attempting testing message!");
				let message = msg[1];
				if(!message) continue;
				for(var embedId in message.embeds) {
					let embed = message.embeds[embedId];
					if (embed.footer) {
						let entryId = embed.footer.text;
						let embedTesting = embedMessagesIndex[entryId];
						console.log("entryID editing:" + entryId + "(" + embedMessagesIndex[entryId] + ")");
						if(embedTesting != undefined) {
							if(message && message.editable) {
								await message.edit({embeds: [embed]});
								console.log("removing from remaining ones: " + entryId);
								console.log("removing from remaining ones index: " + embedMessagesIndex[entryId]);
								embedMessages.splice(embedMessagesIndex[entryId],1);
								delete embedMessagesIndex[entryId];
							}
						}
					}
				}
			}
			for(var embed of embedMessages) {
				if(elementChannel == null) return;
				if (elementChannel instanceof Discord.TextChannel) {
					console.log("entryID creating:" + embed.footer?.text);
					elementChannel.send({embeds: [embed]})
				}
			}
		}
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
				msg.delete();
			}
		}
		return;
	}
	if (msg.content === "dao!refresh") {
		if(msg.guild) refreshElements(msg.guild.id);
		if (msg.deletable) {
			if (user.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
				msg.delete();
			}
		}
		return;
	}
}

botClient.on('messageCreate', onMessage);



botClient.login(token);

