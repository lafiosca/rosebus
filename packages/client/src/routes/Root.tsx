import React, { FunctionComponent, useEffect } from 'react';
import { Router } from '@reach/router';

import NotFound from '../components/NotFound';
import RouteNotFound from './RouteNotFound';
import { RouteComponentProps } from '../services/navigation';
import { initializeBridge } from '../services/bridge';
import './Root.css';

interface Props extends RouteComponentProps {}

const Root: FunctionComponent<Props> = ({ location }) => {
	const notFound = location?.state?.notFound ?? false;

	useEffect(
		() => {
			if (!notFound) {
				return initializeBridge({});
			}
			return undefined;
		},
		[notFound],
	);

	return (
		<div className="Root">
			<main>
				{notFound ? (
					<NotFound />
				) : (
					<Router>
						{/* TODO: iterate through config routes */}
						<RouteNotFound default />
					</Router>
				)}
			</main>
		</div>
	);
};

export default Root;
