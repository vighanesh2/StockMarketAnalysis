"use client";

import type { QuoteData } from "@/lib/finance";
import styles from "./DetailedStats.module.css";

type DetailedStatsProps = {
  quote: QuoteData;
};

function formatCurrency(value: number | null, currency = "USD") {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatLargeNumber(value: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toLocaleString("en-US");
}

function formatVolume(value: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return new Intl.NumberFormat("en-US").format(value);
}

function formatRange(low: number | null, high: number | null, currency = "USD") {
  if (low == null || high == null) {
    return "—";
  }
  return `${formatCurrency(low, currency)} - ${formatCurrency(high, currency)}`;
}

function formatBidAsk(
  price: number | null,
  size: number | null,
  currency = "USD"
) {
  if (price == null) {
    return "—";
  }
  const sizeStr = size != null ? ` x ${formatVolume(size)}` : "";
  return `${formatCurrency(price, currency)}${sizeStr}`;
}

function formatDividendYield(
  rate: number | null,
  yieldValue: number | null
) {
  if (rate == null && yieldValue == null) {
    return "—";
  }
  const rateStr = rate != null ? formatCurrency(rate) : "—";
  const yieldStr =
    yieldValue != null ? `${(yieldValue * 100).toFixed(2)}%` : "—";
  return rateStr !== "—" && yieldStr !== "—"
    ? `${rateStr} (${yieldStr})`
    : rateStr !== "—"
    ? rateStr
    : yieldStr;
}

type DetailedStatsProps = {
  quote: QuoteData;
  className?: string;
};

export function DetailedStats({ quote, className }: DetailedStatsProps) {
  const stats = [
    {
      label: "Previous Close",
      value: formatCurrency(quote.previousClose, quote.currency),
    },
    {
      label: "Open",
      value: formatCurrency(quote.open, quote.currency),
    },
    {
      label: "Bid",
      value: formatBidAsk(quote.bid, quote.bidSize, quote.currency),
    },
    {
      label: "Ask",
      value: formatBidAsk(quote.ask, quote.askSize, quote.currency),
    },
    {
      label: "Day's Range",
      value: formatRange(quote.dayLow, quote.dayHigh, quote.currency),
    },
    {
      label: "52 Week Range",
      value: formatRange(
        quote.fiftyTwoWeekLow,
        quote.fiftyTwoWeekHigh,
        quote.currency
      ),
    },
    {
      label: "Volume",
      value: formatVolume(quote.volume),
    },
    {
      label: "Avg. Volume",
      value: formatVolume(quote.averageVolume),
    },
    {
      label: "Market Cap (intraday)",
      value: quote.marketCap != null ? formatLargeNumber(quote.marketCap) : "—",
    },
    {
      label: "Beta (5Y Monthly)",
      value: formatNumber(quote.beta),
    },
    {
      label: "PE Ratio (TTM)",
      value: formatNumber(quote.trailingPE),
    },
    {
      label: "EPS (TTM)",
      value: formatCurrency(quote.trailingEps, quote.currency),
    },
    {
      label: "Earnings Date",
      value: quote.earningsDate ?? "—",
    },
    {
      label: "Forward Dividend & Yield",
      value: formatDividendYield(quote.dividendRate, quote.dividendYield),
    },
    {
      label: "Ex-Dividend Date",
      value: quote.exDividendDate ?? "—",
    },
    {
      label: "1y Target Est",
      value: formatCurrency(quote.targetMeanPrice, quote.currency),
    },
  ];

  return (
    <section className={`${styles.statsSection} ${className || ""}`}>
      <h2 className={styles.statsHeader}>Statistics</h2>
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statItem}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statValue}>{stat.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

