import type { FunctionComponent } from 'react';
import type { Observable } from 'rxjs';

import {
	Action,
	DispatchAction,
	ModuleApiDispatch,
} from './actions';
import { LogMessage } from './log';

/*
 * Storage role of a module
 *   none: this module is not used for storage
 *   primary: this module is used for fetching and storing
 *   secondary: this module is used only for storing, e.g. as a backup
 */
export type StorageRole = 'none' | 'primary' | 'secondary';

/** Predicate for validating storage role */
export const isStorageRole = (role: any): role is StorageRole => (
	typeof role === 'string'
		&& (role === 'none' || role === 'primary' || role === 'secondary')
);

/** Configuration for a module, arbitrary per module */
export interface ModuleConfig {
	/** Module config property, arbitrary per module */
	[key: string]: any;
}

/** Predicate for validating module config shape */
export const isModuleConfig = (config: any): config is ModuleConfig => (
	!!config && typeof config === 'object'
);

/** The collection of storage API methods provided to a module */
export interface ModuleApiStorage {
	/** Fetch a value by key, if it has been stored */
	readonly fetch: <T = any>(key: string) => Promise<T | undefined>;
	/** Store a JSON-serializable value by key */
	readonly store: <T = any>(key: string, value: T) => Promise<void>;
	/** Remove a stored value by key */
	readonly remove: (key: string) => Promise<void>;
}

/** The log API method provided to a module */
export interface ModuleApiLog {
	(message: LogMessage | string): void;
}

/** The collection of API methods provided to a module */
export interface ModuleApi<TDispatchAction extends DispatchAction = DispatchAction> {
	/** Dispatch an action to the bus */
	readonly dispatch: ModuleApiDispatch<TDispatchAction>;
	/** Storage API methods */
	readonly storage: ModuleApiStorage;
	/** Write a message to the log */
	readonly log: ModuleApiLog;
}

/** Parameters provided when initializing a module */
export interface ModuleParams<
	TConfig extends ModuleConfig = ModuleConfig,
	TDispatchAction extends DispatchAction = DispatchAction,
> {
	/** Unique identifier of this module instance */
	readonly moduleId: string;
	/** Configuration for the module */
	readonly config: TConfig;
	/** API methods provided to the module */
	readonly api: ModuleApi<TDispatchAction>;
	/** Observable stream of bus actions seen by this module */
	readonly action$: Observable<Action>;
}

/** The common shape of a module export, server or client */
export interface BaseModule {
	/** Unique name of this module; also used as default moduleId */
	readonly moduleName: string;
}

/** Predicate for validating base module's name shape */
export const isBaseModuleName = (moduleName: any): moduleName is BaseModule['moduleName'] => (
	!!moduleName && typeof moduleName === 'string'
);

/** Predicate for validating base module shape */
export const isBaseModule = (someModule: any): someModule is BaseModule => {
	if (!someModule || typeof someModule !== 'object') {
		return false;
	}
	const { moduleName } = someModule;
	if (!isBaseModuleName(moduleName)) {
		return false;
	}
	return true;
};

/** Parameters provided when initializing a server module */
export interface ServerModuleInitParams<
	TConfig extends ModuleConfig = ModuleConfig,
	TDispatchAction extends DispatchAction = DispatchAction,
> extends ModuleParams<TConfig, TDispatchAction> {}

/** Server module storage capability implementation */
export interface ServerModuleStorageImplementation {
	/** Fetch a string value by moduleName and key, if it has been stored */
	readonly fetch: (moduleName: string, key: string) => Promise<string | undefined>;
	/** Store a string value by moduleName and key */
	readonly store: (moduleName: string, key: string, value: string) => Promise<void>;
	/** Remove a stored value by moduleName and key */
	readonly remove: (moduleName: string, key: string) => Promise<void>;
}

/** Optional response from server module initialization */
export interface ServerModuleInitResponse<TDispatchAction extends DispatchAction = DispatchAction> {
	/** Reaction (action feedback) stream */
	readonly reaction$?: Observable<TDispatchAction>;
	/** Storage implementation */
	readonly storage?: ServerModuleStorageImplementation;
}

/** The shape of a server module export */
export interface ServerModule<
	TConfig extends ModuleConfig = ModuleConfig,
	TDispatchAction extends DispatchAction = DispatchAction,
> extends BaseModule {
	/** Module initialization method */
	readonly initialize: (params: ServerModuleInitParams<TConfig, TDispatchAction>) => (
		Promise<ServerModuleInitResponse<TDispatchAction> | void>
	);
}

/** Predicate for validating server module shape */
export const isServerModule = (someModule: any): someModule is ServerModule => {
	if (!isBaseModule(someModule)) {
		return false;
	}
	const { initialize } = someModule as any;
	if (typeof initialize !== 'function') {
		return false;
	}
	return true;
};

/** Response from storage module initialization, implementing storage capability */
export interface StorageModuleCapabilities extends Required<Pick<ServerModuleInitResponse, 'storage'>> {}

/** Initializer function for a storage module */
export interface StorageModuleInitializer<TConfig extends ModuleConfig = ModuleConfig> {
	(params: ServerModuleInitParams<TConfig>): Promise<StorageModuleCapabilities>;
}

/** A module which implements storage capability */
export interface StorageModule<TConfig extends ModuleConfig = ModuleConfig> extends ServerModule<TConfig> {
	readonly initialize: StorageModuleInitializer<TConfig>;
}

/** Predicate for validating server module's storage capability implementation shape */
export const isServerModuleCapabilityStorage = (storage: any): storage is ServerModuleStorageImplementation => {
	if (!storage || typeof storage !== 'object') {
		return false;
	}
	const { fetch, store, remove } = storage;
	return typeof fetch === 'function'
		&& typeof store === 'function'
		&& typeof remove === 'function';
};

/** Props passed to a client module component */
export interface ClientModuleComponentProps<
	TConfig extends ModuleConfig = ModuleConfig,
	TDispatchAction extends DispatchAction = DispatchAction,
> extends ModuleParams<TConfig, TDispatchAction> {
	/** Unique identifer of the client connection */
	clientId: string;
	/** Unique identifier for the screen this instance of the module is mounted on */
	screenId: string;
	/** True if the client-server bridge is connected */
	bridgeConnected: boolean;
}

/** Props passed to a client module configurator */
export interface ClientModuleConfiguratorProps<TConfig extends ModuleConfig = ModuleConfig> {
	/** Handler for saving config object */
	saveConfig: (config: TConfig) => Promise<void>;
}

/** The shape of a client module export */
export interface ClientModule<
	TConfig extends ModuleConfig = ModuleConfig,
	TDispatchAction extends DispatchAction = DispatchAction,
> extends BaseModule {
	/** React function component for the module's screen view */
	readonly ScreenView: FunctionComponent<ClientModuleComponentProps<TConfig, TDispatchAction>>;
	/** React function component for the module's configurator */
	readonly Configurator?: FunctionComponent<ClientModuleConfiguratorProps<TConfig>>;
}

/** Predicate for validating client module shape */
export const isClientModule = (someModule: any): someModule is ClientModule => {
	if (!isBaseModule(someModule)) {
		return false;
	}
	const { component } = someModule as any;
	if (typeof component !== 'function') {
		return false;
	}
	return true;
};

/** Import path for a module */
export type ModulePath = string;

/** Describes a module to load */
export interface BaseModuleSpec<TConfig extends ModuleConfig = ModuleConfig> {
	/** Path of the import for the module */
	path: ModulePath;
	/** Unique module id, overriding default; useful for duplicate modules with distinct configs */
	moduleId?: string;
	/** Module config, arbitrary per module */
	config?: TConfig;
}

/** Predicate for validating base module spec shape */
export const isBaseModuleSpec = (spec: any): spec is BaseModuleSpec => {
	if (!spec || typeof spec !== 'object') {
		return false;
	}
	const { path, moduleId, config } = spec;
	if (typeof path !== 'string') {
		return false;
	}
	if (moduleId !== undefined && typeof moduleId !== 'string') {
		return false;
	}
	if (config !== undefined && !isModuleConfig(config)) {
		return false;
	}
	return true;
};

/** Describes a server module to load */
export interface ServerModuleSpec<TConfig extends ModuleConfig = ModuleConfig> extends BaseModuleSpec<TConfig> {
	/** Storage role of the module, if any */
	storageRole?: StorageRole;
}

/** Predicate for validating server module spec shape */
export const isServerModuleSpec = (spec: any): spec is ServerModuleSpec => {
	if (!isBaseModuleSpec(spec)) {
		return false;
	}
	const { storageRole } = spec as any;
	if (storageRole !== undefined && !isStorageRole(storageRole)) {
		return false;
	}
	return true;
};

/** Describes a client module to load */
export interface ClientModuleSpec<TConfig extends ModuleConfig = ModuleConfig> extends BaseModuleSpec<TConfig> {}

/** Predicate for validating client module spec shape */
export const isClientModuleSpec = (spec: any): spec is ClientModuleSpec => {
	if (!isBaseModuleSpec(spec)) {
		return false;
	}
	return true;
};
