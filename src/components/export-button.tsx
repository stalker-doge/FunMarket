"use client";

import { useState, useTransition } from "react";
import { exportTradesCsv } from "@/actions/export";
import { Download, Loader2 } from "lucide-react";

export function ExportButton() {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const result = await exportTradesCsv();
      if (result.csv) {
        const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename || "trades.csv";
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/50 transition-all duration-200 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      Export CSV
    </button>
  );
}
