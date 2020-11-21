import React, { FunctionComponent, useEffect, useState } from 'react';
import { filter, tap } from 'rxjs/operators';
import { isServerConnectRootAction, isServerDisconnectRootAction } from '@rosebus/common';
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
	const [bridgeConnected, setBridgeConnected] = useState(false);
	const action$ = useModuleAction$(fakeLoadedModule, screenId);
	const dispatch = useModuleApiDispatch(fakeLoadedModule, screenId);
	const log = useModuleApiLog(fakeLoadedModule, screenId);
	useEffect(
		() => {
			log('Establish bridgeConnected subscriptions');
			const connectSub = action$.pipe(
				filter(isServerConnectRootAction),
				tap(() => {
					setBridgeConnected(true);
				}),
			).subscribe();
			const disconnectSub = action$.pipe(
				filter(isServerDisconnectRootAction),
				tap(() => {
					setBridgeConnected(false);
				}),
			).subscribe();
			return () => {
				log('Teardown bridgeConnected subscriptions');
				connectSub.unsubscribe();
				disconnectSub.unsubscribe();
			};
		},
		[action$, log],
	);
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
				bridgeConnected={bridgeConnected}
			/>
		</section>
	);
};

export default Screen;
