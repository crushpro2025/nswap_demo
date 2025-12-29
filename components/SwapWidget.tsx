
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUPPORTED_COINS, SERVICE_FEE, NETWORK_FEE_ESTIMATES, ADDRESS_VALIDATORS } from '../constants';
import { Coin, RateType, SwapStatus, HistoryRecord } from '../types';
import { t } from '../i18n';

// Use environment variable for production, fallback to localhost for dev
// Note: In Vite, env variables must be prefixed with VITE_
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

const PrecisionDisplay = ({ value, isInput = false, onChange, colorClass = "text-foreground" }: { value: string, isInput?: boolean, onChange?: (val: string) => void, colorClass?: string }) => {
  if (isInput) {
    const inputSize = value.length > 12 ? 'text-xl' : value.length > 8 ? 'text-2xl' : 'text-4xl';
    return (
      <input 
        type="number"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`bg-transparent ${inputSize} font-black ${colorClass} outline-none w-full min-w-0 placeholder:text-muted-foreground/30 tabular-nums transition-all duration-300`}
        placeholder="0.0"
      />
    );
  }

  const [whole, decimals] = value.split('.');
  const primaryDecimals = decimals ? decimals.slice(0, 4) : '';
  const tailDecimals = decimals ? decimals.slice(4, 10) : ''; 
  const primaryPartLength = (whole || '0').length + (primaryDecimals.length > 0 ? primaryDecimals.length + 1 : 0);
  const baseSize = primaryPartLength > 12 ? 'text-xl' : primaryPartLength > 8 ? 'text-2xl' : 'text-4xl';

  return (
    <div 
      className={`flex items-baseline font-black tracking-tighter tabular-nums ${baseSize} transition-all duration-300 cursor-pointer hover:opacity-80 active:scale-[0.98]`}
      onClick={() => { navigator.clipboard.writeText(value); }}
      title="Click to copy exact amount"
    >
      <span className={colorClass}>{whole || '0'}</span>
      {decimals !== undefined && <span className={`${colorClass} opacity-80`}>.</span>}
      <span className={`${colorClass} opacity-80`}>{primaryDecimals}</span>
      {tailDecimals.length > 0 && (
        <span className="text-muted-foreground/40 font-mono text-[0.4em] ml-0.5 tracking-tight leading-none uppercase select-none">
          {tailDecimals}
        </span>
      )}
    </div>
  );
};

export const SwapWidget: React.FC = () => {
  const navigate = useNavigate();
  const [fromCoin, setFromCoin] = useState<Coin>(SUPPORTED_COINS[0]); 
  const [toCoin, setToCoin] = useState<Coin>(SUPPORTED_COINS[1]);   
  const [fromAmount, setFromAmount] = useState<string>(SUPPORTED_COINS[0].minAmount.toString());
  const [toAmount, setToAmount] = useState<string>('0');
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'ACTIVE' | 'OFFLINE' | 'CONNECTING'>('CONNECTING');
  const [lastError, setLastError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showPicker, setShowPicker] = useState<'from' | 'to' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const getLocalRate = useCallback((from: string, to: string) => {
    const basePrices: Record<string, number> = {
      'BTC': 68500, 'ETH': 3480, 'USDT': 1, 'SOL': 142, 'TRX': 0.12, 'XMR': 168, 'DOGE': 0.16, 'XRP': 0.62, 'BSC': 595, 'BNB': 595, 'ARB': 1.12, 'TON': 7.15
    };
    return (basePrices[from] || 1) / (basePrices[to] || 1);
  }, []);

  // Resilient Health Polling with Diagnostic Info
  useEffect(() => {
    let timerId: number;
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000); 
        
        const res = await fetch(`${API_BASE_URL}/health`, { 
          signal: controller.signal,
          mode: 'cors'
        });
        clearTimeout(timeout);

        if (!isMounted) return;

        if (res.ok) {
          setNetworkStatus('ACTIVE');
          setLastError(null);
          timerId = window.setTimeout(checkHealth, 30000);
        } else {
          setNetworkStatus('CONNECTING');
          setLastError(`HTTP ${res.status}: ${res.statusText}`);
          timerId = window.setTimeout(checkHealth, 4000);
        }
      } catch (e: any) {
        if (!isMounted) return;
        setNetworkStatus('CONNECTING');
        setLastError(e.message || "Network Error: Possible CORS or Cold Start");
        timerId = window.setTimeout(checkHealth, 4000);
      }
    };

    checkHealth();
    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, []);

  const updateQuote = useCallback(async () => {
    const amount = parseFloat(fromAmount);
    if (!amount || isNaN(amount)) { setToAmount('0'); return; }

    setIsQuoting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/quote?from=${fromCoin.symbol}&to=${toCoin.symbol}&amount=${fromAmount}`);
      const data = await res.json();
      
      if (data.estimatedAmount && !data.error) {
        const finalOutput = Math.max(0, parseFloat(data.estimatedAmount) - (parseFloat(data.estimatedAmount) * SERVICE_FEE));
        setToAmount(finalOutput.toFixed(toCoin.precision).replace(/\.?0+$/, ""));
      }
    } catch (err) {
      const localRate = getLocalRate(fromCoin.symbol, toCoin.symbol);
      const estimated = amount * localRate;
      const finalOutput = Math.max(0, estimated - (estimated * SERVICE_FEE));
      setToAmount(finalOutput.toFixed(toCoin.precision).replace(/\.?0+$/, ""));
    } finally {
      setIsQuoting(false);
    }
  }, [fromCoin.symbol, toCoin.symbol, fromAmount, toCoin.precision, getLocalRate]);

  useEffect(() => {
    const timer = setTimeout(updateQuote, 500);
    return () => clearTimeout(timer);
  }, [updateQuote]);

  useEffect(() => {
    const val = parseFloat(fromAmount);
    if (isNaN(val) || fromAmount === '') setAmountError(null);
    else if (val < fromCoin.minAmount) setAmountError(`${t('swap.min')} is ${fromCoin.minAmount} ${fromCoin.symbol}`);
    else if (val > fromCoin.maxAmount) setAmountError(`${t('swap.max')} is ${fromCoin.maxAmount} ${fromCoin.symbol}`);
    else setAmountError(null);
  }, [fromAmount, fromCoin]);

  const handleSwap = async () => {
    if (!address.trim()) { setAddressError(`Address required`); addressInputRef.current?.focus(); return; }
    if (addressError || amountError || !parseFloat(fromAmount)) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromSymbol: fromCoin.symbol,
          toSymbol: toCoin.symbol,
          fromAmount: fromAmount,
          destinationAddress: address
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'API Session Rejected');
      }
      
      const order = await response.json();
      const history = JSON.parse(localStorage.getItem('nexus_swap_history') || '[]');
      history.unshift({
        id: order.id,
        fromSymbol: order.fromSymbol,
        toSymbol: order.toSymbol,
        fromAmount: order.fromAmount,
        toAmount: order.toAmount,
        status: order.status,
        timestamp: Date.now(),
        destinationAddress: order.destinationAddress
      });
      localStorage.setItem('nexus_swap_history', JSON.stringify(history.slice(0, 50)));
      navigate(`/status/${order.id}`);
    } catch (err: any) {
      alert(`Connection Timeout: The swap engine is still waking up. Please try again in 10 seconds.`);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || amountError !== null || !address || !!addressError || networkStatus !== 'ACTIVE';
  let buttonText = 'Initialize Secure Swap';
  if (networkStatus === 'CONNECTING') buttonText = 'Waking Up Engine...';
  else if (isLoading) buttonText = 'Securing Liquidity...';

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-card border border-border rounded-[2.5rem] p-5 sm:p-7 shadow-2xl relative overflow-hidden ring-1 ring-border">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="space-y-1">
             <h2 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Execution Details</h2>
             <div className="h-0.5 w-5 bg-blue-600/30 rounded-full"></div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all duration-500 ${
                networkStatus === 'ACTIVE' ? 'bg-green-500/5 border-green-500/10' : 
                'bg-amber-500/5 border-amber-500/10'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                networkStatus === 'ACTIVE' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                'bg-amber-500 animate-bounce'
              }`}></span>
              <span className={`text-[8px] font-black uppercase tracking-widest ${
                networkStatus === 'ACTIVE' ? 'text-green-500' : 'text-amber-500'
              }`}>
                {networkStatus === 'ACTIVE' ? 'Node Active' : 'Node Waking'}
              </span>
            </button>
          </div>
        </div>

        {/* Diagnostic Panel */}
        {showDiagnostics && (
          <div className="mb-4 p-4 bg-muted/50 rounded-2xl border border-blue-500/20 animate-in slide-in-from-top-2">
            <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Diagnostic Data</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[8px] uppercase font-bold text-muted-foreground">
                <span>Target API:</span>
                <span className="text-foreground font-mono">{API_BASE_URL}</span>
              </div>
              <div className="flex justify-between items-center text-[8px] uppercase font-bold text-muted-foreground">
                <span>Status:</span>
                <span className={networkStatus === 'ACTIVE' ? 'text-green-500' : 'text-amber-500'}>{networkStatus}</span>
              </div>
              {lastError && (
                <div className="text-[8px] uppercase font-bold text-red-400 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                  Last Log: {lastError}
                </div>
              )}
              <div className="text-[7px] text-muted-foreground italic leading-tight">
                * If API is "localhost", your VITE_API_URL environment variable isn't set on Render.
              </div>
            </div>
          </div>
        )}
        
        <div className={`interactive-input-container bg-muted/30 border ${amountError ? 'border-red-500/50' : 'border-border'} rounded-2xl p-4 flex flex-col gap-1 transition-all`}>
          <div className="flex justify-between items-center px-0.5 mb-1">
            <label className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${amountError ? 'text-red-500' : 'text-amber-600 dark:text-[#F3BA2F]'}`}>
              {t('swap.youSend')}
            </label>
            <div className="flex gap-3 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
              <span className="opacity-60">Min: {fromCoin.minAmount}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <PrecisionDisplay isInput={true} value={fromAmount} onChange={(val) => setFromAmount(val)} colorClass={amountError ? 'text-red-400' : 'text-amber-600 dark:text-[#F3BA2F]'} />
            <button onClick={() => setShowPicker('from')} className="flex items-center gap-2 bg-card hover:bg-muted/80 px-3 py-1.5 rounded-xl border border-border transition-all shrink-0 group active:scale-95 shadow-sm">
              <img src={fromCoin.logo} alt="" className="w-4 h-4 rounded-full" />
              <div className="text-left leading-tight">
                <div className="font-black text-foreground text-[10px] tracking-tight">{fromCoin.symbol}</div>
                <div className="text-[6px] font-bold text-muted-foreground uppercase">{fromCoin.network}</div>
              </div>
              <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>

        <div className="relative h-10 flex items-center justify-center my-1">
          <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-border"></div></div>
          <button onClick={() => { if (toCoin.canSend && fromCoin.canReceive) { const temp = fromCoin; setFromCoin(toCoin); setToCoin(temp); setAddress(''); setFromAmount(toCoin.minAmount.toString()); } }} className="relative z-10 w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-blue-500 transition-all shadow-lg active:scale-90">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
          </button>
        </div>

        <div className="interactive-input-container bg-muted/30 border border-border rounded-2xl p-4 flex flex-col gap-1 transition-all">
          <label className="text-[10px] font-black text-emerald-600 dark:text-[#14F195] uppercase tracking-[0.2em] px-0.5 mb-1">{t('swap.youGet')}</label>
          <div className="flex items-center justify-between gap-3">
            <div className={isQuoting ? 'animate-pulse opacity-50' : ''}>
               <PrecisionDisplay value={toAmount} colorClass="text-emerald-600 dark:text-[#14F195]" />
            </div>
            <button onClick={() => setShowPicker('to')} className="flex items-center gap-2 bg-card hover:bg-muted/80 px-3 py-1.5 rounded-xl border border-border transition-all shrink-0 group active:scale-95 shadow-sm">
              <img src={toCoin.logo} alt="" className="w-4 h-4 rounded-full" />
              <div className="text-left leading-tight">
                <div className="font-black text-foreground text-[10px] tracking-tight">{toCoin.symbol}</div>
                <div className="text-[6px] font-bold text-muted-foreground uppercase">{toCoin.network}</div>
              </div>
              <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Recipient Destination</label>
          </div>
          <div className="relative group interactive-input-container bg-muted/30 border border-border rounded-xl overflow-hidden focus-within:ring-1 ring-blue-500/20">
            <input ref={addressInputRef} type="text" value={address} onChange={(e) => { setAddress(e.target.value); setAddressError(null); }} className={`w-full bg-transparent p-4 pr-24 text-xs font-bold outline-none placeholder:text-muted-foreground/30 transition-all ${addressError ? 'text-red-400' : 'text-blue-600 dark:text-blue-400'}`} placeholder={`Enter your ${toCoin.name} address...`} />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3 text-muted-foreground">
               <button onClick={async () => { setAddress(await navigator.clipboard.readText()); }} className="hover:text-foreground transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
            </div>
          </div>
        </div>

        <button onClick={handleSwap} disabled={isButtonDisabled} className={`w-full mt-6 py-5 font-black rounded-2xl transition-all duration-500 text-sm uppercase tracking-[0.2em] relative overflow-hidden group ${isButtonDisabled ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-600/30 active:scale-[0.97]'}`}>
          <span className="relative z-10 flex items-center justify-center gap-3">
             {isLoading && <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
             {buttonText}
          </span>
        </button>

        {networkStatus !== 'ACTIVE' && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[9px] font-bold text-amber-500/80 uppercase tracking-widest text-center">
            Node standby wake-up takes ~40s on Render Free Tier.
          </div>
        )}
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 dark:bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-sm:max-w-xs max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-6 pb-4 border-b border-border space-y-4">
               <div className="flex items-center justify-between">
                 <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Select Asset</h3>
                 <button onClick={() => setShowPicker(null)} className="text-muted-foreground hover:text-foreground"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
               </div>
               <input autoFocus placeholder="Search symbol..." className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 text-foreground font-bold text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2">
              {SUPPORTED_COINS.filter(c => c.symbol.toLowerCase().includes(searchTerm.toLowerCase())).map(coin => (
                <button key={coin.id} onClick={() => { if (showPicker === 'from') { setFromCoin(coin); setFromAmount(coin.minAmount.toString()); } else { setToCoin(coin); setAddressError(null); } setShowPicker(null); }} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 rounded-xl transition-all group">
                  <div className="flex items-center gap-3">
                    <img src={coin.logo} alt="" className="w-7 h-7 rounded-full bg-muted p-1" />
                    <div className="text-left">
                      <div className="text-xs font-black text-foreground group-hover:text-blue-500 transition-colors">{coin.name}</div>
                      <div className="text-[8px] font-bold text-muted-foreground uppercase">{coin.network}</div>
                    </div>
                  </div>
                  <div className="text-xs font-black text-blue-500 font-mono">{coin.symbol}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
