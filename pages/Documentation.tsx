
import React from 'react';

// Fix: Making children optional to satisfy TypeScript's strict check when children are provided via JSX
const CodeBlock = ({ children }: { children?: React.ReactNode }) => (
  <div className="bg-slate-900 rounded-xl p-6 font-mono text-sm text-blue-400 border border-white/5 overflow-x-auto shadow-inner">
    {children}
  </div>
);

export default function Documentation() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="mb-16">
        <h1 className="text-4xl font-extrabold text-white mb-6">API Integration</h1>
        <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
          Automate your crypto workflows with our robust REST API. 
          Perfect for trading bots, payment processors, and cross-chain applications.
        </p>
      </div>

      <div className="space-y-20">
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm">1</span>
            Authentication
          </h2>
          <p className="text-slate-400 mb-6">
            NexusSwap uses a header-based authentication system for private endpoints. 
            Public endpoints (rates, coin info) do not require keys.
          </p>
          {/* Fix: Grouped template strings into a single expression */}
          <CodeBlock>
            {`// Include your API Key in the headers\n` +
             `X-Nexus-Key: your_api_key_here\n` +
             `X-Nexus-Signature: hmac_sha256_hash`}
          </CodeBlock>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm">2</span>
            Get Exchange Rates
          </h2>
          <p className="text-slate-400 mb-6">Retrieve the current live rate for any supported pair.</p>
          {/* Fix: Grouped template strings into a single expression */}
          <CodeBlock>
            {`GET https://api.nexusswap.com/v1/rate/BTC/ETH?amount=0.5\n\n` +
             `{\n` +
             `  "from": "BTC",\n` +
             `  "to": "ETH",\n` +
             `  "rate": 15.4210,\n` +
             `  "estimated_amount": 7.7105,\n` +
             `  "min_amount": 0.001,\n` +
             `  "max_amount": 12.5\n` +
             `}`}
          </CodeBlock>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm">3</span>
            Create Order
          </h2>
          <p className="text-slate-400 mb-6">Initialize a new exchange and receive a deposit address.</p>
          {/* Fix: Grouped template strings into a single expression */}
          <CodeBlock>
            {`POST https://api.nexusswap.com/v1/order\n` +
             `Content-Type: application/json\n\n` +
             `{\n` +
             `  "from": "USDT",\n` +
             `  "to": "XMR",\n` +
             `  "address": "44AFFq...941",\n` +
             `  "amount": 500,\n` +
             `  "type": "fixed"\n` +
             `}`}
          </CodeBlock>
        </section>

        <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-8 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Need a higher limit?</h3>
            <p className="text-slate-400">Contact our institutional desk for bulk API pricing and dedicated support.</p>
          </div>
          <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
