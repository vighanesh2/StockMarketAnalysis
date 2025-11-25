import { NextResponse } from "next/server";
import { fetchNews } from "@/lib/finance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase().trim() ?? "";
  const limit = Number(searchParams.get("limit") ?? 8);

  if (!symbol) {
    return NextResponse.json(
      { error: "Query parameter `symbol` is required." },
      { status: 400 }
    );
  }

  try {
    const news = await fetchNews(symbol, Number.isFinite(limit) ? limit : 8);
    return NextResponse.json({ news });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to retrieve news feed.",
      },
      { status: 502 }
    );
  }
}
