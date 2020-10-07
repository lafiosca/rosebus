import {
	Action,
	LogLevel,
	ServerBridgeOptions,
	bridgeEventServerAction,
	bridgeEventClientAction,
	defaultBridgePort,
	isBridgeEventActionPayload,
	rootActions,
} from '@rosebus/common';
import socketIo, { Socket } from 'socket.io';
import { Subscription } from 'rxjs';

import {
	attachClientActionBridge,
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
		if (isBridgeEventActionPayload(payload)) {
			const action: Action = {
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

const buildConnectionHandler = () => (
	(socket: Socket) => {
		const clientId = socket.id;
		const subscription = attachClientActionBridge(
			clientId,
			(action) => socket.emit(bridgeEventServerAction, action),
		);
		socket.on(bridgeEventClientAction, buildClientActionHandler(clientId));
		socket.on('disconnect', buildDisconnectHandler(clientId, subscription));
		log({
			text: `Client id ${clientId} connected`,
			level: LogLevel.Info,
		});
		emitRootAction(rootActions.clientConnect({ clientId }));
	}
);

export const initializeBridge = (
	options: ServerBridgeOptions = {},
) => {
	const bridgePort = options.bridgePort ?? defaultBridgePort;
	io.on('connection', buildConnectionHandler());
	io.listen(bridgePort);
	log({
		text: `Bridge listening on port ${bridgePort}`,
		level: LogLevel.Debug,
	});
};
