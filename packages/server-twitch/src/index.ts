import {
	ServerModule,
	ModuleConfig,
	buildActionCreator,
	isActionOf,
	isActionFromModuleId,
	isInitCompleteRootAction,
	DispatchActionType,
	ActionType,
	LogLevel,
} from '@rosebus/common';
import {
	EMPTY,
	from,
	merge,
	of,
} from 'rxjs';
import {
	catchError,
	filter,
	first,
	map,
	mergeMap,
	tap,
} from 'rxjs/operators';
import {
	AccessToken,
	RefreshableAuthProvider,
	StaticAuthProvider,
	// TokenInfo,
} from 'twitch-auth';
import { ApiClient } from 'twitch';
import { ChatClient } from 'twitch-chat-client';

const moduleName = 'Twitch';

const defaultAuthModuleId = 'TwitchAuth';
const storageKeyRefreshToken = 'refreshToken';

export interface AuthCredentials {
	accessToken: string;
	refreshToken: string;
}

export interface ShareConfigPayload {
	appClientId: string;
}

export interface AuthorizePayload {
	authorizationCode: string;
}

export interface IdentifyPayload {
	// tokenInfo: TokenInfo;
}

export const actions = {
	requestConfig: buildActionCreator(moduleName, 'requestConfig')<void>(),
	shareConfig: buildActionCreator(moduleName, 'shareConfig')<ShareConfigPayload>(),
	authorize: buildActionCreator(moduleName, 'authorize')<AuthorizePayload>(),
	identify: buildActionCreator(moduleName, 'identify')<IdentifyPayload>(),
};

/** Union type of dispatch actions returned by any Heartbeat module action creator */
export type TwitchDispatchActionType = DispatchActionType<typeof actions>;

/** Union type of all actions originating from the Heartbeat module */
export type TwitchActionType = ActionType<typeof actions>;

/** Config for the Twitch server module */
export interface TwitchConfig extends ModuleConfig {
	/** Twitch app client id */
	appClientId: string;
	/** Twitch app client secret */
	appClientSecret: string;
	/** Twitch auth module id to connect with (default: "TwitchAuth") */
	authModuleId?: string;
}

const Twitch: ServerModule<TwitchConfig, TwitchDispatchActionType> = {
	moduleName,
	initialize: async ({
		action$,
		api: {
			storage,
			log,
		},
		config: {
			appClientId,
			appClientSecret,
			authModuleId = defaultAuthModuleId,
		},
	}) => {
		let chatClient: ChatClient | undefined;
		let cleanupListeners: (() => void) | undefined;

		const onRefresh = async ({ accessToken, refreshToken }: AccessToken) => {
			try {
				await storage.store<AuthCredentials>(
					storageKeyRefreshToken,
					{ accessToken, refreshToken },
				);
			} catch (error) {
				log({
					level: LogLevel.Error,
					text: `Failed to store refreshed credentials: ${error?.message}`,
				});
			}
		};

		const setupListeners = async (
			{ accessToken, refreshToken }: AuthCredentials,
		) => {
			if (cleanupListeners) {
				cleanupListeners();
				cleanupListeners = undefined;
			}

			const authProvider = new RefreshableAuthProvider(
				new StaticAuthProvider(appClientId, accessToken),
				{
					refreshToken,
					onRefresh,
					clientSecret: appClientSecret,
					expiry: new Date(0),
				},
			);

			log('Connecting to Twitch API');
			const apiClient = new ApiClient({ authProvider });
			const tokenInfo = await apiClient.getTokenInfo();
			const { userId, userName } = tokenInfo;
			log(`Authenticated to Twitch as ${userName} (${userId})`);

			log('Creating Twitch chat listeners');
			chatClient = new ChatClient(authProvider, { channels: [userName] });
			const listeners = [
				chatClient.onMessage(
					(
						channel,
						user,
						message,
						msg,
					) => {
						log(`${channel} ${user}: ${message}`);
						log(JSON.stringify(msg, null, 2));
					},
				),
			];
			cleanupListeners = () => {
				log('Cleaning up Twitch chat listeners');
				listeners.forEach((listener) => listener.unbind());
				log('Quitting Twitch chat');
				chatClient?.quit();
			};
			log('Connecting to Twitch chat');
			chatClient.connect();
		};

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
					setupListeners(credentials);
				} else {
					log('No credentials stored; awaiting authentication');
				}
			}),
		).subscribe();

		return {
			reaction$: merge(
				action$.pipe(
					filter(isActionOf(actions.requestConfig)),
					filter(isActionFromModuleId(authModuleId)),
					map(() => actions.shareConfig({
						appClientId,
					})),
				),
				action$.pipe(
					filter(isActionOf(actions.authorize)),
					filter(isActionFromModuleId(authModuleId)),
					mergeMap(({
						payload: { authorizationCode },
					}) => {
						log(`Received new authorization from moduleId ${authModuleId}: ${authorizationCode}`);
						return of(actions.identify({}));
					}),
				),
			),
		};
	},
};

export default Twitch;
