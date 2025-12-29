
import { Router } from 'express';
import { OrderManager } from '../services/OrderManager';
import { LiquidityAggregator } from '../services/LiquidityAggregator';

export const router = Router();
const orderManager = OrderManager.getInstance();
const aggregator = LiquidityAggregator.getInstance();

/**
 * PING: Node Health Check
 */
router.get('/health', (req: any, res: any) => {
  res.json({ status: 'UP', engine: 'v4.1.0-OMS-READY', timestamp: Date.now() });
});

/**
 * ADMIN: List All Global Orders (OMS)
 */
router.get('/admin/orders', (req: any, res: any) => {
  const allOrders = orderManager.getAllOrders();
  res.json(allOrders);
});

/**
 * ADMIN: Update Order Status Manually (OMS Control)
 */
router.post('/admin/orders/:id/status', (req: any, res: any) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = orderManager.getOrder(id);
  
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  order.status = status;
  orderManager.updateOrder(order);
  
  console.log(`[ADMIN ACTION] Order ${id} status manually set to ${status}`);
  res.json(order);
});

/**
 * QUOTE: Get Live Execution Quote
 */
router.get('/quote', async (req: any, res: any) => {
  const { from, to, amount } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'Parameters required' });
  
  try {
    const quote = await aggregator.getBestExecutionRate(from as string, to as string);
    const inputAmount = parseFloat(amount as string || "1");
    const estimatedAmount = (inputAmount * quote.rate).toFixed(6);
    
    res.json({
      rate: quote.rate,
      estimatedAmount,
      provider: quote.provider,
      isStale: quote.isStale,
      validUntil: Date.now() + 30000
    });
  } catch (err) {
    console.error('[QUOTE_ROUTE_ERROR]', err);
    res.status(200).json({ 
      error: 'Using localized node pricing', 
      rate: 1.0, 
      estimatedAmount: amount, 
      isStale: true 
    });
  }
});

/**
 * GATEWAY ENDPOINT: Create Order
 */
router.post('/orders', async (req: any, res: any) => {
  try {
    const { fromSymbol, toSymbol, fromAmount, destinationAddress } = req.body;

    if (!fromSymbol || !toSymbol || !fromAmount || !destinationAddress) {
      return res.status(400).json({ error: 'Incomplete settlement parameters' });
    }

    const quote = await aggregator.getBestExecutionRate(fromSymbol, toSymbol);
    const toAmount = (parseFloat(fromAmount) * quote.rate).toFixed(6);

    const order = orderManager.createOrder({
      fromSymbol,
      toSymbol,
      fromAmount,
      toAmount,
      destinationAddress,
      rate: quote.rate,
      provider: quote.provider
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Gateway Error:', error);
    res.status(500).json({ error: 'Internal Engine Failure' });
  }
});

router.get('/orders/:id', (req: any, res: any) => {
  const order = orderManager.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});
