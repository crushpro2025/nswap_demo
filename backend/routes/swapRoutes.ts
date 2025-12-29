
import { Router, Request, Response } from 'express';
import { OrderManager } from '../services/OrderManager';
import { LiquidityAggregator } from '../services/LiquidityAggregator';

export const router = Router();
const orderManager = OrderManager.getInstance();
const aggregator = LiquidityAggregator.getInstance();

/**
 * GATEWAY ENDPOINT: Create Order
 * Steps: 1. Validate Input -> 2. Aggregate Rates -> 3. Create Record
 */
// Fix: Use 'any' for req and res to resolve TypeScript errors where 'body' or 'status' are not found on the default Request/Response types
router.post('/orders', async (req: any, res: any) => {
  try {
    const { fromSymbol, toSymbol, fromAmount, destinationAddress } = req.body;

    if (!fromSymbol || !toSymbol || !fromAmount || !destinationAddress) {
      return res.status(400).json({ error: 'Incomplete settlement parameters' });
    }

    // Call Liquidity Aggregator for best rate
    const bestRate = await aggregator.getBestExecutionRate(fromSymbol, toSymbol);
    const toAmount = (parseFloat(fromAmount) * bestRate.rate).toFixed(6);

    // Register with Order Manager
    const order = orderManager.createOrder({
      fromSymbol,
      toSymbol,
      fromAmount,
      toAmount,
      destinationAddress,
      rate: bestRate.rate,
      provider: bestRate.provider
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Gateway Error:', error);
    res.status(500).json({ error: 'Internal Engine Failure' });
  }
});

/**
 * GATEWAY ENDPOINT: Track Order
 */
// Fix: Use 'any' for req and res to ensure 'params', 'status', and 'json' methods are correctly recognized by TypeScript
router.get('/orders/:id', (req: any, res: any) => {
  const order = orderManager.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});
