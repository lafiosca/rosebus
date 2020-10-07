import {
	ServerModule,
	ServerModuleInitResponse,
	ServerModuleSpec,
} from '@rosebus/common';
import { Subscription } from 'rxjs';

type RequiredPick<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** A server module that has been loaded from the server config */
export interface LoadedModule extends RequiredPick<ServerModuleSpec, 'moduleId'> {
	/** The server module imported from path */
	serverModule: ServerModule;
	/** The initialization response, if any */
	initResponse?: ServerModuleInitResponse;
	/** The reaction stream subscription, if any */
	reactionSub?: Subscription;
}
