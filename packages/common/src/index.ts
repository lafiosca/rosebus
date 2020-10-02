import type { FunctionComponent } from 'react';
import type { Observable } from 'rxjs';

/** Options for a dispatched action */
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
export interface DispatchAction<TName extends string = string, TType extends string = string, TPayload = any>
	extends DispatchActionOptions {
	/** Name of the module that defines this action */
	moduleName: TName;
	/** Type of the action, arbitrarily defined by module */
	type: TType;
	/** Payload of the action, arbitrarily defined by module; must be JSON-serializable if crossing client-server bridge */
	payload: TPayload;
}

/** An action as it arrives via the bus */
export interface Action<TName extends string = string, TType extends string = string, TPayload = any>
	extends DispatchAction<TName, TType, TPayload> {
	/** The name of the module from which this action was dispatched */
	fromModuleName: string;
	/** The moduleId from which this action was dispatched */
	fromModuleId: string;
	/** The clientId from which this action was dispatched, if client-originated */
	fromClientId?: string;
	/** The screenId from which this action was dispatched, if client-originated */
	fromScreenId?: string;
}

/** Action creator function without metadata */
export interface BareActionCreator<TName extends string = string, TType extends string = string, TPayload = any> {
	(payload: TPayload, options?: DispatchActionOptions): DispatchAction<TName, TType, TPayload>;
}

/** Action creator function */
export interface ActionCreator<
	TName extends string = string,
	TType extends string = string,
	TPayload = any
> extends BareActionCreator<TName, TType, TPayload> {
	/** Name of the module that defines this action */
	readonly moduleName: TName;
	/** Type of the action, arbitrarily defined by module */
	readonly type: TType;
}

/** Union type of dispatch actions returned by any action creator in a map, or from a single action creator */
export type DispatchActionType<TActionCreators extends any> =
	TActionCreators extends BareActionCreator
		? ReturnType<TActionCreators>
		: TActionCreators extends Record<any, any>
			? {
				[K in keyof TActionCreators]: DispatchActionType<TActionCreators[K]>;
			}[keyof TActionCreators]
			: never;

/** Union type of actions originating from any action creator in a map, or from a single action creator */
export type ActionType<TActionCreators extends any> =
	TActionCreators extends ActionCreator<infer TName, infer TType, infer TPayload>
		? Action<TName, TType, TPayload>
		: TActionCreators extends Record<any, any>
			? {
				[K in keyof TActionCreators]: ActionType<TActionCreators[K]>;
			}[keyof TActionCreators]
			: never;

/** Convenience function for building action creators */
export const buildActionCreator = <
	TName extends string = string,
	TType extends string = string
>(moduleName: TName, type: TType) => (
	<TPayload extends any>(): ActionCreator<TName, TType, TPayload> => {
		const actionCreator: BareActionCreator<TName, TType, TPayload> = (
			(payload: TPayload, options: DispatchActionOptions = {}) => ({
				...options,
				moduleName,
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
	(action: Action): action is Action<TName, TType, TPayload> => (
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

/** Predicate for validating storage role */
export const isStorageRole = (role: any): role is StorageRole => (
	typeof role === 'string' && Object.values(StorageRole).includes(role as any)
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

/** The collection of API methods provided to every module */
export interface ModuleApi<TDispatchAction extends DispatchAction = DispatchAction> {
	/** Dispatch an action to the bus */
	readonly dispatch: (action: TDispatchAction) => void;
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
	/** Fetch a string value by key, if it has been stored */
	readonly fetch: (key: string) => Promise<string | undefined>;
	/** Store a string value by key */
	readonly store: (key: string, value: string) => Promise<void>;
	/** Remove a stored value by key */
	readonly remove: (key: string) => Promise<void>;
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

/** The shape of a module which implements storage capability */
export interface StorageModule<TConfig extends ModuleConfig = ModuleConfig> extends ServerModule<TConfig> {
	readonly initialize: (params: ServerModuleInitParams<TConfig>) => Promise<StorageModuleCapabilities>;
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

/** Configuration for the server */
export interface ServerConfig {
	/** The list of modules for the server to load */
	modules: (ServerModuleSpec | ModulePath)[];
	/** The port on which the server should listen for client connections */
	bridgePort?: number;
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
	if (!config || typeof config !== 'object') {
		return false;
	}
	const { modules, bridgePort } = config;
	if (!Array.isArray(modules)) {
		return false;
	}
	if (!modules.every(isServerConfigModule)) {
		return false;
	}
	if (bridgePort !== undefined && typeof bridgePort !== 'number') {
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

/** Configuration for the client */
export interface ClientConfig {
	/** The port on which the client should connect to the server */
	bridgePort?: number;
	/** The port on which the client should listen for web connections */
	port?: number;
	/** The list of screens the client can render */
	screens: ClientScreenConfig[];
}

/** Root module name/id, for the bus itself */
export const rootModuleName = 'Rosebus';
export const rootModuleId = rootModuleName;

/** Payload for root initComplete action */
export interface InitCompletePayload {
	/** Number of server modules loaded */
	moduleCount: number;
}

/** Payload for root shutdown action */
export interface ShutdownPayload {}

/** Root action creators, for actions dispatched by the bus itself */
export const rootActions = {
	initComplete: buildActionCreator(rootModuleName, 'initComplete')<InitCompletePayload>(),
	shutdown: buildActionCreator(rootModuleName, 'shutdown')<ShutdownPayload>(),
};

/** Union type of all actions originating from the bus itself */
export type RootActionType = ActionType<typeof rootActions>;

/** Convenience function for filtering root initComplete action */
export const isInitComplete = isActionOf(rootActions.initComplete);

/** Convenience function for filtering root shutdown action */
export const isShutdown = isActionOf(rootActions.shutdown);
