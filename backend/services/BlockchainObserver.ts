
import { OrderManager } from './OrderManager';
import { SwapStatus, ExecutionLog } from '../models/Order';
import { v4 as uuidv4 } from 'uuid';

export class BlockchainObserver {
  private orderManager = OrderManager.getInstance();

  public start() {
    setInterval(() => this.scan(), 4000);
  }

  private addLog(order: any, message: string, type: ExecutionLog['type'] = 'INFO') {
    if (!order.logs) order.logs = [];
    order.logs.push({
      timestamp: Date.now(),
      message,
      type
    });
  }

  private generateMockHash(symbol: string): string {
    const raw = uuidv4().replace(/-/g, '');
    if (['ETH', 'BSC', 'ARB', 'USDT'].includes(symbol)) return `0x${raw}`;
    if (['TRX', 'USDT_TRC20'].includes(symbol)) return `T${raw.substring(0, 33)}`;
    if (symbol === 'BTC') return raw;
    return `0x${raw}`;
  }

  private scan() {
    const activeOrders = this.orderManager.getAllOrders();
    
    activeOrders.forEach(order => {
      const now = Date.now();

      switch(order.status) {
        case SwapStatus.AWAITING_DEPOSIT:
          // 15% chance to detect deposit
          if (Math.random() > 0.85) {
            order.status = SwapStatus.CONFIRMING;
            order.txHashIn = this.generateMockHash(order.fromSymbol);
            this.addLog(order, `Inbound transaction detected on ${order.fromSymbol} mempool. Hash: ${order.txHashIn.substring(0, 12)}...`, 'NETWORK');
            this.addLog(order, `Validating deposit amount and gas overhead...`, 'INFO');
          }
          break;

        case SwapStatus.CONFIRMING:
          if (order.confirmations < order.requiredConfirmations) {
             const confirmationProbability = order.fromSymbol === 'BTC' ? 0.4 : 0.7;
             if (Math.random() < confirmationProbability) {
               order.confirmations++;
               this.addLog(order, `Block confirmation ${order.confirmations}/${order.requiredConfirmations} verified by Nexus Node Cluster.`, 'INFO');
             }
          } else {
            order.status = SwapStatus.EXCHANGING;
            this.addLog(order, `Required confirmations achieved. Initiating atomic swap routine.`, 'SUCCESS');
          }
          break;

        case SwapStatus.EXCHANGING:
          // Simulate routing logic
          if (Math.random() > 0.4) {
            this.addLog(order, `Routing liquidity via Cross-Chain Bridge #82.`, 'INFO');
            this.addLog(order, `Internal ledger adjustment: -${order.fromAmount} ${order.fromSymbol} / +${order.toAmount} ${order.toSymbol}`, 'INFO');
            order.status = SwapStatus.SENDING;
          }
          break;

        case SwapStatus.SENDING:
          if (Math.random() > 0.4) {
            order.txHashOut = this.generateMockHash(order.toSymbol);
            order.status = SwapStatus.COMPLETED;
            this.addLog(order, `Transaction signed and broadcast to ${order.toSymbol} network. Payout Hash: ${order.txHashOut.substring(0, 16)}...`, 'SUCCESS');
            this.addLog(order, `Settlement session finalized successfully.`, 'SUCCESS');
          }
          break;
      }
      
      this.orderManager.updateOrder(order);
    });
  }
}
