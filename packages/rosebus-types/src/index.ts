import type { FunctionComponent } from 'react';
import type { Observable } from 'rxjs';

export interface DispatchActionOptions {
	/** A moduleId to which this action should be privately dispatched */
	targetModuleId?: string;
	/** A client screenId to which this action should be privately dispatched */
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
export interface Action<TType extends string = string, TPayload = any> {
	/** Type of the action, a string arbitrarily defined by module */
	readonly type: TType;
	/** Payload of the action, arbitrarily defined by module; must be JSON-serializable if crossing client-server bridge */
	readonly payload: TPayload;
	/** The moduleId from which this action was dispatched */
	readonly fromModuleId: string;
	/** The client screenId from which this action was dispatched, if any */
	readonly fromScreenId?: string;
}

/** Action creator function without metadata */
export interface BareActionCreator<TType extends string = string, TPayload = any> {
	(payload: TPayload, options?: DispatchActionOptions): DispatchAction<TType, TPayload>;
}

/** Action creator function */
export interface ActionCreator<TType extends string = string, TPayload = any>
	extends BareActionCreator<TType, TPayload> {
	readonly type: TType;
}

/** Convenience function for building action creators */
export const buildActionCreator = <TType extends string = string>(type: TType) => (
	<TPayload extends any>(): ActionCreator<TType, TPayload> => {
		const actionCreator: BareActionCreator<TType, TPayload> = (
			(payload: TPayload, options: DispatchActionOptions = {}) => ({
				...options,
				type,
				payload,
			})
		);
		return Object.assign(actionCreator, { type });
	}
);

/** Convenience function for filtering actions by action creator */
export const isActionOf = <TType extends string, TPayload>(actionCreator: ActionCreator<TType, TPayload>) => (
	(action: Action) => (action.type === actionCreator.type)
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
export interface ModuleParams {
	/** Configuration for the module */
	readonly config: ModuleConfig;
	/** API methods provided to the module */
	readonly api: ModuleApi;
	/** Observable stream of bus actions seen by this module */
	readonly action$: Observable<Action>;
}

/** The common shape of a module export, server or client */
export interface BaseModule {
	/** Default moduleId for this module */
	readonly defaultModuleId: string;
	/** This module's extra capabilities, if any */
	readonly capabilities?: {
		/** If true, indicates that this module implements the storage methods */
		readonly storage?: boolean;
	};
}

/** Predicate for validating base module's defaultModuleId shape */
export const isBaseModuleDefaultModuleId = (defaultModuleId: any): defaultModuleId is BaseModule['defaultModuleId'] => (
	!!defaultModuleId && typeof defaultModuleId === 'string'
);

/** Predicate for validating base module's capabilities shape */
export const isBaseModuleCapabilities = (capabilities: any): capabilities is BaseModule['capabilities'] => {
	if (capabilities === undefined) {
		return true;
	}
	if (!capabilities || typeof capabilities !== 'object') {
		return false;
	}
	const { storage } = capabilities;
	if (storage !== undefined && typeof storage !== 'boolean') {
		return false;
	}
	return true;
};

/** Predicate for validating base module shape */
export const isBaseModule = (someModule: any): someModule is BaseModule => {
	if (!someModule || typeof someModule !== 'object') {
		return false;
	}
	const { defaultModuleId, capabilities } = someModule;
	if (!isBaseModuleDefaultModuleId(defaultModuleId)) {
		return false;
	}
	if (!isBaseModuleCapabilities(capabilities)) {
		return false;
	}
	return true;
};

/** The shape of a server module export */
export interface ServerModule extends BaseModule {
	/** Module initialization method */
	readonly initialize: (params: ModuleParams) => void;
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

/** Props passed to a client module component */
export interface ClientModuleComponentProps extends ModuleParams {
	/** Unique identifier for the screen this instance of the module is mounted on */
	screenId: string;
}

/** Props passed to a client module configurator */
export interface ClientModuleConfiguratorProps {
	/** Handler for saving config object */
	saveConfig: (config: ModuleConfig) => Promise<void>;
}

/** The shape of a client module export */
export interface ClientModule extends BaseModule {
	/** React function component for the module */
	readonly component: FunctionComponent<ClientModuleComponentProps>;
	/** React function component for the module's configurator */
	readonly configurator?: FunctionComponent<ClientModuleConfiguratorProps>;
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

/** The shape of a module which implements storage capability */
export interface StorageModule extends BaseModule {
	/** This module's extra capabilities */
	readonly capabilities: {
		/** Indicates this module implements the storage methods */
		readonly storage: true;
	};
	/** Storage implementation */
	readonly storage: {
		/** Fetch a string value by key, if it has been stored */
		readonly fetch: (key: string) => Promise<string | undefined>;
		/** Store a string value by key */
		readonly store: (key: string, value: string) => Promise<void>;
		/** Remove a stored value by key */
		readonly remove: (key: string) => Promise<void>;
	};
}

/** Predicate for validating storage module's storage implementation shape */
export const isStorageModuleStorage = (storage: any): storage is StorageModule['storage'] => {
	if (!storage || typeof storage !== 'object') {
		return false;
	}
	const { fetch, store, remove } = storage;
	return typeof fetch === 'function'
		&& typeof store === 'function'
		&& typeof remove === 'function';
};

/** Predicate for validating storage module shape */
export const isStorageModule = (someModule: BaseModule): someModule is StorageModule => (
	someModule.capabilities?.storage === true
		&& isStorageModuleStorage((someModule as any).storage)
);

/** Import path for a module */
export type ModulePath = string;

/** Describes a module to load */
export interface BaseModuleSpec {
	/** Path of the import for the module */
	path: ModulePath;
	/** Storage role of the module, if any */
	storageRole?: StorageRole;
	/** Unique module id, overriding default; useful for duplicate modules with distinct configs */
	moduleId?: string;
	/** Module config, arbitrary per module */
	config?: ModuleConfig;
}

/** Describes a server module to load */
export interface ServerModuleSpec extends BaseModuleSpec {}

/** Describes a client module to load */
export interface ClientModuleSpec extends BaseModuleSpec {}

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
