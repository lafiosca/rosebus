import React, { FunctionComponent, useEffect } from 'react';
import { Router } from '@reach/router';

import Admin from '../routes/Admin';
import RouteNotFound from '../routes/RouteNotFound';
import Screen from '../routes/Screen';
import { initializeBridge } from '../services/bridge';

const AuthenticatedRoot: FunctionComponent = () => {
	useEffect(
		() => {
			const cleanupBridge = initializeBridge({});
			return () => {
				cleanupBridge();
			};
		},
		[],
	);

	return (
		<Router>
			{/* TODO: iterate through config routes */}
			<Admin path="/" />
			<Screen path="/auth" />
			<RouteNotFound default />
		</Router>
	);
};

export default AuthenticatedRoot;
