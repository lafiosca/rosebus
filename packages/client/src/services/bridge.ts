import { bridgeEventServerAction } from '@rosebus/common';
import socketIoClient from 'socket.io-client';

export const initializeBridge = () => {
	// TODO: build out this logic
	const socket = socketIoClient('http://localhost:23000');
	socket.on(bridgeEventServerAction, () => {});
};
