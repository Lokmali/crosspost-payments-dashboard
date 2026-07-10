import { ExternalLink } from "lucide-react";
import { type ReactNode, useState } from "react";
import { PaymentStatusBadge } from "@/components/payments/payment-feed";
import { Button } from "@/components/ui/button";
import type { PaymentTransaction } from "@/types/payment";
import {
  formatPaymentDisplay,
  formatPaymentStatus,
  formatTimestamp,
  truncateHash,
} from "@/utils/payment";
interface PaymentDetailCardProps {
  payment: PaymentTransaction;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{value}</dd>
    </div>
  );
}

export function PaymentDetailCard({ payment }: PaymentDetailCardProps) {
  const [rawOpen, setRawOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">Transaction details</h1>
          <PaymentStatusBadge status={payment.status} />
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground break-all">{payment.hash}</p>
      </div>

      <dl className="px-4 sm:px-6">
        <DetailRow
          label="Transaction hash"
          value={<span className="font-mono break-all">{payment.hash}</span>}
        />
        <DetailRow label="Sender" value={<span className="font-mono">{payment.sender}</span>} />
        <DetailRow label="Receiver" value={<span className="font-mono">{payment.receiver}</span>} />
        <DetailRow
          label="Amount"
          value={
            <span className="font-medium tabular-nums">
              {formatPaymentDisplay(payment.amount, payment.token)}
            </span>          }
        />
        <DetailRow
          label="Token"
          value={
            <div className="space-y-1">
              <p className="font-medium">{payment.token}</p>
              {payment.raw.token ? (
                <p className="font-mono text-xs text-muted-foreground break-all">{payment.raw.token}</p>
              ) : null}
            </div>
          }
        />        <DetailRow label="Timestamp" value={formatTimestamp(payment.timestamp)} />
        <DetailRow label="Block height" value={payment.blockHeight.toLocaleString()} />
        <DetailRow label="Status" value={formatPaymentStatus(payment.status)} />
        <DetailRow
          label="Explorer"
          value={
            <a
              href={payment.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline"
            >
              View on NearBlocks
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          }
        />
      </dl>

      <div className="border-t border-border px-4 py-4 sm:px-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRawOpen((open) => !open)}
        >
          {rawOpen ? "Hide raw transaction" : "Show raw transaction"}
        </Button>

        {rawOpen ? (
          <pre className="mt-4 max-h-96 overflow-auto rounded-md border border-border bg-muted/30 p-4 text-xs leading-relaxed">
            {JSON.stringify(payment.raw, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

export function PaymentDetailSummary({ payment }: { payment: PaymentTransaction }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
      <p className="font-medium">{truncateHash(payment.hash, 12, 10)}</p>
      <p className="mt-1 text-muted-foreground">
        {formatPaymentDisplay(payment.amount, payment.token)} ·{" "}
        {formatTimestamp(payment.timestamp)}
      </p>
    </div>
  );
}
