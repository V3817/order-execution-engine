import { Order, OrderStatus, WebSocketMessage } from '../types/order';
import { MockDexRouter } from './dexRouter';
import { saveOrder } from '../db/postgres';
import { sendMessage } from '../utils/websocket';

export class OrderExecutor {
    private dexRouter: MockDexRouter;

    constructor() {
        this.dexRouter = new MockDexRouter();
    }

    async execute(order: Order): Promise<void> {
        try {
            // Step 1: Pending
            await this.updateStatus(order, 'pending');

            // Step 2: Routing - Find best DEX
            await this.updateStatus(order, 'routing');
            const bestQuote = await this.dexRouter.selectBestDex(
                order.tokenIn,
                order.tokenOut,
                order.amountIn
            );

            order.selectedDex = bestQuote.dex;

            // Step 3: Building - Prepare transaction
            await this.updateStatus(order, 'building', {
                dex: bestQuote.dex,
                price: bestQuote.price
            });

            // Simulate transaction building time
            await this.sleep(500);

            // Step 4: Submitted - Execute swap
            await this.updateStatus(order, 'submitted');
            const swapResult = await this.dexRouter.executeSwap(
                bestQuote.dex,
                order,
                bestQuote
            );

            order.executedPrice = swapResult.executedPrice;
            order.txHash = swapResult.txHash;

            // Step 5: Confirmed - Success
            await this.updateStatus(order, 'confirmed', {
                txHash: swapResult.txHash,
                price: swapResult.executedPrice
            });

        } catch (error: any) {
            // Step 6: Failed - Error occurred
            order.error = error.message;
            await this.updateStatus(order, 'failed', {
                error: error.message
            });
            throw error;
        }
    }

    private async updateStatus(
        order: Order,
        status: OrderStatus,
        extra?: { dex?: string; price?: number; txHash?: string; error?: string }
    ): Promise<void> {
        order.status = status;
        order.updatedAt = new Date();

        // Save to database
        await saveOrder(order);

        // Send WebSocket update
        const message: WebSocketMessage = {
            orderId: order.id,
            status,
            timestamp: new Date().toISOString(),
            ...(extra?.dex && { dex: extra.dex as any }),
            ...(extra?.price && { price: extra.price }),
            ...(extra?.txHash && { txHash: extra.txHash }),
            ...(extra?.error && { error: extra.error })
        };

        sendMessage(order.id, message);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
