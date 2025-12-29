
import React, { useState, useEffect } from 'react';
import { SUPPORTED_COINS } from '../constants';

interface GlobalSwap {
  id: string;
  fromSymbol: string;
  toSymbol: string;
  amount: string;
  timestamp: number;
  timeLabel: string;
}

const formatStaticTime = (timestamp: number): string => {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}min`;
  return `${Math.floor(mins / 60)}h`;
};

const generateRandomSwap = (customTime?: number): GlobalSwap => {
  const from = SUPPORTED_COINS[Math.floor(Math.random() * SUPPORTED_COINS.length)];
  let to = SUPPORTED_COINS[Math.floor(Math.random() * SUPPORTED_COINS.length)];
  while (to.id === from.id) {
    to = SUPPORTED_COINS[Math.floor(Math.random() * SUPPORTED_COINS.length)];
  }
  
  const amountBase = from.symbol === 'BTC' ? 0.05 : from.symbol === 'ETH' ? 1.5 : from.symbol === 'SOL' ? 25 : 500;
  const amount = (Math.random() * amountBase + (amountBase * 0.1)).toFixed(from.precision > 4 ? 4 : from.precision);
  const ts = customTime || Date.now();

  return {
    id: Math.random().toString(36).substring(2, 10).toUpperCase(),
    fromSymbol: from.symbol,
    toSymbol: to.symbol,
    amount,
    timestamp: ts,
    timeLabel: formatStaticTime(ts)
  };
};

export const LiveFeed: React.FC = () => {
  const [swaps, setSwaps] = useState<GlobalSwap[]>([]);

  useEffect(() => {
    // Generate initial varied history
    const initialSwaps = Array.from({ length: 10 }, (_, i) => 
      generateRandomSwap(Date.now() - (i * 60000 + Math.random() * 20000))
    );
    setSwaps(initialSwaps);

    const refreshAndAdd = () => {
      setSwaps(prev => {
        const newSwap = generateRandomSwap();
        const combined = [newSwap, ...prev.slice(0, 9)];
        return combined.map(s => ({
          ...s,
          timeLabel: formatStaticTime(s.timestamp)
        }));
      });
      
      const nextDelay = Math.random() * 8000 + 4000;
      setTimeout(refreshAndAdd, nextDelay);
    };
    
    const initialTimer = setTimeout(refreshAndAdd, 5000);
    return () => clearTimeout(initialTimer);
  }, []);

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-border">
      <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Live Platform Activity</h3>
        </div>
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Real-time Feed</div>
      </div>
      <div className="divide-y divide-border max-h-[440px] overflow-hidden">
        {swaps.map((swap, idx) => {
          const fromCoin = SUPPORTED_COINS.find(c => c.symbol === swap.fromSymbol);
          const toCoin = SUPPORTED_COINS.find(c => c.symbol === swap.toSymbol);
          
          return (
            <div 
              key={swap.id} 
              className={`p-4 flex items-center justify-between transition-all duration-700 ${idx === 0 ? 'bg-blue-600/5 animate-in fade-in slide-in-from-top-4' : 'bg-transparent'}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border border-card bg-muted flex items-center justify-center p-1.5 shadow-sm">
                    <img src={fromCoin?.logo} className="w-full h-full object-contain" alt={swap.fromSymbol} />
                  </div>
                  <div className="w-8 h-8 rounded-full border border-card bg-muted flex items-center justify-center p-1.5 shadow-sm">
                    <img src={toCoin?.logo} className="w-full h-full object-contain" alt={swap.toSymbol} />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {swap.amount} {swap.fromSymbol} <span className="text-muted-foreground px-1 font-normal">→</span> {swap.toSymbol}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono tracking-tighter">ID: {swap.id}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-wider tabular-nums">
                  {swap.timeLabel}
                </div>
                <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                  <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                  Success
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
