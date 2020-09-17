import React, { FunctionComponent } from 'react';
import { RouteComponentProps, Redirect } from '@reach/router';

interface Props extends RouteComponentProps {}

const RouteNotFound: FunctionComponent<Props> = ({ location }) => {
	return (
		<Redirect
			to={location?.pathname ?? '/'}
			state={{ notFound: true }}
			noThrow
		/>
	);
};

export default RouteNotFound;
