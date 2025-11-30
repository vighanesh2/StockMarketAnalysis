import Link from "next/link";
import { StockQuoteSection } from "@/components/StockQuoteSection";
import { HistoricalSnapshot } from "@/components/HistoricalSnapshot";
import { fetchHistorical, fetchQuote } from "@/lib/finance";
import type { HistoricalBar, QuoteData } from "@/lib/finance";
import styles from "./page.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

type HomeProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

const DEFAULT_SYMBOL = "TSLA";
const WATCHLIST = ["TSLA", "AAPL", "MSFT", "NVDA", "SPY", "AMZN", "META", "GOOGL"];
const HISTORICAL_RANGES = ["5d", "1mo", "3mo", "6mo", "1y"] as const;
type HistoricalRange = (typeof HISTORICAL_RANGES)[number];
const DEFAULT_RANGE: HistoricalRange = "5d";

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

function formatDate(dateStr: string) {
  // Parse as local date to avoid timezone shift
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedSymbol = Array.isArray(resolvedSearchParams.symbol)
    ? resolvedSearchParams.symbol[0]
    : resolvedSearchParams.symbol;
  const requestedRange = Array.isArray(resolvedSearchParams.range)
    ? resolvedSearchParams.range[0]
    : resolvedSearchParams.range;
  const isValidRange = (
    value: string | undefined
  ): value is HistoricalRange =>
    value != null && HISTORICAL_RANGES.includes(value as HistoricalRange);
  const symbol = (requestedSymbol ?? DEFAULT_SYMBOL).toUpperCase().trim();
  const range: HistoricalRange = isValidRange(requestedRange)
    ? requestedRange
    : DEFAULT_RANGE;

  let error: string | null = null;
  let quote: QuoteData | null = null;
  let history: HistoricalBar[] = [];

  try {
    [quote, history] = await Promise.all([
      fetchQuote(symbol),
      fetchHistorical(symbol, range, "1d"),
    ]);
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


  return (
    <main className={styles.page}>
      {/* Top Navigation */}
      <div className={styles.topBar}>
        <Link href="/" className={styles.logo}>
          Stock<span>Market</span>
        </Link>
        <nav className={styles.nav}>
          <Link href="/" className={styles.active}>
            Home
          </Link>
          <Link href="/indices">Indices</Link>
          <Link href="/crypto">Crypto</Link>
          <Link href={`/news?symbol=${symbol}`}>News</Link>
        </nav>
      </div>

      {/* Header with Ticker Info */}
      <section className={styles.header}>
        <div className={styles.tickerInfo}>
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
            placeholder="Enter symbol..."
            defaultValue={symbol}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit">Search</button>
        </form>
      </section>

      {/* Watchlist */}
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

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Quick Links Section */}
        <section className={styles.quickLinksSection}>
          <div className={styles.quickLinksGrid}>
            <Link href="/indices" className={styles.quickLinkCard}>
              <h3>Major Indices</h3>
              <p>View S&P 500, Dow Jones, NASDAQ, and more</p>
              <span className={styles.quickLinkArrow}>→</span>
            </Link>
            <Link href="/crypto" className={styles.quickLinkCard}>
              <h3>Cryptocurrency</h3>
              <p>Track Bitcoin, Ethereum, and popular cryptos</p>
              <span className={styles.quickLinkArrow}>→</span>
            </Link>
            <Link href={`/news?symbol=${symbol}`} className={styles.quickLinkCard}>
              <h3>News</h3>
              <p>Latest news and headlines</p>
              <span className={styles.quickLinkArrow}>→</span>
            </Link>
          </div>
        </section>

        {/* Stock Quote Section */}
        <StockQuoteSection initialQuote={quote} symbol={symbol} />

        {/* Historical Snapshot */}
        <HistoricalSnapshot
          symbol={symbol}
          currency={quote.currency}
          initialRange={range}
          initialHistory={history}
        />

        {/* News Link Section */}
        <section className={styles.newsLinkSection}>
          <div className={styles.newsLinkHeader}>
            <h2>News</h2>
            <Link href={`/news?symbol=${symbol}`} className={styles.newsLink}>
              View All News →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
