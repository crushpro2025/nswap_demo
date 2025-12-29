
import React, { useState, useEffect, useRef } from 'react';

interface TickerItem {
  pair: string;
  price: number;
  change: string;
  up: boolean;
}

const FALLBACK_DATA: TickerItem[] = [
  { pair: 'BTC/USD', price: 68111.41, change: '1.24%', up: true },
  { pair: 'ETH/USD', price: 3452.12, change: '0.85%', up: true },
  { pair: 'SOL/USD', price: 142.45, change: '2.10%', up: false },
  { pair: 'XMR/USD', price: 162.18, change: '0.45%', up: true },
  { pair: 'TRX/USD', price: 0.1241, change: '0.12%', up: false },
  { pair: 'USDT/USD', price: 1.0001, change: '0.01%', up: true },
];

export const MarketTicker: React.FC = () => {
  const [tickerData, setTickerData] = useState<TickerItem[]>(FALLBACK_DATA);
  const prevDataRef = useRef<TickerItem[]>(FALLBACK_DATA);
  const [flashingItems, setFlashingItems] = useState<Record<string, 'up' | 'down' | null>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = 'bitcoin,ethereum,solana,tether,tron,monero';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();

        const formatted: TickerItem[] = [
          { 
            pair: 'BTC/USD', 
            price: data.bitcoin.usd, 
            change: `${data.bitcoin.usd_24h_change.toFixed(2)}%`, 
            up: data.bitcoin.usd_24h_change >= 0 
          },
          { 
            pair: 'ETH/USD', 
            price: data.ethereum.usd, 
            change: `${data.ethereum.usd_24h_change.toFixed(2)}%`, 
            up: data.ethereum.usd_24h_change >= 0 
          },
          { 
            pair: 'SOL/USD', 
            price: data.solana.usd, 
            change: `${data.solana.usd_24h_change.toFixed(2)}%`, 
            up: data.solana.usd_24h_change >= 0 
          },
          { 
            pair: 'XMR/USD', 
            price: data.monero.usd, 
            change: `${data.monero.usd_24h_change.toFixed(2)}%`, 
            up: data.monero.usd_24h_change >= 0 
          },
          { 
            pair: 'TRX/USD', 
            price: data.tron.usd, 
            change: `${data.tron.usd_24h_change.toFixed(2)}%`, 
            up: data.tron.usd_24h_change >= 0 
          },
          { 
            pair: 'USDT/USD', 
            price: data.tether.usd, 
            change: `${data.tether.usd_24h_change.toFixed(2)}%`, 
            up: data.tether.usd_24h_change >= 0 
          },
        ];

        const newFlashes: Record<string, 'up' | 'down' | null> = {};
        formatted.forEach((item, idx) => {
          const prevItem = prevDataRef.current[idx];
          if (prevItem && item.price > prevItem.price) newFlashes[item.pair] = 'up';
          else if (prevItem && item.price < prevItem.price) newFlashes[item.pair] = 'down';
        });

        // Trigger the flash state
        setFlashingItems(newFlashes);
        setTickerData(formatted);
        prevDataRef.current = formatted;

        // Reset flashes after animation duration
        setTimeout(() => setFlashingItems({}), 1500);
      } catch (err) {
        console.debug("Market data fetch failed, using fallback:", err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-card/95 backdrop-blur-xl border-b border-border py-1.5 overflow-hidden whitespace-nowrap relative ticker-pause group">
      <div className="flex animate-ticker w-max">
        {[...tickerData, ...tickerData, ...tickerData, ...tickerData].map((item, idx) => {
          const flash = flashingItems[item.pair];
          return (
            <div 
              key={`${item.pair}-${idx}`} 
              className={`inline-flex items-center gap-6 px-12 border-r border-border transition-all duration-300 ${
                flash === 'up' ? 'price-up' : flash === 'down' ? 'price-down' : ''
              }`}
            >
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.pair}</span>
              <span className="text-sm font-mono font-black text-foreground transition-all duration-300">
                ${item.price.toLocaleString(undefined, { minimumFractionDigits: item.price < 1 ? 4 : 2 })}
              </span>
              <span className={`text-[10px] font-black flex items-center gap-1 ${item.up ? 'text-green-500' : 'text-red-500'}`}>
                {item.up ? '▲' : '▼'} {item.change.replace('-', '')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
