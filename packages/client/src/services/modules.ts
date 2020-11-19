import {
	LogMessage,
	ModuleApiDispatch,
	ModuleApiLog,
} from '@rosebus/common';
import { useRef } from 'react';

import { LoadedClientModule } from './types';
import { emitModuleAction } from './actions';
import { log } from './log';

const buildModuleApiDispatch = (
	loadedModule: LoadedClientModule,
	screenId: string,
): ModuleApiDispatch => (
	(action) => emitModuleAction(action, loadedModule, screenId)
);

/** Hook to consistently get the same built module API dispatch method */
export const useModuleApiDispatch = (
	loadedModule: LoadedClientModule,
	screenId: string,
): ModuleApiDispatch => {
	const dispatchRef = useRef<ModuleApiDispatch>();
	if (!dispatchRef.current) {
		dispatchRef.current = buildModuleApiDispatch(loadedModule, screenId);
	}
	return dispatchRef.current;
};

const buildModuleApiLog = (
	{
		moduleId,
		clientModule: { moduleName },
	}: LoadedClientModule,
	screenId: string,
): ModuleApiLog => {
	const channel = (moduleId === moduleName)
		? `${screenId}> ${moduleId}`
		: `${screenId}> ${moduleName}/${moduleId}`;
	return (message: LogMessage | string) => log(message, channel);
};

/** Hook to consistently get the same built module API log method */
export const useModuleApiLog = (
	loadedModule: LoadedClientModule,
	screenId: string,
): ModuleApiLog => {
	const logRef = useRef<ModuleApiLog>();
	if (!logRef.current) {
		logRef.current = buildModuleApiLog(loadedModule, screenId);
	}
	return logRef.current;
};
