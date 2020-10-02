import React, {
	FunctionComponent,
	useState,
	useEffect,
} from 'react';
import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

const actionTypes = {
	logMessage: 'TextLog.logMessage',
	clearMessages: 'TextLog.clearMessages',
};

interface DispatchAction<TPayload = any> {
	type: string;
	payload: TPayload;
	targetModuleId?: string;
	targetScreenId?: string;
}

interface Action<TPayload = any> extends DispatchAction<TPayload> {
	fromModuleId: string;
}

interface Props {
	dispatch: (action: DispatchAction) => void;
	storage: {
		fetch: <T>(key: string) => Promise<T | undefined>;
		store: <T>(key: string, value: T) => Promise<void>;
		remove: (key: string) => Promise<void>;
	};
	action$: Observable<Action>;
}

const TextLog: FunctionComponent<Props> = ({
	storage,
	action$,
}) => {
	const [logMessages, setLogMessages] = useState<string[]>([]);

	useEffect(
		() => {
			(async () => {
				const storedLogMessages = await storage.fetch<string[]>('logMessages');
				if (storedLogMessages) {
					setLogMessages((oldLogMessages) => {
						if (oldLogMessages.length > 0) {
							const newLogMessages = [
								...storedLogMessages,
								...oldLogMessages,
							].slice(-10);
							storage.store('logMessages', newLogMessages);
							return newLogMessages;
						}
						return storedLogMessages;
					});
				}
			})();
		},
		[storage],
	);

	useEffect(
		() => {
			const logMessageAction$ = action$.pipe(
				filter((action) => action.type === actionTypes.logMessage),
				tap(({ payload }) => {
					if (typeof payload !== 'string') {
						// complain?
					} else {
						setLogMessages((oldLogMessages) => {
							const newLogMessages = [...oldLogMessages.slice(-9), payload];
							storage.store('logMessages', newLogMessages);
							return newLogMessages;
						});
					}
				}),
			).subscribe();
			const clearMessagesAction$ = action$.pipe(
				filter((action) => action.type === actionTypes.clearMessages),
				tap(() => {
					setLogMessages([]);
					storage.store('logMessages', []);
				}),
			).subscribe();
			return () => {
				logMessageAction$.unsubscribe();
				clearMessagesAction$.unsubscribe();
			};
		},
		[action$, storage],
	);

	return (
		<div>
			{logMessages.map((message) => (
				<p>{message}</p>
			))}
		</div>
	);
};

export default TextLog;
