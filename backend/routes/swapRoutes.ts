
import { Router } from 'express';
import { OrderManager } from '../services/OrderManager';
import { LiquidityAggregator } from '../services/LiquidityAggregator';
import { systemConfig } from '../models/Order';

export const router = Router();
const orderManager = OrderManager.getInstance();
const aggregator = LiquidityAggregator.getInstance();

router.get('/health', (req: any, res: any) => {
  res.json({ 
    status: 'UP', 
    engine: 'v5.0.0-READY', 
    mode: systemConfig.useChangeNow ? 'CHANGENOW' : 'INTERNAL' 
  });
});

router.get('/admin/config', (req: any, res: any) => {
  res.json(systemConfig);
});

router.post('/admin/config/toggle', (req: any, res: any) => {
  systemConfig.useChangeNow = !systemConfig.useChangeNow;
  console.log(`[SYSTEM] Engine mode toggled to: ${systemConfig.useChangeNow ? 'CHANGENOW' : 'INTERNAL'}`);
  res.json(systemConfig);
});

router.get('/admin/orders', (req: any, res: any) => {
  res.json(orderManager.getAllOrders());
});

router.get('/admin/stats', (req: any, res: any) => {
  res.json(orderManager.getOrderSummary());
});

router.post('/admin/orders/:id/status', (req: any, res: any) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = orderManager.getOrder(id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  order.logs.push({
    timestamp: Date.now(),
    message: `ADMIN_OVERRIDE: Status changed to ${status}`,
    type: 'NETWORK'
  });
  order.status = status;
  orderManager.updateOrder(order);
  res.json(order);
});

router.get('/quote', async (req: any, res: any) => {
  const { from, to, amount } = req.query;
  const quote = await aggregator.getBestExecutionRate(from as string, to as string);
  const inputAmount = parseFloat(amount as string || "1");
  res.json({
    rate: quote.rate,
    estimatedAmount: (inputAmount * quote.rate).toFixed(6),
    provider: systemConfig.useChangeNow ? 'CHANGENOW' : 'NEXUS_ORACLE'
  });
});

router.post('/orders', async (req: any, res: any) => {
  const { fromSymbol, toSymbol, fromAmount, destinationAddress } = req.body;
  const order = await orderManager.createOrder({ fromSymbol, toSymbol, fromAmount, destinationAddress });
  res.status(201).json(order);
});

router.get('/orders/:id', (req: any, res: any) => {
  const order = orderManager.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});
