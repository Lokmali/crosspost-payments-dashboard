import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PaymentFeed } from "@/components/payments/payment-feed";
import { PaymentFilters } from "@/components/payments/payment-filters";
import { PaymentHeader } from "@/components/payments/payment-header";
import {
  PaymentEmptyState,
  PaymentErrorState,
  PaymentLoadingState,
} from "@/components/payments/payment-states";
import { useFilteredPayments } from "@/hooks/use-payments";
import { paymentService } from "@/services/payment-service";
import type { PaymentSortOrder } from "@/types/payment";
export const Route = createFileRoute("/_layout/payments/")({
  component: PaymentsDashboardPage,
  head: () => ({
    meta: [
      { title: "Crosspost Payments | Dashboard" },
      {
        name: "description",
        content: "Payment transactions from crosspost.near to lok07.near on NEAR Protocol.",
      },
    ],
  }),
});

function PaymentsDashboardPage() {
  const [hashQuery, setHashQuery] = useState("");
  const [dateQuery, setDateQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<PaymentSortOrder>("newest");

  const { payments, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } =
    useFilteredPayments({
      hashQuery,
      dateQuery,
      sortOrder,
    });

  return (
    <div className="h-full overflow-y-auto bg-background">
      <PaymentHeader
        lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
        onRefresh={() => {
          paymentService.clearPaymentCache();
          void refetch();
        }}        isRefreshing={isFetching}
      />

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <PaymentFilters
          hashQuery={hashQuery}
          dateQuery={dateQuery}
          sortOrder={sortOrder}
          onHashQueryChange={setHashQuery}
          onDateQueryChange={setDateQuery}
          onSortOrderChange={setSortOrder}
        />

        {isLoading ? <PaymentLoadingState /> : null}

        {!isLoading && isError ? (
          <PaymentErrorState error={error} onRetry={() => {
            paymentService.clearPaymentCache();
            void refetch();
          }} />        ) : null}

        {!isLoading && !isError && payments.length === 0 ? (
          <PaymentEmptyState hasFilters={Boolean(hashQuery || dateQuery)} />
        ) : null}

        {!isLoading && !isError && payments.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {payments.length} payment{payments.length === 1 ? "" : "s"}
            </p>
            <PaymentFeed payments={payments} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
