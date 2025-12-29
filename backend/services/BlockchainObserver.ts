
import { OrderManager } from './OrderManager';
import { SwapStatus } from '../models/Order';

export class BlockchainObserver {
  private orderManager = OrderManager.getInstance();

  public start() {
    // Poll the active sessions every 5 seconds
    setInterval(() => this.scan(), 5000);
  }

  private scan() {
    const activeOrders = this.orderManager.getAllOrders();
    
    activeOrders.forEach(order => {
      // Logic for progressing orders based on network-specific block times
      switch(order.status) {
        case SwapStatus.AWAITING_DEPOSIT:
          // Simulate ledger mempool detection (12% chance per tick)
          if (Math.random() > 0.88) {
            order.status = SwapStatus.CONFIRMING;
            console.log(`[LEDGER] Inbound TX detected for node ${order.id}`);
          }
          break;

        case SwapStatus.CONFIRMING:
          // Inbound confirmation simulation
          if (order.confirmations < order.requiredConfirmations) {
             // BTC takes longer to confirm than SOL/ETH in this simulation
             const confirmationProbability = order.fromSymbol === 'BTC' ? 0.3 : 0.6;
             if (Math.random() < confirmationProbability) {
               order.confirmations++;
             }
          } else {
            order.status = SwapStatus.EXCHANGING;
          }
          break;

        case SwapStatus.EXCHANGING:
          // Atomic swap simulation (80% success rate per tick)
          if (Math.random() > 0.2) {
            order.status = SwapStatus.SENDING;
          }
          break;

        case SwapStatus.SENDING:
          // Broadcoast payout to target chain
          if (Math.random() > 0.3) {
            order.status = SwapStatus.COMPLETED;
            console.log(`[LEDGER] Atomic settlement broadcast complete: ${order.id}`);
          }
          break;
      }
      
      this.orderManager.updateOrder(order);
    });
  }
}
