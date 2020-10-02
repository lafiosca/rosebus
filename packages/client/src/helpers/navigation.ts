import {
	RouteComponentProps as ReachRouteComponentProps,
	WindowLocation,
	navigate as reachNavigate,
	NavigateOptions,
} from '@reach/router';

export type LocationState = {
	/** Used by RouteNotFound for nested route 404 handling */
	notFound?: boolean;
} | undefined;

export interface RouteComponentProps extends ReachRouteComponentProps {
	location?: WindowLocation<LocationState>;
}

export const navigate = (to: string, options?: NavigateOptions<NonNullable<LocationState>>) => (
	reachNavigate(to, options)
);
