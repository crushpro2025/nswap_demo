
import { v4 as uuidv4 } from 'uuid';
import { SwapOrder, SwapStatus, orders, systemConfig } from '../models/Order';
import axios from 'axios';

export class OrderManager {
  private static instance: OrderManager;

  public static getInstance() {
    if (!this.instance) this.instance = new OrderManager();
    return this.instance;
  }

  public async createOrder(data: any): Promise<SwapOrder> {
    if (systemConfig.useChangeNow) {
      return this.createChangeNowOrder(data);
    } else {
      return this.createInternalOrder(data);
    }
  }

  private async createChangeNowOrder(data: any): Promise<SwapOrder> {
    const logPrefix = '[CHANGENOW]';
    try {
      // In a real production app, we would use the real ChangeNOW API here:
      // const res = await axios.post('https://api.changenow.io/v1/transactions/' + systemConfig.changeNowApiKey, { ... });
      
      // For this implementation, we simulate the ChangeNOW API response structure
      const mockProviderId = `cn_${uuidv4().substring(0, 8)}`;
      
      const newOrder: SwapOrder = {
        id: uuidv4().substring(0, 8).toUpperCase(),
        ...data,
        depositAddress: `0x_cn_${uuidv4().substring(0, 32)}`, // ChangeNOW generated address
        status: SwapStatus.AWAITING_DEPOSIT,
        confirmations: 0,
        requiredConfirmations: 1,
        createdAt: Date.now(),
        provider: 'CHANGENOW',
        providerId: mockProviderId,
        logs: [{
          timestamp: Date.now(),
          message: `${logPrefix} Transaction initialized via ChangeNOW API. Partner ID: ${mockProviderId}`,
          type: 'NETWORK'
        }]
      };

      orders.set(newOrder.id, newOrder);
      return newOrder;
    } catch (err) {
      console.error("ChangeNOW API Failure, falling back to internal", err);
      return this.createInternalOrder(data);
    }
  }

  private createInternalOrder(data: any): SwapOrder {
    const newOrder: SwapOrder = {
      id: uuidv4().substring(0, 8).toUpperCase(),
      ...data,
      depositAddress: `0x_nx_${uuidv4().substring(0, 32)}`, 
      status: SwapStatus.AWAITING_DEPOSIT,
      confirmations: 0,
      requiredConfirmations: data.fromSymbol === 'BTC' ? 3 : 1,
      createdAt: Date.now(),
      provider: 'NEXUS_INTERNAL',
      logs: [{
        timestamp: Date.now(),
        message: 'Order created via Nexus Internal Protocol Engine.',
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

  public getOrderSummary() {
    const all = this.getAllOrders();
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    
    return {
      total: all.length,
      newOrders24h: all.filter(o => o.createdAt > dayAgo).length,
      active: all.filter(o => o.status !== SwapStatus.COMPLETED && o.status !== SwapStatus.EXPIRED).length,
      pendingValue: all.filter(o => o.status === SwapStatus.AWAITING_DEPOSIT)
        .reduce((sum, o) => sum + (parseFloat(o.fromAmount) * 100), 0) // Mock value
    };
  }
}
