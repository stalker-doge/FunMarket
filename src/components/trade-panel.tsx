"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { buySharesAction, sellSharesAction } from "@/actions/trades";
import { formatMoney, cn } from "@/lib/utils";
import { lmsrBuyCost, lmsrSellCost, lmsrAllPrices } from "@/lib/market-engine/lmsr";
import { useToast } from "@/components/toast";
import { TradeConfirmDialog } from "@/components/trade-confirm-dialog";

interface TradePanelProps {
  outcomes: {
    id: number;
    label: string;
    color: string | null;
    sharesOutstanding: number;
  }[];
  marketId: number;
  liquidityParam: number;
  userBalance: number;
  userHoldings: Record<number, number>;
}

type TradeMode = "buy" | "sell";

export function TradePanel({
  outcomes,
  marketId,
  liquidityParam,
  userBalance,
  userHoldings,
}: TradePanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [mode, setMode] = useState<TradeMode>("buy");
  const [selectedOutcome, setSelectedOutcome] = useState<number>(
    outcomes[0]?.id ?? 0
  );
  const [quantity, setQuantity] = useState(10);
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const sharesArray = outcomes.map((o) => o.sharesOutstanding);
  const selectedIndex = outcomes.findIndex((o) => o.id === selectedOutcome);
  const currentPrices = lmsrAllPrices(sharesArray, liquidityParam);
  const heldShares = userHoldings[selectedOutcome] || 0;

  const preview = useMemo(() => {
    if (selectedIndex < 0 || quantity < 1) return null;
    if (mode === "buy") {
      const cost = lmsrBuyCost(
        sharesArray,
        liquidityParam,
        selectedIndex,
        quantity
      );
      const avgPrice = cost / quantity;
      return { cost, avgPrice, refund: 0 };
    } else {
      if (quantity > heldShares) return null;
      const refund = lmsrSellCost(
        sharesArray,
        liquidityParam,
        selectedIndex,
        quantity
      );
      const avgPrice = refund / quantity;
      return { cost: 0, avgPrice, refund };
    }
  }, [sharesArray, liquidityParam, selectedIndex, quantity, mode, heldShares]);

  const afterShares = mode === "buy"
    ? sharesArray.map((s, i) => i === selectedIndex ? s + quantity : s)
    : sharesArray.map((s, i) => i === selectedIndex ? s - quantity : s);
  const afterPrices = lmsrAllPrices(afterShares, liquidityParam);

  const canAfford = mode === "buy"
    ? (preview ? userBalance >= preview.cost : false)
    : quantity <= heldShares;

  function handleTrade() {
    const tradeValue = preview
      ? (mode === "buy" ? preview.cost : preview.refund)
      : 0;
    if (tradeValue > 100) {
      setShowConfirm(true);
      return;
    }
    executeTradeAction();
  }

  function executeTradeAction() {
    setShowConfirm(false);
    startTransition(async () => {
      const action = mode === "buy" ? buySharesAction : sellSharesAction;
      const result = await action(selectedOutcome, quantity);
      if ("error" in result) {
        setMessage({ type: "error", text: result.error ?? "Unknown error" });
        showToast(result.error ?? "Trade failed", "error");
      } else {
        const tradeValue = mode === "buy"
          ? formatMoney("cost" in result ? result.cost : 0)
          : formatMoney("refund" in result ? result.refund : 0);
        const msg = mode === "buy"
          ? `Bought ${quantity} shares for ${tradeValue}!`
          : `Sold ${quantity} shares for ${tradeValue}!`;
        setMessage({ type: "success", text: msg });
        showToast(msg, "success");
        router.refresh();
      }
      setTimeout(() => setMessage(null), 3000);
    });
  }

  const maxQuantity = mode === "sell" ? heldShares : 9999;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg relative overflow-hidden">
      {/* Top gradient accent */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        mode === "buy"
          ? "bg-gradient-to-r from-primary via-purple-500 to-primary"
          : "bg-gradient-to-r from-warning via-orange-500 to-warning"
      )} />

      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <div className={cn(
            "h-6 w-1 rounded-full",
            mode === "buy"
              ? "bg-gradient-to-b from-primary to-purple-500"
              : "bg-gradient-to-b from-warning to-orange-500"
          )} />
          Trade
        </h3>

        {/* Buy/Sell toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => { setMode("buy"); setQuantity(10); }}
            className={cn(
              "px-3 py-1.5 text-xs font-bold transition-all duration-200",
              mode === "buy"
                ? "bg-primary text-white"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            Buy
          </button>
          <button
            onClick={() => { setMode("sell"); setQuantity(Math.min(10, heldShares)); }}
            className={cn(
              "px-3 py-1.5 text-xs font-bold transition-all duration-200",
              mode === "sell"
                ? "bg-warning text-white"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            Sell
          </button>
        </div>
      </div>

      {/* Outcome selector */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {outcomes.map((outcome) => {
          const held = userHoldings[outcome.id] || 0;
          return (
            <button
              key={outcome.id}
              onClick={() => setSelectedOutcome(outcome.id)}
              className={cn(
                "group relative rounded-xl border p-3 text-left transition-all duration-300 overflow-hidden",
                selectedOutcome === outcome.id
                  ? mode === "buy"
                    ? "border-primary/50 bg-gradient-to-br from-primary/10 to-purple-500/10 shadow-lg shadow-primary/20 ring-2 ring-primary/30"
                    : "border-warning/50 bg-gradient-to-br from-warning/10 to-orange-500/10 shadow-lg shadow-warning/20 ring-2 ring-warning/30"
                  : "border-border hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              <div className="relative flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full transition-transform duration-300 group-hover:scale-125"
                  style={{
                    backgroundColor: outcome.color || "#8b5cf6",
                    boxShadow: `0 0 12px ${(outcome.color || "#8b5cf6")}40`,
                  }}
                />
                <span className="font-semibold text-sm">{outcome.label}</span>
              </div>
              {held > 0 && (
                <div className="relative mt-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <div className={cn("h-1.5 w-1.5 rounded-full", mode === "buy" ? "bg-primary/50" : "bg-warning/50")} />
                  {held.toFixed(1)} shares
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Quantity */}
      <div className="mb-5">
        <label className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
          <span>Quantity</span>
          {mode === "sell" && (
            <>
              <div className="flex-1 h-px bg-border/50" />
              <button
                onClick={() => setQuantity(Math.floor(heldShares))}
                className="text-xs text-warning font-bold hover:underline"
              >
                Max: {Math.floor(heldShares)}
              </button>
            </>
          )}
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 5))}
            className="h-11 w-11 rounded-xl border border-border bg-muted/30 flex items-center justify-center hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 active:scale-95 text-lg font-semibold hover:text-primary"
          >
            -
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = Math.max(1, Math.min(parseInt(e.target.value) || 1, maxQuantity));
              setQuantity(val);
            }}
            className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-center text-lg font-mono font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            min={1}
            max={maxQuantity}
          />
          <button
            onClick={() => setQuantity(Math.min(quantity + 5, maxQuantity))}
            className="h-11 w-11 rounded-xl border border-border bg-muted/30 flex items-center justify-center hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 active:scale-95 text-lg font-semibold hover:text-primary"
          >
            +
          </button>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {[1, 5, 10, 25, 50].filter(q => q <= maxQuantity).map((q) => (
            <button
              key={q}
              onClick={() => setQuantity(q)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                quantity === q
                  ? mode === "buy"
                    ? "border-primary bg-primary/10 text-primary shadow-md"
                    : "border-warning bg-warning/10 text-warning shadow-md"
                  : "border-border hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Price preview */}
      {preview && (
        <div className="rounded-xl bg-gradient-to-br from-secondary to-muted/30 border border-border/50 p-4 mb-5 space-y-3">
          {mode === "buy" ? (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Est. Cost</span>
              <span className="font-mono font-bold text-base text-primary">
                {formatMoney(preview.cost)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Est. Refund</span>
              <span className="font-mono font-bold text-base text-warning">
                {formatMoney(preview.refund)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-medium">Avg Price</span>
            <span className="font-mono font-semibold text-sm">
              {preview.avgPrice.toFixed(4)} <span className="text-muted-foreground">/ share</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-medium">New Price</span>
            <span className="font-mono font-semibold text-sm flex items-center gap-2">
              {(afterPrices[selectedIndex] * 100).toFixed(1)}%
              <span className="text-xs text-muted-foreground font-normal">
                (from {(currentPrices[selectedIndex] * 100).toFixed(1)}%)
              </span>
            </span>
          </div>
          {!canAfford && (
            <div className="text-danger text-sm pt-2 font-medium flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
              {mode === "buy" ? "Insufficient balance" : "Insufficient shares"}
            </div>
          )}
        </div>
      )}

      {/* Trade button */}
      <button
        onClick={handleTrade}
        disabled={isPending || !canAfford}
        className={cn(
          "group relative w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-300 overflow-hidden",
          isPending
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : mode === "buy"
              ? canAfford
                ? "bg-gradient-to-r from-primary to-purple-500 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
                : "bg-muted text-muted-foreground cursor-not-allowed"
              : canAfford
                ? "bg-gradient-to-r from-warning to-orange-500 hover:shadow-lg hover:shadow-warning/30 hover:-translate-y-0.5 active:translate-y-0"
                : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <span className="relative flex items-center justify-center gap-2">
          {isPending ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Processing...
            </>
          ) : mode === "buy" ? (
            "Buy Shares"
          ) : (
            "Sell Shares"
          )}
        </span>
      </button>

      <div className="mt-3 text-xs text-muted-foreground text-center">
        Balance: <span className="font-mono font-semibold text-foreground">{formatMoney(userBalance)}</span>
      </div>

      {/* Message */}
      {message && (
        <div
          className={cn(
            "mt-4 rounded-xl p-3 text-sm text-center font-medium flex items-center justify-center gap-2 animate-slideIn",
            message.type === "success"
              ? "bg-success/10 border border-success/30 text-success"
              : "bg-danger/10 border border-danger/30 text-danger"
          )}
        >
          <div
            className={cn(
              "h-2 w-2 rounded-full animate-pulse",
              message.type === "success" ? "bg-success" : "bg-danger"
            )}
          />
          {message.text}
        </div>
      )}

      {/* Confirmation dialog */}
      <TradeConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeTradeAction}
        mode={mode}
        outcomeLabel={outcomes.find(o => o.id === selectedOutcome)?.label ?? ""}
        outcomeColor={outcomes.find(o => o.id === selectedOutcome)?.color ?? "#8b5cf6"}
        quantity={quantity}
        costOrRefund={preview ? (mode === "buy" ? preview.cost : preview.refund) : 0}
        newPrice={afterPrices[selectedIndex]}
        oldPrice={currentPrices[selectedIndex]}
        balanceAfter={mode === "buy"
          ? userBalance - (preview?.cost ?? 0)
          : userBalance + (preview?.refund ?? 0)
        }
      />
    </div>
  );
}
