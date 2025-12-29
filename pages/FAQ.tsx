
import React, { useState } from 'react';

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{question}</span>
        <svg className={`w-6 h-6 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6' : 'max-h-0'}`}>
        <p className="text-muted-foreground leading-relaxed font-medium">{answer}</p>
      </div>
    </div>
  );
};

export default function FAQ() {
  const faqs = [
    {
      question: "What is the difference between Fixed and Floating rates?",
      answer: "A Fixed rate locks your exchange amount for 10-20 minutes, protecting you from market dips but usually carrying a slightly higher spread. A Floating rate gives you the best available market price at the moment your deposit reaches the required number of confirmations."
    },
    {
      question: "How long does a swap usually take?",
      answer: "Most swaps are completed in 5-15 minutes. The duration primarily depends on the confirmation speed of the 'Send' blockchain. Once we receive your funds, the exchange and sending process takes less than 2 minutes."
    },
    {
      question: "What if I send more or less than the specified amount?",
      answer: "No problem. Our system will automatically recalculate the 'Receive' amount based on the actual quantity received. If the amount is below the network minimum, a refund link will be generated after a support review."
    },
    {
      question: "Can I cancel a transaction?",
      answer: "Transactions can be canceled as long as you haven't sent the funds yet. Once funds are sent to our deposit address and confirmed on the blockchain, the swap is executed automatically and cannot be reversed."
    },
    {
      question: "Are there any exchange limits?",
      answer: "Minimum limits vary by coin (e.g., 0.001 BTC or 50 USDT). Maximum limits are dynamically adjusted based on current liquidity pool depth. For large institutional swaps over $1M, please contact our OTC desk."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-foreground mb-4">Help Center</h1>
        <p className="text-muted-foreground font-semibold">Everything you need to know about swapping on Nexus.</p>
      </div>

      <div className="glass-panel p-8 md:p-12 rounded-[2.5rem]">
        {faqs.map(faq => (
          <FAQItem 
            key={faq.question} 
            question={faq.question} 
            answer={faq.answer} 
          />
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-muted-foreground mb-6 font-bold uppercase tracking-widest text-xs">Still have questions?</p>
        <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all">
          Chat with Support
        </button>
      </div>
    </div>
  );
}
