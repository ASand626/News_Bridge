import { NextRequest, NextResponse } from "next/server";
import { getWeb3Picks, getFinancePicks } from "@/lib/news-providers";

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain") ?? "web3";
  const articles = domain === "finance" ? await getFinancePicks() : await getWeb3Picks();
  return NextResponse.json(articles);
}
