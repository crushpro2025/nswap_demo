
import axios from 'axios';
import { systemConfig } from '../models/Order';

/**
 * Smart Liquidity Aggregator
 * Version 5.5: Added production ChangeNOW integration
 */
export class LiquidityAggregator {
  private static instance: LiquidityAggregator;
  private isSyncing = false;
  
  private static lastKnownRates: Record<string, number> = {
    'BTC': 68500, 'ETH': 3480, 'SOL': 142, 'USDT': 1.0, 
    'TRX': 0.12, 'LTC': 84, 'XMR': 168, 'DOGE': 0.16, 
    'XRP': 0.62, 'BSC': 595, 'ARB': 1.12, 'TON': 7.15, 'BNB': 595
  };

  private static idMap: Record<string, string> = {
    'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 
    'USDT': 'tether', 'TRX': 'tron', 'LTC': 'litecoin',
    'XMR': 'monero', 'DOGE': 'dogecoin', 'XRP': 'ripple',
    'BSC': 'binancecoin', 'BNB': 'binancecoin', 'ARB': 'arbitrum', 'TON': 'the-open-network'
  };

  public static getInstance() {
    if (!this.instance) {
      this.instance = new LiquidityAggregator();
      this.instance.startBackgroundSync();
    }
    return this.instance;
  }

  private startBackgroundSync() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.syncPrices();
    setInterval(() => this.syncPrices(), 60000); 
  }

  private async syncPrices() {
    try {
      const ids = Object.values(LiquidityAggregator.idMap).join(',');
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`, 
        { timeout: 8000 }
      );

      const data = response.data;
      Object.entries(LiquidityAggregator.idMap).forEach(([symbol, id]) => {
        if (data[id]?.usd) {
          LiquidityAggregator.lastKnownRates[symbol] = data[id].usd;
        }
      });
    } catch (err: any) {
      console.warn('[LIQUIDITY] Oracle sync error, using cache');
    }
  }

  public async getBestExecutionRate(from: string, to: string, amount: number) {
    // If ChangeNOW is enabled, attempt to get real production quote
    if (systemConfig.useChangeNow) {
      try {
        const fromSym = from.toLowerCase();
        const toSym = to.toLowerCase();
        const apiKeyParam = systemConfig.changeNowApiKey ? `&apiKey=${systemConfig.changeNowApiKey}` : '';
        
        // ChangeNOW Public/Private Quote API
        const url = `https://api.changenow.io/v1/exchange-amount/${amount}/${fromSym}_${toSym}?fixed=false${apiKeyParam}`;
        const response = await axios.get(url, { timeout: 5000 });
        
        if (response.data && response.data.toAmount) {
          return {
            provider: 'CHANGENOW',
            rate: response.data.toAmount / amount,
            estimatedAmount: response.data.toAmount.toString(),
            isRealtime: true
          };
        }
      } catch (err: any) {
        console.error('[LIQUIDITY] ChangeNOW Quote Failed, falling back to Oracle', err.message);
      }
    }

    // Fallback: Internal Oracle
    const rate = this.getRateFromCache(from, to);
    const spread = 0.005; // 0.5% platform spread
    return {
      provider: 'NEXUS_ORACLE',
      rate: rate * (1 - spread),
      estimatedAmount: (amount * rate * (1 - spread)).toFixed(6),
      isRealtime: false
    };
  }

  private getRateFromCache(from: string, to: string): number {
    const fromPrice = LiquidityAggregator.lastKnownRates[from.toUpperCase()] || 1;
    const toPrice = LiquidityAggregator.lastKnownRates[to.toUpperCase()] || 1;
    return fromPrice / toPrice;
  }
}
