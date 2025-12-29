
import React, { useState, useEffect, useMemo } from 'react';
import { SwapStatus } from '../types';
import { SUPPORTED_COINS } from '../constants';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

interface OperationalStats {
  totalOrders: number;
  activeVolume: number;
  successRate: number;
  liquidity: Record<string, number>;
}

export default function Admin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'LIQUIDITY'>('LEDGER');

  const fetchAllOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders`);
      const data = await res.json();
      setOrders(data.sort((a: any, b: any) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error("OMS Sync Failure:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
    const interval = setInterval(fetchAllOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo<OperationalStats>(() => {
    const vol = orders.reduce((acc, curr) => acc + parseFloat(curr.fromAmount || 0), 0);
    const completed = orders.filter(o => o.status === SwapStatus.COMPLETED).length;
    const liq: Record<string, number> = {};
    orders.forEach(o => {
      liq[o.fromSymbol] = (liq[o.fromSymbol] || 0) + parseFloat(o.fromAmount);
    });
    return {
      totalOrders: orders.length,
      activeVolume: vol,
      successRate: orders.length > 0 ? (completed / orders.length) * 100 : 0,
      liquidity: liq
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           o.destinationAddress.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const updateStatus = async (id: string, newStatus: SwapStatus) => {
    try {
      await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchAllOrders();
    } catch (err) {
      alert("Status override rejected by node.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-300 font-sans selection:bg-blue-500/30">
      {/* Top Navigation Bar */}
      <nav className="border-b border-white/5 bg-[#0F1219] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white uppercase tracking-wider leading-none">Nexus Admin</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">OMS Engine v4.2</span>
            </div>
          </div>
          
          <div className="h-6 w-px bg-white/5 mx-2"></div>
          
          <div className="flex gap-1">
            <button 
              onClick={() => setActiveTab('LEDGER')}
              className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'LEDGER' ? 'bg-white/5 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Order Ledger
            </button>
            <button 
              onClick={() => setActiveTab('LIQUIDITY')}
              className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'LIQUIDITY' ? 'bg-white/5 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Liquidity Map
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-emerald-500 uppercase">System Nominal</span>
          </div>
          <button onClick={fetchAllOrders} className="p-2 text-slate-500 hover:text-white transition-colors">
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricBox label="Total Orders" value={stats.totalOrders.toString()} sub="Lifetime throughput" color="blue" />
          <MetricBox label="Active Volume" value={`${stats.activeVolume.toFixed(2)} Units`} sub="Aggregate turnover" color="emerald" />
          <MetricBox label="Execution Success" value={`${stats.successRate.toFixed(1)}%`} sub="Confirmed settlement" color="blue" />
          <MetricBox label="Avg. Latency" value="142ms" sub="Node heartbeat" color="slate" />
        </div>

        {activeTab === 'LEDGER' ? (
          <div className="space-y-6">
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#161B22] p-4 rounded-xl border border-white/5">
              <div className="relative flex-grow max-w-xl w-full">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search by ID or Address..." 
                  className="w-full bg-[#0D1117] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs font-medium focus:border-blue-500 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filter:</span>
                <select 
                  className="bg-[#0D1117] border border-white/10 rounded-lg py-2 px-4 text-xs font-black uppercase outline-none focus:border-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  {Object.values(SwapStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            {/* Main Table */}
            <div className="bg-[#0D1117] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#161B22]/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                    <th className="px-6 py-4">Execution ID</th>
                    <th className="px-6 py-4">Asset Route</th>
                    <th className="px-6 py-4">Settlement Address</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-20 text-center uppercase text-[10px] font-bold text-slate-600">No matching orders found in memory</td></tr>
                  ) : filteredOrders.map(order => (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-white/[0.02] transition-colors cursor-pointer group ${selectedOrder?.id === order.id ? 'bg-blue-600/[0.03]' : ''}`}
                    >
                      <td className="px-6 py-5">
                        <div className="text-xs font-black text-white">{order.id}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">{new Date(order.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-black text-white">{order.fromSymbol}</span>
                           <svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeWidth={3} /></svg>
                           <span className="text-xs font-black text-blue-500">{order.toSymbol}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 mt-1">{order.fromAmount} → {order.toAmount}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[10px] text-slate-300 font-mono truncate max-w-[200px]" title={order.destinationAddress}>
                          {order.destinationAddress}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                           <select 
                            onChange={(e) => updateStatus(order.id, e.target.value as SwapStatus)}
                            value={order.status}
                            className="bg-[#161B22] border border-white/10 rounded-md px-2 py-1.5 text-[9px] font-black uppercase text-slate-300 outline-none focus:border-blue-500"
                           >
                             {Object.values(SwapStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                           </select>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Liquidity Map */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[#0D1117] border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Volume per Asset</h3>
                <div className="space-y-4">
                  {SUPPORTED_COINS.map(coin => {
                    const vol = stats.liquidity[coin.symbol] || 0;
                    const percentage = stats.activeVolume > 0 ? (vol / stats.activeVolume) * 100 : 0;
                    return (
                      <div key={coin.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <div className="flex items-center gap-2">
                            <img src={coin.logo} className="w-4 h-4 rounded-full grayscale opacity-50" alt="" />
                            <span className="text-slate-300">{coin.name}</span>
                          </div>
                          <span className="text-slate-500">{vol.toFixed(4)} <span className="opacity-40">{coin.symbol}</span></span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 transition-all duration-1000" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
               <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-6">
                 <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest mb-4">Node Health</h3>
                 <div className="space-y-4">
                   <HealthMetric label="Mempool Scanner" status="ACTIVE" />
                   <HealthMetric label="Aggregator Sync" status="STABLE" />
                   <HealthMetric label="Confirmation Loop" status="ACTIVE" />
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Side Panel Overlay */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="absolute top-0 right-0 h-full w-full max-w-xl bg-[#0F1219] border-l border-white/10 shadow-2xl p-10 animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex items-center justify-between mb-8">
               <div>
                 <h2 className="text-xl font-black text-white uppercase tracking-tighter">Order Detail</h2>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Transaction Instance: {selectedOrder.id}</p>
               </div>
               <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>

             <div className="space-y-10">
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-1">
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Inbound</span>
                     <div className="text-lg font-black text-white">{selectedOrder.fromAmount} {selectedOrder.fromSymbol}</div>
                   </div>
                   <div className="space-y-1">
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Outbound</span>
                     <div className="text-lg font-black text-blue-500">{selectedOrder.toAmount} {selectedOrder.toSymbol}</div>
                   </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-2 border-b border-white/5">Execution Log</h4>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                    {selectedOrder.logs?.map((log: any, i: number) => (
                      <div key={i} className="flex gap-4 group">
                        <span className="text-slate-600 shrink-0 font-mono text-[10px] mt-1">{new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}</span>
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-bold ${log.type === 'SUCCESS' ? 'text-emerald-500' : 'text-slate-400'}`}>{log.message}</span>
                          <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-0.5">{log.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-2">Network Addresses</h4>
                  <div className="space-y-4">
                    <AddressRow label="Destination Address" value={selectedOrder.destinationAddress} />
                    <AddressRow label="Protocol Deposit" value={selectedOrder.depositAddress} />
                    {selectedOrder.txHashOut && <AddressRow label="Payout Tx Hash" value={selectedOrder.txHashOut} />}
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MetricBox = ({ label, value, sub, color }: { label: string, value: string, sub: string, color: string }) => (
  <div className="bg-[#0D1117] border border-white/5 p-6 rounded-2xl shadow-sm hover:border-white/10 transition-colors">
    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</div>
    <div className={`text-2xl font-black ${color === 'blue' ? 'text-blue-500' : color === 'emerald' ? 'text-emerald-500' : 'text-white'} tracking-tight`}>{value}</div>
    <div className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-tight">{sub}</div>
  </div>
);

const HealthMetric = ({ label, status }: { label: string, status: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{status}</span>
  </div>
);

const AddressRow = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-1.5">
    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</div>
    <div className="bg-[#161B22] p-3 rounded-lg border border-white/5 font-mono text-[10px] text-slate-300 break-all select-all hover:border-blue-500/30 transition-colors">
      {value}
    </div>
  </div>
);

const getStatusStyles = (status: SwapStatus) => {
  switch(status) {
    case SwapStatus.COMPLETED: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case SwapStatus.AWAITING_DEPOSIT: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case SwapStatus.EXPIRED: return 'bg-red-500/10 text-red-500 border-red-500/20';
    case SwapStatus.SENDING:
    case SwapStatus.EXCHANGING:
    case SwapStatus.CONFIRMING: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  }
};
