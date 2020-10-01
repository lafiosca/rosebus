import {
	ServerModule,
	isServerModule,
	isServerConfig,
} from '@rosydoublecross/rosebus-types';

import serverConfig from './config';

const moduleCache: Record<string, ServerModule> = {};

const importModule = async (modulePath: string) => {
	const cachedModule = moduleCache[modulePath];
	if (cachedModule) {
		return cachedModule;
	}
	const moduleImport = await import(modulePath);
	if (!isServerModule(moduleImport)) {
		throw new Error(`Malformed server module at import path '${modulePath}'`);
	}
	moduleCache[modulePath] = moduleImport;
	return moduleImport;
};

const loadServerConfig = async (config: unknown) => {
	if (!isServerConfig(config)) {
		throw new Error('Malformed server config');
	}
	const modules = await Promise.all(
		config.modules.map((item) => (
			importModule(typeof item === 'string' ? item : item.path)
		)),
	);
	modules.forEach(({ moduleName }) => {
		console.log(moduleName);
	});
};

(async () => {
	await loadServerConfig(serverConfig);
})();
