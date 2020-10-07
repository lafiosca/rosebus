import { LogLevel, LogMessage } from '@rosebus/common';
import chalk from 'chalk';
import { format } from 'date-fns';

let logLevelThreshold: LogLevel = LogLevel.Info;

const logLevelTags = [
	'DBG',
	'INF',
	'NOT',
	'WRN',
	'ERR',
];

const logLevelColors = [
	chalk.gray,
	chalk.white,
	chalk.blueBright,
	chalk.yellowBright,
	chalk.red,
];

const normalizeLogMessage = (message: LogMessage | string): Required<LogMessage> => {
	const {
		text,
		level = LogLevel.Debug,
	} = (typeof message === 'string' ? { text: message } : message);
	return { text, level };
};

export const log = (message: LogMessage | string): void => {
	const { text, level } = normalizeLogMessage(message);
	if (level >= logLevelThreshold) {
		const date = format(new Date(), 'y-MM-dd HH:mm:ss');
		const tag = logLevelTags[level];
		const color = logLevelColors[level];
		console.log(`[${date}] ${color(`${tag}: ${text}`)}`);
	}
};

export const setLogLevelThreshold = (logLevel: LogLevel): void => {
	logLevelThreshold = logLevel;
};
