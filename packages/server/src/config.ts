import { ServerConfig, StorageRole } from '@rosebus/common';

const config: ServerConfig = {
	modules: [
		{
			path: '@rosebus/server-memory-storage',
			storageRole: StorageRole.Primary,
		},
		'@rosebus/server-heartbeat',
	],
};

export default config;
