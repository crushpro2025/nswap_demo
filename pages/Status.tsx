
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SwapStatus } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

export default function Status() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let retryCount = 0;
    const fetchOrderStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders/${id}`);
        if (!response.ok) throw new Error('Order tracking synchronized with ledger');
        const data = await response.json();
        setOrder(data);
        setError(null);
      } catch (err) {
        retryCount++;
        if (retryCount > 10) {
          setError('Synchronizing with distributed node taking longer than expected...');
        }
      }
    };

    fetchOrderStatus();
    const interval = setInterval(fetchOrderStatus, 3000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [order?.logs]);

  if (error && !order) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center animate-in fade-in duration-700">
        <div className="p-10 bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] shadow-2xl">
           <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-600/20">
              <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
           </div>
           <p className="text-foreground font-black uppercase tracking-widest text-sm mb-2">Network Synchronization</p>
           <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">{error}</p>
        </div>
      </div>
    );
  }

  if (!order) return (
    <div className="p-24 text-center space-y-4">
      <div className="flex justify-center gap-1.5">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
      <div className="text-muted-foreground uppercase font-black text-[10px] tracking-[0.4em] animate-pulse">Syncing Distributed Node...</div>
    </div>
  );

  const steps = [
    { key: SwapStatus.AWAITING_DEPOSIT, label: 'Awaiting Deposit' },
    { key: SwapStatus.CONFIRMING, label: 'Confirming' },
    { key: SwapStatus.EXCHANGING, label: 'Exchanging' },
    { key: SwapStatus.SENDING, label: 'Sending funds' },
    { key: SwapStatus.COMPLETED, label: 'Completed' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);
  const progress = Math.min(100, (currentStepIndex + 1) * 20);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Hero Status Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-card rounded-[2.5rem] p-8 border border-border shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5 select-none font-black text-6xl tracking-tighter uppercase pointer-events-none">
             {order.status}
           </div>
           <div className="flex items-center gap-3 mb-4">
             <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">Session Live</span>
             <span className="text-[10px] font-mono text-muted-foreground">ID: {id}</span>
           </div>
           <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter mb-8 leading-tight">
             Settling {order.fromAmount} <span className="text-blue-500">{order.fromSymbol}</span> <br /> 
             to {order.toAmount} <span className="text-emerald-500">{order.toSymbol}</span>
           </h1>
           
           <div className="relative h-2 bg-muted rounded-full overflow-hidden border border-border mb-2">
             <div className="absolute inset-0 bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
           </div>
           <div className="flex justify-between text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">
             <span>Initialization</span>
             <span>Broadcast Finalization</span>
           </div>
        </div>

        <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-2xl flex flex-col justify-between">
           <div>
             <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Payout Destination</h3>
             <div className="bg-muted p-4 rounded-xl border border-border break-all font-mono text-[10px] text-foreground mb-4">
               {order.destinationAddress}
             </div>
           </div>
           {order.txHashOut && (
             <div className="animate-in fade-in slide-in-from-top-2">
                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Blockchain Receipt</h3>
                <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 font-mono text-[10px] text-emerald-600 truncate">
                  {order.txHashOut}
                </div>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Steps & QR */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-2xl">
            {order.status === SwapStatus.AWAITING_DEPOSIT ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-[2rem] border-4 border-muted">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${order.depositAddress}`} alt="QR" className="w-40 h-40" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Protocol Deposit Address</p>
                  <div className="bg-muted p-4 rounded-2xl border border-border font-mono text-[11px] break-all text-foreground select-all">
                    {order.depositAddress}
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(order.depositAddress); alert('Address copied'); }} className="w-full py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:bg-blue-500 transition-all">
                    Copy Deposit Address
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 py-4">
                {steps.map((step, idx) => {
                  const isComp = currentStepIndex > idx;
                  const isCurr = currentStepIndex === idx;
                  return (
                    <div key={step.key} className="flex items-center gap-6 group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${isComp ? 'bg-emerald-500 border-emerald-500 text-white' : isCurr ? 'bg-blue-600 border-blue-600 text-white animate-pulse' : 'border-border text-muted-foreground'}`}>
                        {isComp ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : <span className="text-xs font-black">{idx + 1}</span>}
                      </div>
                      <div className={`text-xs font-black uppercase tracking-widest ${isCurr ? 'text-blue-500' : isComp ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Technical Log Console */}
        <div className="lg:col-span-7 h-full min-h-[500px]">
           <div className="bg-[#0A0C10] rounded-[2.5rem] border border-white/5 shadow-2xl h-full flex flex-col overflow-hidden">
             <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
               <div className="flex items-center gap-3">
                 <div className="flex gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                 </div>
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Execution Console</span>
               </div>
               <span className="text-[9px] font-mono text-blue-500/50">nexus_protocol_v4.1</span>
             </div>
             
             <div className="flex-grow p-6 font-mono text-[10px] overflow-y-auto space-y-3 custom-scrollbar">
               {order.logs?.map((log: any, i: number) => (
                 <div key={i} className="flex gap-4 group animate-in slide-in-from-left-2 fade-in">
                   <span className="text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}]</span>
                   <span className={
                     log.type === 'SUCCESS' ? 'text-emerald-500' : 
                     log.type === 'NETWORK' ? 'text-blue-400' : 'text-slate-400'
                   }>
                     <span className="mr-2 opacity-50">{log.type === 'SUCCESS' ? '✓' : log.type === 'NETWORK' ? 'λ' : '::'}</span>
                     {log.message}
                   </span>
                 </div>
               ))}
               <div ref={logEndRef} />
               
               {order.status !== SwapStatus.COMPLETED && (
                 <div className="flex gap-4 items-center">
                   <span className="text-slate-600">[{new Date().toLocaleTimeString([], {hour12: false})}]</span>
                   <span className="text-blue-500 animate-pulse">Scanning peer nodes for block updates...</span>
                 </div>
               )}
             </div>
             
             <div className="p-4 bg-black/40 border-t border-white/5 text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center italic">
               All logs are generated in real-time by the Nexus Distributed Settlement Engine.
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
