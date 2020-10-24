import React, {
	useEffect,
} from 'react';
import { Router } from '@reach/router';

import AppRoot from './routes/AppRoot';
import { initializeBridge } from './services/bridge';

const App = () => {
	useEffect(
		() => {
			initializeBridge({});
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
