import * as fs from "fs";

let fileDate = new Date();
let fileDateline = `run - ${fileDate.getFullYear()}-${
	fileDate.getMonth() + 1
}-${fileDate.getDate()} ${fileDate.getHours()}:${fileDate.getMinutes()}:${fileDate.getSeconds()}`;
let logsFolder = process.env.PWD + "/logs"
let fileName = logsFolder + "/" + fileDateline + ".log";

fs.rmSync(logsFolder + "/latest.log");

/**
 * logs data to a file
 * @param {*} data the data to be logged
 */
function log(data : String) {
	let date = new Date();
	let line = `[${date.getFullYear()}-${
		date.getMonth() + 1
	}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] `;
	line = line + data + "\n";
	if (!fs.existsSync(logsFolder)) {
		fs.mkdirSync("logs");
	}
	fs.appendFileSync(logsFolder+"/latest.log", line, { encoding: "utf-8" });
	fs.appendFileSync(fileName, line, { encoding: "utf-8" });
}

/**
 * Adds a console.log to the logger
 * @param {*} data the data to be logged
 */
function logV(data : String) {
	console.log(data);
	log(data);
}

export { log, logV };
