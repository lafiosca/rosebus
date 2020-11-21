import {
	Action,
	LogLevel,
	ServerBridgeOptions,
	bridgeEventServerAction,
	bridgeEventClientAction,
	defaultBridgePort,
	isBridgeEventClientActionPayload,
	rootActions,
	bridgeEventClientRegistration,
	isBridgeEventClientRegistrationPayload,
} from '@rosebus/common';
import socketIo, { Socket } from 'socket.io';
import { Subscription } from 'rxjs';

import {
	subscribeClient,
	emitAction,
	emitRootAction,
} from './actions';
import { log } from './log';

const io = socketIo();

const buildDisconnectHandler = (clientId: string, subscription: Subscription) => (
	() => {
		subscription.unsubscribe();
		log({
			text: `Client id ${clientId} disconnected`,
			level: LogLevel.Info,
		});
		emitRootAction(rootActions.clientDisconnect({ clientId }));
	}
);

const buildClientActionHandler = (clientId: string) => (
	(payload: unknown) => {
		if (isBridgeEventClientActionPayload(payload)) {
			const action: Action = {
				payload: undefined,
				...payload,
				fromClientId: clientId,
			};
			const { moduleName, type } = action;
			log({
				text: `Received ${moduleName}.${type} action from client id ${clientId}`,
				level: LogLevel.Debug,
			});
			emitAction(action);
		} else {
			log({
				text: `Ignoring malformed action payload received from client id ${clientId}`,
				level: LogLevel.Warning,
			});
		}
	}
);

const handleConnection = (socket: Socket) => {
	socket.on(bridgeEventClientRegistration, (payload: unknown) => {
		if (isBridgeEventClientRegistrationPayload(payload)) {
			const { clientId } = payload;
			const subscription = subscribeClient(
				clientId,
				(action) => socket.emit(bridgeEventServerAction, action),
			);
			socket.on(bridgeEventClientAction, buildClientActionHandler(clientId));
			socket.on('disconnect', buildDisconnectHandler(clientId, subscription));
			log({
				text: `Client id ${clientId} connected from socket id ${socket.id}`,
				level: LogLevel.Info,
			});
			emitRootAction(rootActions.clientConnect({ clientId }));
		} else {
			log({
				text: `Received malformed client registration payload from socket id ${socket.id}; disconnecting`,
				level: LogLevel.Error,
			});
			socket.disconnect();
		}
	});
};

export const initializeBridge = (options: ServerBridgeOptions) => {
	const {
		bridgePort = defaultBridgePort,
	} = options;
	io.on('connection', handleConnection);
	io.listen(bridgePort);
	log({
		text: `Bridge listening on port ${bridgePort}`,
		level: LogLevel.Debug,
	});
};
