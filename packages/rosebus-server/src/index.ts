/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

const loadModules = async () => {
	const config = await import('./config.json');
	for (const entry of config.modules) {
		const modulePath = (typeof entry === 'string') ? entry : entry.path;
		try {
			const module = await import(modulePath);
			const { value } = module;
			console.log(`loaded module value ${value}`);
		} catch (error) {
			console.error(`Failed to load module path '${modulePath}'`);
		}
	}
};

loadModules();
