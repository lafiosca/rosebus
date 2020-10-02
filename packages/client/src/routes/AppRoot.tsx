import React, { FunctionComponent } from 'react';
import { Router } from '@reach/router';

import NotFound from '../components/NotFound';
import RouteNotFound from './RouteNotFound';
import { RouteComponentProps } from '../helpers/navigation';
import './AppRoot.css';

interface Props extends RouteComponentProps {}

const AppRoot: FunctionComponent<Props> = ({ location }) => {
	const notFound = location?.state?.notFound ?? false;
	return (
		<div className="AppRoot">
			<main>
				{notFound ? (
					<NotFound />
				) : (
					<Router>
						<RouteNotFound default />
					</Router>
				)}
			</main>
		</div>
	);
};

export default AppRoot;
