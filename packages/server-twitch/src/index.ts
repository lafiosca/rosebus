import {
	ServerModule,
	ModuleConfig,
	buildActionCreator,
	isActionOf,
	isInitCompleteRootAction,
	isShutdownRootAction,
	DispatchActionType,
	ActionType,
} from '@rosebus/common';
import { } from 'rxjs';
import {
} from 'rxjs/operators';

const moduleName = 'Twitch';

export interface AuthenticatePayload {
	refreshToken: string;
}

export const actions = {
	authenticate: buildActionCreator(moduleName, 'authenticate')<AuthenticatePayload>(),
};

/** Union type of dispatch actions returned by any Heartbeat module action creator */
export type TwitchDispatchActionType = DispatchActionType<typeof actions>;

/** Union type of all actions originating from the Heartbeat module */
export type TwitchActionType = ActionType<typeof actions>;

export interface TwitchConfig extends ModuleConfig {
	appClientId: string;
	appClientSecret: string;
}

const Twitch: ServerModule<TwitchConfig, TwitchDispatchActionType> = {
	moduleName,
	initialize: async ({
		action$,
		config: {
			appClientId,
			appClientSecret,
		},
	}) => {
		// attempt to fetch refresh token from storage after init
		// listen for auth actions to set refresh token
		// in either case, when we have a refresh token, set up API event monitoring
	},
};

export default Twitch;
