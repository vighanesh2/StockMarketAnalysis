import Link from "next/link";
import { fetchNews, fetchQuote } from "@/lib/finance";
import type { NewsItem, QuoteData } from "@/lib/finance";
import styles from "./page.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

type NewsPageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

const DEFAULT_SYMBOL = "TSLA";

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedSymbol = Array.isArray(resolvedSearchParams.symbol)
    ? resolvedSearchParams.symbol[0]
    : resolvedSearchParams.symbol;

  const symbol = (requestedSymbol ?? DEFAULT_SYMBOL).toUpperCase().trim();

  let error: string | null = null;
  let quote: QuoteData | null = null;
  let news: NewsItem[] = [];

  try {
    const [resolvedQuote, resolvedNews] = await Promise.all([
      fetchQuote(symbol),
      fetchNews(symbol, 50), // Fetch more news items for the dedicated news page
    ]);
    quote = resolvedQuote;
    news = resolvedNews;
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Unable to retrieve news data at this time.";
  }

  if (!quote) {
    return (
      <main className={styles.page}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.logo}>
            Stock<span>Market</span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href="/news" className={styles.active}>
              News
            </Link>
          </nav>
        </div>
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
          <Link href="/">Home</Link>
          <Link href="/indices">Indices</Link>
          <Link href="/crypto">Crypto</Link>
          <Link href="/news" className={styles.active}>
            News
          </Link>
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
          <p className={styles.timestamp}>News from Yahoo Finance</p>
        </div>
        <form className={styles.search} action="/news" method="get">
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

      {/* News Section */}
      <div className={styles.mainContent}>
        <section className={styles.newsSection}>
          <div className={styles.newsHeader}>
            <h2>News</h2>
            <p>Yahoo Finance</p>
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
                    year: "numeric",
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
      </div>
    </main>
  );
}

