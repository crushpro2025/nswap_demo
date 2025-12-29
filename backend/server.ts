
import express from 'express';
import cors from 'cors';
import { router as swapRoutes } from './routes/swapRoutes';
import { BlockchainObserver } from './services/BlockchainObserver';
import { LiquidityAggregator } from './services/LiquidityAggregator';

const app = express();
// Priority: Environment Variable (set by Render/Railway) or fallback to 3001
const PORT = process.env.PORT || 3001;

app.use(cors() as any);
app.use(express.json() as any);

app.use('/api', swapRoutes);

// Initialize Services
const observer = new BlockchainObserver();
observer.start();

// Prime the liquidity oracle
LiquidityAggregator.getInstance();

app.listen(PORT, () => {
  console.log(`
  ================================================
  🚀 NEXUS SWAP ENGINE v4.1 ACTIVE
  ================================================
  📡 PORT: ${PORT}
  🔗 STATUS: OPERATIONAL
  🧠 ORACLE: CACHED BACKGROUND SYNC
  ================================================
  `);
});
