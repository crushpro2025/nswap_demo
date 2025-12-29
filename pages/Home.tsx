
import React from 'react';
import { Link } from 'react-router-dom';
import { SwapWidget } from '../components/SwapWidget';
import { LiveFeed } from '../components/LiveFeed';
import { t } from '../i18n';

const FeatureCard = ({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) => (
  <div className="p-8 sm:p-10 bg-card border border-border rounded-[2.5rem] sm:rounded-[3rem] group hover:border-blue-500/30 transition-all shadow-xl">
    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 sm:8 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg">
      {icon}
    </div>
    <h3 className="text-xl sm:text-2xl font-black text-foreground mb-4 tracking-tight uppercase">{title}</h3>
    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base font-medium">{desc}</p>
  </div>
);

export default function Home() {
  return (
    <div className="relative overflow-hidden min-h-screen bg-background">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-blue-600/5 dark:bg-blue-600/10 blur-[100px] sm:blur-[150px] rounded-full -z-10 pointer-events-none animate-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-cyan-600/5 blur-[80px] sm:blur-[120px] rounded-full -z-10 pointer-events-none animate-glow" style={{animationDelay: '-2s'}}></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-2 sm:pt-4 lg:pt-10 pb-24">
        {/* Main Hero Stack - Flex column for mobile, grid for desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-24 items-center">
          
          {/* 1. Headline Section - Top of mobile */}
          <div className="lg:col-span-6 flex flex-col gap-4 sm:gap-8 text-center lg:text-left order-1">
            
            {/* Desktop Only Badge */}
            <div className="hidden lg:inline-flex items-center self-start gap-3 px-4 py-2 bg-card border border-border rounded-full text-blue-500 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.25em] shadow-2xl">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.8)]"></span>
              {t('hero.badge')}
            </div>
            
            <div className="space-y-2 sm:space-y-6 flex flex-col">
              {/* Mobile Headline */}
              <h1 className="sm:hidden text-2xl font-black text-foreground leading-tight tracking-tighter uppercase order-1">
                Reliable <span className="text-blue-500">Flash</span> Exchange
              </h1>

              {/* Mobile Badge */}
              <div className="sm:hidden inline-flex items-center self-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full text-blue-500 dark:text-blue-400 text-[8px] font-black uppercase tracking-[0.2em] shadow-2xl mt-2 order-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                {t('hero.badge')}
              </div>

              {/* Desktop Headline */}
              <h1 className="hidden sm:block text-2xl sm:text-6xl md:text-8xl lg:text-[6rem] font-black text-foreground leading-[1.1] lg:leading-[0.95] tracking-tighter uppercase">
                {t('hero.titleMain')} <br />
                {t('hero.titleSub')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">{t('hero.titleAccent')}</span>
              </h1>
            </div>

            {/* Desktop Stats */}
            <div className="hidden lg:flex flex-wrap justify-start gap-8 pt-6">
              <div className="space-y-1">
                <div className="text-3xl font-black text-foreground">150+</div>
                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('hero.stats.assets')}</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-foreground">0.5%</div>
                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('hero.stats.fee')}</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-foreground">5 min</div>
                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('hero.stats.duration')}</div>
              </div>
            </div>
          </div>

          {/* 2. Swap Card Section */}
          <div className="lg:col-span-6 relative order-2 w-full max-w-lg mx-auto">
            <div className="absolute -inset-10 sm:-inset-24 bg-blue-600/5 dark:bg-blue-600/20 blur-[60px] sm:blur-[150px] rounded-full -z-10 animate-pulse-slow"></div>
            <div className="animate-float">
              <div className="relative z-10 p-0.5 sm:p-2 bg-gradient-to-br from-blue-500/10 to-transparent rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden">
                 <SwapWidget />
              </div>
            </div>
          </div>

          {/* 3. Live Platform Activity */}
          <div className="w-full lg:hidden order-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
             <LiveFeed />
          </div>

          {/* 4. Mobile Live Session Info Text */}
          <div className="lg:hidden order-4 px-4 py-2 text-center animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-[1px] w-6 bg-blue-600/30"></div>
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Active Settlement Pool</span>
              <div className="h-[1px] w-6 bg-blue-600/30"></div>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-tight">
              All platform sessions are currently processing through atomic liquidity routing for maximum speed and sub-millisecond price synchronization.
            </p>
          </div>

          {/* 5. Descriptive Text & Stats */}
          <div className="lg:col-span-12 order-5 space-y-8 lg:hidden mt-4">
            <p className="text-xs sm:text-xl text-muted-foreground text-center leading-relaxed font-bold opacity-80 uppercase tracking-tight px-4">
              {t('hero.description')}
            </p>

            <div className="flex justify-center gap-6 sm:gap-12 py-6 border-t border-b border-border w-full">
                <div className="text-center">
                  <div className="text-xl font-black text-foreground">150+</div>
                  <div className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.2em]">{t('hero.stats.assets')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-foreground">0.5%</div>
                  <div className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.2em]">{t('hero.stats.fee')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-foreground">5 min</div>
                  <div className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.2em]">{t('hero.stats.duration')}</div>
                </div>
            </div>
          </div>
        </div>

        {/* Live Network Section (Desktop Only View) */}
        <div className="hidden lg:block max-w-7xl mx-auto py-24 border-t border-border mt-32">
          <div className="grid grid-cols-3 gap-16">
            <div className="col-span-1 flex flex-col justify-center space-y-8">
              <h2 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-tight">
                Live Network <br />
                <span className="text-blue-500">Transactions.</span>
              </h2>
              <p className="text-muted-foreground font-bold uppercase tracking-tight opacity-70 leading-relaxed text-sm">
                Our automated routing engine monitors cross-chain activity to ensure deep liquidity and zero-delay execution for every swap session.
              </p>
              <div className="flex gap-4">
                <div className="bg-card border border-border p-8 rounded-[2.5rem] flex-1 shadow-2xl">
                  <div className="text-4xl font-black text-blue-500 mb-1">8.2k+</div>
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">24h Swaps</div>
                </div>
                <div className="bg-card border border-border p-8 rounded-[2.5rem] flex-1 shadow-2xl">
                  <div className="text-4xl font-black text-blue-500 mb-1">99.9%</div>
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Uptime</div>
                </div>
              </div>
            </div>
            <div className="col-span-2">
              <LiveFeed />
            </div>
          </div>
        </div>

        {/* Mobile-only descriptive text section */}
        <div className="lg:hidden mt-12 text-center px-4 space-y-4">
           <div className="h-px w-12 bg-blue-500 mx-auto opacity-50"></div>
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Nexus Distributed Liquidity Cluster Alpha-7</p>
        </div>
      </div>
    </div>
  );
}
