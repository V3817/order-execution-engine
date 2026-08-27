import { WebSocketMessage, OrderStatus } from '../src/types/order';

describe('WebSocket Lifecycle', () => {
    it('should create valid status update messages', () => {
        const statuses: OrderStatus[] = ['pending', 'routing', 'building', 'submitted', 'confirmed'];

        statuses.forEach(status => {
            const message: WebSocketMessage = {
                orderId: 'test-order',
                status,
                timestamp: new Date().toISOString()
            };

            expect(message.orderId).toBe('test-order');
            expect(message.status).toBe(status);
            expect(message.timestamp).toBeDefined();
        });
    });

    it('should include additional data for routing status', () => {
        const message: WebSocketMessage = {
            orderId: 'test-order',
            status: 'routing',
            timestamp: new Date().toISOString(),
            dex: 'raydium',
            price: 100.5
        };

        expect(message.dex).toBe('raydium');
        expect(message.price).toBe(100.5);
    });

    it('should include txHash for confirmed status', () => {
        const message: WebSocketMessage = {
            orderId: 'test-order',
            status: 'confirmed',
            timestamp: new Date().toISOString(),
            txHash: '5j7K8...'
        };

        expect(message.txHash).toBeDefined();
        expect(message.txHash!.length).toBeGreaterThan(0);
    });

    it('should include error for failed status', () => {
        const message: WebSocketMessage = {
            orderId: 'test-order',
            status: 'failed',
            timestamp: new Date().toISOString(),
            error: 'Insufficient liquidity'
        };

        expect(message.error).toBe('Insufficient liquidity');
    });
});
