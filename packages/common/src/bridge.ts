import { SerializedAction, isSerializedAction } from './actions';

/** Default port used for client-server bridge */
export const defaultBridgePort = 23000;

/** Common options for client-server bridge */
export interface BridgeOptions {
	/** The port on which the server should listen and the client should connect */
	bridgePort?: number;
}

/** Predicate for validating bridge options item shape */
export const isBridgeOptions = (options: any): options is BridgeOptions => {
	if (!options || typeof options !== 'object') {
		return false;
	}
	const { bridgePort } = options;
	if (bridgePort !== undefined && typeof bridgePort !== 'number') {
		return false;
	}
	return true;
};

/** Server options for client-server bridge */
export interface ServerBridgeOptions extends BridgeOptions {}

/** Predicate for validating server bridge options item shape */
export const isServerBridgeOptions = (options: any): options is ServerBridgeOptions => (
	isBridgeOptions(options)
);

/** Client options for client-server bridge */
export interface ClientBridgeOptions extends BridgeOptions {
	/** The scheme used to connect to the host; defaults to http */
	bridgeScheme?: string;
	/** The host to which the client should connect; defaults to localhost */
	bridgeHost?: string;
}

/** Predicate for validating client bridge options item shape */
export const isClientBridgeOptions = (options: any): options is ClientBridgeOptions => {
	if (!isBridgeOptions(options)) {
		return false;
	}
	const { bridgeScheme, bridgeHost } = options as any;
	if (bridgeScheme !== undefined
		&& (!bridgeScheme || typeof bridgeScheme !== 'string')) {
		return false;
	}
	if (bridgeHost !== undefined
		&& (!bridgeHost || typeof bridgeHost !== 'string')) {
		return false;
	}
	return true;
};

/** Bridge event name for a registration sent from client to server */
export const bridgeEventClientRegistration = 'clientRegistration';

/** Bridge event payload for a registration sent from client to server */
export interface BridgeEventClientRegistrationPayload {
	/** Unique client id of the registering client */
	clientId: string;
}

/** Predicate for validating bridge event client registration payload shape */
export const isBridgeEventClientRegistrationPayload = (
	(payload: any): payload is BridgeEventClientRegistrationPayload => (
		payload !== null
			&& typeof payload === 'object'
			&& typeof payload.clientId === 'string'
			&& payload.clientId !== ''
	)
);

/** Bridge event name for a bus action sent from server to client */
export const bridgeEventServerAction = 'serverAction';

/** Bridge event payload for a bus action sent from server to client */
export interface BridgeEventServerActionPayload extends SerializedAction {}

/** Predicate for validating bridge event server action payload shape */
export const isBridgeEventServerActionPayload = isSerializedAction;

/** Bridge event name for a bus action sent from client to server */
export const bridgeEventClientAction = 'clientAction';

/** Bridge event payload for a bus action sent from client to server */
export interface BridgeEventClientActionPayload extends SerializedAction {}

/** Predicate for validating bridge event client action payload shape */
export const isBridgeEventClientActionPayload = isSerializedAction;
