
export enum RateType {
  FIXED = 'FIXED',
  FLOATING = 'FLOATING'
}

export enum SwapStatus {
  AWAITING_DEPOSIT = 'AWAITING_DEPOSIT',
  CONFIRMING = 'CONFIRMING',
  EXCHANGING = 'EXCHANGING',
  SENDING = 'SENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED'
}

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  network: string;
  logo: string;
  color: string;
  precision: number;
  minAmount: number;
  maxAmount: number;
  canSend: boolean;
  canReceive: boolean;
}

export interface HistoryRecord {
  id: string;
  fromSymbol: string;
  toSymbol: string;
  fromAmount: string;
  toAmount: string;
  status: SwapStatus;
  timestamp: number;
  destinationAddress: string;
}

export interface SwapOrder {
  id: string;
  fromCoin: Coin;
  toCoin: Coin;
  fromAmount: number;
  toAmount: number;
  rateType: RateType;
  rate: number;
  status: SwapStatus;
  destinationAddress: string;
  depositAddress: string;
  createdAt: number;
  expiresAt: number;
  txHashIn?: string;
  txHashOut?: string;
  confirmations: number;
  requiredConfirmations: number;
}

export interface MarketTicker {
  symbol: string;
  price: number;
  change24h: number;
}
