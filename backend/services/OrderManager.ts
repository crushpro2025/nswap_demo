
import { v4 as uuidv4 } from 'uuid';
import { SwapOrder, SwapStatus, orders } from '../models/Order';

export class OrderManager {
  private static instance: OrderManager;

  public static getInstance() {
    if (!this.instance) this.instance = new OrderManager();
    return this.instance;
  }

  public createOrder(data: any): SwapOrder {
    const newOrder: SwapOrder = {
      id: uuidv4().substring(0, 8).toUpperCase(),
      ...data,
      // In production, derive this from an xPub using bip32-path logic
      depositAddress: `0x${uuidv4().substring(0, 32)}`, 
      status: SwapStatus.AWAITING_DEPOSIT,
      confirmations: 0,
      requiredConfirmations: data.fromSymbol === 'BTC' ? 3 : 1,
      createdAt: Date.now(),
      logs: [{
        timestamp: Date.now(),
        message: 'Order created and pending deposit.',
        type: 'INFO'
      }]
    };

    orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  public getOrder(id: string) {
    return orders.get(id);
  }

  public getAllOrders() {
    return Array.from(orders.values());
  }

  public updateOrder(order: SwapOrder) {
    orders.set(order.id, order);
  }

  /**
   * Generates a high-level summary for the Executive Dashboard
   */
  public getOrderSummary() {
    const all = this.getAllOrders();
    return {
      total: all.length,
      active: all.filter(o => o.status !== SwapStatus.COMPLETED && o.status !== SwapStatus.EXPIRED).length,
      recent: all.slice(-10).reverse()
    };
  }
}
