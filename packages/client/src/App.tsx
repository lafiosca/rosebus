import React from 'react';
import { Router } from '@reach/router';

import Root from './routes/Root';

const App = () => (
	<Router>
		<Root default />
	</Router>
);

export default App;
