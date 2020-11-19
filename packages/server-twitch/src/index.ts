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
} from 'rxjs';
import {
	catchError,
	filter,
	first,
	map,
	mergeMap,
	tap,
} from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';
import {
	AccessToken,
	RefreshableAuthProvider,
	StaticAuthProvider,
	TokenInfo,
} from 'twitch-auth';
import { ApiClient } from 'twitch';
import { ChatClient } from 'twitch-chat-client';

const moduleName = 'Twitch';

const twitchTokenUrl = 'https://id.twitch.tv/oauth2/token';

const defaultAuthModuleId = 'TwitchAuth';
const storageKeyRefreshToken = 'refreshToken';

interface TwitchTokenResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	scope: string[];
	token_type: 'bearer';
}

export interface Credentials {
	accessToken: string;
	refreshToken: string;
}

export interface ShareConfigPayload {
	appClientId: string;
}

export interface AuthorizePayload {
	authorizationCode: string;
	redirectUri: string;
}

export interface IdentifyPayload {
	tokenInfo: TokenInfo;
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
				await storage.store<Credentials>(
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
			{ accessToken, refreshToken }: Credentials,
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

			return tokenInfo;
		};

		action$.pipe(
			first(isInitCompleteRootAction),
			mergeMap(() => from(storage.fetch<Credentials>('refreshToken')).pipe(
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
					log('No credentials stored; awaiting authorization');
				}
			}),
		).subscribe();

		const authModuleAction$ = action$.pipe(
			filter(isActionFromModuleId(authModuleId)),
		);

		return {
			reaction$: merge(
				authModuleAction$.pipe(
					filter(isActionOf(actions.requestConfig)),
					map(() => actions.shareConfig(
						{ appClientId },
						{
							targetModuleId: authModuleId,
							sensitive: true,
						},
					)),
				),
				authModuleAction$.pipe(
					filter(isActionOf(actions.authorize)),
					mergeMap(({
						payload: {
							authorizationCode,
							redirectUri,
						},
					}) => {
						log(`Received authorization from moduleId ${authModuleId}: ${authorizationCode}`);
						const queryParts = [
							`client_id=${appClientId}`,
							`client_secret=${appClientSecret}`,
							`code=${authorizationCode}`,
							'grant_type=authorization_code',
							`redirect_uri=${redirectUri}`,
						];
						return ajax.post(
							`${twitchTokenUrl}?${queryParts.join('&')}`,
							null,
							{ 'Content-Type': 'application/json' },
						);
					}),
					catchError((error) => {
						const statusCode: number = error?.response?.statusCode ?? 0;
						const message: string = statusCode === 0
							? 'Connection error'
							: (error?.response?.message ?? 'Unrecognized error');
						log({
							level: LogLevel.Error,
							text: `Failed to convert authorization to tokens: ${message} (statusCode: ${statusCode})`,
						});
						return EMPTY;
					}),
					map(({ response }) => response as TwitchTokenResponse),
					mergeMap(({
						access_token: accessToken,
						refresh_token: refreshToken,
					}) => (
						setupListeners({ accessToken, refreshToken })
					)),
					map((tokenInfo) => actions.identify({ tokenInfo })),
				),
			),
		};
	},
};

export default Twitch;
