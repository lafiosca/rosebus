import React, {
	FunctionComponent,
} from 'react';
import OAuth2Login from 'react-simple-oauth2-login';
import {
	ClientModule,
	ClientModuleComponentProps,
	ModuleConfig,
	buildActionCreator,
	DispatchActionType,
	ActionType,
} from '@rosebus/common';
// import {
// 	actions as serverTwitchActions,
// } from '@rosebus/server-twitch';
import { useLocation } from '@reach/router';

const moduleName = 'TwitchAuth';

export interface AuthenticatedPayload {
}

export const actions = {
	authenticated: buildActionCreator(moduleName, 'authenticated')<AuthenticatedPayload>(),
};

/** Union type of dispatch actions returned by any TwitchAuth module action creator */
export type TwitchAuthDispatchActionType = DispatchActionType<typeof actions>;

/** Union type of all actions originating from the TwitchAuth module */
export type TwitchAuthActionType = ActionType<typeof actions>;

/** TwitchAuth config */
export interface TwitchAuthConfig extends ModuleConfig {
	/** Twitch application client id */
	appClientId: string;
}

const ScreenView: FunctionComponent<ClientModuleComponentProps<TwitchAuthConfig, TwitchAuthDispatchActionType>> = ({
	// action$,
	// moduleId,
	// api: { storage },
	config: {
		appClientId,
	},
}) => {
	const { href } = useLocation();
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
	return (
		<div className={moduleName}>
			<h1>Twitch Auth</h1>
			<OAuth2Login
				authorizationUrl="https://id.twitch.tv/oauth2/authorize"
				responseType="code"
				clientId={appClientId}
				redirectUri={href}
				scope={scopes.join('+')}
				onSuccess={(response: any) => {
					console.log(`success: ${JSON.stringify(response, null, 2)}`);
				}}
				onFailure={(response: any) => {
					console.log(`failure: ${JSON.stringify(response, null, 2)}`);
				}}
			/>
		</div>
	);
};

const TwitchAuth: ClientModule<TwitchAuthConfig, TwitchAuthDispatchActionType> = {
	moduleName,
	ScreenView,
};

export default TwitchAuth;
