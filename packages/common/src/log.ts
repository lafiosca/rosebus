/** Log message significance level */
export enum LogLevel {
	Debug,
	Info,
	Notice,
	Warning,
	Error,
}

/** Full log message structure */
export interface LogMessage {
	/** The text to log */
	text: string;
	/** The significance level of the message, defaults to Debug */
	level?: LogLevel;
}
