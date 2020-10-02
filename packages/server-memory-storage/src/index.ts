import {
	ModuleConfig,
	StorageModule,
	StorageModuleInitializer,
} from '@rosebus/common';

const moduleName = 'MemoryStorage';

export interface MemoryStorageConfig extends ModuleConfig {
	verbose?: boolean;
}

type MemoryStore = Record<string, Record<string, string>>;

const initialize: StorageModuleInitializer<MemoryStorageConfig> = async ({
	moduleId,
	config: { verbose = false },
}) => {
	const store: MemoryStore = {};
	const log = verbose
		? (msg: string) => console.log(`[${moduleId}] ${msg}`)
		: undefined;
	return {
		storage: {
			fetch: async (name, key) => {
				const value = store[name]?.[key];
				log?.(`Fetched ('${name}', '${key}'): ${value === undefined ? 'not found' : `'${value}'`}`);
				return value;
			},
			store: async (name, key, value) => {
				let found = false;
				if (!store[name]) {
					store[name] = {};
				} else {
					found = (typeof store[name][key] === 'string');
				}
				store[name][key] = value;
				log?.(`Stored ${found ? 'overwritten' : 'new'} ('${name}', '${key}'): '${value}'`);
			},
			remove: async (name, key) => {
				let found = false;
				if (store[name]) {
					found = (typeof store[name][key] === 'string');
					delete store[name][key];
				}
				log?.(`Removed ${found ? '' : 'non'}existent ('${name}', '${key}')`);
			},
		},
	};
};

const MemoryStorage: StorageModule = {
	moduleName,
	initialize,
};

export default MemoryStorage;
