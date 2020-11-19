import React, {
	FunctionComponent, useEffect, useState,
} from 'react';
import OAuth2Login from 'react-simple-oauth2-login';
import {
	ClientModule,
	ClientModuleComponentProps,
	ModuleConfig,
	DispatchActionType,
	ActionType,
	isActionFromModuleId,
	isActionOf,
} from '@rosebus/common';
import { actions } from '@rosebus/server-twitch';
import { useLocation } from '@reach/router';
import { filter, tap } from 'rxjs/operators';

const moduleName = 'TwitchAuth';

/** Union type of dispatch actions originating from the TwitchAuth module */
export type TwitchAuthDispatchActionType = DispatchActionType<typeof actions>;

/** Union type of all actions originating from the TwitchAuth module */
export type TwitchAuthActionType = ActionType<typeof actions>;

/** TwitchAuth config */
export interface TwitchAuthConfig extends ModuleConfig {
	/** Twitch module id to connect with (default: "Twitch") */
	twitchModuleId?: string;
}

const scopes = [
	'channel:read:hype_train',
	'channel:read:redemptions',
	'channel:read:subscriptions',
	'channel:moderate',
	'chat:edit',
	'chat:read',
	'whispers:edit',
	'whispers:read',
];

const ScreenView: FunctionComponent<ClientModuleComponentProps<TwitchAuthConfig, TwitchAuthDispatchActionType>> = ({
	action$,
	api: {
		dispatch,
		log,
	},
	config: {
		twitchModuleId = 'Twitch',
	},
}) => {
	const [appClientId, setAppClientId] = useState('');
	const { href: redirectUri } = useLocation();

	useEffect(
		() => {
			if (!appClientId) {
				log('Request twitch module config');
				dispatch(actions.requestConfig(
					undefined,
					{ targetModuleId: twitchModuleId },
				));
			}
		},
		[
			appClientId,
			log,
			dispatch,
			twitchModuleId,
		],
	);

	useEffect(
		() => {
			log('Setup twitch module action subscriptions');
			const twitchModuleAction$ = action$.pipe(
				filter(isActionFromModuleId(twitchModuleId)),
			);
			const subscriptions = [
				twitchModuleAction$.pipe(
					filter(isActionOf(actions.shareConfig)),
					tap(({ payload }) => {
						setAppClientId(payload.appClientId);
					}),
				).subscribe(),
				twitchModuleAction$.pipe(
					filter(isActionOf(actions.identify)),
					tap(({ payload: { tokenInfo: { userId, userName } } }) => {
						log(`Logged in as ${userName} (${userId})`);
					}),
				).subscribe(),
			];
			return () => {
				log('Clean up twitch module action subscriptions');
				subscriptions.forEach((subscription) => {
					subscription.unsubscribe();
				});
			};
		},
		[
			log,
			action$,
			twitchModuleId,
		],
	);

	return (
		<div className={moduleName}>
			<h1>Twitch Auth</h1>
			{appClientId ? (
				<OAuth2Login
					authorizationUrl="https://id.twitch.tv/oauth2/authorize"
					responseType="code"
					clientId={appClientId}
					redirectUri={redirectUri}
					scope={scopes.join('+')}
					onSuccess={(response: any) => {
						console.log(`success: ${JSON.stringify(response, null, 2)}`);
					}}
					onFailure={(response: any) => {
						console.log(`failure: ${JSON.stringify(response, null, 2)}`);
					}}
				/>
			) : (
				<p>Loading...</p>
			)}
		</div>
	);
};

const TwitchAuth: ClientModule<TwitchAuthConfig, TwitchAuthDispatchActionType> = {
	moduleName,
	ScreenView,
};

export default TwitchAuth;
