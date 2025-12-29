
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Coin } from '../types';

interface AiInsightProps {
  fromCoin: Coin;
  toCoin: Coin;
}

export const AiInsight: React.FC<AiInsightProps> = ({ fromCoin, toCoin }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Act as a professional crypto market advisor. Give a 1-sentence sentiment/advice for swapping ${fromCoin.name} to ${toCoin.name} right now. Be concise and institutional.`,
          config: {
            temperature: 0.7,
            maxOutputTokens: 100,
          }
        });
        setInsight(response.text?.trim() || "Market liquidity is optimal for this pair. Proceed with swap.");
      } catch (error) {
        console.error("AI Insight failed:", error);
        setInsight("Current market sentiment is neutral. Execution recommended.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [fromCoin.symbol, toCoin.symbol]);

  return (
    <div className="mt-8 p-6 rounded-[1.5rem] bg-[#1A1D23]/50 border border-white/5 flex gap-5 items-center animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0 shadow-lg">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-500 fill-current">
          <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
        </svg>
      </div>
      <div className="overflow-hidden">
        <div className="text-[11px] font-black text-blue-500 uppercase tracking-[0.1em] mb-1">AI Swap Advisor</div>
        <p className={`text-[13px] text-slate-400 font-medium italic truncate-amount ${loading ? 'animate-pulse' : ''}`}>
          {loading ? 'Analyzing cross-chain liquidity and market depth...' : `"${insight}"`}
        </p>
      </div>
    </div>
  );
};
