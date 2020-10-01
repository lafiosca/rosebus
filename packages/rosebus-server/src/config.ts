import { ServerConfig, StorageRole } from '@rosydoublecross/rosebus-types';

const config: ServerConfig = {
	modules: [
		{
			path: '@rosydoublecross/rosebus-storage-memory',
			storageRole: StorageRole.Primary,
		},
		'@rosydoublecross/rosebus-server-heartbeat',
	],
};

export default config;
