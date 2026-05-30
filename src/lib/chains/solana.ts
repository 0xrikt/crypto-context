/**
 * Solana wallet portfolio fetcher — dependency-free JSON-RPC over fetch.
 *
 * Mirrors the hand-rolled-client style used elsewhere (GLM, CoinGecko): no SDK,
 * just the documented Solana JSON-RPC. Native SOL via `getBalance`; ALL SPL
 * tokens (classic + Token-2022) via `getTokenAccountsByOwner` with jsonParsed
 * encoding — full coverage, no hardcoded token list. USD values come from
 * CoinGecko keyed by mint; unknown symbols fall back to a truncated mint.
 */
import { SOLANA_RPC_DEFAULT } from "../chains";
import type { WalletHolding, WalletSnapshot } from "../wallet";

const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const LAMPORTS_PER_SOL = 1_000_000_000;
const FETCH_TIMEOUT_MS = 6_000;

/** Human-readable symbols for the most common mints (display only; value is by mint). */
const KNOWN_MINTS: Record<string, string> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "USDT",
  So11111111111111111111111111111111111111112: "SOL",
  "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj": "stSOL",
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: "mSOL",
  J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn: "JitoSOL",
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: "JUP",
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: "BONK",
  EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm: "WIF",
  "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr": "POPCAT",
  HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3: "PYTH",
  jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL: "JTO",
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "RAY",
  orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE: "ORCA",
  rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof: "RENDER",
};

interface ParsedTokenAccount {
  account?: {
    data?: {
      parsed?: {
        info?: {
          mint?: string;
          tokenAmount?: { amount?: string; decimals?: number; uiAmount?: number | null; uiAmountString?: string };
        };
      };
    };
  };
}

async function solanaRpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Solana RPC HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`Solana RPC error: ${json.error?.message ?? "unknown"}`);
  return json.result as T;
}

function truncateMint(mint: string): string {
  return mint.length > 10 ? `${mint.slice(0, 4)}…${mint.slice(-4)}` : mint;
}

/** Fetch SOL price + per-mint prices from CoinGecko. Failures degrade to no price. */
async function fetchSolanaPrices(mints: string[]): Promise<{ sol: number; byMint: Record<string, number> }> {
  const byMint: Record<string, number> = {};
  let sol = 0;

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), cache: "no-store" },
    );
    if (res.ok) {
      const data = await res.json();
      sol = data?.solana?.usd ?? 0;
    }
  } catch (err) {
    console.error("[solana] SOL price failed:", err instanceof Error ? err.message : err);
  }

  // Price tokens by mint, chunked to bound URL length.
  const unique = [...new Set(mints)];
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${chunk.join(",")}&vs_currencies=usd`,
        { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), cache: "no-store" },
      );
      if (!res.ok) continue;
      const data = (await res.json()) as Record<string, { usd?: number }>;
      // CoinGecko may lowercase keys — index case-insensitively.
      for (const [key, val] of Object.entries(data)) {
        if (typeof val?.usd === "number") byMint[key.toLowerCase()] = val.usd;
      }
    } catch (err) {
      console.error("[solana] token prices failed:", err instanceof Error ? err.message : err);
    }
  }

  return { sol, byMint };
}

export async function fetchSolanaPortfolio(address: string): Promise<WalletSnapshot> {
  const rpcUrl = process.env.SOLANA_RPC_URL || SOLANA_RPC_DEFAULT;
  const source = `solana:${address.slice(0, 4)}…${address.slice(-4)}`;

  // Native SOL + token accounts (both token programs) in parallel; each degrades independently.
  const [lamports, classicAccounts, token2022Accounts] = await Promise.all([
    solanaRpc<{ value: number }>(rpcUrl, "getBalance", [address])
      .then((r) => r.value)
      .catch((err) => {
        console.error("[solana] getBalance failed:", err instanceof Error ? err.message : err);
        return 0;
      }),
    solanaRpc<{ value: ParsedTokenAccount[] }>(rpcUrl, "getTokenAccountsByOwner", [
      address,
      { programId: TOKEN_PROGRAM_ID },
      { encoding: "jsonParsed" },
    ])
      .then((r) => r.value)
      .catch(() => [] as ParsedTokenAccount[]),
    solanaRpc<{ value: ParsedTokenAccount[] }>(rpcUrl, "getTokenAccountsByOwner", [
      address,
      { programId: TOKEN_2022_PROGRAM_ID },
      { encoding: "jsonParsed" },
    ])
      .then((r) => r.value)
      .catch(() => [] as ParsedTokenAccount[]),
  ]);

  // Aggregate token balances by mint (a wallet may hold several accounts per mint).
  const byMint = new Map<string, { amount: number; decimals: number }>();
  for (const acct of [...classicAccounts, ...token2022Accounts]) {
    const info = acct.account?.data?.parsed?.info;
    const mint = info?.mint;
    const amt = info?.tokenAmount;
    if (!mint || !amt) continue;
    const amount = amt.uiAmountString ? parseFloat(amt.uiAmountString) : amt.uiAmount ?? 0;
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const existing = byMint.get(mint);
    byMint.set(mint, { amount: (existing?.amount ?? 0) + amount, decimals: amt.decimals ?? 0 });
  }

  const { sol: solPrice, byMint: prices } = await fetchSolanaPrices([...byMint.keys()]);

  const holdings: WalletHolding[] = [];
  let totalUsdValue = 0;

  const solAmount = lamports / LAMPORTS_PER_SOL;
  if (solAmount > 0.00001) {
    const usdValue = solAmount * solPrice;
    holdings.push({ asset: "SOL", total: solAmount, usdValue: usdValue > 0 ? usdValue : null, source });
    if (usdValue > 0) totalUsdValue += usdValue;
  }

  for (const [mint, { amount }] of byMint) {
    const price = prices[mint.toLowerCase()] ?? 0;
    const usdValue = amount * price;
    const symbol = KNOWN_MINTS[mint] ?? (mint === SOL_MINT ? "SOL" : truncateMint(mint));
    holdings.push({ asset: symbol, total: amount, usdValue: usdValue > 0 ? usdValue : null, source });
    if (usdValue > 0) totalUsdValue += usdValue;
  }

  holdings.sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

  return {
    address,
    chain: "solana",
    holdings,
    totalUsdValue,
    fetchedAt: new Date().toISOString(),
  };
}
