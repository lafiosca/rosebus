import {
	Action,
	DispatchAction,
	ServerModule,
	ServerModuleInitResponse,
	ServerModuleSpec,
	isServerModule,
	isServerConfig,
	rootActions,
	rootModuleName,
	rootModuleId,
} from '@rosebus/common';
import { Subject } from 'rxjs';
// import { } from 'rxjs/operators';

import serverConfig from './config';

// TODO: internal representation of storage module configuration
// TODO: socketIo client/server bridge

/** The raw source action bus from which server module observables originate */
const action$ = new Subject<Action>();

/** Cache of all imported and validated server modules by path */
const moduleCache: Record<string, ServerModule> = {};

/** A server module that has been loaded from the server config */
interface LoadedModule extends Omit<ServerModuleSpec, 'moduleId'>, Required<Pick<ServerModuleSpec, 'moduleId'>> {
	/** The server module imported from path */
	serverModule: ServerModule;
	/** The initialization response, if any */
	initResponse?: ServerModuleInitResponse;
}

/** Registry of loaded server modules, keyed by moduleId */
type ModuleRegistry = Record<string, LoadedModule>;

/** The registry of all loaded server modules */
const moduleRegistry: ModuleRegistry = {};

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
	serverModules.forEach((serverModule, i) => {
		const moduleSpec = moduleSpecs[i];
		const baseModuleId = moduleSpec.moduleId ?? serverModule.moduleName;
		let moduleId = baseModuleId;
		let j = 1;
		while (moduleRegistry[moduleId]) {
			j += 1;
			moduleId = `${baseModuleId}.${j}`;
		}
		const loadedModule: LoadedModule = {
			...moduleSpec,
			serverModule,
			moduleId,
		};
		// TODO: establish piped action stream for module
		// TODO: establish API for module
		// TODO: initialize module, and add init response to loadedModule
		// TODO: examine init response for storage module handling
		// TODO: examine init response for reaction stream feedback hookup
		moduleRegistry[moduleId] = loadedModule;
	});
	emitRootAction(rootActions.initComplete({ moduleCount: serverModules.length }));
};

(async () => {
	await initializeServer(serverConfig);
})();
