/** Options for a dispatched action */
export interface DispatchActionOptions {
	/** If true, dispatch this action only to server modules */
	targetServer?: boolean;
	/** A moduleId to which this action should be privately dispatched */
	targetModuleId?: string;
	/** A clientId to which this action should be privately dispatched */
	targetClientId?: string;
	/** A screenId to which this action should be privately dispatched */
	targetScreenId?: string;
	/** If true, this action's payload contains sensitive information */
	sensitive?: boolean;
}

/** An action as it is dispatched by a module */
export interface DispatchAction<TName extends string = string, TType extends string = string, TPayload = any>
	extends DispatchActionOptions {
	/** Name of the module that defines this action */
	moduleName: TName;
	/** Type of the action, arbitrarily defined by module */
	type: TType;
	/** Payload of the action, arbitrarily defined by module; must be JSON-serializable if crossing client-server bridge */
	payload: TPayload;
}

/** An action as it arrives via the bus */
export interface Action<TName extends string = string, TType extends string = string, TPayload = any>
	extends DispatchAction<TName, TType, TPayload> {
	/** The name of the module from which this action was dispatched */
	fromModuleName: string;
	/** The moduleId from which this action was dispatched */
	fromModuleId: string;
	/** The clientId from which this action was dispatched, if client-originated */
	fromClientId?: string;
	/** The screenId from which this action was dispatched, if client-originated */
	fromScreenId?: string;
}

/** Predicate for validating action shape */
export const isAction = (action: any): action is Action => {
	if (!action || typeof action !== 'object') {
		return false;
	}
	const {
		moduleName,
		type,
		fromModuleName,
		fromModuleId,
		fromClientId,
		fromScreenId,
		targetServer,
		targetModuleId,
		targetClientId,
		targetScreenId,
	} = action;
	if (typeof moduleName !== 'string' || typeof type !== 'string') {
		return false;
	}
	if (!Object.prototype.hasOwnProperty.call(action, 'payload')) {
		return false;
	}
	if (typeof fromModuleName !== 'string' || typeof fromModuleId !== 'string') {
		return false;
	}
	if (fromClientId !== undefined && typeof fromClientId !== 'boolean') {
		return false;
	}
	if (fromScreenId !== undefined && typeof fromScreenId !== 'boolean') {
		return false;
	}
	if (targetServer !== undefined && typeof targetServer !== 'boolean') {
		return false;
	}
	if (targetModuleId !== undefined && typeof targetModuleId !== 'string') {
		return false;
	}
	if (targetClientId !== undefined && typeof targetClientId !== 'string') {
		return false;
	}
	if (targetScreenId !== undefined && typeof targetScreenId !== 'string') {
		return false;
	}
	return true;
};

/** Action creator function without metadata */
export interface BareActionCreator<TName extends string = string, TType extends string = string, TPayload = any> {
	(payload: TPayload, options?: DispatchActionOptions): DispatchAction<TName, TType, TPayload>;
}

/** Action creator function */
export interface ActionCreator<
	TName extends string = string,
	TType extends string = string,
	TPayload = any
> extends BareActionCreator<TName, TType, TPayload> {
	/** Name of the module that defines this action */
	readonly moduleName: TName;
	/** Type of the action, arbitrarily defined by module */
	readonly type: TType;
}

/** Union type of dispatch actions returned by any action creator in a map, or from a single action creator */
export type DispatchActionType<TActionCreators extends any> =
	TActionCreators extends BareActionCreator
		? ReturnType<TActionCreators>
		: TActionCreators extends Record<any, any>
			? {
				[K in keyof TActionCreators]: DispatchActionType<TActionCreators[K]>;
			}[keyof TActionCreators]
			: never;

/** Union type of actions originating from any action creator in a map, or from a single action creator */
export type ActionType<TActionCreators extends any> =
	TActionCreators extends ActionCreator<infer TName, infer TType, infer TPayload>
		? Action<TName, TType, TPayload>
		: TActionCreators extends Record<any, any>
			? {
				[K in keyof TActionCreators]: ActionType<TActionCreators[K]>;
			}[keyof TActionCreators]
			: never;

/** Convenience function for building action creators */
export const buildActionCreator = <
	TName extends string = string,
	TType extends string = string
>(moduleName: TName, type: TType) => (
	<TPayload extends any>(): ActionCreator<TName, TType, TPayload> => {
		const actionCreator: BareActionCreator<TName, TType, TPayload> = (
			(payload: TPayload, options: DispatchActionOptions = {}) => ({
				...options,
				moduleName,
				type,
				payload,
			})
		);
		return Object.assign(actionCreator, { moduleName, type });
	}
);

/** Convenience function for filtering actions by action creator */
export const isActionOf = <TName extends string, TType extends string, TPayload>(
	actionCreator: ActionCreator<TName, TType, TPayload>,
) => (
	(action: Action): action is Action<TName, TType, TPayload> => (
		action.moduleName === actionCreator.moduleName
			&& action.type === actionCreator.type
	)
);

/** Convenience function for filtering actions by module id */
export const isActionFromModuleId = <TName extends string, TType extends string, TPayload>(
	fromModuleId: string,
) => (
	(action: Action<TName, TType, TPayload>) => action.fromModuleId === fromModuleId
);

/** The dispatch API method provided to a module */
export interface ModuleApiDispatch<TDispatchAction extends DispatchAction = DispatchAction> {
	(action: TDispatchAction): void;
}

/** Root module name/id, for the bus itself */
export const rootModuleName = 'Rosebus';
export const rootModuleId = rootModuleName;

/** Payload for root initComplete action */
export interface InitCompletePayload {
	/** Number of server modules loaded */
	moduleCount: number;
}

/** Payload for root shutdown action */
export interface ShutdownPayload {}

/** Payload for root clientConnect action */
export interface ClientConnectPayload {
	/** Client id of the connecting client */
	clientId: string;
}

/** Payload for root clientDisconnect action */
export interface ClientDisconnectPayload {
	/** Client id of the disconnecting client */
	clientId: string;
}

/** Payload for root serverConnect action */
export interface ServerConnectPayload {}

/** Payload for root serverConnect action */
export interface ServerDisconnectPayload {}

/** Root action creators, for actions dispatched by the bus itself */
export const rootActions = {
	/** Dispatched by server when all server modules are initialized */
	initComplete: buildActionCreator(rootModuleName, 'initComplete')<InitCompletePayload>(),
	/** Dispatched by server when shutting down */
	shutdown: buildActionCreator(rootModuleName, 'shutdown')<ShutdownPayload>(),
	/** Dispatched by server when a client connects */
	clientConnect: buildActionCreator(rootModuleName, 'clientConnect')<ClientConnectPayload>(),
	/** Dispatched by server when a client disconnects */
	clientDisconnect: buildActionCreator(rootModuleName, 'clientDisconnect')<ClientDisconnectPayload>(),
	/** Dispatched locally by client when connected to server */
	serverConnect: buildActionCreator(rootModuleName, 'serverConnect')<ServerConnectPayload>(),
	/** Dispatched locally by client when disconnected from server */
	serverDisconnect: buildActionCreator(rootModuleName, 'serverDisconnect')<ServerDisconnectPayload>(),
};

/** Union type of all actions originating from the bus itself */
export type RootActionType = ActionType<typeof rootActions>;

/** Convenience function for filtering initComplete root action */
export const isInitCompleteRootAction = isActionOf(rootActions.initComplete);

/** Convenience function for filtering shutdown root action */
export const isShutdownRootAction = isActionOf(rootActions.shutdown);
