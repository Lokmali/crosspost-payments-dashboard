import { useQuery } from "@tanstack/react-query";
import { Near } from "near-kit";
import { useMemo } from "react";
import { getRuntimeConfig, useAuthClient } from "@/app";
import { PaymentServiceError, paymentService } from "@/services/payment-service";
import type { PaymentQueryFilters, PaymentTransaction } from "@/types/payment";
import { filterPayments, sortPayments } from "@/utils/payment";

export const PAYMENTS_QUERY_KEY = ["crosspost-payments", "v2"] as const;
export function useNearContext() {
  const auth = useAuthClient();
  const networkId = getRuntimeConfig()?.networkId ?? "mainnet";

  const near = useMemo(
    () =>
      new Near({
        network: networkId === "testnet" ? "testnet" : "mainnet",
      }),
    [networkId],
  );

  const walletAccountId = auth.near.getAccountId();

  return {
    near,
    networkId,
    walletAccountId,
  };
}

export function useCrosspostPayments() {
  const { networkId } = useNearContext();

  return useQuery({
    queryKey: [...PAYMENTS_QUERY_KEY, networkId],
    queryFn: () => paymentService.fetchCrosspostPayments(networkId),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof PaymentServiceError) {
        if (error.statusCode === 401) return false;
        if (error.statusCode === 429) return failureCount < 2;
      }
      return failureCount < 1;
    },
    retryDelay: (attempt, error) => {
      if (error instanceof PaymentServiceError && error.statusCode === 429) {
        return Math.min(30_000, 3000 * 2 ** attempt);
      }
      return 1500;
    },
  });
}

export function useFilteredPayments(filters: PaymentQueryFilters) {
  const query = useCrosspostPayments();

  const payments = useMemo(() => {
    if (!query.data) return [] as PaymentTransaction[];
    const filtered = filterPayments(query.data, filters);
    return sortPayments(filtered, filters.sortOrder);
  }, [query.data, filters]);

  return {
    ...query,
    payments,
  };
}

export function usePaymentHistory(currentHash?: string) {
  const query = useCrosspostPayments();

  const timeline = useMemo(() => {
    if (!query.data) return [] as PaymentTransaction[];
    return [...query.data].sort(
      (left, right) => left.timestamp.getTime() - right.timestamp.getTime(),
    );
  }, [query.data]);

  return {
    ...query,
    timeline,
    currentHash,
  };
}

export function usePaymentDetail(hash: string) {
  const { networkId } = useNearContext();
  const historyQuery = useCrosspostPayments();

  const detailQuery = useQuery({
    queryKey: [...PAYMENTS_QUERY_KEY, "detail", networkId, hash],
    queryFn: async () => {
      const fromCache = historyQuery.data?.find((payment) => payment.hash === hash);
      if (fromCache) return fromCache;
      return paymentService.fetchPaymentByHash(hash, networkId);
    },
    enabled: Boolean(hash),
    staleTime: 60_000,
  });

  return {
    payment: detailQuery.data ?? null,
    isLoading: historyQuery.isLoading || detailQuery.isLoading,
    isError: historyQuery.isError || detailQuery.isError,
    error: detailQuery.error ?? historyQuery.error,
    refetch: detailQuery.refetch,
  };
}
