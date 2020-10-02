import {
	Action,
	DispatchAction,
	ModuleApiDispatch,
	ModuleApiStorage,
	ModuleApi,
	ServerModule,
	ServerModuleStorageImplementation,
	ServerModuleInitParams,
	ServerModuleInitResponse,
	ServerModuleSpec,
	StorageRole,
	isServerConfig,
	isServerModule,
	isServerModuleCapabilityStorage,
	rootActions,
	rootModuleName,
	rootModuleId,
} from '@rosebus/common';
import { Subject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import serverConfig from './config';

// TODO: socketIo client/server bridge

/** The raw source action stream from which server module observables originate */
const action$ = new Subject<Action>();
action$.subscribe(
	({
		moduleName,
		type,
		payload,
		fromModuleId,
		fromModuleName,
	}) => {
		const from = `${fromModuleId}${fromModuleName !== fromModuleId ? ` (${fromModuleName})` : ''}`;
		const message = `(${moduleName}, ${type}, ${JSON.stringify(payload)})`;
		console.log(`[${from}] ${message}`);
	},
);

/** Cache of all imported and validated server modules by path */
const moduleCache: Record<string, ServerModule> = {};

/** Registry of module paths keyed by module name, for enforcing name uniqueness */
const modulePathsByName: Record<string, string> = {};

type RequiredPick<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** A server module that has been loaded from the server config */
interface LoadedModule extends RequiredPick<ServerModuleSpec, 'moduleId'> {
	/** The server module imported from path */
	serverModule: ServerModule;
	/** The initialization response, if any */
	initResponse?: ServerModuleInitResponse;
	/** The reaction stream subscription, if any */
	reactionSub?: Subscription;
}

/** Registry of loaded server modules, keyed by moduleId */
type ModuleRegistry = Record<string, LoadedModule>;

/** The registry of all loaded server modules */
const moduleRegistry: ModuleRegistry = {};

/** Registry of loaded storage modules, by role */
interface StorageModuleRegistry {
	/** Primary (read/write) storage module, used for fetch, store, and remove methods */
	primary?: ServerModuleStorageImplementation;
	/** Secondary (write-only) storage modules, used for store and remove methods only */
	secondaries: ServerModuleStorageImplementation[];
}

/** The registry of all loaded storage modules */
const storageModuleRegistry: StorageModuleRegistry = {
	primary: undefined,
	secondaries: [],
};

/** Emit an action dispatched by a module */
const emitModuleAction = (
	action: DispatchAction,
	{
		moduleId: fromModuleId,
		serverModule: {
			moduleName: fromModuleName,
		},
	}: LoadedModule,
) => {
	action$.next({
		...action,
		fromModuleName,
		fromModuleId,
	});
};

/** Emit a root action */
const emitRootAction = (action: DispatchAction) => {
	action$.next({
		...action,
		fromModuleName: rootModuleName,
		fromModuleId: rootModuleId,
	});
};

/** Build an action stream specific to a loaded module */
const buildModuleAction$ = ({ moduleId }: LoadedModule) => (
	action$.pipe(
		filter(({
			targetModuleId,
			targetClientId,
			targetScreenId,
		}) => {
			if (targetClientId || targetScreenId) {
				return false;
			}
			if (targetModuleId && moduleId !== targetModuleId) {
				return false;
			}
			return true;
		}),
	)
);

const buildModuleApiDispatch = (loadedModule: LoadedModule): ModuleApiDispatch => (
	(action) => emitModuleAction(action, loadedModule)
);

const buildModuleApiStorage = (
	{ serverModule: { moduleName } }: LoadedModule,
): ModuleApiStorage => ({
	fetch: async (key: string) => {
		const { primary } = storageModuleRegistry;
		if (!primary) {
			throw new Error('No primary storage module has been registered');
		}
		const value = await primary.fetch(moduleName, key);
		return value === undefined ? value : JSON.parse(value);
	},
	store: async <T = any>(key: string, value: T) => {
		const { primary, secondaries } = storageModuleRegistry;
		if (!primary) {
			throw new Error('No primary storage module has been registered');
		}
		await Promise.all([primary, ...secondaries].map((s) => (
			s.store(moduleName, key, JSON.stringify(value))
		)));
	},
	remove: async (key: string) => {
		const { primary, secondaries } = storageModuleRegistry;
		if (!primary) {
			throw new Error('No primary storage module has been registered');
		}
		await Promise.all([primary, ...secondaries].map((s) => s.remove(moduleName, key)));
	},
});

const buildModuleApi = (
	loadedModule: LoadedModule,
): ModuleApi => ({
	dispatch: buildModuleApiDispatch(loadedModule),
	storage: buildModuleApiStorage(loadedModule),
});

/** Import a module from path and validate that it is a ServerModule; error if import fails or invalid shape */
const importModule = async (modulePath: string) => {
	const cachedModule = moduleCache[modulePath];
	if (cachedModule) {
		return cachedModule;
	}
	const { default: serverModule } = await import(modulePath);
	if (!isServerModule(serverModule)) {
		throw new Error(`Malformed server module at import path '${modulePath}'`);
	}
	const { moduleName } = serverModule;
	const expectedPath = modulePathsByName[moduleName];
	if (expectedPath) {
		if (expectedPath !== modulePath) {
			throw new Error(`Module name '${moduleName}' is already registered to import path '${expectedPath}'`);
		}
	} else {
		modulePathsByName[moduleName] = modulePath;
	}
	moduleCache[modulePath] = serverModule;
	return serverModule;
};

/** Initialize server by validating config then loading and initializing all specified modules */
const initializeServer = async (config: unknown) => {
	if (!isServerConfig(config)) {
		throw new Error('Malformed server config');
	}
	const moduleSpecs: ServerModuleSpec[] = config.modules.map((item) => (
		typeof item === 'string' ? { path: item } : item
	));
	const serverModules = await Promise.all(
		moduleSpecs.map((spec) => spec.path)
			.map(importModule),
	);
	await Promise.all(serverModules.map(async (serverModule, i) => {
		const moduleSpec = moduleSpecs[i];
		const baseModuleId = moduleSpec.moduleId ?? serverModule.moduleName;
		let moduleId = baseModuleId;
		let j = 1;
		while (moduleRegistry[moduleId]) {
			j += 1;
			moduleId = `${baseModuleId}.${j}`;
			// TODO: warn user that they might want explicit module id
		}
		const loadedModule: LoadedModule = {
			...moduleSpec,
			serverModule,
			moduleId,
		};
		const initParams: ServerModuleInitParams = {
			moduleId,
			config: moduleSpec.config ?? {},
			action$: buildModuleAction$(loadedModule),
			api: buildModuleApi(loadedModule),
		};
		const initResponse = await serverModule.initialize(initParams);
		if (initResponse) {
			const { storage, reaction$ } = initResponse;
			const { storageRole } = moduleSpec;
			if (storage && !isServerModuleCapabilityStorage(storage)) {
				throw new Error(`Module path '${moduleSpec.path}' returned an invalid storage implementation`);
			}
			if (storageRole && storageRole !== StorageRole.None) {
				if (!storage) {
					throw new Error(`Module path '${moduleSpec.path}' is configured with storage role but does not implement storage`);
				}
				switch (storageRole) {
					case StorageRole.Primary:
						if (storageModuleRegistry.primary) {
							throw new Error('Server config specifies more than one primary storage module');
						}
						storageModuleRegistry.primary = storage;
						break;
					case StorageRole.Secondary:
						storageModuleRegistry.secondaries.push(storage);
						break;
					default:
						/* Do nothing */
				}
			}
			if (reaction$) {
				loadedModule.reactionSub = reaction$.subscribe({
					next: initParams.api.dispatch,
					error: (error) => {
						console.error(`Reaction stream for moduleId '${moduleId}' ended with error`, error);
					},
					complete: () => {
						console.log(`Reaction stream for moduleId '${moduleId}' completed`);
					},
				});
			}
			loadedModule.initResponse = initResponse;
		}
		moduleRegistry[moduleId] = loadedModule;
	}));
	emitRootAction(rootActions.initComplete({ moduleCount: serverModules.length }));
};

(async () => {
	await initializeServer(serverConfig);
})();
