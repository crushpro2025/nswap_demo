
export enum SwapStatus {
  AWAITING_DEPOSIT = 'AWAITING_DEPOSIT',
  CONFIRMING = 'CONFIRMING',
  EXCHANGING = 'EXCHANGING',
  SENDING = 'SENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED'
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
}

// In-memory Store (Replace with MongoDB/PostgreSQL in production)
export const orders = new Map<string, SwapOrder>();
