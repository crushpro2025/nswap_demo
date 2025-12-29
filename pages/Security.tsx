
import React from 'react';

export default function Security() {
  const securityFeatures = [
    {
      title: "Non-Custodial Architecture",
      desc: "NexusSwap utilizes smart contracts and atomic-like order routing. We never store user private keys, ensuring that you maintain control over your assets until the moment of exchange.",
      icon: "🔒"
    },
    {
      title: "Liquidity Fragmentation",
      desc: "Our engine splits orders across multiple liquidity providers to minimize price impact and protect against flash-loan vulnerabilities.",
      icon: "🌊"
    },
    {
      title: "Rate Protection",
      desc: "For fixed rate swaps, we lock the exchange price for up to 15 minutes, absorbing market volatility on your behalf.",
      icon: "⏱️"
    },
    {
      title: "Cold Storage Reserve",
      desc: "80% of our liquidity pools are held in multi-sig cold storage wallets, with hot wallets only containing operational capital.",
      icon: "🧊"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h1 className="text-4xl font-extrabold text-white mb-6">Nexus Security Protocols</h1>
        <p className="text-lg text-slate-400">Security is not a feature; it is our foundation. Explore how we protect every transaction.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        {securityFeatures.map(f => (
          <div key={f.title} className="glass-panel p-10 rounded-3xl">
            <div className="text-4xl mb-6">{f.icon}</div>
            <h3 className="text-xl font-bold text-white mb-4">{f.title}</h3>
            <p className="text-slate-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-3xl p-12 text-center border border-white/5">
        <h2 className="text-3xl font-bold text-white mb-6">Regulatory Transparency</h2>
        <div className="max-w-2xl mx-auto space-y-4 text-slate-400">
          <p>
            NexusSwap operates as a software provider facilitating peer-to-peer liquidity matching. 
            We do not hold deposits or provide financial advisory services.
          </p>
          <p>
            Users are responsible for complying with local regulations regarding cryptocurrency 
            exchange and capital gains taxation.
          </p>
        </div>
      </div>
    </div>
  );
}
