
import React, { useState, useEffect } from 'react';
import { SwapStatus } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

export default function Admin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalOrders: 0, activeVolume: 0 });

  const fetchAllOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders`);
      const data = await res.json();
      setOrders(data.sort((a: any, b: any) => b.createdAt - a.createdAt));
      
      const volume = data.reduce((acc: number, curr: any) => acc + parseFloat(curr.fromAmount || 0), 0);
      setStats({ totalOrders: data.length, activeVolume: volume });
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

  const updateStatus = async (id: string, newStatus: SwapStatus) => {
    try {
      await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchAllOrders();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-300 p-4 sm:p-8 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* OMS Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]"></span>
              Nexus Control Center
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">OMS Engine v4.1.0 // Global Order Management System</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-card border border-border px-6 py-3 rounded-xl">
              <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Total Throughput</div>
              <div className="text-lg font-black text-white">{stats.totalOrders} <span className="text-[10px] text-blue-500">Orders</span></div>
            </div>
            <div className="bg-card border border-border px-6 py-3 rounded-xl">
              <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Aggregate Volume</div>
              <div className="text-lg font-black text-emerald-500">{stats.activeVolume.toFixed(2)} <span className="text-[10px] opacity-50">Units</span></div>
            </div>
          </div>
        </div>

        {/* Global Orders Table */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-6 py-4">Session ID</th>
                  <th className="px-6 py-4">Asset Pair</th>
                  <th className="px-6 py-4">Execution Address</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center animate-pulse uppercase text-[10px] font-bold">Synchronizing Ledger...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center uppercase text-[10px] font-bold text-slate-600">No Orders in Active Memory</td></tr>
                ) : orders.map(order => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-bold text-blue-500 text-xs">{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-white">{order.fromSymbol} → {order.toSymbol}</div>
                      <div className="text-[9px] text-slate-500">{order.fromAmount} In / {order.toAmount} Out</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[9px] text-slate-400 font-mono truncate max-w-[150px]" title={order.destinationAddress}>
                        DEST: {order.destinationAddress}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono truncate max-w-[150px]" title={order.depositAddress}>
                        DEPO: {order.depositAddress}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                        order.status === SwapStatus.COMPLETED ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        order.status === SwapStatus.AWAITING_DEPOSIT ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                       <select 
                        onChange={(e) => updateStatus(order.id, e.target.value as SwapStatus)}
                        value={order.status}
                        className="bg-muted border border-white/10 rounded px-2 py-1 text-[9px] font-black uppercase text-slate-300 outline-none focus:border-blue-500"
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

        {/* OMS Footer Diagnostics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-40 hover:opacity-100 transition-opacity">
           <div className="bg-muted/30 p-4 rounded-xl border border-white/5">
             <div className="text-[8px] font-black uppercase mb-1">Node Synchronization</div>
             <div className="text-[10px] font-bold text-emerald-500">STABLE // OFFSET 0ms</div>
           </div>
           <div className="bg-muted/30 p-4 rounded-xl border border-white/5">
             <div className="text-[8px] font-black uppercase mb-1">Oracle Health</div>
             <div className="text-[10px] font-bold text-emerald-500">COINGECKO_LATEST // SYNC_60S</div>
           </div>
           <div className="bg-muted/30 p-4 rounded-xl border border-white/5">
             <div className="text-[8px] font-black uppercase mb-1">Mempool Observer</div>
             <div className="text-[10px] font-bold text-blue-500">SCANNING_ACTIVE</div>
           </div>
        </div>

      </div>
    </div>
  );
}
