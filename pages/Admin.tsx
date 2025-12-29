
import React, { useState, useEffect, useMemo } from 'react';
import { SwapStatus } from '../types';
import { SUPPORTED_COINS, SERVICE_FEE } from '../constants';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  newOrdersToday: number;
  totalVolumeUSD: number;
  pendingValueUSD: number;
  estimatedRevenue: number;
  successRate: number;
}

export default function Admin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LEDGER' | 'INVENTORY'>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders`);
      const data = await res.json();
      setOrders(data.sort((a: any, b: any) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error("Failed to sync with OMS Engine");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    // Explicitly set light theme styles for Admin page
    document.documentElement.classList.remove('dark');
    document.body.style.backgroundColor = '#F8FAFC';
    return () => {
      clearInterval(interval);
      document.body.style.backgroundColor = '';
    };
  }, []);

  const stats = useMemo<DashboardStats>(() => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const total = orders.length;
    const active = orders.filter(o => o.status !== SwapStatus.COMPLETED && o.status !== SwapStatus.EXPIRED).length;
    const newToday = orders.filter(o => o.createdAt > oneDayAgo).length;
    const completed = orders.filter(o => o.status === SwapStatus.COMPLETED);
    const awaiting = orders.filter(o => o.status === SwapStatus.AWAITING_DEPOSIT);
    
    // Mock USD calculation (Using $100 baseline for simulation as in existing logic)
    const volume = completed.reduce((acc, o) => acc + (parseFloat(o.fromAmount) * 100), 0);
    const pendingValue = awaiting.reduce((acc, o) => acc + (parseFloat(o.fromAmount) * 100), 0);
    const revenue = volume * SERVICE_FEE;
    const successRate = total > 0 ? (completed.length / total) * 100 : 0;

    return { 
      totalOrders: total, 
      activeOrders: active, 
      newOrdersToday: newToday,
      totalVolumeUSD: volume, 
      pendingValueUSD: pendingValue,
      estimatedRevenue: revenue, 
      successRate 
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.destinationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.fromSymbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

  const updateStatus = async (id: string, status: SwapStatus) => {
    try {
      await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchOrders();
    } catch (err) {
      alert("Status override failed");
    }
  };

  const getCoinNetwork = (symbol: string) => {
    return SUPPORTED_COINS.find(c => c.symbol === symbol)?.network || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 pb-20">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-50 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">Nexus <span className="text-indigo-600">Admin</span></h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">OMS Engine v5.5</p>
            </div>
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} label="Overview" />
            <TabButton active={activeTab === 'LEDGER'} onClick={() => setActiveTab('LEDGER')} label="Ledger" />
            <TabButton active={activeTab === 'INVENTORY'} onClick={() => setActiveTab('INVENTORY')} label="Inventory" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Sync: Nominal</span>
          </div>
          <button onClick={fetchOrders} className={`p-2 text-slate-400 hover:text-indigo-600 transition-colors ${isLoading ? 'animate-spin' : ''}`}>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth={2} /></svg>
          </button>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-8">
        
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard label="New Orders (24h)" value={stats.newOrdersToday.toString()} sub="Velocity Tracking" icon="📥" color="indigo" />
              <KpiCard label="Total Vol (Gross)" value={`$${stats.totalVolumeUSD.toLocaleString()}`} sub="Settled Settlement" icon="📊" />
              <KpiCard label="Active Sessions" value={stats.activeOrders.toString()} sub="Pending Completion" icon="🔄" />
              <KpiCard label="Success Rate" value={`${stats.successRate.toFixed(1)}%`} sub="Platform Integrity" icon="⚡" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Lifecycle Events</h3>
                  <button onClick={() => setActiveTab('LEDGER')} className="text-[10px] font-bold text-indigo-600 uppercase hover:underline">Full Ledger</button>
                </div>
                <div className="space-y-4">
                  {orders.slice(0, 6).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={() => { setSelectedOrder(order); }}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[10px] font-black shadow-sm border border-slate-100">{order.fromSymbol.substring(0,2)}</div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{order.fromAmount} {order.fromSymbol} <span className="text-slate-300 mx-1">→</span> {order.toAmount} {order.toSymbol}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{order.id} • {new Date(order.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusClasses(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Network Distribution</h3>
                <div className="space-y-6">
                  {['BTC', 'ETH', 'SOL', 'USDT', 'BSC', 'TRX'].map(sym => {
                    const count = orders.filter(o => o.fromSymbol === sym).length;
                    const percent = orders.length > 0 ? (count / orders.length) * 100 : 0;
                    return (
                      <div key={sym} className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                          <span>{sym} Activity</span>
                          <span className="text-slate-900">{count} Events</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'LEDGER' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
              <div className="relative flex-grow">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2} /></svg>
                <input 
                  type="text" 
                  placeholder="Filter by ID, Address, or Asset Symbol..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Transaction ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Execution Route</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Settlement Target</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Overrides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length > 0 ? filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-indigo-50/40 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <td className="px-6 py-5">
                        <div className="text-xs font-bold text-slate-900">{order.id}</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">{new Date(order.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-bold text-slate-700">{order.fromAmount} {order.fromSymbol}</span>
                           <span className="text-slate-300 text-sm">→</span>
                           <span className="text-xs font-bold text-indigo-600">{order.toAmount} {order.toSymbol}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[10px] font-mono text-slate-500 truncate max-w-[200px] bg-slate-50 px-2 py-1 rounded border border-slate-100">{order.destinationAddress}</div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusClasses(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right" onClick={e => e.stopPropagation()}>
                        <select 
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value as SwapStatus)}
                        >
                          {Object.values(SwapStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No order matches found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'INVENTORY' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Inventory KPI */}
            <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row justify-between items-center shadow-xl shadow-indigo-600/20">
              <div className="mb-6 md:mb-0 text-center md:text-left">
                <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-80">Expected Inbound Liquidity</span>
                <div className="text-4xl font-black mt-2 tracking-tight">${stats.pendingValueUSD.toLocaleString()} <span className="text-lg opacity-60 font-bold uppercase tracking-widest ml-2">Total Expected</span></div>
              </div>
              <div className="flex gap-4">
                <div className="bg-white/10 px-6 py-4 rounded-3xl backdrop-blur-md border border-white/10">
                   <div className="text-[9px] font-black uppercase tracking-widest opacity-70">Awaiting Deposit</div>
                   <div className="text-xl font-black">{orders.filter(o => o.status === SwapStatus.AWAITING_DEPOSIT).length} Swaps</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {orders.filter(o => o.status === SwapStatus.AWAITING_DEPOSIT).map(o => (
                 <div key={o.id} className="bg-white border border-slate-200 rounded-[2rem] p-7 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded w-fit mb-2">HOT ADDRESS ACTIVE</span>
                        <div className="text-xl font-black text-slate-900">{o.fromAmount} {o.fromSymbol}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Expected Inbound</div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-lg border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
                        {o.fromSymbol === 'BTC' ? '₿' : 'Ξ'}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Address</span>
                           <span className="text-[9px] font-black text-indigo-500 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{getCoinNetwork(o.fromSymbol)} Network</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-700 break-all select-all leading-relaxed">
                          {o.depositAddress}
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                         <button 
                           onClick={() => updateStatus(o.id, SwapStatus.CONFIRMING)} 
                           className="flex-1 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10"
                         >
                           Force Confirm
                         </button>
                         <button className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth={2} /></svg>
                         </button>
                      </div>
                    </div>
                 </div>
               ))}
               {orders.filter(o => o.status === SwapStatus.AWAITING_DEPOSIT).length === 0 && (
                 <div className="col-span-full py-32 text-center bg-white border border-dashed border-slate-200 rounded-[3rem]">
                   <div className="text-5xl mb-6 grayscale opacity-40">❄️</div>
                   <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">No Active Deposit Listeners</h3>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* Detail Slide-over */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedOrder(null)}>
           <div className="w-full max-w-xl bg-white h-full shadow-2xl p-12 flex flex-col animate-in slide-in-from-right duration-500" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Execution Brief</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Transaction Instance: {selectedOrder.id}</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="p-3 text-slate-300 hover:text-slate-900 transition-all bg-slate-50 rounded-2xl hover:bg-slate-100">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5} /></svg>
                 </button>
              </div>

              <div className="flex-grow space-y-10 overflow-y-auto pr-4 custom-scrollbar">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inbound Payload</span>
                       <div className="text-xl font-black text-slate-900 mt-2">{selectedOrder.fromAmount} {selectedOrder.fromSymbol}</div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payout Asset</span>
                       <div className="text-xl font-black text-indigo-600 mt-2">{selectedOrder.toAmount} {selectedOrder.toSymbol}</div>
                    </div>
                 </div>

                 <div className="space-y-5">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-3">Security Verification Logs</h4>
                    <div className="space-y-5">
                       {selectedOrder.logs?.map((log: any, i: number) => (
                         <div key={i} className="flex gap-5">
                            <span className="text-[10px] font-mono text-slate-300 mt-1 shrink-0">{new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}</span>
                            <div className="flex flex-col gap-1">
                               <p className="text-xs font-bold text-slate-700 leading-tight">{log.message}</p>
                               <span className={`text-[9px] font-black uppercase tracking-widest ${log.type === 'SUCCESS' ? 'text-green-500' : 'text-slate-400'}`}>{log.type}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-6 pt-10 border-t border-slate-100">
                    <AddressField label={`Inbound ${selectedOrder.fromSymbol} (${getCoinNetwork(selectedOrder.fromSymbol)}) Deposit Address`} value={selectedOrder.depositAddress} />
                    <AddressField label={`Recipient ${selectedOrder.toSymbol} (${getCoinNetwork(selectedOrder.toSymbol)}) Settlement Address`} value={selectedOrder.destinationAddress} />
                 </div>
              </div>

              <div className="pt-10 mt-auto flex gap-4 border-t border-slate-100">
                 <button onClick={() => updateStatus(selectedOrder.id, SwapStatus.COMPLETED)} className="flex-1 py-5 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20">Finalize Settlement</button>
                 <button onClick={() => updateStatus(selectedOrder.id, SwapStatus.EXPIRED)} className="px-8 py-5 bg-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-200 transition-all">Invalidate</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

const TabButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${active ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600 border border-transparent'}`}
  >
    {label}
  </button>
);

const KpiCard = ({ label, value, sub, icon, color = "white" }: { label: string, value: string, sub: string, icon: string, color?: string }) => (
  <div className={`bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 w-32 h-32 ${color === 'indigo' ? 'bg-indigo-500/5' : 'bg-slate-500/5'} blur-3xl -z-10 group-hover:scale-150 transition-transform duration-700`}></div>
    <div className="flex justify-between items-start mb-6">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
      <span className="text-xl bg-slate-50 p-2 rounded-xl border border-slate-100">{icon}</span>
    </div>
    <div className={`text-3xl font-black ${color === 'indigo' ? 'text-indigo-600' : 'text-slate-900'} tracking-tighter`}>{value}</div>
    <div className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{sub}</div>
  </div>
);

const AddressField = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-2">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl font-mono text-[10px] text-slate-600 break-all select-all leading-relaxed hover:border-indigo-300 transition-colors">
      {value}
    </div>
  </div>
);

const getStatusClasses = (status: SwapStatus) => {
  switch(status) {
    case SwapStatus.COMPLETED: return 'bg-green-50 text-green-600 border-green-200';
    case SwapStatus.AWAITING_DEPOSIT: return 'bg-slate-100 text-slate-500 border-slate-200';
    case SwapStatus.EXPIRED: return 'bg-red-50 text-red-600 border-red-200';
    case SwapStatus.SENDING:
    case SwapStatus.EXCHANGING:
    case SwapStatus.CONFIRMING: return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    default: return 'bg-slate-50 text-slate-500 border-slate-200';
  }
};
