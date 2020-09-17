import React from 'react';

import ErrorPage from './ErrorPage';

const NotFound = () => (
	<ErrorPage
		errorTitle="Not Found"
		errorMessage="The page you are trying to access could not be found"
	/>
);

export default NotFound;
