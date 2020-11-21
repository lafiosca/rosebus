import {
	LogLevel,
	ModuleConfig,
	StorageModule,
	StorageModuleInitializer,
} from '@rosebus/common';

const moduleName = 'MemoryStorage';

export interface MemoryStorageConfig extends ModuleConfig {}

type MemoryStore = Record<string, Record<string, string>>;

const initialize: StorageModuleInitializer<MemoryStorageConfig> = async ({
	api: { log },
}) => {
	const store: MemoryStore = {};
	return {
		storage: {
			fetch: async (name, key) => {
				const value = store[name]?.[key];
				log({
					level: LogLevel.Debug,
					text: `Fetched ('${name}', '${key}'): ${value === undefined ? 'not found' : `'${value}'`}`,
				});
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
				log({
					level: LogLevel.Debug,
					text: `Stored ${found ? 'overwritten' : 'new'} ('${name}', '${key}'): '${value}'`,
				});
			},
			remove: async (name, key) => {
				let found = false;
				if (store[name]) {
					found = (typeof store[name][key] === 'string');
					delete store[name][key];
				}
				log({
					level: LogLevel.Debug,
					text: `Removed ${found ? '' : 'non'}existent ('${name}', '${key}')`,
				});
			},
		},
	};
};

const MemoryStorage: StorageModule = {
	moduleName,
	initialize,
};

export default MemoryStorage;
