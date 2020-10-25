import {
	Action,
	bridgeEventClientAction,
	bridgeEventClientRegistration,
	bridgeEventServerAction,
	ClientBridgeOptions,
	defaultBridgePort,
	isBridgeEventServerActionPayload,
	LogLevel,
	rootActions,
} from '@rosebus/common';
import { Subscription } from 'rxjs';
import socketIoClient from 'socket.io-client';

import { emitAction, emitRootAction, subscribeServer } from './actions';
import { clientId } from './clientId';
import { log } from './log';

const handleConnect = () => {
	log({
		text: 'Connected to server',
		level: LogLevel.Info,
	});
	emitRootAction(rootActions.serverConnect({}, { targetClientId: clientId }));
};

const handleServerAction = (payload: unknown) => {
	if (isBridgeEventServerActionPayload(payload)) {
		const action: Action = payload;
		const { moduleName, type } = action;
		log({
			text: `Received ${moduleName}.${type} action from server`,
			level: LogLevel.Debug,
		});
		emitAction(action);
	} else {
		log({
			text: 'Ignoring malformed action payload received from server',
			level: LogLevel.Warning,
		});
	}
};

const buildDisconnectHandler = (subscription: Subscription) => (
	() => {
		subscription.unsubscribe();
		log({
			text: 'Disconnected from server',
			level: LogLevel.Info,
		});
		emitRootAction(rootActions.serverDisconnect({}, { targetClientId: clientId }));
	}
);

export const initializeBridge = (options: ClientBridgeOptions) => {
	const {
		bridgeScheme = 'http',
		bridgeHost = 'localhost',
		bridgePort = defaultBridgePort,
	} = options;
	const socket = socketIoClient(`${bridgeScheme}://${bridgeHost}:${bridgePort}`);
	socket.on('connect', handleConnect);
	socket.on(bridgeEventServerAction, handleServerAction);
	const subscription = subscribeServer(
		(action) => socket.emit(bridgeEventClientAction, action),
	);
	socket.on('disconnect', buildDisconnectHandler(subscription));
	socket.emit(bridgeEventClientRegistration, { clientId });
	return () => {
		socket.close();
	};
};
