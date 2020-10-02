import React, {
	FunctionComponent,
	useEffect,
	useState,
} from 'react';
import {
	ClientModule,
	ClientModuleComponentProps,
	ModuleConfig,
	buildActionCreator,
	isActionOf,
	DispatchActionType,
	ActionType,
} from '@rosydoublecross/rosebus-common';
import { filter, tap } from 'rxjs/operators';

const moduleName = 'TextLog';
const defaultMaxMessageCount = 20;

export interface LogMesagePayload {
	message: string;
}

export interface ClearMessagesPayload {}

export const actions = {
	logMessage: buildActionCreator(moduleName, 'logMessage')<LogMesagePayload>(),
	clearMessages: buildActionCreator(moduleName, 'clearMessages')<ClearMessagesPayload>(),
};

/** Union type of dispatch actions returned by any TextLog module action creator */
export type HeartbeatDispatchActionType = DispatchActionType<typeof actions>;

/** Union type of all actions originating from the TextLog module */
export type HearbeatActionType = ActionType<typeof actions>;

/** TextLog config */
export interface TextLogConfig extends ModuleConfig {
	/** Maximum number of messages to keep in log before rolling off old ones; defaults to 20 */
	logLength?: number;
	/** Identifier of this log, for storing messages; defaults to moduleId */
	logId?: string;
	/** Optional title for the log */
	logTitle?: string;
}

const ScreenView: FunctionComponent<ClientModuleComponentProps<TextLogConfig, never>> = ({
	action$,
	moduleId,
	api: { storage },
	config: {
		logId,
		logLength,
		logTitle,
	},
}) => {
	const [logMessages, setLogMessages] = useState<string[]>([]);

	const maxMessageCount = logLength ?? defaultMaxMessageCount;
	const storageKey = `${logId ?? moduleId}:logMessages`;

	// Fetch data initially
	useEffect(
		() => {
			(async () => {
				const storedLogMessages = await storage.fetch<string[]>(storageKey);
				if (storedLogMessages) {
					setLogMessages((oldLogMessages) => {
						if (oldLogMessages.length > 0) {
							const newLogMessages = [
								...storedLogMessages,
								...oldLogMessages,
							].slice(-maxMessageCount);
							storage.store(storageKey, newLogMessages);
							return newLogMessages;
						}
						return storedLogMessages;
					});
				}
			})();
		},
		[storage, maxMessageCount, storageKey],
	);

	useEffect(
		() => {
			const logMessageSub = action$.pipe(
				filter(isActionOf(actions.logMessage)),
				tap(({ payload: { message } }) => {
					setLogMessages((oldLogMessages) => {
						const newLogMessages = [...oldLogMessages.slice(1 - maxMessageCount), message];
						storage.store(storageKey, newLogMessages);
						return newLogMessages;
					});
				}),
			).subscribe();
			const clearMessagesSub = action$.pipe(
				filter(isActionOf(actions.clearMessages)),
				tap(() => {
					setLogMessages([]);
					storage.store(storageKey, []);
				}),
			).subscribe();
			return () => {
				logMessageSub.unsubscribe();
				clearMessagesSub.unsubscribe();
			};
		},
		[
			action$,
			storage,
			maxMessageCount,
			storageKey,
		],
	);

	return (
		<div className={moduleName}>
			{!!logTitle && (
				<h1>{logTitle}</h1>
			)}
			<ul>
				{logMessages.map((message) => (
					<li>{message}</li>
				))}
			</ul>
		</div>
	);
};

const TextLog: ClientModule<TextLogConfig, never> = {
	moduleName,
	ScreenView,
};

export default TextLog;
