import { ServerConfig } from '@rosebus/common';

const config: ServerConfig = {
	modules: [
		{
			path: '@rosebus/server-memory-storage',
			storageRole: 'primary',
		},
		'@rosebus/server-heartbeat',
	],
};

export default config;
