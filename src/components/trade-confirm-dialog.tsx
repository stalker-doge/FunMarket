"use client";

import { useEffect, useRef } from "react";
import { formatMoney, cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface TradeConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mode: "buy" | "sell";
  outcomeLabel: string;
  outcomeColor: string;
  quantity: number;
  costOrRefund: number;
  newPrice: number;
  oldPrice: number;
  balanceAfter: number;
}

export function TradeConfirmDialog({
  open,
  onClose,
  onConfirm,
  mode,
  outcomeLabel,
  outcomeColor,
  quantity,
  costOrRefund,
  newPrice,
  oldPrice,
  balanceAfter,
}: TradeConfirmDialogProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const isBuy = mode === "buy";

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/60 backdrop-blur-sm"
    >
      <div className="rounded-2xl border border-border bg-card p-6 w-full max-w-sm shadow-2xl relative overflow-hidden animate-fadeIn">
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          isBuy
            ? "bg-gradient-to-r from-primary via-purple-500 to-primary"
            : "bg-gradient-to-r from-warning via-orange-500 to-warning"
        )} />

        <div className="flex items-center gap-3 mb-5">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center",
            isBuy ? "bg-primary/10" : "bg-warning/10"
          )}>
            <AlertTriangle className={cn("h-5 w-5", isBuy ? "text-primary" : "text-warning")} />
          </div>
          <div>
            <h3 className="font-bold text-base">Confirm {isBuy ? "Purchase" : "Sale"}</h3>
            <p className="text-xs text-muted-foreground">Review your trade details</p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div className="rounded-xl bg-muted/30 border border-border/50 p-3 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Outcome</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: outcomeColor }}
                />
                <span className="text-sm font-semibold">{outcomeLabel}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Quantity</span>
              <span className="text-sm font-mono font-bold">{quantity} shares</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{isBuy ? "Total Cost" : "Est. Refund"}</span>
              <span className={cn("text-sm font-mono font-bold", isBuy ? "text-primary" : "text-warning")}>
                {formatMoney(costOrRefund)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price Impact</span>
              <span className="text-sm font-mono">
                {(oldPrice * 100).toFixed(1)}% → <strong>{(newPrice * 100).toFixed(1)}%</strong>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Balance After</span>
              <span className="text-sm font-mono font-bold">{formatMoney(balanceAfter)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all duration-200",
              isBuy
                ? "bg-gradient-to-r from-primary to-purple-500 hover:shadow-lg hover:shadow-primary/20"
                : "bg-gradient-to-r from-warning to-orange-500 hover:shadow-lg hover:shadow-warning/20"
            )}
          >
            Confirm {isBuy ? "Buy" : "Sell"}
          </button>
        </div>
      </div>
    </div>
  );
}
