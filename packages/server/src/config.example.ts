import { ServerConfig } from '@rosebus/common';

const config: ServerConfig = {
	modules: [
		{
			path: '@rosebus/server-memory-storage',
			storageRole: 'primary',
		},
		{
			path: '@rosebus/server-heartbeat',
			config: {
				durationMs: 30000,
			},
		},
	],
};

export default config;
