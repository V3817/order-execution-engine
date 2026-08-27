import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { orderRoutes } from './routes/orders';
import { initDatabase } from './db/postgres';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000');

async function start() {
    const fastify = Fastify({
        logger: {
            level: 'info',
            transport: {
                target: 'pino-pretty'
            }
        }
    });

    // Register plugins
    await fastify.register(cors, {
        origin: true
    });

    await fastify.register(websocket);

    // Register routes
    await fastify.register(orderRoutes);

    // Initialize database
    await initDatabase();

    // Start server
    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 WebSocket endpoint: ws://localhost:${PORT}/api/orders/execute\n`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();
