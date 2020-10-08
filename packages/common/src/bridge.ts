import { Action, isAction } from './actions';

/** Default port used for client-server bridge */
export const defaultBridgePort = 23000;

/** Common options for client-server bridge */
export interface BridgeOptions {
	/** The port on which the server should listen and the client should connect */
	bridgePort?: number;
}

/** Server options for client-server bridge */
export interface ServerBridgeOptions extends BridgeOptions {}

/** Client options for client-server bridge */
export interface ClientBridgeOptions extends BridgeOptions {
	/** The host to which the client should connect; defaults to localhost */
	bridgeHost?: string;
}

/** Bridge event name for a registration sent from client to server */
export const bridgeEventClientRegistration = 'clientRegistration';

/** Bridge event payload for a registration sent from client to server */
export interface BridgeEventClientRegistration {
	/** Unique client id of the registering client */
	clientId: string;
}

/** Bridge event name for a bus action sent from server to client */
export const bridgeEventServerAction = 'serverAction';

/** Bridge event payload for a bus action sent from server to client */
export interface BridgeEventServerActionPayload extends Action {}

/** Predicate for validating bridge event server action payload shape */
export const isBridgeEventServerActionPayload = isAction;

/** Bridge event name for a bus action sent from client to server */
export const bridgeEventClientAction = 'clientAction';

/** Bridge event payload for a bus action sent from client to server */
export interface BridgeEventClientActionPayload extends Action {}

/** Predicate for validating bridge event client action payload shape */
export const isBridgeEventClientActionPayload = isAction;
