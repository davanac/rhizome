/** ------------------ cmt 989524 ------------------
Pour afficher dans une console:
 tail -f logs.json | jq
*-------------------------------------------------*/

import fs from "fs";
import Config from "#config";

const config = Config;

let LOGS_FILE_PATH = config?.LOGS.FILE_PATH || "./logs.json";
let MAX_LOG_COUNT = Number(config?.LOGS.MAX_COUNT || 200);
let LOGS_OUTPUT = config?.LOGS.OUTPUT || "both";

const originalLog = console.log;
const originalDir = console.dir;
const originalError = console.error;

/**
 * 
 * @param {*} output [CustomLogger.CONSOLE, CustomLogger.FILE, CustomLogger.BOTH]
 * @param {*} maxLogsCount int default 200
 * @param {*} logsFilePath
 * @returns
 */
const init = ({output, maxLogsCount, logsFilePath}) => {
  LOGS_OUTPUT = output ?? LOGS_OUTPUT;
  MAX_LOG_COUNT = parseInt(maxLogsCount) > 0 ? parseInt(maxLogsCount) : parseInt(MAX_LOG_COUNT) > 0 ? parseInt(MAX_LOG_COUNT) : 200;
  LOGS_FILE_PATH = logsFilePath ?? (LOGS_FILE_PATH || "./logs.json");
  console.log = log;
  console.dir = dir;
  console.error = error; 
};

const CustomLogger = {
  init,
  CONSOLE: "console",
  FILE: "file",
  BOTH: "both",
  LOGS_FILE_PATH,
  MAX_LOG_COUNT,
  LOGS_OUTPUT,
};

const log = (...args) => {
  const logCreatedAt = new Date().toISOString();
  switch (LOGS_OUTPUT) {
    case "console":
      consoleLogHandler(...args);
      break;
    case "file":
      fileLogHandler([logCreatedAt, ...args]);
      break;
    case "both":
      consoleLogHandler(...args);
      fileLogHandler([logCreatedAt, ...args]);
      break;
    default:
      consoleLogHandler(...args);
  }
};

const error = (...args) => {
  originalLog(...args);
  const logEntry = {
    level: "error",
    timestamp: new Date().toISOString(),
    message: args.find(arg => typeof arg === "string")||args.find(arg => arg instanceof Error)?.message || args.message || "Unknown error",
    stack: args.find(arg => arg instanceof Error)?.stack || null,
    context: args.filter(arg => !(typeof arg === "string" || arg instanceof Error)),
  };

  try {
    const jsonStack =logEntry.stack.split("\n").map(line => line.trim());
    logEntry.stack = jsonStack;
  } catch (error) {

   // originalError("Erreur lors de la conversion de la stack en JSON:", error);
  }


  switch (LOGS_OUTPUT) {
    case "console":
      originalError(logEntry,{ depth: null, colors: true });
      break;
    case "file":
      fileDirHandler(logEntry,{ depth: null, colors: true });
      break;
    case "both":
      originalDir(logEntry,{ depth: null, colors: true });
      fileDirHandler(logEntry,{ depth: null, colors: true });
      break;
    default:
      originalDir(logEntry,{ depth: null, colors: true });
  }
};



const dir = (obj, options) => {
  const isError = obj instanceof Error;
  if (isError) {
    error(obj);
    return;
  }
  switch (LOGS_OUTPUT) {
    case "console":
      originalDir(obj, options);
      break;
    case "file":
      fileDirHandler({dir:obj}, options);
      break;
    case "both":
      originalDir(obj, options);
      fileDirHandler({dir:obj}, options);
      break;
    default:
      originalDir(obj, options);
  }
};

/**
 * Handler qui affiche les logs dans la console.
 */
const consoleLogHandler = (...args) => {
  args.forEach(arg => {
    originalLog(arg.toString());
  });
};


const fileLogHandler = (logEntry) => {
  try {
    const logString = JSON.stringify(logEntry) + "\n";
    fs.appendFileSync(LOGS_FILE_PATH, logString, { encoding: "utf8" });
  } catch (err) {
   // originalError("Erreur lors de l'écriture du log dans le fichier:", err);
  }
};

const fileDirHandler = (obj, options) => {
  try {
    const logEntry = { ...obj, logCreatedAt: new Date().toISOString() };
    const logString = JSON.stringify(logEntry) + "\n";
    fs.appendFileSync(LOGS_FILE_PATH, logString, { encoding: "utf8" });
  } catch (err) {
    //originalError("Erreur lors de l'écriture du log dans le fichier:", err);
  }
};

export default CustomLogger;
