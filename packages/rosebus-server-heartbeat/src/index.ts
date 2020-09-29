import {
	ServerModule,
	ModuleConfig,
	buildActionCreator,
	isActionOf,
	isInitComplete,
	isShutdown,
	DispatchActionType,
	ActionType,
} from '@rosydoublecross/rosebus-types';
import { interval } from 'rxjs';
import {
	first,
	map,
	mergeMap,
	takeUntil,
} from 'rxjs/operators';

const moduleName = 'Heartbeat';
const defaultDurationMs = 30000;

export interface HeartbeatPayload {
	beatCount: number;
}

export const actions = {
	heartbeat: buildActionCreator(moduleName, 'heartbeat')<HeartbeatPayload>(),
};

/** Union type of dispatch actions returned by any Heartbeat module action creator */
export type HeartbeatDispatchActionType = DispatchActionType<typeof actions>;

/** Union type of all actions originating from the Heartbeat module */
export type HearbeatActionType = ActionType<typeof actions>;

/** Convenience function for filtering root initComplete action */
export const isHeartbeat = isActionOf(actions.heartbeat);

export interface HeartbeatConfig extends ModuleConfig {
	durationMs?: number;
}

const Heartbeat: ServerModule<HeartbeatConfig, HeartbeatDispatchActionType> = {
	moduleName,
	initialize: ({
		action$,
		config: { durationMs = defaultDurationMs },
	}) => ({
		reaction$: action$.pipe(
			first(isInitComplete),
			mergeMap(() => interval(durationMs).pipe(
				takeUntil(action$.pipe(first(isShutdown))),
				map((n) => actions.heartbeat({ beatCount: n + 1 })),
			)),
		),
	}),
};

export default Heartbeat;
