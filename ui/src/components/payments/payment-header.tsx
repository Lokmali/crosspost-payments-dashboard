import { Link } from "@tanstack/react-router";
import { ArrowRightLeft, RefreshCw, Wallet } from "lucide-react";
import { useAuthClient } from "@/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNearContext } from "@/hooks/use-payments";
import { PAYMENT_RECEIVER, PAYMENT_SENDER } from "@/types/payment";
import { formatTimestamp } from "@/utils/payment";

interface PaymentHeaderProps {
  lastUpdated?: Date;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function PaymentHeader({ lastUpdated, onRefresh, isRefreshing }: PaymentHeaderProps) {
  const auth = useAuthClient();
  const { networkId, walletAccountId } = useNearContext();
  const linkedNearAccount = walletAccountId ?? auth.near.getAccountId();

  return (
    <div className="border-b border-border bg-card/60 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Crosspost Payments
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Payment Dashboard</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Live transfers from{" "}
              <span className="font-mono text-foreground">{PAYMENT_SENDER}</span> to{" "}
              <span className="font-mono text-foreground">{PAYMENT_RECEIVER}</span> on NEAR mainnet,
              sourced from the Pikespeak API.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="self-start"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              Connected wallet
            </div>
            {linkedNearAccount ? (
              <p className="truncate font-mono text-sm">{linkedNearAccount}</p>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">Not connected</p>
                <Link
                  to="/login"
                  className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Connect
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <p className="mb-2 text-xs text-muted-foreground">Network</p>
            <Badge variant="secondary" className="font-mono uppercase">
              {networkId}
            </Badge>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <p className="mb-2 text-xs text-muted-foreground">Last updated</p>
            <p className="text-sm">
              {lastUpdated ? formatTimestamp(lastUpdated) : "Waiting for first sync…"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
