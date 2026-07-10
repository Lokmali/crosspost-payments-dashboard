import { Link } from "@tanstack/react-router";
import { PaymentStatusBadge } from "@/components/payments/payment-feed";
import type { PaymentTransaction } from "@/types/payment";
import { formatPaymentDisplay, formatTimestamp, truncateHash } from "@/utils/payment";
interface PaymentTimelineProps {
  timeline: PaymentTransaction[];
  activeHash?: string;
}

export function PaymentTimeline({ timeline, activeHash }: PaymentTimelineProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Payment history</h2>
        <p className="text-xs text-muted-foreground">
          Complete chronological timeline between crosspost.near and lok07.near
        </p>
      </div>

      <div className="relative space-y-0">
        <div className="absolute bottom-2 left-[11px] top-2 w-px bg-border" aria-hidden />

        {timeline.map((payment, index) => {
          const isActive = payment.hash === activeHash;
          return (
            <div
              key={`${payment.hash}-${payment.raw.index ?? index}`}
              className="relative pl-8 pb-5 last:pb-0"
            >
              <div
                className={`absolute left-0 top-1.5 h-6 w-6 rounded-full border-2 ${
                  isActive ? "border-foreground bg-foreground" : "border-border bg-background"
                }`}
              >
                <div
                  className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    isActive ? "bg-background" : "bg-muted-foreground/40"
                  }`}
                />
              </div>

              <Link
                to="/payments/$txHash"
                params={{ txHash: payment.hash }}
                className={`block rounded-md border p-3 transition-colors ${
                  isActive
                    ? "border-foreground/30 bg-muted/60"
                    : "border-transparent hover:border-border hover:bg-muted/30"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs">{truncateHash(payment.hash, 10, 8)}</p>
                  <PaymentStatusBadge status={payment.status} />
                </div>
                <p className="mt-2 text-sm font-medium tabular-nums">
                  {formatPaymentDisplay(payment.amount, payment.token)}
                </p>                <p className="mt-1 text-xs text-muted-foreground">
                  {formatTimestamp(payment.timestamp)}
                </p>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
