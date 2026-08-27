import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../db/redis';
import { Order } from '../types/order';
import { OrderExecutor } from './orderExecutor';

const QUEUE_NAME = 'order-execution';

// Create order queue
export const orderQueue = new Queue<Order>(QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000 // Start with 1 second, doubles each retry
        },
        removeOnComplete: {
            count: 100 // Keep last 100 completed jobs
        },
        removeOnFail: {
            count: 50 // Keep last 50 failed jobs
        }
    }
});

// Create worker to process orders
const orderExecutor = new OrderExecutor();

export const orderWorker = new Worker<Order>(
    QUEUE_NAME,
    async (job: Job<Order>) => {
        console.log(`[Queue] Processing order ${job.data.id} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);

        try {
            await orderExecutor.execute(job.data);
            console.log(`[Queue] Order ${job.data.id} completed successfully`);
        } catch (error) {
            console.error(`[Queue] Order ${job.data.id} failed:`, error);
            throw error; // Re-throw to trigger retry
        }
    },
    {
        connection: redis,
        concurrency: 10, // Process up to 10 orders concurrently
        limiter: {
            max: 100, // Maximum 100 jobs
            duration: 60000 // Per minute
        }
    }
);

orderWorker.on('completed', (job) => {
    console.log(`[Queue] ✓ Job ${job.id} completed`);
});

orderWorker.on('failed', (job, err) => {
    console.error(`[Queue] ✗ Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
});

orderWorker.on('error', (err) => {
    console.error('[Queue] Worker error:', err);
});

// Add order to queue
export async function enqueueOrder(order: Order): Promise<void> {
    await orderQueue.add('execute', order, {
        jobId: order.id
    });
    console.log(`[Queue] Order ${order.id} enqueued`);
}

// Get queue stats
export async function getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
        orderQueue.getWaitingCount(),
        orderQueue.getActiveCount(),
        orderQueue.getCompletedCount(),
        orderQueue.getFailedCount()
    ]);

    return { waiting, active, completed, failed };
}
