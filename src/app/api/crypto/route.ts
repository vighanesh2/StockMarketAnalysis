import { NextResponse } from "next/server";
import { fetchQuote } from "@/lib/finance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols")?.toUpperCase().trim() ?? "";

  if (!symbolsParam) {
    return NextResponse.json(
      { error: "Query parameter `symbols` is required." },
      { status: 400 }
    );
  }

  const symbols = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);

  try {
    const results = await Promise.allSettled(
      symbols.map((symbol) => fetchQuote(symbol))
    );

    const cryptos = results.map((result) =>
      result.status === "fulfilled" ? result.value : null
    );

    return NextResponse.json({ cryptos });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to retrieve cryptocurrency data.",
      },
      { status: 502 }
    );
  }
}

