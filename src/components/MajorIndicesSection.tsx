"use client";

import { useState } from "react";
import Link from "next/link";
import type { QuoteData } from "@/lib/finance";
import { DetailedStats } from "./DetailedStats";
import styles from "./MajorIndicesSection.module.css";

type MajorIndicesSectionProps = {
  initialIndices: (QuoteData | null)[];
  indicesList: { symbol: string; name: string }[];
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

export function MajorIndicesSection({
  initialIndices,
  indicesList,
}: MajorIndicesSectionProps) {
  const [indices, setIndices] = useState<(QuoteData | null)[]>(initialIndices);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const symbols = indicesList.map((i) => i.symbol).join(",");
      const response = await fetch(`/api/indices?symbols=${symbols}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch indices data");
      }

      const data = (await response.json()) as { indices: (QuoteData | null)[] };
      setIndices(data.indices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.indicesSection}>
      <div className={styles.indicesHeader}>
        <h2 className={styles.indicesTitle}>Major Indices</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={styles.refreshButton}
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
      {error && <p className={styles.errorMessage}>{error}</p>}
      <div className={styles.indicesGrid}>
        {indices.map((index, i) => {
          if (!index) return null;
          const isPositive = index.change >= 0;
          const isExpanded = expandedIndex === i;
          return (
            <div key={indicesList[i].symbol} className={styles.indexCardWrapper}>
              <div
                className={styles.indexCard}
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
              >
                <div className={styles.indexCardContent}>
                  <Link
                    href={`/?symbol=${indicesList[i].symbol}`}
                    className={styles.indexLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={styles.indexHeader}>
                      <h3 className={styles.indexName}>{indicesList[i].name}</h3>
                      <span className={styles.indexSymbol}>{index.symbol}</span>
                    </div>
                  </Link>
                  <div className={styles.indexPrice}>
                    {formatCurrency(index.price, index.currency)}
                  </div>
                  <div
                    className={
                      isPositive
                        ? styles.indexChangePositive
                        : styles.indexChangeNegative
                    }
                  >
                    {index.change >= 0 ? "+" : ""}
                    {formatCurrency(Math.abs(index.change), index.currency)} (
                    {formatPercent(index.changePercent)})
                  </div>
                </div>
                <button
                  className={styles.expandButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedIndex(isExpanded ? null : i);
                  }}
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={isExpanded ? styles.expandedIcon : ""}
                  >
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              {isExpanded && (
                <div className={styles.expandedContent}>
                  <DetailedStats quote={index} className={styles.expandedStats} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

