const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = (config) => {
	// Remove the ModuleScopePlugin which throws when we try
	// to import something outside of src/.
	config.resolve.plugins.pop();

	// Resolve the path aliases.
	config.resolve.plugins.push(new TsconfigPathsPlugin());

	// Let Babel compile outside of src/.
	const tsRule = config.module.rules[2].oneOf[1];
	tsRule.include = undefined;
	tsRule.exclude = /node_modules/;

	// Workaround problem with mjs imports (e.g., twitch library)
	// per https://github.com/reactioncommerce/reaction-component-library/issues/399#issuecomment-467860022
	config.module.rules.push({
		test: /\.mjs$/,
		include: /node_modules/,
		type: 'javascript/auto',
	});

	return config;
};
