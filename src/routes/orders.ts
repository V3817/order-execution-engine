import { FastifyInstance, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../types/order';
import { enqueueOrder } from '../services/orderQueue';
import { registerConnection, unregisterConnection } from '../utils/websocket';

interface ExecuteOrderQuerystring {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    slippage?: string;
}

export async function orderRoutes(fastify: FastifyInstance) {
    // GET /api/orders/execute - Submit order and upgrade to WebSocket
    fastify.get<{ Querystring: ExecuteOrderQuerystring }>(
        '/api/orders/execute',
        { websocket: true },
        async (socket: any, req) => {
            const { tokenIn, tokenOut, amountIn, slippage } = req.query;

            // Validate input
            if (!tokenIn || !tokenOut || !amountIn || Number(amountIn) <= 0) {
                socket.send(JSON.stringify({
                    error: 'Invalid order parameters. Use: ?tokenIn=SOL&tokenOut=USDC&amountIn=1.5&slippage=0.01'
                }));
                socket.close();
                return;
            }

            // Create order
            const order: Order = {
                id: uuidv4(),
                tokenIn,
                tokenOut,
                amountIn: Number(amountIn),
                slippage: Number(slippage) || 0.01,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Register WebSocket connection
            registerConnection(order.id, socket);

            // Send initial response
            socket.send(JSON.stringify({
                orderId: order.id,
                status: 'pending',
                timestamp: new Date().toISOString()
            }));

            // Enqueue order for processing
            await enqueueOrder(order);

            // Handle disconnection
            socket.on('close', () => {
                unregisterConnection(order.id);
            });
        }
    );

    // GET /api/health - Health check
    fastify.get('/api/health', async (request, reply) => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });
}
