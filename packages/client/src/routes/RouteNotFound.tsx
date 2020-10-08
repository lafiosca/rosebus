import React, { FunctionComponent } from 'react';
import { Redirect } from '@reach/router';

import { RouteComponentProps } from '../services/navigation';

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
