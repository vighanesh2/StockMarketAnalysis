"use client";

import { useState } from "react";

const formatCurrency = (value: number | null, currency = "USD") => {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

type HistoricalRow = {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
};

export function HistoricalFetcher({ symbol = "TSLA" }: { symbol?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<HistoricalRow[]>([]);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the new yahoo-finance2 backed route
      const today = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const response = await fetch("/api/get-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          fromDate: oneMonthAgo.toISOString().split("T")[0],
          toDate: today.toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const payload = (await response.json()) as { data?: HistoricalRow[] };
      setRows(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="history-fetcher">
      <button onClick={handleFetch} disabled={loading}>
        {loading ? `Fetching ${symbol} history...` : `Fetch ${symbol} historical data`}
      </button>
      {error ? <p className="history-fetcher__error">{error}</p> : null}
      {rows.length > 0 && (
        <div className="history-fetcher__results">
          <p>
            Returned {rows.length} data points for {symbol}:
          </p>
          <ul>
            {rows.slice(-10).reverse().map((row) => (
              <li key={row.date}>
                <strong>{row.date}</strong> — O {formatCurrency(row.open)} · H{" "}
                {formatCurrency(row.high)} · L {formatCurrency(row.low)} · C{" "}
                {formatCurrency(row.close)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
