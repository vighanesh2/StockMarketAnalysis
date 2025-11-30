"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { HistoricalBar } from "@/lib/finance";
import styles from "./HistoricalSnapshot.module.css";

type HistoricalRange = "5d" | "1mo" | "3mo" | "6mo" | "1y";

const RANGE_OPTIONS = [
  { value: "5d" as const, label: "5 Days" },
  { value: "1mo" as const, label: "1 Month" },
  { value: "3mo" as const, label: "3 Months" },
];

const SELECTABLE_RANGES = RANGE_OPTIONS;
const DEFAULT_RANGE: HistoricalRange = "1mo";
const ROW_LIMITS: Record<HistoricalRange, number> = {
  "5d": 5,
  "1mo": 22,
  "3mo": 60,
  "6mo": 90,
  "1y": 126,
};

type HistoricalSnapshotProps = {
  symbol: string;
  initialRange: HistoricalRange;
  initialHistory: HistoricalBar[];
  currency: string;
};

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

export function HistoricalSnapshot({
  symbol,
  initialRange,
  initialHistory,
  currency,
}: HistoricalSnapshotProps) {
  const [range, setRange] = useState<HistoricalRange>(initialRange ?? DEFAULT_RANGE);
  const [rows, setRows] = useState<HistoricalBar[]>(initialHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Record<string, HistoricalBar[]>>({
    [initialRange]: initialHistory,
  });

  useEffect(() => {
    cacheRef.current = { [initialRange ?? DEFAULT_RANGE]: initialHistory };
    setRange(initialRange ?? DEFAULT_RANGE);
    setRows(initialHistory);
    setError(null);
  }, [initialHistory, initialRange, symbol]);

  useEffect(() => {
    const cachedRows = cacheRef.current[range];
    if (cachedRows) {
      setRows(cachedRows);
      setError(null);
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/historical?symbol=${encodeURIComponent(symbol)}&range=${range}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("Unable to load historical data");
        }
        const data = (await response.json()) as { history?: HistoricalBar[] };
        cacheRef.current[range] = data.history ?? [];
        setRows(cacheRef.current[range]);
        setLastUpdated(
          new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          }).format(new Date())
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Unexpected error");
        setRows([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [range, symbol]);

  const rowLimit = ROW_LIMITS[range] ?? 20;
  const displayedRows = useMemo(
    () => rows.slice(-rowLimit).reverse(),
    [rows, rowLimit]
  );

  return (
    <section className={styles.snapshotCard}>
      <div className={styles.snapshotHeader}>
        <div>
          <h2>Historical Snapshot</h2>
          {lastUpdated && (
            <p style={{ fontSize: "0.85rem", color: "rgba(15,23,42,0.7)" }}>
              Last updated {lastUpdated}
            </p>
          )}
        </div>
        <div className={styles.controls}>
          <select
            className={styles.select}
            value={SELECTABLE_RANGES.some((option) => option.value === range)
              ? range
              : DEFAULT_RANGE}
            onChange={(event) =>
              setRange(event.target.value as HistoricalRange)
            }
            aria-label="Select time range"
          >
            {SELECTABLE_RANGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.fetchButton}
            onClick={() => setRange(range)}
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}
      {!error && !loading && displayedRows.length === 0 && (
        <p className={styles.emptyMessage}>Select a range to load recent prices.</p>
      )}

      {displayedRows.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Open</th>
                <th scope="col">High</th>
                <th scope="col">Low</th>
                <th scope="col">Close</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((bar, index) => (
                <tr
                  key={`${bar.date}-${index}`}
                  className={index === 0 ? styles.tableRowHighlight : undefined}
                >
                  <td>{bar.date}</td>
                  <td>{formatCurrency(bar.open, currency)}</td>
                  <td>{formatCurrency(bar.high, currency)}</td>
                  <td>{formatCurrency(bar.low, currency)}</td>
                  <td>{formatCurrency(bar.close, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
