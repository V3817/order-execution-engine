import type { WebSocket } from '@fastify/websocket';
import { WebSocketMessage } from '../types/order';

// Store active WebSocket connections by order ID
const connections = new Map<string, any>();

export function registerConnection(orderId: string, socket: any) {
    connections.set(orderId, socket);
    console.log(`[WebSocket] Registered connection for order ${orderId}`);
}

export function unregisterConnection(orderId: string) {
    connections.delete(orderId);
    console.log(`[WebSocket] Unregistered connection for order ${orderId}`);
}

export function sendMessage(orderId: string, message: WebSocketMessage) {
    const socket = connections.get(orderId);
    if (socket && socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(message));
        console.log(`[WebSocket] Sent to ${orderId}:`, message.status);
    }
}

export function broadcastMessage(message: WebSocketMessage) {
    connections.forEach((socket, orderId) => {
        if (socket.readyState === socket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    });
}
