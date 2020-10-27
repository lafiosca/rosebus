import React, { FunctionComponent } from 'react';

import NotFound from '../components/NotFound';
import AuthGate from '../components/AuthGate';
import AuthenticatedRoot from '../components/AuthenticatedRoot';
import { RouteComponentProps } from '../services/navigation';
import './Root.css';

interface Props extends RouteComponentProps {}

const Root: FunctionComponent<Props> = ({ location }) => {
	const notFound = location?.state?.notFound ?? false;
	return (
		<div className="Root">
			<main>
				{notFound ? (
					<NotFound />
				) : (
					<AuthGate>
						<AuthenticatedRoot />
					</AuthGate>
				)}
			</main>
		</div>
	);
};

export default Root;
