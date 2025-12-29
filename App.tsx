
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Swap from './pages/Swap';
import Status from './pages/Status';
import Documentation from './pages/Documentation';
import Security from './pages/Security';
import FAQ from './pages/FAQ';
import History from './pages/History';
import { MarketTicker } from './components/MarketTicker';
import { t } from './i18n';

const Navbar = ({ theme, toggleTheme }: { theme: string, toggleTheme: () => void }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-card/95 backdrop-blur-xl border-b border-border px-8 py-4 relative z-[60]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
              <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground uppercase">Nexus<span className="text-blue-500">Swap</span></span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={`text-sm font-semibold ${isActive('/') ? 'text-blue-500' : 'text-muted-foreground'}`}>{t('nav.home')}</Link>
          <Link to="/swap" className={`text-sm font-semibold ${isActive('/swap') ? 'text-blue-500' : 'text-muted-foreground'}`}>{t('nav.exchange')}</Link>
          <Link to="/history" className={`text-sm font-semibold ${isActive('/history') ? 'text-blue-500' : 'text-muted-foreground'}`}>{t('nav.history')}</Link>
          <Link to="/docs" className={`text-sm font-semibold ${isActive('/docs') ? 'text-blue-500' : 'text-muted-foreground'}`}>{t('nav.api')}</Link>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground transition-all">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/swap" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg">
            Launch Engine
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-400">
        <header className="fixed top-0 left-0 right-0 z-50">
           <Navbar theme={theme} toggleTheme={toggleTheme} />
           <MarketTicker />
        </header>
        <main className="flex-grow pt-28">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/swap" element={<Swap />} />
            <Route path="/history" element={<History />} />
            <Route path="/status/:id" element={<Status />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/security" element={<Security />} />
            <Route path="/faq" element={<FAQ />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
