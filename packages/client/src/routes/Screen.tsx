import React, { FunctionComponent } from 'react';
import TwitchAuth from '@rosebus/client-twitch-auth';

import { RouteComponentProps } from '../services/navigation';
import { useModuleAction$ } from '../services/actions';
import { useModuleApiDispatch, useModuleApiLog } from '../services/modules';

interface Props extends RouteComponentProps {}

const Screen: FunctionComponent<Props> = () => {
	const screenId = 'auth';
	const moduleId = 'TwitchAuth';
	const fakeLoadedModule: any = {
		moduleId,
		clientModule: {
			moduleName: moduleId,
		},
	};
	const action$ = useModuleAction$(fakeLoadedModule, screenId);
	const dispatch = useModuleApiDispatch(fakeLoadedModule, screenId);
	const log = useModuleApiLog(fakeLoadedModule, screenId);
	return (
		<section className="Screen">
			<TwitchAuth.ScreenView
				clientId="xyz"
				screenId={screenId}
				moduleId={moduleId}
				config={{}}
				api={{
					dispatch,
					log,
					storage: {
						fetch: async () => undefined,
						store: async () => {},
						remove: async () => {},
					},
				}}
				action$={action$}
			/>
		</section>
	);
};

export default Screen;
