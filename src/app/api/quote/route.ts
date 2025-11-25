import { NextResponse } from "next/server";
import { fetchHistorical, fetchQuote } from "@/lib/finance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase().trim() ?? "";
  const includeHistory = searchParams.get("history") === "true";
  const range = (searchParams.get("range") as
    | "5d"
    | "1mo"
    | "3mo"
    | "6mo"
    | "1y"
    | null) ?? "1mo";
  const interval = (searchParams.get("interval") as "1d" | "1wk" | null) ?? "1d";

  if (!symbol) {
    return NextResponse.json(
      { error: "Query parameter `symbol` is required." },
      { status: 400 }
    );
  }

  try {
    const [quote, history] = await Promise.all([
      fetchQuote(symbol),
      includeHistory ? fetchHistorical(symbol, range, interval) : Promise.resolve(null),
    ]);
    return NextResponse.json({ quote, history });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to retrieve market data.",
      },
      { status: 502 }
    );
  }
}
