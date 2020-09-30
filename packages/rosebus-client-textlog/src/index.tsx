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
} from '@rosydoublecross/rosebus-types';
import { filter, tap } from 'rxjs/operators';

const moduleName = 'TextLog';
const defaultMaxMessageCount = 20;

enum TextLogStorageKey {
	LogMessages = 'logMessages',
}

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

export interface TextLogConfig extends ModuleConfig {
	maxMessageCount?: number;
}

const TextLog: FunctionComponent<ClientModuleComponentProps<TextLogConfig, never>> = ({
	action$,
	api: { storage },
	config: {
		maxMessageCount = defaultMaxMessageCount,
	},
}) => {
	const [logMessages, setLogMessages] = useState<string[]>([]);

	// Fetch data initially
	useEffect(
		() => {
			(async () => {
				const storedLogMessages = await storage.fetch<string[]>(TextLogStorageKey.LogMessages);
				if (storedLogMessages) {
					setLogMessages((oldLogMessages) => {
						if (oldLogMessages.length > 0) {
							const newLogMessages = [
								...storedLogMessages,
								...oldLogMessages,
							].slice(-maxMessageCount);
							storage.store(TextLogStorageKey.LogMessages, newLogMessages);
							return newLogMessages;
						}
						return storedLogMessages;
					});
				}
			})();
		},
		[storage, maxMessageCount],
	);

	useEffect(
		() => {
			const logMessageSub = action$.pipe(
				filter(isActionOf(actions.logMessage)),
				tap(({ payload: { message } }) => {
					setLogMessages((oldLogMessages) => {
						const newLogMessages = [...oldLogMessages.slice(1 - maxMessageCount), message];
						storage.store(TextLogStorageKey.LogMessages, newLogMessages);
						return newLogMessages;
					});
				}),
			).subscribe();
			const clearMessagesSub = action$.pipe(
				filter(isActionOf(actions.clearMessages)),
				tap(() => {
					setLogMessages([]);
					storage.store(TextLogStorageKey.LogMessages, []);
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
		],
	);

	return (
		<div className="TextLog">
			<ul>
				{logMessages.map((message) => (
					<li>{message}</li>
				))}
			</ul>
		</div>
	);
};

const TextLogModule: ClientModule<TextLogConfig, never> = {
	moduleName,
	component: TextLog,
};

export default TextLogModule;
