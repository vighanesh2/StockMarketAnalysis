"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { QuoteData, HistoricalBar } from "@/lib/finance";
import { DetailedStats } from "./DetailedStats";
import styles from "./StockQuoteSection.module.css";

type StockQuoteSectionProps = {
  initialQuote: QuoteData;
  initialHistory: HistoricalBar[];
  symbol: string;
};

const RANGE_OPTIONS = [
  { value: "5d", label: "5 Days" },
  { value: "1mo", label: "1 Month" },
  { value: "3mo", label: "3 Months" },
  { value: "6mo", label: "6 Months" },
  { value: "1y", label: "1 Year" },
] as const;

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

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type PriceAnalysisProps = {
  history: HistoricalBar[];
  currentPrice: number;
  range: "5d" | "1mo" | "3mo" | "6mo" | "1y";
  currency: string;
  symbol: string;
};

function PriceAnalysis({
  history,
  currentPrice,
  range,
  currency,
  symbol,
}: PriceAnalysisProps) {
  const analysis = useMemo(() => {
    const validData = history
      .filter((bar) => bar.close != null && bar.close > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (validData.length < 2) return null;

    const firstClose = validData[0].close!;
    const lastClose = validData[validData.length - 1].close!;
    const priceChange = lastClose - firstClose;
    const priceChangePercent = ((priceChange / firstClose) * 100);

    const highs = validData.map((bar) => bar.high).filter((h): h is number => h != null);
    const lows = validData.map((bar) => bar.low).filter((l): l is number => l != null);
    const closes = validData.map((bar) => bar.close).filter((c): c is number => c != null);

    const highest = Math.max(...highs);
    const lowest = Math.min(...lows);
    const avgClose = closes.reduce((sum, val) => sum + val, 0) / closes.length;
    const volatility = Math.max(...highs) - Math.min(...lows);

    const isPositive = priceChange >= 0;
    const trend = isPositive ? "upward" : "downward";

    let periodText = "";
    switch (range) {
      case "5d":
        periodText = "5 trading days";
        break;
      case "1mo":
        periodText = "1 month (~20-22 trading days)";
        break;
      case "3mo":
        periodText = "3 months";
        break;
      case "6mo":
        periodText = "6 months";
        break;
      case "1y":
        periodText = "1 year";
        break;
    }

    return {
      periodText,
      dataPoints: validData.length,
      firstClose,
      lastClose,
      priceChange,
      priceChangePercent,
      highest,
      lowest,
      avgClose,
      volatility,
      isPositive,
      trend,
    };
  }, [history, range]);

  if (!analysis) return null;

  return (
    <div className={styles.analysisSection}>
      <h3 className={styles.analysisTitle}>Price Analysis</h3>
      <div className={styles.analysisContent}>
        <div className={styles.analysisStats}>
          <div className={styles.analysisStat}>
            <span className={styles.analysisLabel}>Period:</span>
            <span className={styles.analysisValue}>{analysis.periodText}</span>
          </div>
          <div className={styles.analysisStat}>
            <span className={styles.analysisLabel}>Data Points:</span>
            <span className={styles.analysisValue}>{analysis.dataPoints} days</span>
          </div>
          <div className={styles.analysisStat}>
            <span className={styles.analysisLabel}>Price Change:</span>
            <span
              className={
                analysis.isPositive
                  ? styles.analysisValuePositive
                  : styles.analysisValueNegative
              }
            >
              {analysis.isPositive ? "+" : ""}
              {formatCurrency(analysis.priceChange, currency)} (
              {analysis.isPositive ? "+" : ""}
              {analysis.priceChangePercent.toFixed(2)}%)
            </span>
          </div>
          <div className={styles.analysisStat}>
            <span className={styles.analysisLabel}>Range:</span>
            <span className={styles.analysisValue}>
              {formatCurrency(analysis.lowest, currency)} -{" "}
              {formatCurrency(analysis.highest, currency)}
            </span>
          </div>
        </div>
        <div className={styles.analysisText}>
          <p>
            Over the selected {analysis.periodText.toLowerCase()}, <strong>{symbol}</strong> has shown a{" "}
            <strong>{analysis.trend} trend</strong> with a price change of{" "}
            {formatCurrency(Math.abs(analysis.priceChange), currency)} (
            {Math.abs(analysis.priceChangePercent).toFixed(2)}%). The stock reached a high of{" "}
            {formatCurrency(analysis.highest, currency)} and a low of{" "}
            {formatCurrency(analysis.lowest, currency)}, indicating{" "}
            {analysis.volatility > analysis.avgClose * 0.1
              ? "significant"
              : "moderate"}{" "}
            volatility during this period. The average closing price was{" "}
            {formatCurrency(analysis.avgClose, currency)}.
          </p>
          <p>
            {analysis.isPositive ? (
              <>
                The <strong>positive momentum</strong> suggests potential strength, but investors
                should consider market conditions, company fundamentals, and broader economic
                factors before making investment decisions.
              </>
            ) : (
              <>
                The <strong>decline</strong> may indicate various factors such as market
                sentiment, company-specific news, or broader economic conditions. Further analysis
                of volume, news, and technical indicators would provide additional context.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export function StockQuoteSection({
  initialQuote,
  initialHistory,
  symbol,
}: StockQuoteSectionProps) {
  const searchParams = useSearchParams();
  const rangeParam = searchParams.get("range") || "1mo";
  const currentRange = (RANGE_OPTIONS.find((r) => r.value === rangeParam)?.value ??
    "1mo") as "5d" | "1mo" | "3mo" | "6mo" | "1y";

  const [quote, setQuote] = useState<QuoteData>(initialQuote);
  const [history, setHistory] = useState<HistoricalBar[]>(initialHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update state when initial props change (e.g., after navigation to different stock)
  useEffect(() => {
    setQuote(initialQuote);
    setHistory(initialHistory);
  }, [initialQuote.symbol, initialHistory.length]);

  // Auto-update when range changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/quote?symbol=${symbol}&history=true&range=${currentRange}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch stock data");
        }

        const data = (await response.json()) as {
          quote: QuoteData;
          history: HistoricalBar[];
        };
        setQuote(data.quote);
        setHistory(data.history || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh price every 30 seconds (only quote, not history)
    const priceRefreshInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/quote?symbol=${symbol}&history=false`);
        if (response.ok) {
          const data = (await response.json()) as { quote: QuoteData };
          setQuote(data.quote);
        }
      } catch (err) {
        // Silently fail for auto-refresh to avoid disrupting user experience
        console.error("Auto-refresh failed:", err);
      }
    }, 30000); // 30 seconds

    return () => {
      clearInterval(priceRefreshInterval);
    };
  }, [symbol, currentRange]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/quote?symbol=${symbol}&history=true&range=1mo`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch stock data");
      }

      const data = (await response.json()) as {
        quote: QuoteData;
        history: HistoricalBar[];
      };
      setQuote(data.quote);
      setHistory(data.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh data");
    } finally {
      setLoading(false);
    }
  };

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

      {/* Historical Data Table */}
      <section className={styles.historySection}>
        <div className={styles.historyHeader}>
          <div>
            <h2>Historical Data</h2>
            <div className={styles.rangeSelector}>
              {RANGE_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  href={`/?symbol=${symbol}&range=${option.value}`}
                  className={
                    currentRange === option.value
                      ? styles.rangeActive
                      : styles.rangeOption
                  }
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
          <Link
            href={`/api/quote?symbol=${symbol}&history=true&range=${currentRange}`}
            target="_blank"
          >
            Export JSON →
          </Link>
        </div>
        {loading ? (
          <p className={styles.historyEmpty}>Loading historical data...</p>
        ) : history.length === 0 ? (
          <p className={styles.historyEmpty}>Historical data unavailable.</p>
        ) : (
          <div className={styles.historyTableWrapper}>
            <table className={styles.historyTable}>
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
                {history
                  .filter((bar) => bar.close != null)
                  .reverse()
                  .map((bar) => (
                    <tr key={bar.date}>
                      <td>{formatDate(bar.date)}</td>
                      <td>{formatCurrency(bar.open, quote.currency)}</td>
                      <td>{formatCurrency(bar.high, quote.currency)}</td>
                      <td>{formatCurrency(bar.low, quote.currency)}</td>
                      <td>{formatCurrency(bar.close, quote.currency)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {history.length > 0 && (
          <PriceAnalysis
            history={history}
            currentPrice={quote.price}
            range={currentRange}
            currency={quote.currency}
            symbol={symbol}
          />
        )}
      </section>
    </>
  );
}

