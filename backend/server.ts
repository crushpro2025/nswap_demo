
import express from 'express';
import cors from 'cors';
import { router as swapRoutes } from './routes/swapRoutes';
import { BlockchainObserver } from './services/BlockchainObserver';

const app = express();
// Priority: Environment Variable (set by Render/Railway) or fallback to 3001
const PORT = process.env.PORT || 3001;

app.use(cors() as any);
app.use(express.json() as any);

app.use('/api', swapRoutes);

const observer = new BlockchainObserver();
observer.start();

app.listen(PORT, () => {
  console.log(`
  ================================================
  🚀 NEXUS SWAP ENGINE v4.0 DEPLOYED
  ================================================
  📡 PORT: ${PORT}
  🔗 STATUS: OPERATIONAL
  ================================================
  `);
});
