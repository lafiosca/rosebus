import React, { FunctionComponent } from 'react';

// import './AuthGate.css';

interface Props {
}

const AuthGate: FunctionComponent<Props> = ({ children }) => {
	return (
		<>
			{children}
		</>
	);
	// return (
	// 	<article className="AuthGate">
	// 		<h1>Logon please:</h1>
	// 	</article>
	// );
};

export default AuthGate;
