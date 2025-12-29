
import { OrderManager } from './OrderManager';
import { SwapStatus } from '../models/Order';

/**
 * Blockchain Observer Service
 * Monitors the "Distributed Ledger" for order fulfillment.
 */
export class BlockchainObserver {
  private orderManager = OrderManager.getInstance();

  public start() {
    setInterval(() => this.scan(), 4000);
  }

  private scan() {
    const activeOrders = this.orderManager.getAllOrders();
    
    activeOrders.forEach(order => {
      // Logic for progressing orders based on "Network Events"
      switch(order.status) {
        case SwapStatus.AWAITING_DEPOSIT:
          // Simulate finding a deposit 15% of the time
          if (Math.random() > 0.85) {
            order.status = SwapStatus.CONFIRMING;
            console.log(`[OBSERVER] Found deposit for ${order.id}`);
          }
          break;

        case SwapStatus.CONFIRMING:
          if (order.confirmations < order.requiredConfirmations) {
            order.confirmations++;
          } else {
            order.status = SwapStatus.EXCHANGING;
          }
          break;

        case SwapStatus.EXCHANGING:
          order.status = SwapStatus.SENDING;
          break;

        case SwapStatus.SENDING:
          order.status = SwapStatus.COMPLETED;
          console.log(`[OBSERVER] Settlement complete for ${order.id}`);
          break;
      }
      
      this.orderManager.updateOrder(order);
    });
  }
}
