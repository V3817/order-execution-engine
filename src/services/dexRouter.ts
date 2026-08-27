import { DexQuote, DexName, SwapResult, Order } from '../types/order';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockDexRouter {
    private basePrice = 100; // Base price for simulation

    /**
     * Get quote from Raydium DEX
     * Simulates network delay and price variance
     */
    async getRaydiumQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
        // Simulate network delay
        await sleep(200);

        // Price with 2-4% variance from base
        const price = this.basePrice * (0.98 + Math.random() * 0.04);
        const fee = 0.003; // 0.3% fee
        const estimatedOutput = amount * price * (1 - fee);

        return {
            dex: 'raydium',
            price,
            fee,
            estimatedOutput
        };
    }

    /**
     * Get quote from Meteora DEX
     * Simulates network delay and price variance
     */
    async getMeteorQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
        // Simulate network delay
        await sleep(200);

        // Price with 3-5% variance from base (slightly different range)
        const price = this.basePrice * (0.97 + Math.random() * 0.05);
        const fee = 0.002; // 0.2% fee (lower than Raydium)
        const estimatedOutput = amount * price * (1 - fee);

        return {
            dex: 'meteora',
            price,
            fee,
            estimatedOutput
        };
    }

    /**
     * Fetch quotes from both DEXs and select the best one
     */
    async selectBestDex(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
        console.log(`[DEX Router] Fetching quotes for ${amount} ${tokenIn} → ${tokenOut}`);

        // Fetch quotes concurrently
        const [raydiumQuote, meteoraQuote] = await Promise.all([
            this.getRaydiumQuote(tokenIn, tokenOut, amount),
            this.getMeteorQuote(tokenIn, tokenOut, amount)
        ]);

        console.log(`[DEX Router] Raydium: ${raydiumQuote.price.toFixed(4)} (output: ${raydiumQuote.estimatedOutput.toFixed(2)})`);
        console.log(`[DEX Router] Meteora: ${meteoraQuote.price.toFixed(4)} (output: ${meteoraQuote.estimatedOutput.toFixed(2)})`);

        // Select DEX with better estimated output
        const bestQuote = raydiumQuote.estimatedOutput > meteoraQuote.estimatedOutput
            ? raydiumQuote
            : meteoraQuote;

        console.log(`[DEX Router] Selected: ${bestQuote.dex.toUpperCase()} (better by ${Math.abs(raydiumQuote.estimatedOutput - meteoraQuote.estimatedOutput).toFixed(2)})`);

        return bestQuote;
    }

    /**
     * Execute swap on selected DEX
     * Simulates transaction execution with realistic delay
     */
    async executeSwap(dex: DexName, order: Order, quote: DexQuote): Promise<SwapResult> {
        console.log(`[DEX Router] Executing swap on ${dex.toUpperCase()}...`);

        // Simulate 2-3 second execution time
        await sleep(2000 + Math.random() * 1000);

        // Simulate slight price slippage (±0.5%)
        const slippageFactor = 1 + (Math.random() - 0.5) * 0.01;
        const executedPrice = quote.price * slippageFactor;
        const actualOutput = order.amountIn * executedPrice * (1 - quote.fee);

        // Generate mock transaction hash
        const txHash = this.generateMockTxHash();

        console.log(`[DEX Router] Swap executed! TxHash: ${txHash}, Price: ${executedPrice.toFixed(4)}`);

        return {
            txHash,
            executedPrice,
            actualOutput
        };
    }

    /**
     * Generate a mock Solana transaction hash
     */
    private generateMockTxHash(): string {
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let hash = '';
        for (let i = 0; i < 88; i++) {
            hash += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return hash;
    }
}
