import Link from "next/link";
import { CryptocurrencySection } from "@/components/CryptocurrencySection";
import { fetchQuote } from "@/lib/finance";
import type { QuoteData } from "@/lib/finance";
import styles from "./page.module.css";

const POPULAR_CRYPTOS = [
  { symbol: "BTC-USD", name: "Bitcoin" },
  { symbol: "ETH-USD", name: "Ethereum" },
  { symbol: "BNB-USD", name: "BNB" },
  { symbol: "SOL-USD", name: "Solana" },
  { symbol: "XRP-USD", name: "XRP" },
  { symbol: "ADA-USD", name: "Cardano" },
  { symbol: "DOGE-USD", name: "Dogecoin" },
  { symbol: "AVAX-USD", name: "Avalanche" },
];

export default async function CryptoPage() {
  let cryptos: (QuoteData | null)[] = [];

  try {
    const results = await Promise.allSettled(
      POPULAR_CRYPTOS.map((crypto) => fetchQuote(crypto.symbol))
    );
    cryptos = results.map((result) =>
      result.status === "fulfilled" ? result.value : null
    );
  } catch (err) {
    // Handle error silently, will show empty state
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
          <Link href="/crypto" className={styles.active}>
            Crypto
          </Link>
          <Link href="/news">News</Link>
        </nav>
      </div>

      {/* Header */}
      <section className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>Cryptocurrency</h1>
          <p className={styles.timestamp}>Live market data from Yahoo Finance</p>
        </div>
      </section>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <CryptocurrencySection
          initialCryptos={cryptos}
          cryptoList={POPULAR_CRYPTOS}
        />
      </div>
    </main>
  );
}

