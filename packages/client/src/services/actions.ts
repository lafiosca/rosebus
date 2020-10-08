import {
	Action,
	DispatchAction,
	LogLevel,
} from '@rosebus/common';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { log } from './log';
import { LoadedClientModule } from './modules';

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

/** Emit an action dispatched by a module */
export const emitModuleAction = (
	action: DispatchAction,
	{
		moduleId: fromModuleId,
		clientModule: {
			moduleName: fromModuleName,
		},
	}: LoadedClientModule,
) => {
	action$.next({
		...action,
		fromModuleName,
		fromModuleId,
	});
};

/** Build an action stream specific to a loaded module */
export const buildModuleAction$ = (
	{ moduleId }: LoadedClientModule,
	screenId: string,
) => (
	action$.pipe(
		filter(({ targetServer }) => !targetServer),
		// TODO: work out client id logic
		// filter(({ targetClientId }) => !targetClientId || targetClientId === clientId),
		filter(({ targetScreenId }) => !targetScreenId || targetScreenId === screenId),
		filter(({ targetModuleId }) => !targetModuleId || targetModuleId === moduleId),
	)
);
