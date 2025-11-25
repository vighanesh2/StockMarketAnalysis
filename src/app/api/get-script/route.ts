import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export async function POST(req: Request) {
  try {
    const { symbol, fromDate, toDate } = (await req.json()) as {
      symbol?: string;
      fromDate?: string;
      toDate?: string;
    };

    if (!symbol || !fromDate || !toDate) {
      return NextResponse.json(
        { error: "symbol, fromDate, and toDate are required" },
        { status: 400 }
      );
    }

    const period1 = new Date(fromDate);
    if (Number.isNaN(period1.getTime())) {
      throw new Error("Invalid fromDate value");
    }
    period1.setDate(period1.getDate() - 1);

    const period2 = new Date(toDate);
    if (Number.isNaN(period2.getTime())) {
      throw new Error("Invalid toDate value");
    }

    const results = await yahooFinance.historical(symbol, {
      period1,
      period2,
      interval: "1d",
    });

    const data = results.map((entry) => ({
      date: entry.date.toISOString().split("T")[0],
      open: entry.open,
      high: entry.high,
      low: entry.low,
      close: entry.close,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("❌ Yahoo Finance Error:", error);
    return NextResponse.json({ error: "Yahoo Finance API failed" }, { status: 500 });
  }
}
