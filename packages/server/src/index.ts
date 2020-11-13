import { isServerConfig, rootActions } from '@rosebus/common';

import { emitRootAction } from './actions';
import { initializeBridge } from './bridge';
import { initializeServerModules } from './modules';
import serverConfig from './config';

/*
 * Initialize server by:
 * 1. Validating config
 * 2. Loading and initializing all server modules
 * 3. Establishing client-server bridge
 */
const initializeServer = async (config: unknown) => {
	if (!isServerConfig(config)) {
		throw new Error('Malformed server config');
	}
	const moduleCount = await initializeServerModules(config);
	emitRootAction(rootActions.initComplete({ moduleCount }));
	initializeBridge(config);
};

(async () => {
	await initializeServer(serverConfig);
})();
