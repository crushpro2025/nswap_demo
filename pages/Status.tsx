
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SwapStatus } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export default function Status() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders/${id}`);
        if (!response.ok) throw new Error('Order tracking lost');
        const data = await response.json();
        setOrder(data);
        setError(null);
      } catch (err) {
        setError('Connection to node-level tracking failed. Please ensure backend is running.');
        console.error(err);
      }
    };

    fetchOrderStatus();
    const interval = setInterval(fetchOrderStatus, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl">
           <p className="text-red-500 font-black uppercase tracking-widest text-sm">{error}</p>
           <Link to="/swap" className="mt-6 inline-block text-blue-500 font-black uppercase tracking-widest text-xs">Return to Exchange</Link>
        </div>
      </div>
    );
  }

  if (!order) return <div className="p-20 text-center animate-pulse text-muted-foreground uppercase font-black text-xs tracking-widest">Synchronizing Ledger...</div>;

  const steps = [
    { key: SwapStatus.AWAITING_DEPOSIT, label: 'Awaiting Deposit', sub: 'Detected: Pending' },
    { key: SwapStatus.CONFIRMING, label: 'Confirming', sub: `${order.confirmations}/${order.requiredConfirmations} network confirmations` },
    { key: SwapStatus.EXCHANGING, label: 'Exchanging', sub: 'Routing through pools' },
    { key: SwapStatus.SENDING, label: 'Sending Funds', sub: 'Signing transaction' },
    { key: SwapStatus.COMPLETED, label: 'Completed', sub: 'Funds successfully sent' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);
  const progress = Math.min(100, (currentStepIndex + 1) * 20 + (order.status === SwapStatus.CONFIRMING ? (order.confirmations / order.requiredConfirmations) * 15 : 0));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="bg-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-border">
        <div className="bg-blue-600/5 p-6 sm:p-10 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Session ID</span>
              <span className="px-3 py-1 bg-blue-600/10 text-blue-500 font-mono text-xs rounded-lg border border-blue-500/10 tracking-widest uppercase">{id}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Tracking Order</h1>
          </div>
          <div className="w-full sm:w-56 space-y-2">
            <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
               <span>Integrity Check</span>
               <span className="text-blue-500">{Math.round(progress)}%</span>
            </div>
            <div className="bg-muted h-2.5 rounded-full overflow-hidden border border-border shadow-inner">
              <div 
                className="h-full bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div className="space-y-8 sm:space-y-10 order-2 lg:order-1">
              {steps.map((step, idx) => {
                const isCompleted = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;
                
                return (
                  <div key={step.key} className="flex gap-6 relative group">
                    {idx !== steps.length - 1 && (
                      <div className={`absolute left-[15px] top-10 bottom-[-24px] w-0.5 ${isCompleted ? 'bg-blue-600' : 'bg-border'}`}></div>
                    )}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 z-10 transition-all duration-500 border-2 ${isCompleted ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : isCurrent ? 'bg-blue-600 border-blue-600 animate-pulse text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-transparent border-border text-muted-foreground'}`}>
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <span className="text-[10px] font-black">{idx + 1}</span>
                      )}
                    </div>
                    <div>
                      <h3 className={`text-sm sm:text-base font-black transition-colors uppercase tracking-tight ${isCurrent ? 'text-blue-500' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-bold uppercase tracking-widest">{step.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-6 order-1 lg:order-2">
              <div className="bg-muted/30 rounded-[2rem] p-6 sm:p-8 border border-border relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Execution Hub</h4>
                  <div className={`px-2 py-1 text-[9px] font-black rounded uppercase tracking-widest border ${order.status === SwapStatus.AWAITING_DEPOSIT ? 'bg-yellow-500/5 text-yellow-500 border-yellow-500/10' : 'bg-green-500/5 text-green-500 border-green-500/10'}`}>
                    {order.status === SwapStatus.AWAITING_DEPOSIT ? 'Pending Funds' : 'Active Settlement'}
                  </div>
                </div>

                {order.status === SwapStatus.AWAITING_DEPOSIT && (
                  <div className="space-y-8">
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-[2rem] shadow-2xl border border-border group-hover:scale-105 transition-transform">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.depositAddress}`} alt="QR" className="w-32 h-32 sm:w-40 sm:h-40" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-[10px] text-muted-foreground mb-2 uppercase font-black tracking-[0.2em]">Institutional Deposit Address</div>
                        <div className="font-mono text-[10px] sm:text-[11px] bg-background p-4 rounded-xl text-foreground break-all select-all border border-border leading-relaxed shadow-inner">
                          {order.depositAddress}
                        </div>
                      </div>
                      <button onClick={() => navigator.clipboard.writeText(order.depositAddress)} className="w-full py-4 bg-muted hover:bg-border text-foreground text-[10px] font-black uppercase tracking-widest rounded-xl border border-border transition-all active:scale-95">
                        Copy Address
                      </button>
                    </div>
                  </div>
                )}

                {order.status !== SwapStatus.AWAITING_DEPOSIT && (
                  <div className="py-12 text-center animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-600/20">
                      <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-sm font-black text-foreground uppercase tracking-tighter">Settlement in progress</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">Our nodes are confirming the transaction.</p>
                  </div>
                )}
              </div>

              <div className="bg-muted/30 rounded-[2rem] p-6 sm:p-8 border border-border">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6">Order Details</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-tight">
                    <span className="text-muted-foreground">Swap Pair</span>
                    <span className="text-foreground">{order.fromSymbol} <span className="text-muted-foreground mx-1">→</span> {order.toSymbol}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-tight">
                    <span className="text-muted-foreground">Amount Expected</span>
                    <span className="text-blue-500">{order.toAmount} {order.toSymbol}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
