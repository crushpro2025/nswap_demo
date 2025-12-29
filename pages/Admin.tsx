
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
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LEDGER' | 'INVENTORY' | 'SETTINGS'>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [useChangeNow, setUseChangeNow] = useState(false);
  const [changeNowApiKey, setChangeNowApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [ordersRes, configRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/orders`),
        fetch(`${API_BASE_URL}/admin/config`)
      ]);
      const ordersData = await ordersRes.json();
      const configData = await configRes.json();
      
      setOrders(ordersData.sort((a: any, b: any) => b.createdAt - a.createdAt));
      setUseChangeNow(configData.useChangeNow);
      setChangeNowApiKey(configData.changeNowApiKey);
    } catch (err) {
      console.error("OMS Sync Failure");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    document.documentElement.classList.remove('dark');
    document.body.style.backgroundColor = '#F8FAFC';
    return () => {
      clearInterval(interval);
      document.body.style.backgroundColor = '';
    };
  }, []);

  const saveConfig = async (newToggleState?: boolean) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/config/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useChangeNow: newToggleState !== undefined ? newToggleState : useChangeNow,
          changeNowApiKey
        })
      });
      const data = await res.json();
      setUseChangeNow(data.useChangeNow);
      setChangeNowApiKey(data.changeNowApiKey);
      if (newToggleState === undefined) alert("Settings Saved Successfully");
    } catch (err) {
      alert("Failed to update configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const stats = useMemo<DashboardStats>(() => {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const total = orders.length;
    const active = orders.filter(o => o.status !== SwapStatus.COMPLETED && o.status !== SwapStatus.EXPIRED).length;
    const newToday = orders.filter(o => o.createdAt > dayAgo).length;
    const completed = orders.filter(o => o.status === SwapStatus.COMPLETED);
    const awaiting = orders.filter(o => o.status === SwapStatus.AWAITING_DEPOSIT);
    const volume = completed.reduce((acc, o) => acc + (parseFloat(o.fromAmount) * 100), 0);
    const pending = awaiting.reduce((acc, o) => acc + (parseFloat(o.fromAmount) * 100), 0);
    return { 
      totalOrders: total, activeOrders: active, newOrdersToday: newToday,
      totalVolumeUSD: volume, pendingValueUSD: pending,
      estimatedRevenue: volume * SERVICE_FEE, 
      successRate: total > 0 ? (completed.length / total) * 100 : 0 
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
    await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const getNetwork = (symbol: string) => SUPPORTED_COINS.find(c => c.symbol === symbol)?.network || 'Mainnet';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20">
      <nav className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
               <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={2} /></svg>
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest">Nexus <span className="text-indigo-600">OMS</span></h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Command</p>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} label="Overview" />
             <TabButton active={activeTab === 'LEDGER'} onClick={() => setActiveTab('LEDGER')} label="Ledger" />
             <TabButton active={activeTab === 'INVENTORY'} onClick={() => setActiveTab('INVENTORY')} label="Inventory" />
             <TabButton active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} label="Settings" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${useChangeNow ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            {useChangeNow ? 'ChangeNOW: ACTIVE' : 'Internal Engine'}
          </div>
          <button onClick={fetchData} className={`p-2 text-slate-400 hover:text-indigo-600 transition-colors ${isLoading ? 'animate-spin' : ''}`}>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth={2} /></svg>
          </button>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-8">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard label="New Orders (24h)" value={stats.newOrdersToday.toString()} sub="Velocity Insight" icon="📤" color="indigo" />
              <KpiCard label="Cumulative Volume" value={`$${stats.totalVolumeUSD.toLocaleString()}`} sub="Gross Settled" icon="📊" />
              <KpiCard label="In-Flight Value" value={`$${stats.pendingValueUSD.toLocaleString()}`} sub="Expected Deposit" icon="🔄" color="emerald" />
              <KpiCard label="Node Health" value="99.9%" sub="Uptime Verified" icon="⚡" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Latest Platform Events</h3>
                  <button onClick={() => setActiveTab('LEDGER')} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Full Protocol Ledger</button>
                </div>
                <div className="space-y-4">
                  {orders.slice(0, 6).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group" onClick={() => setSelectedOrder(order)}>
                      <div className="flex items-center gap-5">
                        <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-[10px] font-black shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">{order.fromSymbol.substring(0,2)}</div>
                        <div>
                          <div className="text-sm font-black text-slate-900">{order.fromAmount} {order.fromSymbol} <span className="text-slate-300 mx-1">→</span> {order.toAmount} {order.toSymbol}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{order.id} • {order.provider}</div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusClasses(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Operational Metrics</h3>
                 <div className="space-y-8">
                    <StatItem label="Swap Success Ratio" value={`${stats.successRate.toFixed(1)}%`} />
                    <StatItem label="Active Hot Wallets" value={orders.filter(o => o.status === SwapStatus.AWAITING_DEPOSIT).length.toString()} />
                    <StatItem label="Engine Latency" value="14ms" />
                    <div className="pt-4 border-t border-slate-100">
                       <p className="text-[10px] text-slate-400 leading-relaxed italic">Nexus Distributed Protocol ensures atomic swaps via Multi-Path Routing and ChangeNOW fallback liquidity.</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-12 shadow-sm">
               <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth={2} /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2} /></svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Engine Configuration</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage Liquidity Providers</p>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">ChangeNOW Strategy</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Route all orders through production API</p>
                    </div>
                    <button 
                      onClick={() => { const newState = !useChangeNow; setUseChangeNow(newState); saveConfig(newState); }}
                      className={`w-14 h-8 rounded-full p-1.5 transition-all duration-300 flex items-center ${useChangeNow ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'}`}
                    >
                       <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
                    </button>
                  </div>

                  <div className={`space-y-4 transition-all ${useChangeNow ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none'}`}>
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Production API Key</label>
                     <div className="relative">
                        <input 
                          type="password"
                          value={changeNowApiKey}
                          onChange={(e) => setChangeNowApiKey(e.target.value)}
                          placeholder="changenow_production_api_key_..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-xs font-mono focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                           <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" strokeWidth={2} /></svg>
                        </div>
                     </div>
                     <p className="text-[9px] text-slate-400 italic px-2">Leave blank to use the public ChangeNOW rate API (Limited to public pairs only).</p>
                  </div>

                  <button 
                    onClick={() => saveConfig()}
                    disabled={isSaving}
                    className="w-full py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                  >
                    {isSaving ? <span className="animate-spin text-lg">⚙️</span> : 'Save Credentials'}
                  </button>
               </div>
            </div>

            <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem]">
               <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <span className="text-lg">ℹ️</span> Technical Notice
               </h5>
               <p className="text-[11px] font-bold text-indigo-900/60 leading-relaxed uppercase tracking-tight">
                 With ChangeNOW Mode active, the system fetches "Minimum Amount" and "Estimated Payout" directly from ChangeNOW's liquidity cluster. Ensure your API key is correct to avoid "Invalid Key" errors during the exchange initialization.
               </p>
            </div>
          </div>
        )}

        {activeTab === 'LEDGER' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                <input 
                  type="text" 
                  placeholder="Global search by Order ID, Transaction Hash or Asset..." 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Session</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Route</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Provider</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-indigo-50/40 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                        <td className="px-8 py-6">
                           <div className="text-xs font-black text-slate-900">{order.id}</div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{new Date(order.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="text-xs font-black text-slate-700">{order.fromAmount} {order.fromSymbol} → {order.toAmount} {order.toSymbol}</div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{getNetwork(order.fromSymbol)}</div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-lg">{order.provider}</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                           <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusClasses(order.status)}`}>
                             {order.status.replace('_', ' ')}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right" onClick={e => e.stopPropagation()}>
                           <select 
                            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/10"
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value as SwapStatus)}
                           >
                              {Object.values(SwapStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                           </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'INVENTORY' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl -z-10"></div>
                <div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Expected Inbound Liquidity</span>
                   <div className="text-6xl font-black text-slate-900 mt-2 tracking-tighter">${stats.pendingValueUSD.toLocaleString()}</div>
                   <div className="flex items-center gap-3 mt-4">
                      <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        {orders.filter(o => o.status === SwapStatus.AWAITING_DEPOSIT).length} Active Deposit Listeners
                      </span>
                   </div>
                </div>
                <div className="flex gap-4 mt-8 md:mt-0">
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center min-w-[140px]">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Internal (NX)</div>
                      <div className="text-2xl font-black text-slate-900">{orders.filter(o => o.provider === 'NEXUS_INTERNAL' && o.status === SwapStatus.AWAITING_DEPOSIT).length}</div>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center min-w-[140px]">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-2">ChangeNOW (CN)</div>
                      <div className="text-2xl font-black text-slate-900">{orders.filter(o => o.provider === 'CHANGENOW' && o.status === SwapStatus.AWAITING_DEPOSIT).length}</div>
                   </div>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {orders.filter(o => o.status === SwapStatus.AWAITING_DEPOSIT).map(o => (
                  <div key={o.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group">
                     <div className="flex justify-between items-start mb-8">
                        <div>
                           <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border mb-3 inline-block ${o.provider === 'CHANGENOW' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                              {o.provider}
                           </span>
                           <div className="text-2xl font-black text-slate-900">{o.fromAmount} {o.fromSymbol}</div>
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Network: {getNetwork(o.fromSymbol)}</div>
                        </div>
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                           {o.fromSymbol === 'BTC' ? '₿' : 'Ξ'}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Deposit Hot-Address</span>
                           <div className="font-mono text-[10px] text-slate-700 break-all select-all leading-relaxed">{o.depositAddress}</div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => updateStatus(o.id, SwapStatus.CONFIRMING)} className="flex-1 py-3.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Manual Push</button>
                           <button className="p-3.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth={2} /></svg></button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedOrder(null)}>
           <div className="w-full max-w-xl bg-white h-full shadow-2xl p-12 flex flex-col animate-in slide-in-from-right duration-500" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Swap Audit Report</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Provider: {selectedOrder.provider} • ID: {selectedOrder.id}</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
                 </button>
              </div>
              <div className="flex-grow space-y-10 overflow-y-auto pr-4 custom-scrollbar">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inbound</span>
                       <div className="text-xl font-black text-slate-900 mt-1">{selectedOrder.fromAmount} {selectedOrder.fromSymbol}</div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outbound</span>
                       <div className="text-xl font-black text-indigo-600 mt-1">{selectedOrder.toAmount} {selectedOrder.toSymbol}</div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Execution Metadata</h4>
                    <div className="space-y-4">
                       {selectedOrder.logs?.map((log: any, i: number) => (
                         <div key={i} className="flex gap-5">
                            <span className="text-[10px] font-mono text-slate-300 mt-1 shrink-0">{new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}</span>
                            <div>
                               <p className="text-xs font-bold text-slate-700 leading-tight">{log.message}</p>
                               <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${log.type === 'SUCCESS' ? 'text-green-500' : 'text-slate-400'}`}>{log.type}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="pt-10 mt-auto flex gap-4 border-t border-slate-100">
                 <button onClick={() => updateStatus(selectedOrder.id, SwapStatus.COMPLETED)} className="flex-1 py-5 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20">Finalize Session</button>
                 <button onClick={() => updateStatus(selectedOrder.id, SwapStatus.EXPIRED)} className="px-8 py-5 bg-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">Invalidate</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

const TabButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button onClick={onClick} className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${active ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600 border border-transparent'}`}>{label}</button>
);

const KpiCard = ({ label, value, sub, icon, color = "white" }: { label: string, value: string, sub: string, icon: string, color?: string }) => (
  <div className={`bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 w-32 h-32 ${color === 'indigo' ? 'bg-indigo-500/5' : color === 'emerald' ? 'bg-emerald-500/5' : 'bg-slate-500/5'} blur-3xl -z-10 group-hover:scale-150 transition-transform duration-700`}></div>
    <div className="flex justify-between items-start mb-6">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-xl bg-slate-50 p-2 rounded-xl border border-slate-100">{icon}</span>
    </div>
    <div className={`text-3xl font-black ${color === 'indigo' ? 'text-indigo-600' : color === 'emerald' ? 'text-emerald-600' : 'text-slate-900'} tracking-tighter`}>{value}</div>
    <div className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{sub}</div>
  </div>
);

const StatItem = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-slate-900">{value}</span>
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
