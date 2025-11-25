import Link from "next/link";
import { HistoricalFetcher } from "@/components/HistoricalFetcher";
import { fetchHistorical, fetchNews, fetchQuote } from "@/lib/finance";
import type { HistoricalBar, NewsItem, QuoteData } from "@/lib/finance";
import styles from "./page.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

type HomeProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

const DEFAULT_SYMBOL = "TSLA";
const WATCHLIST = ["TSLA", "AAPL", "MSFT", "NVDA", "SPY", "AMZN", "META", "GOOGL"];
const HISTORICAL_RANGE: Parameters<typeof fetchHistorical>[1] = "1mo";
const HISTORICAL_INTERVAL: Parameters<typeof fetchHistorical>[2] = "1d";

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

function formatTimestamp(timestamp: number | null) {
  if (!timestamp) {
    return "Real-time data pulled from Yahoo Finance";
  }
  return `Last updated ${new Date(timestamp * 1000).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  })}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedSymbol = Array.isArray(resolvedSearchParams.symbol)
    ? resolvedSearchParams.symbol[0]
    : resolvedSearchParams.symbol;

  const symbol = (requestedSymbol ?? DEFAULT_SYMBOL).toUpperCase().trim();

  let error: string | null = null;
  let quote: QuoteData | null = null;
  let news: NewsItem[] = [];
  let history: HistoricalBar[] = [];

  try {
    const [resolvedQuote, resolvedNews, resolvedHistory] = await Promise.all([
      fetchQuote(symbol),
      fetchNews(symbol, 6),
      fetchHistorical(symbol, HISTORICAL_RANGE, HISTORICAL_INTERVAL),
    ]);
    quote = resolvedQuote;
    news = resolvedNews;
    history = resolvedHistory;
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Unable to retrieve market data at this time.";
  }

  if (!quote) {
    return (
      <main className={styles.page}>
        <section className={styles.stateCard}>
          <p>Something went wrong.</p>
          <p className={styles.stateDescription}>{error}</p>
          <Link href="/" className={styles.primaryCta}>
            Try Again
          </Link>
        </section>
      </main>
    );
  }

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
    { label: "Previous Close", value: formatCurrency(quote.previousClose, quote.currency) },
    { label: "Day Low", value: formatCurrency(quote.dayLow, quote.currency) },
    { label: "Day High", value: formatCurrency(quote.dayHigh, quote.currency) },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p className={styles.exchange}>
            {quote.exchange} · {quote.currency}
          </p>
          <h1>
            {quote.name} <span>({quote.symbol})</span>
          </h1>
          <p className={styles.timestamp}>{formatTimestamp(quote.timestamp)}</p>
        </div>
        <form className={styles.search}>
          <label htmlFor="symbol" className={styles.srOnly}>
            Search for a ticker
          </label>
          <input
            id="symbol"
            name="symbol"
            placeholder="Search ticker e.g. TSLA"
            defaultValue={symbol}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit">Search</button>
        </form>
      </section>

      <section className={styles.watchlist}>
        <p>Quick symbols:</p>
        <ul>
          {WATCHLIST.map((ticker) => (
            <li key={ticker}>
              <Link href={`/?symbol=${ticker}`}>{ticker}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.hero}>
        <div>
          <p className={styles.price}>{formatCurrency(quote.price, quote.currency)}</p>
          <p
            className={changeIsPositive ? styles.positiveChange : styles.negativeChange}
          >
            {quote.change >= 0 ? "+" : ""}
            {formatCurrency(Math.abs(quote.change), quote.currency)} ·
            {formatPercent(quote.changePercent)}
          </p>
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

      <section className={styles.metrics}>
        {stats.map((stat) => (
          <article className={styles.metricCard} key={stat.label}>
            <p className={styles.metricLabel}>{stat.label}</p>
            <p className={styles.metricValue}>{stat.value}</p>
          </article>
        ))}
      </section>

      <section className={styles.fetcherSection}>
        <h2>Interactive fetch</h2>
        <p>Manually request the latest TSLA historical data snapshot from Yahoo Finance.</p>
        <HistoricalFetcher symbol="TSLA" />
      </section>

      <section className={styles.historySection}>
        <div className={styles.historyHeader}>
          <div>
            <h2>Recent closes</h2>
            <p>Historical Yahoo Finance data ({HISTORICAL_RANGE} / {HISTORICAL_INTERVAL})</p>
          </div>
          <Link href={`/api/quote?symbol=${symbol}&history=true`} target="_blank">
            View JSON
          </Link>
        </div>
        {history.length === 0 ? (
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
                {history.slice(-10).reverse().map((bar) => (
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
      </section>

      <section className={styles.newsSection}>
        <div className={styles.newsHeader}>
          <h2>Market headlines</h2>
          <p>Powered by Yahoo Finance RSS feed</p>
        </div>
        <div className={styles.newsGrid}>
          {news.length === 0 && (
            <article className={styles.newsCard}>
              <p>No headlines available for this ticker.</p>
            </article>
          )}
          {news.map((item) => (
            <article key={item.link} className={styles.newsCard}>
              <p className={styles.newsMeta}>
                {new Date(item.pubDate).toLocaleString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  month: "short",
                  day: "numeric",
                })}
                {item.source ? ` · ${item.source}` : null}
              </p>
              <a href={item.link} target="_blank" rel="noreferrer">
                <h3>{item.title}</h3>
              </a>
              {item.description ? (
                <p className={styles.newsDescription}>{item.description}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
