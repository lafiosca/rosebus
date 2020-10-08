import {
	ClientModule,
	ClientModuleSpec,
} from '@rosebus/common';
import { Subscription } from 'rxjs';

type RequiredPick<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** A server module that has been loaded from the server config */
export interface LoadedClientModule extends RequiredPick<ClientModuleSpec, 'moduleId'> {
	/** The client module imported from path */
	clientModule: ClientModule;
	/** The reaction stream subscription, if any */
	reactionSub?: Subscription;
}
