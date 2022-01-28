import * as Discord from 'discord.js';
import axios, * as Axios from 'axios';

type ElementProperties = 'entryId' | 'description' | 'texturePath' | 'name' | 'author' | 'listBegets' | 'listOpposes';
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

async function refreshElements(botClient: Discord.Client, guildId: string) {
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
				if (startId == -1) continue;
				startId += searchParameter.length;
				let endParamenter = "\"";
				if (varName === "entryId" || varName === "author") {
					endParamenter = "\n";
				}
				let endId = entry.indexOf(endParamenter, startId);
				let varValue = entry.substring(startId, endId);
				elementData[varName] = varValue;
				if (varName === "texturePath") console.log("elementData[" + varName + "]: " + varValue);
			}
			let begetsSplits = entry.split(".begets(new ResourceLocation(WuxiaCraft.MOD_ID, \"");
			let opposesSplits = entry.split(".suppresses(new ResourceLocation(WuxiaCraft.MOD_ID, \"");
			let begetsMsg = "";
			let opposesMSG = "";
			for (var splits of begetsSplits) {
				if (begetsSplits.indexOf(splits) == 0) continue;
				let endParameter = "\"";
				let endId = splits.indexOf(endParameter);
				begetsMsg += splits.substring(0, endId) + "\n";
			}
			if (begetsSplits.length > 0) elementData['listBegets'] = begetsMsg;
			for (var splits of opposesSplits) {
				if (opposesSplits.indexOf(splits) == 0) continue;
				let endParameter = "\"";
				let endId = splits.indexOf(endParameter);
				opposesMSG += splits.substring(0, endId) + "\n";
			}
			if (opposesSplits.length > 0) elementData['listOpposes'] = opposesMSG;
			let embed = await buildEmbedElementMessage(elementData);
			let entryId = elementData.entryId;
			if (entryId == null || embed == null) continue;
			embed.setFooter({ text: entryId });
			console.log("Creting embed for: " + entryId);
			embedMessagesIndex[entryId] = embedMessages.push(embed) - 1;
		}
		let guild = await botClient.guilds.fetch(guildId as Discord.Snowflake);
		let channels = await guild.channels.fetch();
		let elementChannel = channels.find(ch => ch.name === "elements");
		if (elementChannel instanceof Discord.TextChannel) {
			let messages = await elementChannel.messages.fetch();
			for (let msg of messages) {
				console.log("attempting testing message!");
				let message = msg[1];
				if (!message) continue;
				for (var embedId in message.embeds) {
					let embed = message.embeds[embedId];
					if (embed.footer) {
						let entryId = embed.footer.text;
						let embedTesting = embedMessagesIndex[entryId];
						console.log("entryID editing:" + entryId + "(" + embedMessagesIndex[entryId] + ")");
						if (embedTesting != undefined) {
							if (message && message.editable) {
								await message.delete();
							}
						}
					}
				}
			}
			for (var embed of embedMessages) {
				if (elementChannel == null) return;
				if (elementChannel instanceof Discord.TextChannel) {
					console.log("entryID creating:" + embed.footer?.text);
					await elementChannel.send({embeds: [embed]});
				}
			}
		}
	}
}

export {
	buildEmbedElementMessage,
	refreshElements
}