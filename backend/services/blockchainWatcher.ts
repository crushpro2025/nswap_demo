
import { orders, SwapStatus } from '../models/Order';

/**
 * This service simulates a real blockchain node observer.
 * In production, you would use Web3.js/Ethers.js to listen for 
 * Transfer events on-chain for the specific 'depositAddress'.
 */
export const startWatcher = () => {
  setInterval(() => {
    orders.forEach((order, id) => {
      // 1. If awaiting deposit, simulate finding a transaction on-chain
      if (order.status === SwapStatus.AWAITING_DEPOSIT) {
        if (Math.random() > 0.7) { // 30% chance each tick to find tx
          order.status = SwapStatus.CONFIRMING;
          console.log(`[WATCHER] Transaction detected for order ${id}`);
        }
      } 
      
      // 2. Increment confirmations
      else if (order.status === SwapStatus.CONFIRMING) {
        if (order.confirmations < order.requiredConfirmations) {
          order.confirmations += 1;
        } else {
          order.status = SwapStatus.EXCHANGING;
          console.log(`[WATCHER] Order ${id} reached required confirmations`);
        }
      }

      // 3. Complete the exchange cycle
      else if (order.status === SwapStatus.EXCHANGING) {
        order.status = SwapStatus.SENDING;
      }
      else if (order.status === SwapStatus.SENDING) {
        order.status = SwapStatus.COMPLETED;
        console.log(`[WATCHER] Order ${id} payout sent to ${order.destinationAddress}`);
      }

      orders.set(id, { ...order });
    });
  }, 3000); // Check every 3 seconds
};
