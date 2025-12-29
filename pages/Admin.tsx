
import React, { useState, useEffect, useMemo } from 'react';
import { SwapStatus } from '../types';
import { SUPPORTED_COINS } from '../constants';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

export default function Admin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'WALLETS'>('LEDGER');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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
    // Force light theme body background for this page specifically
    document.body.style.backgroundColor = '#F8FAFC';
    return () => {
      clearInterval(interval);
      document.body.style.backgroundColor = '';
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.destinationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.fromSymbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

  const updateStatus = async (id: string, newStatus: SwapStatus) => {
    try {
      await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchAllOrders();
    } catch (err) {
      alert("Status override rejected.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-0 m-0">
      {/* Sidebar-style Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
              </svg>
            </div>
            <div className="leading-none">
              <h1 className="text-base font-bold text-slate-900">OMS Control Center</h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Order Management System v5.0</p>
            </div>
          </div>
          
          <nav className="flex ml-10">
            <button 
              onClick={() => setActiveTab('LEDGER')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'LEDGER' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Transaction Ledger
            </button>
            <button 
              onClick={() => setActiveTab('WALLETS')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'WALLETS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Address Monitoring
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-100 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-[11px] font-bold text-slate-600 uppercase">Nodes Sync'd</span>
          </div>
          <button onClick={fetchAllOrders} className={`p-2 text-slate-400 hover:text-blue-600 transition-colors ${isLoading ? 'animate-spin' : ''}`}>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth={2} /></svg>
          </button>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto p-8">
        
        {activeTab === 'LEDGER' ? (
          <div className="space-y-6">
            {/* Control Strip */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 items-center">
              <div className="relative flex-grow">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2} /></svg>
                <input 
                  type="text" 
                  placeholder="Filter by Order ID, Symbol or Address..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase whitespace-nowrap px-4 border-l border-slate-200">
                Found {filteredOrders.length} results
              </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Order Reference</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Exchange Pair</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Settlement Target</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Protocol Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(order => (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        <div className="text-sm font-bold text-slate-900">{order.id}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{new Date(order.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-slate-700">{order.fromAmount} {order.fromSymbol}</span>
                           <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth={2} /></svg>
                           <span className="text-xs font-bold text-blue-600">{order.toAmount} {order.toSymbol}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[11px] font-mono text-slate-500 truncate max-w-[180px]" title={order.destinationAddress}>
                          {order.destinationAddress}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${getStatusClasses(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <select 
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value as SwapStatus)}
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          {Object.values(SwapStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                   <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Generated Protocol Addresses</h3>
                   <div className="space-y-4">
                      {orders.slice(0, 15).map(o => (
                        <div key={o.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                           <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                {o.fromSymbol.substring(0,2)}
                              </div>
                              <div>
                                <div className="text-[11px] font-mono text-slate-800 break-all">{o.depositAddress}</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Linked to Order ID: {o.id}</div>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => window.open(`https://blockstream.info/address/${o.depositAddress}`, '_blank')} className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Explorer</button>
                           </div>
                        </div>
                      ))}
                      {orders.length === 0 && <div className="text-center py-20 text-slate-400 uppercase text-xs font-bold italic tracking-widest">No active deposit addresses</div>}
                   </div>
                </div>
             </div>
             
             <div className="space-y-6">
                <div className="bg-blue-600 text-white rounded-xl p-6 shadow-lg">
                   <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 opacity-80">OMS Intelligence</h3>
                   <div className="space-y-6">
                      <div>
                        <div className="text-[10px] font-black uppercase mb-1">Total Network Flow</div>
                        <div className="text-3xl font-black">${orders.reduce((acc, curr) => acc + (parseFloat(curr.fromAmount) * 100), 0).toLocaleString()}</div>
                      </div>
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                           <span>Simulated Liquidity</span>
                           <span>98.2%</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full">
                           <div className="h-full bg-white w-[98%]"></div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Side Detail View */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedOrder(null)}>
           <div className="w-full max-w-xl bg-white h-full shadow-2xl p-10 flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Order Profile: {selectedOrder.id}</h2>
                 <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-slate-900">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
                 </button>
              </div>

              <div className="flex-grow space-y-8 overflow-y-auto pr-4 custom-scrollbar">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Input Volume</span>
                       <p className="text-lg font-bold text-slate-900">{selectedOrder.fromAmount} {selectedOrder.fromSymbol}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Output Volume</span>
                       <p className="text-lg font-bold text-blue-600">{selectedOrder.toAmount} {selectedOrder.toSymbol}</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-2">Execution Logs</h4>
                    <div className="space-y-3">
                       {selectedOrder.logs?.map((log: any, i: number) => (
                         <div key={i} className="flex gap-4">
                            <span className="text-[10px] font-mono text-slate-400 mt-1">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <div>
                               <p className="text-xs font-medium text-slate-700">{log.message}</p>
                               <span className="text-[9px] font-bold text-slate-400 uppercase">{log.type}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4 pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase">Settlement Details</h4>
                    <DetailRow label="Deposit Address" value={selectedOrder.depositAddress} />
                    <DetailRow label="Target Payout" value={selectedOrder.destinationAddress} />
                    {selectedOrder.txHashOut && <DetailRow label="Settlement Hash" value={selectedOrder.txHashOut} />}
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex gap-4">
                 <button 
                  onClick={() => updateStatus(selectedOrder.id, SwapStatus.COMPLETED)} 
                  className="flex-1 py-3 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all shadow-md"
                 >
                   Force Settle
                 </button>
                 <button 
                  onClick={() => updateStatus(selectedOrder.id, SwapStatus.EXPIRED)} 
                  className="px-6 py-3 bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all"
                 >
                   Expire
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-1">
    <span className="text-[9px] font-bold text-slate-400 uppercase">{label}</span>
    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg font-mono text-[11px] text-slate-800 break-all select-all">
      {value}
    </div>
  </div>
);

const getStatusClasses = (status: SwapStatus) => {
  switch(status) {
    case SwapStatus.COMPLETED: return 'bg-green-100 text-green-700';
    case SwapStatus.AWAITING_DEPOSIT: return 'bg-slate-100 text-slate-600';
    case SwapStatus.EXPIRED: return 'bg-red-100 text-red-700';
    default: return 'bg-blue-100 text-blue-700';
  }
};
