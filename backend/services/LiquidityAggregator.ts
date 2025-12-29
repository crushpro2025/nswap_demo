
import axios from 'axios';

/**
 * Smart Liquidity Aggregator
 * Fetches real-time market data and applies institutional spreads.
 */
export class LiquidityAggregator {
  private static instance: LiquidityAggregator;
  // Persistent memory cache to survive API outages
  private static lastKnownRates: Record<string, number> = {
    'BTC': 68500, 'ETH': 3480, 'SOL': 142, 'USDT': 1.0, 
    'TRX': 0.12, 'LTC': 84, 'XMR': 168, 'DOGE': 0.16, 
    'XRP': 0.62, 'BSC': 595, 'ARB': 1.12, 'TON': 7.15, 'BNB': 595
  };

  public static getInstance() {
    if (!this.instance) this.instance = new LiquidityAggregator();
    return this.instance;
  }

  public async getBestExecutionRate(from: string, to: string) {
    const providers = [
      { name: 'NEXUS_INTERNAL', spread: 0.0015 },
      { name: 'UNISWAP_V3', spread: 0.003 },
      { name: '1INCH_AGGREGATOR', spread: 0.001 }
    ];

    const { rate, isStale } = await this.getLiveMarketRate(from, to);
    
    // Sort to find the highest rate for the user (lowest spread)
    const quotes = providers.map(p => ({
      provider: p.name,
      rate: rate * (1 - p.spread),
      isStale
    }));

    return quotes.sort((a, b) => b.rate - a.rate)[0];
  }

  private async getLiveMarketRate(from: string, to: string): Promise<{ rate: number, isStale: boolean }> {
    try {
      const idMap: Record<string, string> = {
        'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 
        'USDT': 'tether', 'TRX': 'tron', 'LTC': 'litecoin',
        'XMR': 'monero', 'DOGE': 'dogecoin', 'XRP': 'ripple',
        'BSC': 'binancecoin', 'BNB': 'binancecoin', 'ARB': 'arbitrum', 'TON': 'the-open-network'
      };

      const fromId = idMap[from.toUpperCase()];
      const toId = idMap[to.toUpperCase()];

      if (!fromId || !toId) {
         return { rate: (LiquidityAggregator.lastKnownRates[from] || 1) / (LiquidityAggregator.lastKnownRates[to] || 1), isStale: true };
      }

      // 5-second timeout to prevent hanging the event loop
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${fromId},${toId}&vs_currencies=usd`, { timeout: 5000 });
      
      const fromPrice = response.data[fromId]?.usd;
      const toPrice = response.data[toId]?.usd;

      if (fromPrice && toPrice) {
        // Update persistent cache
        LiquidityAggregator.lastKnownRates[from] = fromPrice;
        LiquidityAggregator.lastKnownRates[to] = toPrice;
        return { rate: fromPrice / toPrice, isStale: false };
      }

      throw new Error('Incomplete data from oracle');
    } catch (error: any) {
      console.warn(`[ORACLE] Stale fallback triggered for ${from}/${to}: ${error.message}`);
      const fallbackRate = (LiquidityAggregator.lastKnownRates[from] || 1) / (LiquidityAggregator.lastKnownRates[to] || 1);
      return { rate: fallbackRate, isStale: true };
    }
  }
}
