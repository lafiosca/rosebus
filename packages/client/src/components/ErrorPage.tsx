import React, { FunctionComponent } from 'react';

import './ErrorPage.css';

interface Props {
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
