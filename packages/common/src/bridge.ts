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

/** Bridge event name for a bus action sent from server to client */
export const bridgeEventServerAction = 'serverAction';

/** Bridge event name for a bus action sent from client to server */
export const bridgeEventClientAction = 'clientAction';

/** Bridge event payload for a bus action */
export interface BridgeEventActionPayload extends Action {}

/** Predicate for validating bridge event action payload shape */
export const isBridgeEventActionPayload = isAction;
