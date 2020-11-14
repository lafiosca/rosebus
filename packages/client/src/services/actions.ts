import {
	Action,
	DispatchAction,
	LogLevel,
	rootModuleId,
	rootModuleName,
} from '@rosebus/common';
import { useRef } from 'react';
import { Observable, Subject, Subscription } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

import { log } from './log';
import { LoadedClientModule } from './modules';
import { clientId } from './clientId';

/** The raw source action stream from which client module observables originate */
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
export const emitAction = (action: Action): void => {
	action$.next(action);
};

/** Emit an action dispatched by a module */
export const emitModuleAction = (
	action: DispatchAction,
	{
		moduleId: fromModuleId,
		clientModule: {
			moduleName: fromModuleName,
		},
	}: LoadedClientModule,
): void => {
	action$.next({
		...action,
		fromModuleName,
		fromModuleId,
	});
};

/** Emit an action dispatched by the client itself */
export const emitRootAction = (action: DispatchAction): void => {
	action$.next({
		...action,
		fromModuleName: rootModuleName,
		fromModuleId: rootModuleId,
		fromClientId: clientId,
	});
};

/** Build an action stream specific to a loaded module */
export const buildModuleAction$ = (
	{ moduleId }: LoadedClientModule,
	screenId: string,
): Observable<Action> => (
	action$.pipe(
		filter(({ targetServer }) => !targetServer),
		filter(({ targetClientId }) => !targetClientId || targetClientId === clientId),
		filter(({ targetScreenId }) => !targetScreenId || targetScreenId === screenId),
		filter(({ targetModuleId }) => !targetModuleId || targetModuleId === moduleId),
	)
);

/** Hook to consistently get the same built module action stream */
export const useModuleAction$ = (
	clientModule: LoadedClientModule,
	screenId: string,
): Observable<Action> => {
	const action$Ref = useRef<Observable<Action>>();
	if (!action$Ref.current) {
		action$Ref.current = buildModuleAction$(clientModule, screenId);
	}
	return action$Ref.current;
};

/** Subscribe a server-specific side-effect handler */
export const subscribeServer = (
	handler: (action: Action) => void,
): Subscription => (
	action$.pipe(
		filter(({ fromClientId }) => fromClientId === clientId),
		filter(({ targetClientId }) => targetClientId !== clientId),
		tap(handler),
	).subscribe()
);
