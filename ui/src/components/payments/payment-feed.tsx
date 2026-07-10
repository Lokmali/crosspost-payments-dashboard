import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PaymentTransaction } from "@/types/payment";
import {
  formatPaymentDisplay,
  formatPaymentStatus,
  formatTimestamp,
  truncateHash,
} from "@/utils/payment";
interface PaymentStatusBadgeProps {
  status: PaymentTransaction["status"];
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const label = formatPaymentStatus(status);
  const className =
    status === "success"
      ? "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400"
      : status === "failed"
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : "bg-muted text-muted-foreground border-border";

  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  );
}

interface PaymentFeedItemProps {
  payment: PaymentTransaction;
}

export function PaymentFeedItem({ payment }: PaymentFeedItemProps) {
  return (
    <Link
      to="/payments/$txHash"
      params={{ txHash: payment.hash }}
      className="group block rounded-lg border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-medium">{truncateHash(payment.hash)}</p>
            <PaymentStatusBadge status={payment.status} />
          </div>

          <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            <p>
              <span className="text-foreground/70">From:</span>{" "}
              <span className="font-mono text-foreground">{payment.sender}</span>
            </p>
            <p>
              <span className="text-foreground/70">To:</span>{" "}
              <span className="font-mono text-foreground">{payment.receiver}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <p className="text-lg font-semibold tabular-nums">
            {formatPaymentDisplay(payment.amount, payment.token)}
          </p>          <p className="text-xs text-muted-foreground">{formatTimestamp(payment.timestamp)}</p>
          <p className="text-xs text-muted-foreground">
            Block {payment.blockHeight.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <ExternalLink className="h-3.5 w-3.5" />
        <span className="group-hover:text-foreground">View transaction details</span>
      </div>
    </Link>
  );
}

interface PaymentFeedProps {
  payments: PaymentTransaction[];
}

export function PaymentFeed({ payments }: PaymentFeedProps) {
  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <PaymentFeedItem key={`${payment.hash}-${payment.raw.index ?? 0}`} payment={payment} />
      ))}
    </div>
  );
}
