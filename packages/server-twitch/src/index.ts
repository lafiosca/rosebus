import {
	ServerModule,
	ModuleConfig,
	buildActionCreator,
	isActionOf,
	isInitCompleteRootAction,
	DispatchActionType,
	ActionType,
	LogLevel,
} from '@rosebus/common';
import { EMPTY, from } from 'rxjs';
import {
	catchError,
	filter,
	first,
	mergeMap,
	tap,
} from 'rxjs/operators';

const moduleName = 'Twitch';

export interface AuthCredentials {
	accessToken: string;
	refreshToken: string;
}

export interface AuthenticatePayload extends AuthCredentials {}

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
		api: {
			storage,
			log,
		},
		// config: {
		// 	appClientId,
		// 	appClientSecret,
		// },
	}) => {
		action$.pipe(
			first(isInitCompleteRootAction),
			mergeMap(() => from(storage.fetch<AuthCredentials>('refreshToken')).pipe(
				catchError((error) => {
					log({
						level: LogLevel.Error,
						text: `Failed to fetch credentials from storage: ${error?.message}`,
					});
					return EMPTY;
				}),
			)),
			tap((credentials) => {
				if (credentials) {
					log('Initializing with previously stored credentials');
					// TODO: initialize
				} else {
					log('No credentials stored; awaiting authentication');
				}
			}),
		).subscribe();
		action$.pipe(
			filter(isActionOf(actions.authenticate)),
			tap(({
				// payload: { accessToken, refreshToken },
				fromModuleId,
			}) => {
				log(`Received new credentials from moduleId ${fromModuleId}`);
			}),
		).subscribe();
	},
};

export default Twitch;
