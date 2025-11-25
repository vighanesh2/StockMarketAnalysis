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
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1); // Add 1 day to include today
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const response = await fetch("/api/get-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          fromDate: oneMonthAgo.toISOString().split("T")[0],
          toDate: tomorrow.toISOString().split("T")[0],
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
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <button
        onClick={handleFetch}
        disabled={loading}
        style={{
          padding: "12px 24px",
          background: loading ? "#9ca3af" : "#0066cc",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          fontWeight: 600,
          fontSize: "0.9rem",
          cursor: loading ? "not-allowed" : "pointer",
          alignSelf: "flex-start",
        }}
      >
        {loading ? `Fetching ${symbol}...` : `Fetch ${symbol} Data`}
      </button>
      {error ? (
        <p style={{ color: "#dc2626", fontSize: "0.9rem" }}>{error}</p>
      ) : null}
      {rows.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              fontSize: "0.85rem",
              color: "#374151",
              fontWeight: 500,
            }}
          >
            {rows.length} data points returned for {symbol}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr style={{ background: "#fff" }}>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#6b7280",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#6b7280",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Open
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#6b7280",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    High
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#6b7280",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Low
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#6b7280",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    Close
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(-5).reverse().map((row) => (
                  <tr key={row.date}>
                    <td
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f3f4f6",
                        color: "#111827",
                      }}
                    >
                      {row.date}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        borderBottom: "1px solid #f3f4f6",
                        color: "#111827",
                      }}
                    >
                      {formatCurrency(row.open)}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        borderBottom: "1px solid #f3f4f6",
                        color: "#111827",
                      }}
                    >
                      {formatCurrency(row.high)}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        borderBottom: "1px solid #f3f4f6",
                        color: "#111827",
                      }}
                    >
                      {formatCurrency(row.low)}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        borderBottom: "1px solid #f3f4f6",
                        color: "#111827",
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(row.close)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
