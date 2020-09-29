import type { FunctionComponent } from 'react';
import type { Observable } from 'rxjs';

export interface DispatchActionOptions {
	/** If true, dispatch this action only to server modules */
	targetServer?: boolean;
	/** A moduleId to which this action should be privately dispatched */
	targetModuleId?: string;
	/** A clientId to which this action should be privately dispatched */
	targetClientId?: string;
	/** A screenId to which this action should be privately dispatched */
	targetScreenId?: string;
}

/** An action as it is dispatched by a module */
export interface DispatchAction<TType extends string = string, TPayload = any> extends DispatchActionOptions {
	/** Type of the action, arbitrarily defined by module */
	type: TType;
	/** Payload of the action, arbitrarily defined by module */
	payload: TPayload;
}

/** An action as it arrives via the bus */
export interface Action<TName extends string = string, TType extends string = string, TPayload = any> {
	/** Name of the module that dispatches this action */
	readonly moduleName: TName;
	/** Type of the action, a string arbitrarily defined by module */
	readonly type: TType;
	/** Payload of the action, arbitrarily defined by module; must be JSON-serializable if crossing client-server bridge */
	readonly payload: TPayload;
	/** The moduleId from which this action was dispatched */
	readonly fromModuleId: string;
	/** The clientId from which this action was dispatched, if client-originated */
	readonly fromClientId?: string;
	/** The screenId from which this action was dispatched, if client-originated */
	readonly fromScreenId?: string;
}

/** Action creator function without metadata */
export interface BareActionCreator<TType extends string = string, TPayload = any> {
	(payload: TPayload, options?: DispatchActionOptions): DispatchAction<TType, TPayload>;
}

/** Action creator function */
export interface ActionCreator<
	TName extends string = string,
	TType extends string = string,
	TPayload = any
> extends BareActionCreator<TType, TPayload> {
	readonly moduleName: TName;
	readonly type: TType;
}

/** Convenience function for building action creators */
export const buildActionCreator = <
	TName extends string = string,
	TType extends string = string
>(moduleName: TName, type: TType) => (
	<TPayload extends any>(): ActionCreator<TName, TType, TPayload> => {
		const actionCreator: BareActionCreator<TType, TPayload> = (
			(payload: TPayload, options: DispatchActionOptions = {}) => ({
				...options,
				type,
				payload,
			})
		);
		return Object.assign(actionCreator, { moduleName, type });
	}
);

/** Convenience function for filtering actions by action creator */
export const isActionOf = <TName extends string, TType extends string, TPayload>(
	actionCreator: ActionCreator<TName, TType, TPayload>,
) => (
	(action: Action) => (
		action.moduleName === actionCreator.moduleName
			&& action.type === actionCreator.type
	)
);

/** Storage role of a module */
export enum StorageRole {
	/** None: this module is not used for storage */
	None = 'none',
	/** Primary: this module is used for fetching and storing */
	Primary = 'primary',
	/** Secondary: this module is used only for storing, e.g. as a backup */
	Secondary = 'secondary',
}

/** Configuration for a module, arbitrary per module */
export interface ModuleConfig {
	/** Module config property, arbitrary per module */
	[key: string]: any;
}

/** Predicate for validating module config shape */
export const isModuleConfig = (config: any): config is ModuleConfig => (
	!!config && typeof config === 'object'
);

/** The collection of API methods provided to every module */
export interface ModuleApi {
	/** Dispatch an action to the bus */
	readonly dispatch: (action: DispatchAction) => void;
	/** Storage API methods */
	readonly storage: {
		/** Fetch a value by key, if it has been stored */
		readonly fetch: <T = any>(key: string) => Promise<T | undefined>;
		/** Store a JSON-serializable value by key */
		readonly store: <T = any>(key: string, value: T) => Promise<void>;
		/** Remove a stored value by key */
		readonly remove: (key: string) => Promise<void>;
	}
}

/** Parameters provided when initializing a module */
export interface ModuleParams<TConfig extends ModuleConfig = ModuleConfig> {
	/** Unique identifier of this module instance */
	readonly moduleId: string;
	/** Configuration for the module */
	readonly config: TConfig;
	/** API methods provided to the module */
	readonly api: ModuleApi;
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
export interface ServerModuleInitParams<TConfig extends ModuleConfig = ModuleConfig> extends ModuleParams<TConfig> {}

/** Server module storage capability implementation */
export interface ServerModuleCapabilityStorage {
	/** Fetch a string value by key, if it has been stored */
	readonly fetch: (key: string) => Promise<string | undefined>;
	/** Store a string value by key */
	readonly store: (key: string, value: string) => Promise<void>;
	/** Remove a stored value by key */
	readonly remove: (key: string) => Promise<void>;
}

/** Optional response from server module initialization, providing module capabilities */
export interface ServerModuleCapabilities {
	/** Storage implementation */
	readonly storage?: ServerModuleCapabilityStorage;
}

/** The shape of a server module export */
export interface ServerModule<TConfig extends ModuleConfig = ModuleConfig> extends BaseModule {
	/** Module initialization method */
	readonly initialize: (params: ServerModuleInitParams<TConfig>) => ServerModuleCapabilities | void;
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
export interface StorageModuleCapabilities extends Required<Pick<ServerModuleCapabilities, 'storage'>> {}

/** The shape of a module which implements storage capability */
export interface StorageModule<TConfig extends ModuleConfig = ModuleConfig> extends ServerModule<TConfig> {
	readonly initialize: (params: ServerModuleInitParams<TConfig>) => StorageModuleCapabilities;
}

/** Predicate for validating server module's storage capability implementation shape */
export const isServerModuleCapabilityStorage = (storage: any): storage is ServerModuleCapabilityStorage => {
	if (!storage || typeof storage !== 'object') {
		return false;
	}
	const { fetch, store, remove } = storage;
	return typeof fetch === 'function'
		&& typeof store === 'function'
		&& typeof remove === 'function';
};

/** Props passed to a client module component */
export interface ClientModuleComponentProps<TConfig extends ModuleConfig = ModuleConfig> extends ModuleParams<TConfig> {
	/** Unique identifer of the client connection */
	clientId: string;
	/** Unique identifier for the screen this instance of the module is mounted on */
	screenId: string;
}

/** Props passed to a client module configurator */
export interface ClientModuleConfiguratorProps<TConfig extends ModuleConfig = ModuleConfig> {
	/** Handler for saving config object */
	saveConfig: (config: TConfig) => Promise<void>;
}

/** The shape of a client module export */
export interface ClientModule<TConfig extends ModuleConfig = ModuleConfig> extends BaseModule {
	/** React function component for the module */
	readonly component: FunctionComponent<ClientModuleComponentProps<TConfig>>;
	/** React function component for the module's configurator */
	readonly configurator?: FunctionComponent<ClientModuleConfiguratorProps<TConfig>>;
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

/** Describes a server module to load */
export interface ServerModuleSpec<TConfig extends ModuleConfig = ModuleConfig> extends BaseModuleSpec<TConfig> {
	/** Storage role of the module, if any */
	storageRole?: StorageRole;
}

/** Describes a client module to load */
export interface ClientModuleSpec<TConfig extends ModuleConfig = ModuleConfig> extends BaseModuleSpec<TConfig> {}

/** Configuration for the server */
export interface ServerConfig {
	/** The list of modules for the server to load */
	modules: (ServerModuleSpec | ModulePath)[];
	/** The port on which the server should listen for client connections */
	bridgePort?: number;
}

/** Configuration for a client screen */
export interface ClientScreenConfig {
	/** Unique identifier of the screen, also used in route URL */
	screenId: string;
	/** The list of modules for the screen to render */
	modules: (ClientModuleSpec | ModulePath)[];
}

/** Configuration for the client */
export interface ClientConfig {
	/** The port on which the client should connect to the server */
	bridgePort?: number;
	/** The port on which the client should listen for web connections */
	port?: number;
	/** The list of screens the client can render */
	screens: ClientScreenConfig[];
}

/** Root moduleId, for the bus itself */
export const rootModuleId = 'rosebus';

/** Root action types, for actions dispatched by the bus itself */
export enum RootActionType {
	InitComplete = 'initComplete',
}
