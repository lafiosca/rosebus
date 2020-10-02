import React, { FunctionComponent } from 'react';
import { RouteComponentProps } from '@reach/router';

import './ErrorPage.css';

interface Props extends RouteComponentProps {
	errorTitle?: string;
	errorMessage?: string;
}

const ErrorPage: FunctionComponent<Props> = ({ errorTitle, errorMessage }) => (
	<article className="ErrorPage">
		<header>
			<h1>{errorTitle ?? 'Error'}</h1>
		</header>
		<p>{errorMessage}</p>
	</article>
);

export default ErrorPage;
