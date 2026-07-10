import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PaymentDetailCard } from "@/components/payments/payment-detail";
import { PaymentHeader } from "@/components/payments/payment-header";
import {
  PaymentErrorState,
  PaymentLoadingState,
  PaymentNotFoundState,
} from "@/components/payments/payment-states";
import { PaymentTimeline } from "@/components/payments/payment-timeline";
import { usePaymentDetail, usePaymentHistory } from "@/hooks/use-payments";

export const Route = createFileRoute("/_layout/payments/$txHash")({
  component: PaymentDetailPage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.txHash.slice(0, 12)}… | Crosspost Payments` },
      {
        name: "description",
        content: "Transaction details for crosspost.near to lok07.near payment history.",
      },
    ],
  }),
});

function PaymentDetailPage() {
  const { txHash } = Route.useParams();
  const { payment, isLoading, isError, error, refetch } = usePaymentDetail(txHash);
  const {
    timeline,
    isLoading: timelineLoading,
    dataUpdatedAt,
    isFetching,
    refetch: refetchHistory,
  } = usePaymentHistory(txHash);

  const handleRefresh = () => {
    void refetch();
    void refetchHistory();
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <PaymentHeader
        lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
      />

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <Link
          to="/payments"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to payment feed
        </Link>

        {isLoading || timelineLoading ? <PaymentLoadingState label="Loading transaction…" /> : null}

        {!isLoading && isError ? <PaymentErrorState error={error} onRetry={handleRefresh} /> : null}

        {!isLoading && !isError && !payment ? <PaymentNotFoundState hash={txHash} /> : null}

        {!isLoading && !isError && payment ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <PaymentDetailCard payment={payment} />
            <PaymentTimeline timeline={timeline} activeHash={txHash} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
