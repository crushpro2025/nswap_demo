
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HistoryRecord } from '../types';

export default function History() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const stored = localStorage.getItem('nexus_swap_history');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear your local swap history?')) {
      localStorage.removeItem('nexus_swap_history');
      setHistory([]);
    }
  };

  const deleteEntry = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem('nexus_swap_history', JSON.stringify(updated));
    setHistory(updated);
  };

  const copyToClipboard = async (e: React.MouseEvent, text: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard');
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch (err: any) {
      console.warn("Copy to clipboard failed:", err.message);
      window.prompt("Manual copy required:", text);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10 sm:mb-12 text-center sm:text-left">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 uppercase tracking-tight">Order History</h1>
          <p className="text-slate-400 text-sm sm:text-base font-bold uppercase tracking-tight opacity-70">Locally stored swap sessions.</p>
        </div>
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="w-full sm:w-auto px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-black rounded-xl border border-red-500/20 transition-all uppercase tracking-widest"
          >
            Clear Ledger
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-[#0F1116] border border-white/5 rounded-[2.5rem] p-12 sm:p-20 text-center shadow-2xl">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mb-4 uppercase">No Sessions Found</h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm font-bold uppercase tracking-tight">Start your first high-integrity swap session today.</p>
          <Link to="/swap" className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all uppercase tracking-widest text-sm">
            Launch Engine
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => (
            <div key={record.id} className="relative group">
              <Link 
                to={`/status/${record.id}`}
                className="bg-[#0F1116] border border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] hover:border-blue-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 block shadow-xl"
              >
                <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
                  <div className="flex -space-x-2 sm:-space-x-3 shrink-0">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900 border-2 border-[#0F1116] flex items-center justify-center p-2 z-10 shadow-lg">
                      <img src={`https://cryptologos.cc/logos/${record.fromSymbol.toLowerCase()}-${record.fromSymbol.toLowerCase()}-logo.png`} alt="" className="w-full" onError={(e) => e.currentTarget.src = 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'} />
                    </div>
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900 border-2 border-[#0F1116] flex items-center justify-center p-2 shadow-lg">
                      <img src={`https://cryptologos.cc/logos/${record.toSymbol.toLowerCase()}-${record.toSymbol.toLowerCase()}-logo.png`} alt="" className="w-full" onError={(e) => e.currentTarget.src = 'https://cryptologos.cc/logos/ethereum-eth-logo.png'} />
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-base sm:text-lg font-black text-white mb-1 group-hover:text-blue-500 transition-colors uppercase tracking-tighter truncate">
                      {record.fromAmount} {record.fromSymbol} <span className="text-slate-600 font-normal">→</span> {record.toAmount} {record.toSymbol}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] sm:text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-60">
                      <span>ID: <button onClick={(e) => copyToClipboard(e, record.id)} className="hover:text-blue-400">{record.id.substring(0,6)}...</button></span>
                      <span className="hidden xs:inline">• {new Date(record.timestamp).toLocaleDateString()}</span>
                      <span className="hidden sm:inline">• {new Date(record.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                  <div className="text-left md:text-right">
                    <div className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-0.5 sm:mb-1">Protocol Status</div>
                    <div className="px-2 sm:px-3 py-1 bg-blue-500/5 text-blue-500 text-[9px] sm:text-[10px] font-black rounded-lg uppercase tracking-widest border border-blue-500/10 whitespace-nowrap">
                      {record.status.split('_').join(' ')}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => deleteEntry(e, record.id)}
                      className="p-2.5 sm:p-3 bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-xl transition-all"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-500 group-hover:text-blue-500 group-hover:bg-blue-600/10 transition-all hidden sm:flex">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
