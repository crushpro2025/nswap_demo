
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SwapWidget } from '../components/SwapWidget';
import { AiInsight } from '../components/AiInsight';
import { HistoryRecord } from '../types';
import { SUPPORTED_COINS } from '../constants';

const MiniMetric = ({ label, value, color = "blue" }: { label: string, value: string, color?: string }) => (
  <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-muted/50 border border-border rounded-2xl group hover:border-blue-500/20 transition-all flex-1 min-w-[140px]">
    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${color === 'blue' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></div>
    <div className="flex flex-col overflow-hidden">
      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] truncate">{label}</span>
      <span className="text-xs font-black text-foreground uppercase tracking-tighter truncate">{value}</span>
    </div>
  </div>
);

const SectionHeader = ({ title, sub }: { title: string, sub: string }) => (
  <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:8">
    <div className="flex flex-col">
      <h3 className="text-[9px] sm:text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">{title}</h3>
      <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-tight">{sub}</p>
    </div>
    <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent"></div>
  </div>
);

export default function Swap() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('nexus_swap_history');
    if (stored) setHistory(JSON.parse(stored).slice(0, 4));
  }, []);

  return (
    <div className="min-h-screen pt-2 sm:pt-6 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-12 relative bg-background overflow-hidden">
      {/* Background Visual Architecture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--foreground) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[800px] h-[300px] sm:h-[800px] bg-blue-600/5 dark:bg-blue-600/10 blur-[100px] sm:blur-[180px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-5xl mx-auto relative z-10 space-y-8 sm:space-y-10">
        
        {/* Institutional Branding Header - Split/Centered */}
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-4 px-3 sm:px-4 py-1.5 bg-muted/50 border border-border rounded-full mb-2">
             <span className="text-[8px] sm:text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Protocol.v4 Engine Active</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-foreground tracking-tighter uppercase leading-tight sm:leading-none">
            The <span className="text-blue-500">New</span> Standard <span className="font-light italic text-muted-foreground lowercase hidden xs:inline">of</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Exchange.</span>
          </h1>
          
          <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-[0.1em] sm:tracking-widest opacity-80 max-w-xl mx-auto px-4">
            Decentralized node-based routing for secure, atomic cross-chain settlement.
          </p>
        </div>

        {/* Primary Exchange Zone - Centered Emphasis */}
        <div className="flex flex-col items-center">
          {/* Pre-flight Metrics */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-10 w-full px-2">
             <MiniMetric label="Execution" value="Atomic" />
             <MiniMetric label="Slippage" value="0.01% Est" />
             <MiniMetric label="Network" value="Optimized" color="green" />
             <MiniMetric label="Integrity" value="Verified" color="green" />
          </div>

          <div className="w-full max-w-2xl relative px-1 sm:px-0">
            <div className="absolute -inset-4 bg-blue-600/5 blur-3xl rounded-[3rem] -z-10 hidden sm:block"></div>
            <SwapWidget />
            <div className="px-2">
              <div className="max-w-xl mx-auto">
                <AiInsight fromCoin={SUPPORTED_COINS[0]} toCoin={SUPPORTED_COINS[1]} />
              </div>
            </div>
          </div>
        </div>

        {/* Support Grid - Positioned Below */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-10 sm:pt-12 border-t border-border px-2">
          
          {/* Market Intelligence */}
          <div className="bg-card border border-border rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 space-y-6 sm:space-y-8">
            <SectionHeader title="Network Pulse" sub="Live Blockchain Intelligence" />
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 bg-background/50 rounded-2xl border border-border">
                <div className="text-[8px] font-black text-muted-foreground uppercase mb-2">Node Latency</div>
                <div className="text-lg sm:text-xl font-black text-foreground font-mono">142 <span className="text-[10px] sm:text-xs text-blue-500">ms</span></div>
              </div>
              <div className="p-4 sm:p-5 bg-background/50 rounded-2xl border border-border">
                <div className="text-[8px] font-black text-muted-foreground uppercase mb-2">Fee Efficiency</div>
                <div className="text-lg sm:text-xl font-black text-foreground font-mono">99.8 <span className="text-[10px] sm:text-xs text-blue-500">%</span></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                <span className="text-muted-foreground">Liquidity Depth</span>
                <span className="text-blue-500">Aggregated</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-[91%] shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
              </div>
            </div>
          </div>

          {/* Session Ledger */}
          <div className="bg-card border border-border rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 flex flex-col">
            <div className="flex justify-between items-start">
              <SectionHeader title="Session Ledger" sub="Your Activity" />
              <Link to="/history" className="text-[8px] sm:text-[9px] font-black text-blue-500 hover:text-blue-600 uppercase transition-colors tracking-widest mt-0.5">Full Ledger →</Link>
            </div>
            
            <div className="space-y-3 flex-1 mt-2">
              {history.length > 0 ? history.map((record) => (
                <Link key={record.id} to={`/status/${record.id}`} className="flex items-center justify-between p-3.5 sm:p-4 bg-background/50 hover:bg-muted/50 border border-border rounded-2xl transition-all group">
                  <div className="text-[10px] sm:text-[11px] font-black text-foreground uppercase opacity-80 group-hover:opacity-100 transition-opacity">
                    {record.fromSymbol} <span className="text-muted-foreground mx-0.5">→</span> {record.toSymbol}
                  </div>
                  <div className="text-[7px] sm:text-[8px] font-black text-blue-500 uppercase px-2 py-0.5 sm:py-1 bg-blue-500/5 rounded border border-blue-500/10">
                    {record.status.split('_')[0]}
                  </div>
                </Link>
              )) : (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-2xl py-12">
                   <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">No Active Sessions</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Protocol Info */}
        <div className="flex flex-col items-center gap-6 py-10 sm:py-8 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <div className="flex gap-8 sm:gap-12 items-center">
            <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" className="w-4 h-4 sm:w-5 sm:h-5" alt="BTC" />
            <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" className="w-4 h-4 sm:w-5 sm:h-5" alt="ETH" />
            <img src="https://cryptologos.cc/logos/monero-xmr-logo.png" className="w-4 h-4 sm:w-5 sm:h-5" alt="XMR" />
            <img src="https://cryptologos.cc/logos/solana-sol-logo.png" className="w-4 h-4 sm:w-5 sm:h-5" alt="SOL" />
          </div>
          <p className="text-[7px] sm:text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.4em] text-center px-6">
            Nexus Distributed Liquidity Protocol - Verified Nodes Only
          </p>
        </div>

      </div>
    </div>
  );
}
