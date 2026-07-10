import { Link } from "@tanstack/react-router";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentServiceError } from "@/services/payment-service";

interface PaymentLoadingStateProps {
  label?: string;
}

export function PaymentLoadingState({
  label = "Loading all payments from Pikespeak…",
}: PaymentLoadingStateProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

interface PaymentEmptyStateProps {
  hasFilters?: boolean;
}

export function PaymentEmptyState({ hasFilters }: PaymentEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
      <Inbox className="mb-4 h-10 w-10 text-muted-foreground" />
      <h2 className="text-lg font-medium">No payments found</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {hasFilters
          ? "No transactions match your current search filters. Try clearing the hash or date filter."
          : "No transfers from crosspost.near to lok07.near were returned by Pikespeak yet."}
      </p>
    </div>
  );
}

interface PaymentErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

export function PaymentErrorState({ error, onRetry }: PaymentErrorStateProps) {
  const message =
    error instanceof PaymentServiceError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Unable to load payment data.";

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
        <div className="space-y-3">
          <div>
            <h2 className="font-medium text-destructive">Failed to load payments</h2>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
          {onRetry ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface PaymentNotFoundStateProps {
  hash: string;
}

export function PaymentNotFoundState({ hash }: PaymentNotFoundStateProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center">
      <h2 className="text-lg font-medium">Transaction not found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        No payment with hash <span className="font-mono">{hash}</span> exists in the crosspost →
        lok07 history.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/payments">Back to dashboard</Link>
      </Button>
    </div>
  );
}
