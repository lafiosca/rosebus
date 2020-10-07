import {
	Action,
	DispatchAction,
	LogLevel,
	rootModuleId,
	rootModuleName,
} from '@rosebus/common';
import { Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

import { log } from './log';
import { LoadedModule } from './modules';

/** The raw source action stream from which server module observables originate */
const action$ = new Subject<Action>();

/** Establish basic action stream logging */
action$.subscribe(
	({
		moduleName,
		type,
		payload,
		fromModuleId,
		fromModuleName,
	}) => {
		const from = `${fromModuleId}${fromModuleName !== fromModuleId ? ` (${fromModuleName})` : ''}`;
		const message = `(${moduleName}, ${type}, ${JSON.stringify(payload)})`;
		log({
			text: `[${from}] ${message}`,
			level: LogLevel.Debug,
		});
	},
);

/** Emit an action that has been processed */
export const emitAction = (action: Action) => {
	action$.next(action);
};

/** Emit an action dispatched by a module */
export const emitModuleAction = (
	action: DispatchAction,
	{
		moduleId: fromModuleId,
		serverModule: {
			moduleName: fromModuleName,
		},
	}: LoadedModule,
) => {
	action$.next({
		...action,
		fromModuleName,
		fromModuleId,
	});
};

/** Emit an action dispatched by the server itself */
export const emitRootAction = (action: DispatchAction) => {
	action$.next({
		...action,
		fromModuleName: rootModuleName,
		fromModuleId: rootModuleId,
	});
};

/** Build an action stream specific to a loaded module */
export const buildModuleAction$ = ({ moduleId }: LoadedModule) => (
	action$.pipe(
		filter(({
			targetModuleId,
			targetClientId,
			targetScreenId,
		}) => {
			if (targetClientId || targetScreenId) {
				return false;
			}
			if (targetModuleId && moduleId !== targetModuleId) {
				return false;
			}
			return true;
		}),
	)
);

export const attachClientActionBridge = (
	clientId: string,
	handler: (action: Action) => void,
) => (
	action$.pipe(
		filter(({ fromClientId }) => fromClientId !== clientId),
		filter(({ targetServer }) => !targetServer),
		filter(({ targetClientId }) => !targetClientId || targetClientId === clientId),
		tap(handler),
	).subscribe()
);
