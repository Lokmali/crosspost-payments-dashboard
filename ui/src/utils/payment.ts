import type { PaymentStatus, PaymentTransaction, PikespeakHistoricEvent } from "@/types/payment";
import { PAYMENT_RECEIVER, PAYMENT_SENDER } from "@/types/payment";

const TRANSFER_TYPES = new Set(["NEAR_TRANSFER", "FT_TRANSFER"]);

export function getExplorerUrl(txHash: string, networkId = "mainnet"): string {
  const base = networkId === "testnet" ? "https://testnet.nearblocks.io" : "https://nearblocks.io";
  return `${base}/txns/${txHash}`;
}

export function formatTokenLabel(token: string | null): string {
  if (!token) return "NEAR";
  const normalized = token.trim();
  if (!normalized || normalized.toUpperCase() === "NEAR") return "NEAR";
  if (/\.(near|testnet|tg)$/i.test(normalized)) return normalized;
  if (/^[0-9a-f]{32,}$/i.test(normalized)) return "FT";
  return normalized;
}

export function formatPaymentAmount(amount: string, tokenLabel: string): string {
  let numeric: number;

  if (/^\d+$/.test(amount) && tokenLabel === "NEAR" && amount.length > 15) {
    numeric = Number(BigInt(amount)) / 1e24;
  } else {
    numeric = Number(amount);
  }

  if (!Number.isFinite(numeric)) {
    return amount;
  }

  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPaymentDisplay(amount: string, token: string): string {
  return `${formatPaymentAmount(amount, token)} ${token}`;
}
export function formatPaymentStatus(status: PaymentStatus): string {
  switch (status) {
    case "success":
      return "Success";
    case "failed":
      return "Failed";
    default:
      return "Unknown";
  }
}

export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function truncateHash(hash: string, head = 8, tail = 6): string {
  if (hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

function parseStatus(event: PikespeakHistoricEvent): PaymentStatus {
  const viewStatus = event.transaction_view?.status;
  if (typeof viewStatus === "boolean") {
    return viewStatus ? "success" : "failed";
  }
  return "unknown";
}

function parseTimestamp(value: string): Date {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return new Date(value);
  return new Date(numeric < 1_000_000_000_000 ? numeric * 1000 : numeric);
}

export function isPaymentTransfer(event: PikespeakHistoricEvent): boolean {
  if (!TRANSFER_TYPES.has(event.type)) return false;
  return event.sender === PAYMENT_SENDER && event.receiver === PAYMENT_RECEIVER;
}

export function normalizePaymentEvent(
  event: PikespeakHistoricEvent,
  networkId = "mainnet",
): PaymentTransaction {
  const token = formatTokenLabel(event.token);
  const amount =
    typeof event.transaction_view?.amount === "number"
      ? String(event.transaction_view.amount)
      : event.amount;

  return {
    hash: event.transaction_id,
    sender: event.sender,
    receiver: event.receiver,
    amount,
    token,    timestamp: parseTimestamp(event.timestamp),
    status: parseStatus(event),
    blockHeight: Number(event.block_height),
    explorerUrl: getExplorerUrl(event.transaction_id, networkId),
    raw: event,
  };
}

export function filterPayments(
  payments: PaymentTransaction[],
  filters: { hashQuery?: string; dateQuery?: string },
): PaymentTransaction[] {
  const hashNeedle = filters.hashQuery?.trim().toLowerCase();
  const dateNeedle = filters.dateQuery?.trim();

  return payments.filter((payment) => {
    if (hashNeedle && !payment.hash.toLowerCase().includes(hashNeedle)) {
      return false;
    }

    if (dateNeedle) {
      const paymentDate = payment.timestamp.toISOString().slice(0, 10);
      if (paymentDate !== dateNeedle) return false;
    }

    return true;
  });
}

export function sortPayments(
  payments: PaymentTransaction[],
  sortOrder: "newest" | "oldest",
): PaymentTransaction[] {
  return [...payments].sort((left, right) => {
    const delta = right.timestamp.getTime() - left.timestamp.getTime();
    return sortOrder === "newest" ? delta : -delta;
  });
}
