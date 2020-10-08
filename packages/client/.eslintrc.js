module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: './tsconfig.json',
	},
	plugins: ['@typescript-eslint'],
	extends: [
		'airbnb-typescript',
		'react-app',
	],
	rules: {
		'no-tabs': 0,
		'arrow-body-style': 0,
		'arrow-parens': [2, 'always'],
		'no-console': 0,
		'max-len': [2, {
			code: 120,
			tabWidth: 4,
			ignoreComments: true,
			ignoreUrls: true,
			ignoreStrings: true,
			ignoreTemplateLiterals: true,
			ignoreRegExpLiterals: true,
		}],
		'@typescript-eslint/indent': [2, 'tab', { SwitchCase: 1 }],
		'react/jsx-indent': [2, 'tab'],
		'react/jsx-indent-props': [2, 'tab'],
		'react/prop-types': 0,
		'import/prefer-default-export': 0,
	},
	ignorePatterns: [
		'.eslintrc.js',
	],
};
