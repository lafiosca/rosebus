import React, { FunctionComponent } from 'react';

import { RouteComponentProps } from '../services/navigation';

interface Props extends RouteComponentProps {}

const Admin: FunctionComponent<Props> = () => {
	return (
		<section className="Admin">
			<p>Admin panel...</p>
		</section>
	);
};

export default Admin;
