import { XMLParser } from "fast-xml-parser";
import YahooFinance from "yahoo-finance2";

const NEWS_ENDPOINT = "https://feeds.finance.yahoo.com/rss/2.0/headline";

const parser = new XMLParser({ ignoreAttributes: false });
const yahooFinance = new YahooFinance();

const HISTORICAL_CACHE_TTL_MS = 5 * 60 * 1000;
const historicalCache = new Map<string, { expiresAt: number; data: HistoricalBar[] }>();

let yahooRequestQueue: Promise<void> = Promise.resolve();

/**
 * Yahoo's public endpoints can throttle or hang when we open too many
 * connections simultaneously. This simple queue ensures we only have one
 * in-flight Yahoo Finance request at a time, which keeps dev compiles from
 * waiting on several concurrent network calls.
 */
function enqueueYahooCall<T>(task: () => Promise<T>): Promise<T> {
  const nextTask = yahooRequestQueue.then(task);
  yahooRequestQueue = nextTask.then(
    () => undefined,
    () => undefined
  );
  return nextTask;
}

type YahooRssItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  source?: { "#text"?: string } | string;
};

type YahooRssFeed = {
  rss?: {
    channel?: {
      item?: YahooRssItem | YahooRssItem[];
    };
  };
};

type HistoricalEntry = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose?: number;
  volume: number;
};

type QuoteResult = {
  symbol?: string;
  longName?: string;
  shortName?: string;
  currency?: string;
  fullExchangeName?: string;
  exchange?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketDayLow?: number;
  regularMarketDayHigh?: number;
  regularMarketOpen?: number;
  regularMarketPreviousClose?: number;
  regularMarketTime?: Date;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  regularMarketVolume?: number;
  averageVolume?: number;
  averageVolume10days?: number;
  marketCap?: number;
  beta?: number;
  trailingPE?: number;
  forwardPE?: number;
  trailingEps?: number;
  forwardEps?: number;
  earningsDate?: Date | Date[];
  dividendRate?: number;
  dividendYield?: number;
  exDividendDate?: Date;
  targetMeanPrice?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
};

export type QuoteData = {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  dayLow: number | null;
  dayHigh: number | null;
  open: number | null;
  previousClose: number | null;
  timestamp: number | null;
  bid: number | null;
  ask: number | null;
  bidSize: number | null;
  askSize: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  volume: number | null;
  averageVolume: number | null;
  marketCap: number | null;
  beta: number | null;
  trailingPE: number | null;
  trailingEps: number | null;
  earningsDate: string | null;
  dividendRate: number | null;
  dividendYield: number | null;
  exDividendDate: string | null;
  targetMeanPrice: number | null;
};

export type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source?: string;
  description?: string;
};

export type HistoricalBar = {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
};


export async function fetchHistorical(
  symbol: string,
  range: "5d" | "1mo" | "3mo" | "6mo" | "1y" = "1mo",
  _interval: "1d" | "1wk" = "1d"
): Promise<HistoricalBar[]> {
  const normalizedSymbol = symbol.toUpperCase().trim();
  const cacheKey = `${normalizedSymbol}|${range}|${_interval}`;
  const cached = historicalCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const period2 = new Date();
  period2.setDate(period2.getDate() + 1); // Add 1 day to include today's data
  const period1 = new Date();

  switch (range) {
    case "5d":
      period1.setDate(period1.getDate() - 5);
      break;
    case "1mo":
      period1.setMonth(period1.getMonth() - 1);
      break;
    case "3mo":
      period1.setMonth(period1.getMonth() - 3);
      break;
    case "6mo":
      period1.setMonth(period1.getMonth() - 6);
      break;
    case "1y":
      period1.setFullYear(period1.getFullYear() - 1);
      break;
  }

  const results = (await enqueueYahooCall(() =>
    yahooFinance.historical(normalizedSymbol, {
      period1,
      period2,
      interval: _interval,
    }) as Promise<HistoricalEntry[]>
  ));

  const mapped = results.map((entry: HistoricalEntry) => ({
    date: entry.date.toISOString().split("T")[0],
    open: entry.open ?? null,
    high: entry.high ?? null,
    low: entry.low ?? null,
    close: entry.close ?? null,
  }));

  historicalCache.set(cacheKey, {
    expiresAt: Date.now() + HISTORICAL_CACHE_TTL_MS,
    data: mapped,
  });

  return mapped;
}

export async function fetchQuote(symbol: string): Promise<QuoteData> {
  const result = (await enqueueYahooCall(() =>
    yahooFinance.quote(symbol.toUpperCase().trim()) as Promise<QuoteResult>
  ));

  const formatEarningsDate = (date: Date | Date[] | undefined): string | null => {
    if (!date) return null;
    if (Array.isArray(date)) {
      if (date.length === 0) return null;
      return new Date(date[0]).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatExDividendDate = (date: Date | undefined): string | null => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return {
    symbol: result.symbol ?? symbol,
    name:
      result.longName ?? result.shortName ?? result.symbol ?? "Unknown Equity",
    currency: result.currency ?? "USD",
    exchange: result.fullExchangeName ?? result.exchange ?? "",
    price: result.regularMarketPrice ?? 0,
    change: result.regularMarketChange ?? 0,
    changePercent: result.regularMarketChangePercent ?? 0,
    dayLow: result.regularMarketDayLow ?? null,
    dayHigh: result.regularMarketDayHigh ?? null,
    open: result.regularMarketOpen ?? null,
    previousClose: result.regularMarketPreviousClose ?? null,
    timestamp: result.regularMarketTime
      ? Math.floor(result.regularMarketTime.getTime() / 1000)
      : null,
    bid: result.bid ?? null,
    ask: result.ask ?? null,
    bidSize: result.bidSize ?? null,
    askSize: result.askSize ?? null,
    fiftyTwoWeekLow: result.fiftyTwoWeekLow ?? null,
    fiftyTwoWeekHigh: result.fiftyTwoWeekHigh ?? null,
    volume: result.regularMarketVolume ?? result.averageVolume10days ?? null,
    averageVolume: result.averageVolume ?? null,
    marketCap: result.marketCap ?? null,
    beta: result.beta ?? null,
    trailingPE: result.trailingPE ?? null,
    trailingEps: result.trailingEps ?? null,
    earningsDate: formatEarningsDate(result.earningsDate),
    dividendRate: result.dividendRate ?? null,
    dividendYield: result.dividendYield ?? null,
    exDividendDate: formatExDividendDate(result.exDividendDate),
    targetMeanPrice: result.targetMeanPrice ?? null,
  };
}

export async function fetchNews(symbol: string, limit = 8): Promise<NewsItem[]> {
  const url = new URL(NEWS_ENDPOINT);
  url.searchParams.set("s", symbol.toUpperCase());
  url.searchParams.set("region", "US");
  url.searchParams.set("lang", "en-US");

  const response = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Unable to retrieve news feed.");
  }

  const xml = await response.text();
  const feed = parser.parse(xml) as YahooRssFeed;
  const items = feed.rss?.channel?.item ?? [];
  const normalized = (Array.isArray(items) ? items : [items])
    .filter(Boolean)
    .slice(0, limit)
    .map((item) => ({
      title: item?.title ?? "Untitled",
      link: item?.link ?? "#",
      pubDate: item?.pubDate ?? new Date().toISOString(),
      source:
        typeof item?.source === "string"
          ? item.source
          : item?.source?.["#text"] ?? undefined,
      description: item?.description ?? undefined,
    }));

  return normalized;
}
