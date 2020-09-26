import { Observable } from 'rxjs';

/** An action as it is dispatched by a module */
export interface DispatchAction<TType extends string = string, TPayload = any> {
	/** Type of the action, arbitrarily defined by module */
	type: TType;
	/** Payload of the action, arbitrarily defined by module */
	payload: TPayload;
	/** A moduleId to which this action should be privately dispatched */
	targetModuleId?: string;
	/** A client screenId to which this action should be privately dispatched */
	targetScreenId?: string;
}

/** An action as it arrives from the bus */
export interface Action<TType extends string = string, TPayload = any> {
	/** Type of the action, arbitrarily defined by module */
	readonly type: TType;
	/** Payload of the action, arbitrarily defined by module */
	readonly payload: TPayload;
	/** The moduleId from which this action was dispatched */
	readonly fromModuleId: string;
	/** The client screenId from which this action was dispatched, if any */
	readonly fromScreenId?: string;
}

/** Storage role of a module */
export enum StorageRole {
	/** None: this module is not used for storage */
	None = 'none',
	/** Primary: this module is used for fetching and storing */
	Primary = 'primary',
	/** Secondary: this module is used only for storing, e.g. as a backup */
	Secondary = 'secondary',
}

/** User-specified configuration for a module, arbitrary per module */
export interface ModuleConfig {
	/** Module config property, arbitrary per module */
	[key: string]: any;
}

/** Predicate for validating module config shape */
export const isModuleConfig = (config: any): config is ModuleConfig => (
	!!config && typeof config === 'object'
);

/** Path of an import for a module */
export type ModulePath = string;

/** Describes a module for the server to load */
export interface ModuleSpec {
	/** Path of the import for the module */
	path: ModulePath;
	/** Storage role of the module, if any */
	storageRole?: StorageRole;
	/** Unique module id, overriding default; useful for duplicate modules with distinct configs */
	moduleId?: string;
	/** Module config, arbitrary per module */
	config?: ModuleConfig;
}

/** User-specified configuration for the server */
export interface ServerConfig {
	/** The list of modules for the server to load */
	modules: (ModuleSpec | ModulePath)[];
	/** The port on which the server should listen for client connections */
	port?: number;
}

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
	/** User-specified configuration for the module */
	readonly config: ModuleConfig;
	/** API methods provided to the module */
	readonly api: ModuleApi;
	/** Observable stream of bus actions seen by this module */
	readonly action$: Observable<Action>;
}

/** The shape of a server module export */
export interface ServerModule {
	/** Default moduleId for this module */
	readonly defaultModuleId: string;
	/** This module's extra capabilities, if any */
	readonly capabilities?: {
		/** If true, indicates that this module implements the storage methods */
		readonly storage?: boolean;
	};
	/** Module initialization method */
	readonly initialize: (params: ModuleParams) => void;
}

/** Helper function for isServerModule */
const isServerModuleDefaultModuleId = (defaultModuleId: any): defaultModuleId is ServerModule['defaultModuleId'] => (
	!!defaultModuleId && typeof defaultModuleId === 'string'
);

/** Helper function for isServerModule */
const isServerModuleCapabilities = (capabilities: any): capabilities is ServerModule['capabilities'] => {
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

/** Predicate for validating server module shape */
export const isServerModule = (serverModule: any): serverModule is ServerModule => {
	if (!serverModule || typeof serverModule !== 'object') {
		return false;
	}
	const {
		defaultModuleId,
		capabilities,
		initialize,
	} = serverModule;
	if (!isServerModuleDefaultModuleId(defaultModuleId)) {
		return false;
	}
	if (!isServerModuleCapabilities(capabilities)) {
		return false;
	}
	if (typeof initialize !== 'function') {
		return false;
	}
	return true;
};

/** The shape of a specific subclass of server module which implements storage capability */
export interface ServerStorageModule extends ServerModule {
	/** This module's extra capabilities */
	readonly capabilities: {
		/** Indicates this module implements the storage methods */
		readonly storage: true;
	};
	/** Fetch a string value by key, if it has been stored */
	readonly fetch: (key: string) => Promise<string | undefined>;
	/** Store a string value by key */
	readonly store: (key: string, value: string) => Promise<void>;
	/** Remove a stored value by key */
	readonly remove: (key: string) => Promise<void>;
}

/** Predicate for validating server storage module shape */
export const isServerStorageModule = (serverModule: ServerModule): serverModule is ServerStorageModule => (
	serverModule.capabilities?.storage === true
		&& typeof (serverModule as any).fetch === 'function'
		&& typeof (serverModule as any).store === 'function'
		&& typeof (serverModule as any).remove === 'function'
);
