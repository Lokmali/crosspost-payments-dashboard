import type { PaymentTransaction, PikespeakHistoricEvent } from "@/types/payment";
import { PAYMENT_SENDER } from "@/types/payment";
import { enrichPaymentsWithTokenSymbols } from "@/services/token-metadata";
import { isPaymentTransfer, normalizePaymentEvent } from "@/utils/payment";
const PIKESPEAK_BASE_URL = "https://api.pikespeak.ai";
const PAGE_SIZE = 100;
const MAX_PAGES = 100;
const CACHE_TTL_MS = 5 * 60_000;
const CACHE_VERSION = 2;
const PAGE_DELAY_MS = 500;
const MAX_429_RETRIES = 4;
export class PaymentServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "PaymentServiceError";
  }
}

type PaymentCache = {
  version: number;
  data: PaymentTransaction[];
  expiresAt: number;
  networkId: string;
};
let paymentCache: PaymentCache | null = null;
let inflightRequest: Promise<PaymentTransaction[]> | null = null;

function getApiKey(): string {
  const key = import.meta.env.VITE_PIKESPEAK_API_KEY ?? import.meta.env.PIKESPEAK_API_KEY;
  if (!key || typeof key !== "string") {
    throw new PaymentServiceError(
      "Missing Pikespeak API key. Set VITE_PIKESPEAK_API_KEY in your .env file.",
    );
  }
  return key;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCachedPayments(networkId: string) {
  if (!paymentCache || paymentCache.networkId !== networkId || paymentCache.version !== CACHE_VERSION) {
    return null;
  }
  if (Date.now() >= paymentCache.expiresAt) {
    paymentCache = null;
    return null;
  }
  return paymentCache.data;
}

function writeCachedPayments(networkId: string, data: PaymentTransaction[]) {
  paymentCache = {
    version: CACHE_VERSION,
    data,
    networkId,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
}
async function fetchHistoricPage(
  accountId: string,
  offset: number,
  apiKey: string,
): Promise<PikespeakHistoricEvent[]> {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });

  for (let attempt = 0; attempt < MAX_429_RETRIES; attempt += 1) {
    const response = await fetch(
      `${PIKESPEAK_BASE_URL}/event-historic/${encodeURIComponent(accountId)}?${params.toString()}`,
      {
        headers: {
          accept: "application/json",
          "x-api-key": apiKey,
        },
      },
    );

    if (response.status === 429) {
      if (attempt + 1 >= MAX_429_RETRIES) {
        const body = await response.text().catch(() => "");
        throw new PaymentServiceError(
          body || "Pikespeak rate limit reached. Wait a minute and try again.",
          429,
        );
      }
      await sleep(1500 * 2 ** attempt);
      continue;
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new PaymentServiceError(
        body || `Pikespeak request failed with status ${response.status}`,
        response.status,
      );
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      throw new PaymentServiceError("Unexpected Pikespeak response shape");
    }

    return data as PikespeakHistoricEvent[];
  }

  throw new PaymentServiceError("Pikespeak rate limit reached. Wait a minute and try again.", 429);
}

async function loadCrosspostPayments(networkId: string): Promise<PaymentTransaction[]> {
  const apiKey = getApiKey();
  const collected: PaymentTransaction[] = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    let events: PikespeakHistoricEvent[];
    try {
      events = await fetchHistoricPage(PAYMENT_SENDER, offset, apiKey);
    } catch (error) {
      if (error instanceof PaymentServiceError && error.statusCode === 429 && collected.length > 0) {
        break;
      }
      throw error;
    }

    if (events.length === 0) break;

    for (const event of events) {
      if (isPaymentTransfer(event)) {
        collected.push(normalizePaymentEvent(event, networkId));
      }
    }

    if (events.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
    await sleep(PAGE_DELAY_MS);
  }
  const sorted = collected.sort(
    (left, right) => right.timestamp.getTime() - left.timestamp.getTime(),
  );
  const enriched = await enrichPaymentsWithTokenSymbols(sorted, networkId);
  writeCachedPayments(networkId, enriched);
  return enriched;
}
export async function fetchCrosspostPayments(networkId = "mainnet"): Promise<PaymentTransaction[]> {
  const cached = readCachedPayments(networkId);
  if (cached) {
    if (cached.some((payment) => payment.token === "FT")) {
      const enriched = await enrichPaymentsWithTokenSymbols(cached, networkId);
      writeCachedPayments(networkId, enriched);
      return enriched;
    }
    return cached;
  }

  if (inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = loadCrosspostPayments(networkId).finally(() => {
    inflightRequest = null;
  });

  return inflightRequest;
}

export async function fetchPaymentByHash(
  hash: string,
  networkId = "mainnet",
): Promise<PaymentTransaction | null> {
  const payments = await fetchCrosspostPayments(networkId);
  return payments.find((payment) => payment.hash === hash) ?? null;
}

export function clearPaymentCache() {
  paymentCache = null;
  inflightRequest = null;
}

export const paymentService = {
  fetchCrosspostPayments,
  fetchPaymentByHash,
  clearPaymentCache,
};