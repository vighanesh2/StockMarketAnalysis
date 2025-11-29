import Link from "next/link";
import { MajorIndicesSection } from "@/components/MajorIndicesSection";
import { fetchQuote } from "@/lib/finance";
import type { QuoteData } from "@/lib/finance";
import styles from "./page.module.css";

const MAJOR_INDICES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^RUT", name: "Russell 2000" },
];

export default async function IndicesPage() {
  let indices: (QuoteData | null)[] = [];

  try {
    const results = await Promise.allSettled(
      MAJOR_INDICES.map((index) => fetchQuote(index.symbol))
    );
    indices = results.map((result) =>
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
          <Link href="/indices" className={styles.active}>
            Indices
          </Link>
          <Link href="/crypto">Crypto</Link>
          <Link href="/news">News</Link>
        </nav>
      </div>

      {/* Header */}
      <section className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>Major Indices</h1>
          <p className={styles.timestamp}>Live market data from Yahoo Finance</p>
        </div>
      </section>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <MajorIndicesSection
          initialIndices={indices}
          indicesList={MAJOR_INDICES}
        />
      </div>
    </main>
  );
}

