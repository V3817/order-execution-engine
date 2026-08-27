export type OrderStatus =
    | 'pending'
    | 'routing'
    | 'building'
    | 'submitted'
    | 'confirmed'
    | 'failed';

export type DexName = 'raydium' | 'meteora';

export interface Order {
    id: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: number;
    slippage: number;
    status: OrderStatus;
    selectedDex?: DexName;
    executedPrice?: number;
    txHash?: string;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DexQuote {
    dex: DexName;
    price: number;
    fee: number;
    estimatedOutput: number;
}

export interface SwapResult {
    txHash: string;
    executedPrice: number;
    actualOutput: number;
}

export interface WebSocketMessage {
    orderId: string;
    status: OrderStatus;
    timestamp: string;
    dex?: DexName;
    price?: number;
    txHash?: string;
    error?: string;
}
