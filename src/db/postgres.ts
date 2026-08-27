import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('[PostgreSQL] Connected successfully');
});

pool.on('error', (err) => {
    console.error('[PostgreSQL] Connection error:', err);
});

// Initialize database schema
export async function initDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY,
        token_in VARCHAR(50) NOT NULL,
        token_out VARCHAR(50) NOT NULL,
        amount_in DECIMAL NOT NULL,
        slippage DECIMAL NOT NULL,
        status VARCHAR(20) NOT NULL,
        selected_dex VARCHAR(20),
        executed_price DECIMAL,
        tx_hash VARCHAR(100),
        error TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
    `);
        console.log('[PostgreSQL] Database schema initialized');
    } finally {
        client.release();
    }
}

// Save order to database
export async function saveOrder(order: any) {
    await pool.query(
        `INSERT INTO orders (id, token_in, token_out, amount_in, slippage, status, selected_dex, executed_price, tx_hash, error, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (id) DO UPDATE SET
       status = $6,
       selected_dex = $7,
       executed_price = $8,
       tx_hash = $9,
       error = $10,
       updated_at = $12`,
        [
            order.id,
            order.tokenIn,
            order.tokenOut,
            order.amountIn,
            order.slippage,
            order.status,
            order.selectedDex,
            order.executedPrice,
            order.txHash,
            order.error,
            order.createdAt,
            order.updatedAt
        ]
    );
}
