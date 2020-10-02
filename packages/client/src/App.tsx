import React, {
	useEffect,
} from 'react';
import { Router } from '@reach/router';

import AppRoot from './routes/AppRoot';

const App = () => {
	useEffect(
		() => {
			console.log('Start client');
		},
		[],
	);

	return (
		<Router>
			<AppRoot default />
		</Router>
	);
};

export default App;
