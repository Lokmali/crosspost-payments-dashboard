export const PAYMENT_SENDER = "crosspost.near" as const;
export const PAYMENT_RECEIVER = "lok07.near" as const;

export type PaymentStatus = "success" | "failed" | "unknown";

export interface PikespeakTransactionView {
  type?: string;
  index?: number;
  amount?: number;
  sender?: string;
  receiver?: string;
  status?: boolean;
  timestamp?: number;
}

export interface PikespeakHistoricEvent {
  direction?: string;
  transaction_id: string;
  receipt_id?: string;
  index?: number;
  sender: string;
  receiver: string;
  type: string;
  block_height: string;
  timestamp: string;
  transaction_type?: string;
  token: string | null;
  amount: string;
  transaction_view?: PikespeakTransactionView;
}

export interface PaymentTransaction {
  hash: string;
  sender: string;
  receiver: string;
  amount: string;
  token: string;
  timestamp: Date;
  status: PaymentStatus;
  blockHeight: number;
  explorerUrl: string;
  raw: PikespeakHistoricEvent;
}

export type PaymentSortOrder = "newest" | "oldest";

export interface PaymentQueryFilters {
  hashQuery?: string;
  dateQuery?: string;
  sortOrder: PaymentSortOrder;
}
