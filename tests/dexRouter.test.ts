import { MockDexRouter } from '../src/services/dexRouter';

describe('MockDexRouter', () => {
    let router: MockDexRouter;

    beforeEach(() => {
        router = new MockDexRouter();
    });

    describe('getRaydiumQuote', () => {
        it('should return a valid quote with price and fee', async () => {
            const quote = await router.getRaydiumQuote('SOL', 'USDC', 1);

            expect(quote.dex).toBe('raydium');
            expect(quote.price).toBeGreaterThan(0);
            expect(quote.fee).toBe(0.003);
            expect(quote.estimatedOutput).toBeGreaterThan(0);
        });

        it('should have price variance within expected range', async () => {
            const quote = await router.getRaydiumQuote('SOL', 'USDC', 1);

            // Price should be within 98-102 (base 100 ± 2-4%)
            expect(quote.price).toBeGreaterThanOrEqual(98);
            expect(quote.price).toBeLessThanOrEqual(102);
        });
    });

    describe('getMeteorQuote', () => {
        it('should return a valid quote with price and fee', async () => {
            const quote = await router.getMeteorQuote('SOL', 'USDC', 1);

            expect(quote.dex).toBe('meteora');
            expect(quote.price).toBeGreaterThan(0);
            expect(quote.fee).toBe(0.002);
            expect(quote.estimatedOutput).toBeGreaterThan(0);
        });

        it('should have lower fee than Raydium', async () => {
            const meteoraQuote = await router.getMeteorQuote('SOL', 'USDC', 1);
            const raydiumQuote = await router.getRaydiumQuote('SOL', 'USDC', 1);

            expect(meteoraQuote.fee).toBeLessThan(raydiumQuote.fee);
        });
    });

    describe('selectBestDex', () => {
        it('should select DEX with better estimated output', async () => {
            const bestQuote = await router.selectBestDex('SOL', 'USDC', 1);

            expect(['raydium', 'meteora']).toContain(bestQuote.dex);
            expect(bestQuote.estimatedOutput).toBeGreaterThan(0);
        });

        it('should compare both DEXs', async () => {
            const consoleSpy = jest.spyOn(console, 'log');

            await router.selectBestDex('SOL', 'USDC', 1);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[DEX Router] Raydium:')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[DEX Router] Meteora:')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[DEX Router] Selected:')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('executeSwap', () => {
        it('should return transaction hash and executed price', async () => {
            const quote = await router.selectBestDex('SOL', 'USDC', 1);
            const order: any = {
                id: 'test-order',
                tokenIn: 'SOL',
                tokenOut: 'USDC',
                amountIn: 1,
                slippage: 0.01
            };

            const result = await router.executeSwap(quote.dex, order, quote);

            expect(result.txHash).toBeDefined();
            expect(result.txHash.length).toBe(88);
            expect(result.executedPrice).toBeGreaterThan(0);
            expect(result.actualOutput).toBeGreaterThan(0);
        });

        it('should simulate execution delay', async () => {
            const quote = await router.selectBestDex('SOL', 'USDC', 1);
            const order: any = {
                id: 'test-order',
                tokenIn: 'SOL',
                tokenOut: 'USDC',
                amountIn: 1,
                slippage: 0.01
            };

            const start = Date.now();
            await router.executeSwap(quote.dex, order, quote);
            const duration = Date.now() - start;

            // Should take 2-3 seconds
            expect(duration).toBeGreaterThanOrEqual(2000);
            expect(duration).toBeLessThan(3500);
        });
    });
});
