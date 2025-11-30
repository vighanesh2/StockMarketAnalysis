"use client";

import { useState, useEffect, useCallback } from "react";
import type { QuoteData } from "@/lib/finance";
import { DetailedStats } from "./DetailedStats";
import styles from "./StockQuoteSection.module.css";

type StockQuoteSectionProps = {
  initialQuote: QuoteData;
  symbol: string;
};

function formatCurrency(value: number | null, currency = "USD") {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value >= 0 ? "+" : ""}${formatter.format(value)}%`;
}

export function StockQuoteSection({ initialQuote, symbol }: StockQuoteSectionProps) {
  const [quote, setQuote] = useState<QuoteData>(initialQuote);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update state when server-provided quote changes (e.g., navigating to another ticker)
  useEffect(() => {
    setQuote(initialQuote);
  }, [initialQuote.symbol, initialQuote.price]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/quote?symbol=${symbol}&history=false`);
      if (!response.ok) {
        throw new Error("Failed to fetch latest quote");
      }
      const data = (await response.json()) as { quote: QuoteData };
      setQuote(data.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh data");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const changeIsPositive = quote.change >= 0;
  const intradayRangePercent =
    quote.dayLow != null &&
    quote.dayHigh != null &&
    quote.dayHigh !== quote.dayLow
      ? Math.min(
          100,
          Math.max(
            0,
            ((quote.price - quote.dayLow) / (quote.dayHigh - quote.dayLow)) * 100
          )
        )
      : null;

  const stats = [
    { label: "Open", value: formatCurrency(quote.open, quote.currency) },
    {
      label: "Previous Close",
      value: formatCurrency(quote.previousClose, quote.currency),
    },
    { label: "Day Low", value: formatCurrency(quote.dayLow, quote.currency) },
    { label: "Day High", value: formatCurrency(quote.dayHigh, quote.currency) },
  ];

  return (
    <>
      {/* Price Hero */}
      <section className={styles.hero}>
        <div className={styles.heroHeader}>
          <div className={styles.priceBlock}>
            <p className={styles.price}>{formatCurrency(quote.price, quote.currency)}</p>
            <p
              className={
                changeIsPositive ? styles.positiveChange : styles.negativeChange
              }
            >
              {quote.change >= 0 ? "+" : ""}
              {formatCurrency(Math.abs(quote.change), quote.currency)} (
              {formatPercent(quote.changePercent)})
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={styles.refreshButton}
            title="Refresh stock price"
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Refreshing...
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.3333 2.66667L13.3333 5.33333L10.6667 5.33333"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.66667 13.3333L2.66667 10.6667L5.33333 10.6667"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11.4667 4.53333C10.88 3.94667 10.12 3.6 9.33333 3.6C7.49333 3.6 6 5.09333 6 6.93333C6 8.77333 7.49333 10.2667 9.33333 10.2667C10.12 10.2667 10.88 9.92 11.4667 9.33333"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4.53333 11.4667C5.12 12.0533 5.88 12.4 6.66667 12.4C8.50667 12.4 10 10.9067 10 9.06667C10 7.22667 8.50667 5.73333 6.66667 5.73333C5.88 5.73333 5.12 6.08 4.53333 6.66667"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
        <div className={styles.rangeCard}>
          <div className={styles.rangeLabels}>
            <span>{formatCurrency(quote.dayLow, quote.currency)}</span>
            <span>Day Range</span>
            <span>{formatCurrency(quote.dayHigh, quote.currency)}</span>
          </div>
          <div className={styles.rangeTrack}>
            {intradayRangePercent != null ? (
              <span
                className={styles.rangeProgress}
                style={{ width: `${intradayRangePercent}%` }}
              />
            ) : (
              <span className={styles.rangeUnavailable}>No intraday data</span>
            )}
          </div>
        </div>
      </section>
      {error && <p className={styles.errorMessage}>{error}</p>}

      {/* Key Metrics */}
      <section className={styles.metrics}>
        {stats.map((stat) => (
          <article className={styles.metricCard} key={stat.label}>
            <p className={styles.metricLabel}>{stat.label}</p>
            <p className={styles.metricValue}>{stat.value}</p>
          </article>
        ))}
      </section>

      {/* Detailed Statistics */}
      <DetailedStats quote={quote} />
    </>
  );
}

