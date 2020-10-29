import {
	ServerBridgeOptions,
	ClientBridgeOptions,
	isServerBridgeOptions,
	isClientBridgeOptions,
} from './bridge';
import { LogLevel } from './log';
import {
	ClientModuleSpec,
	isClientModuleSpec,
	isServerModuleSpec,
	ModulePath,
	ServerModuleSpec,
} from './modules';

/** Configuration for the server */
export interface ServerConfig extends ServerBridgeOptions {
	/** The list of modules for the server to load */
	modules: (ServerModuleSpec | ModulePath)[];
	/** Set level threshold for server activity log messages (default: Info) */
	logThreshold?: LogLevel;
}

/** Predicate for validating server config module item shape */
export const isServerConfigModule = (item: any): item is ServerModuleSpec | ModulePath => {
	if (typeof item === 'string') {
		return true;
	}
	return isServerModuleSpec(item);
};

/** Predicate for validating server config shape */
export const isServerConfig = (config: any): config is ServerConfig => {
	if (!isServerBridgeOptions(config)) {
		return false;
	}
	const { modules, logThreshold } = config as any;
	if (!Array.isArray(modules)) {
		return false;
	}
	if (!modules.every(isServerConfigModule)) {
		return false;
	}
	if (logThreshold !== undefined && typeof logThreshold !== 'number') {
		return false;
	}
	return true;
};

/** Configuration for a client screen */
export interface ClientScreenConfig {
	/** Unique identifier of the screen, also used in route URL */
	screenId: string;
	/** The list of modules for the screen to render */
	modules: (ClientModuleSpec | ModulePath)[];
}

/** Predicate for validating client screen config module item shape */
export const isClientScreenConfigModule = (item: any): item is ClientModuleSpec | ModulePath => {
	if (typeof item === 'string') {
		return true;
	}
	return isClientModuleSpec(item);
};

/** Predicate for validating client screen config shape */
export const isClientScreenConfig = (config: any): config is ClientScreenConfig => {
	if (!config || typeof config !== 'object') {
		return false;
	}
	const { screenId, modules } = config;
	if (!screenId || typeof screenId !== 'string') {
		return false;
	}
	if (!Array.isArray(modules)) {
		return false;
	}
	if (!modules.every(isClientScreenConfigModule)) {
		return false;
	}
	return true;
};

/** Configuration for the client */
export interface ClientConfig extends ClientBridgeOptions {
	/** The list of screens the client can render */
	screens: ClientScreenConfig[];
}

/** Predicate for validating client config shape */
export const isClientConfig = (config: any): config is ClientConfig => {
	if (!isClientBridgeOptions(config)) {
		return false;
	}
	const { screens } = config as any;
	if (!Array.isArray(screens)) {
		return false;
	}
	if (!screens.every(isClientScreenConfig)) {
		return false;
	}
	return true;
};
