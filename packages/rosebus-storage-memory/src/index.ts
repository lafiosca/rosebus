import {
	StorageModule,
	ModuleConfig,
} from '@rosydoublecross/rosebus-common';

const moduleName = 'MemoryStorage';

export interface MemoryStorageConfig extends ModuleConfig {
	verbose?: boolean;
}

type MemoryStore = Record<string, string>;

const initialize: StorageModule<MemoryStorageConfig>['initialize'] = ({
	moduleId,
	config: { verbose = false },
}) => {
	const store: MemoryStore = {};
	const log = verbose
		? (msg: string) => console.log(`[${moduleId}] ${msg}`)
		: undefined;
	return {
		storage: {
			fetch: async (key) => {
				const value = store[key];
				log?.(`Fetched key '${key}': ${value === undefined ? '(not found)' : `'${value}'`}`);
				return value;
			},
			store: async (key, value) => {
				store[key] = value;
				log?.(`Stored key '${key}': '${value}'`);
			},
			remove: async (key) => {
				delete store[key];
				log?.(`Removed key '${key}'`);
			},
		},
	};
};

const MemoryStorage: StorageModule = {
	moduleName,
	initialize,
};

export default MemoryStorage;
