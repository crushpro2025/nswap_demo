
export enum SwapStatus {
  AWAITING_DEPOSIT = 'AWAITING_DEPOSIT',
  CONFIRMING = 'CONFIRMING',
  EXCHANGING = 'EXCHANGING',
  SENDING = 'SENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED'
}

export interface ExecutionLog {
  timestamp: number;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'NETWORK' | 'ERROR';
}

export interface SwapOrder {
  id: string;
  fromSymbol: string;
  toSymbol: string;
  fromAmount: string;
  toAmount: string;
  destinationAddress: string;
  depositAddress: string;
  status: SwapStatus;
  confirmations: number;
  requiredConfirmations: number;
  createdAt: number;
  logs: ExecutionLog[];
  txHashOut?: string;
  txHashIn?: string;
  provider: 'NEXUS_INTERNAL' | 'CHANGENOW';
  providerId?: string; // ChangeNOW ID
  network?: string;
}

// In-memory Store
export const orders = new Map<string, SwapOrder>();

// Global System Configuration
export const systemConfig = {
  useChangeNow: false,
  changeNowApiKey: 'YOUR_API_KEY_HERE' // This would be in .env in production
};
