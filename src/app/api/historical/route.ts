import { NextResponse } from "next/server";
import { fetchHistorical } from "@/lib/finance";

const RANGE_OPTIONS = ["5d", "1mo", "3mo", "6mo", "1y"] as const;
type AllowedRange = (typeof RANGE_OPTIONS)[number];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase().trim() ?? "";
  const requestedRange = searchParams.get("range") as AllowedRange | null;
  const range: AllowedRange = RANGE_OPTIONS.includes(requestedRange ?? "1mo")
    ? (requestedRange as AllowedRange)
    : "1mo";

  if (!symbol) {
    return NextResponse.json(
      { error: "Query parameter `symbol` is required." },
      { status: 400 }
    );
  }

  try {
    const history = await fetchHistorical(symbol, range, "1d");
    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to retrieve historical data.",
      },
      { status: 502 }
    );
  }
}
