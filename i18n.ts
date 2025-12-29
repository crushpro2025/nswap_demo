
export type Locale = 'en'; // Expandable to 'es', 'zh', etc.

const translations = {
  en: {
    nav: {
      home: "Home",
      exchange: "Exchange",
      history: "History",
      api: "API",
      signIn: "Sign In",
      launchApp: "Launch App"
    },
    hero: {
      badge: "Institutional Liquidity Engine",
      titleMain: "The New",
      titleSub: "Standard of",
      titleAccent: "Exchange.",
      description: "Execute seamless cross-chain swaps without accounts, limits, or compromise.",
      stats: {
        assets: "Global Assets",
        fee: "Capped Fee",
        duration: "Avg Duration"
      }
    },
    swap: {
      details: "Exchange Details",
      liveRates: "Live Rates Active",
      youSend: "You Send",
      youGet: "You Get",
      min: "Min",
      max: "Max",
      noHiddenFees: "No hidden commissions",
      recipientWallet: "Recipient Wallet",
      verifyAddress: "Verify Address",
      addressPlaceholder: "Enter your {name} address",
      initiateButton: "Initialize Swap",
      requestingLiquidity: "Requesting Liquidity...",
      securedBy: "Secured by Nexus Distributed Network",
      selectAsset: "Select Asset",
      searchPlaceholder: "Search by name, symbol, or chain...",
      networkNotice: "Only send assets on their native networks.",
      scannerTitle: "Address Scanner",
      closeScanner: "Close Scanner"
    },
    footer: {
      tagline: "The ultimate non-custodial gateway for instant cryptocurrency swaps. Fast, secure, and registration-free.",
      platform: "Platform",
      support: "Support",
      terms: "Service Terms",
      liquidity: "Liquidity Deck",
      privacy: "Privacy Shield",
      copyright: "© 2024 NEXUSSWAP EXCHANGE. FOR EDUCATIONAL PURPOSES."
    }
  }
};

let currentLocale: Locale = 'en';

/**
 * t helper function for localization.
 * Usage: t('swap.youSend')
 */
export const t = (key: string): string => {
  const keys = key.split('.');
  let result: any = translations[currentLocale];
  
  for (const k of keys) {
    if (result && result[k]) {
      result = result[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  return result;
};
