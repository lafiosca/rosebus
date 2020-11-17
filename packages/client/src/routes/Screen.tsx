import React, { FunctionComponent } from 'react';
import TwitchAuth from '@rosebus/client-twitch-auth';

import { RouteComponentProps } from '../services/navigation';
import { useModuleAction$ } from '../services/actions';

interface Props extends RouteComponentProps {}

const Screen: FunctionComponent<Props> = () => {
	const action$ = useModuleAction$(
		{ moduleId: 'auth' } as any,
		'auth',
	);
	return (
		<section className="Screen">
			<TwitchAuth.ScreenView
				clientId="xyz"
				screenId="auth"
				moduleId="auth"
				config={{ appClientId: 'wepsh3w5vwwhxtcsw7buc782iubnxp' }}
				api={{
					dispatch: () => {},
					storage: {
						fetch: async () => undefined,
						store: async () => {},
						remove: async () => {},
					},
					log: () => {},
				}}
				action$={action$}
			/>
		</section>
	);
};

export default Screen;
