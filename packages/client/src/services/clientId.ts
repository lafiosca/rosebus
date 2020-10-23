const clientIdKey = 'rosebus.clientId';

let id: string | null = null;

try {
	id = window.localStorage.getItem(clientIdKey);
} catch (error) {
	console.error(`Failed to get item ${clientIdKey} from local storage`, error);
}

if (!id) {
	id = `${Math.random().toString(36).substr(2)}${Math.random().toString(36).substr(2)}`;
	try {
		window.localStorage.setItem(clientIdKey, id);
	} catch (error) {
		console.error(`Failed to set item ${clientIdKey} in local storage`, error);
	}
}

export const clientId = id;
