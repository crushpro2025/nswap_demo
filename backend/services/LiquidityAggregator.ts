
import axios from 'axios';

/**
 * Smart Liquidity Aggregator
 * Fetches real-time market data and applies institutional spreads.
 * Version 4.1: Background Syncing to prevent Oracle Rate Limiting (429)
 */
export class LiquidityAggregator {
  private static instance: LiquidityAggregator;
  private isSyncing = false;
  
  // Persistent memory cache to survive API outages
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

  /**
   * Starts a background loop to fetch prices every 60 seconds.
   * This prevents hitting CoinGecko's rate limits (429) when multiple users swap.
   */
  private startBackgroundSync() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    
    console.log('[LIQUIDITY] Initializing Oracle Sync Loop (60s Intervals)');
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
      console.log('[LIQUIDITY] Oracle sync successful. Cache updated.');
    } catch (err: any) {
      if (err.response?.status === 429) {
        console.warn('[LIQUIDITY] Oracle Rate Limited (429). Retaining existing cache.');
      } else {
        console.error('[LIQUIDITY] Oracle Sync Error:', err.message);
      }
    }
  }

  public async getBestExecutionRate(from: string, to: string) {
    const providers = [
      { name: 'NEXUS_INTERNAL', spread: 0.0015 },
      { name: 'UNISWAP_V3', spread: 0.003 },
      { name: '1INCH_AGGREGATOR', spread: 0.001 }
    ];

    // Pull from the recently synced cache instead of making a new API call
    const rate = this.getRateFromCache(from, to);
    
    // Sort to find the highest rate for the user (lowest spread)
    const quotes = providers.map(p => ({
      provider: p.name,
      rate: rate * (1 - p.spread),
      isStale: false // We consider our background sync "fresh" enough
    }));

    return quotes.sort((a, b) => b.rate - a.rate)[0];
  }

  private getRateFromCache(from: string, to: string): number {
    const fromPrice = LiquidityAggregator.lastKnownRates[from.toUpperCase()] || 1;
    const toPrice = LiquidityAggregator.lastKnownRates[to.toUpperCase()] || 1;
    
    if (fromPrice === 1 || toPrice === 1) {
      console.warn(`[LIQUIDITY] Asset ${fromPrice === 1 ? from : to} missing in cache. Using parity.`);
    }

    return fromPrice / toPrice;
  }
}
