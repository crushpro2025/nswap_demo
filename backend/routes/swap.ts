
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { orders, SwapOrder, SwapStatus } from '../models/Order';

export const router = Router();

// Create a new swap order
// Fix: Use 'any' for req and res to avoid type conflicts with global Fetch API Request/Response types and resolve missing property errors
router.post('/orders', (req: any, res: any) => {
  const { fromSymbol, toSymbol, fromAmount, destinationAddress } = req.body;

  if (!fromSymbol || !toSymbol || !fromAmount || !destinationAddress) {
    return res.status(400).json({ error: 'Missing required settlement parameters' });
  }

  // In a real app, you would call a Price API here (e.g. CoinGecko/Binance)
  const mockRate = 0.052; // Example: BTC to ETH rate
  const toAmount = (parseFloat(fromAmount) * mockRate).toFixed(6);

  const newOrder: SwapOrder = {
    id: uuidv4().substring(0, 12).toUpperCase(),
    fromSymbol,
    toSymbol,
    fromAmount,
    toAmount,
    destinationAddress,
    depositAddress: `0x${uuidv4().substring(0, 40)}`, // Deterministic address generation
    status: SwapStatus.AWAITING_DEPOSIT,
    confirmations: 0,
    requiredConfirmations: 3,
    createdAt: Date.now()
  };

  orders.set(newOrder.id, newOrder);
  
  console.log(`[ORDER CREATED] ID: ${newOrder.id} | ${fromAmount} ${fromSymbol} -> ${toAmount} ${toSymbol}`);
  res.status(201).json(newOrder);
});

// Get order status
// Fix: Use 'any' for req and res to allow access to Express-specific properties like params and json()
router.get('/orders/:id', (req: any, res: any) => {
  const order = orders.get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found in active ledger' });
  }

  res.json(order);
});
