/**
 * CCXT wrapper for exchange operations.
 * Only read-only operations. No trading, no withdrawals.
 */

import ccxt, { type Exchange, type Balances } from "ccxt";
import { sanitizeExchangeError } from "./security";

export type SupportedExchange =
  | "binance"
  | "okx"
  | "bybit"
  | "coinbase"
  | "kraken"
  | "bitget"
  | "kucoin"
  | "gateio"
  | "htx"
  | "mexc";

/** Exchanges that require a passphrase in addition to API key + secret */
export const PASSPHRASE_EXCHANGES: SupportedExchange[] = ["okx", "bitget", "kucoin"];

export interface ExchangeCredentials {
  apiKey: string;
  secret: string;
  password?: string; // OKX, Bitget, KuCoin require passphrase
}

export interface PortfolioHolding {
  asset: string;
  free: number;
  locked: number;
  total: number;
  usdValue: number | null;
}

export interface PortfolioSnapshot {
  exchange: SupportedExchange;
  holdings: PortfolioHolding[];
  totalUsdValue: number;
  fetchedAt: string;
}

const EXCHANGE_CLASSES: Record<SupportedExchange, new (config: object) => Exchange> = {
  binance: ccxt.binance,
  okx: ccxt.okx,
  bybit: ccxt.bybit,
  coinbase: ccxt.coinbase,
  kraken: ccxt.kraken,
  bitget: ccxt.bitget,
  kucoin: ccxt.kucoin,
  gateio: ccxt.gateio,
  htx: ccxt.htx,
  mexc: ccxt.mexc,
};

/**
 * Exchange-specific options for CCXT initialization.
 * Some exchanges need different config for their V2 APIs or specific account types.
 */
const EXCHANGE_OPTIONS: Partial<Record<SupportedExchange, object>> = {
  bitget: {
    defaultType: "spot",
    broker: "ccxt",
  },
  okx: {
    defaultType: "spot",
  },
  kucoin: {
    defaultType: "spot",
    versions: { public: { GET: { "api/v1/timestamp": "v1" } } },
  },
};

export function createExchangeInstance(
  exchangeId: SupportedExchange,
  credentials: ExchangeCredentials
): Exchange {
  const ExchangeClass = EXCHANGE_CLASSES[exchangeId];
  if (!ExchangeClass) {
    throw new Error(`Unsupported exchange: ${exchangeId}`);
  }

  const exchangeOptions = EXCHANGE_OPTIONS[exchangeId] ?? { defaultType: "spot" };

  return new ExchangeClass({
    apiKey: credentials.apiKey,
    secret: credentials.secret,
    password: credentials.password,
    enableRateLimit: true,
    timeout: 15000, // 15s timeout to avoid Vercel function timeout
    options: exchangeOptions,
  });
}

/**
 * Verify that API key has ONLY read permissions.
 * Calls fetchBalance to confirm key can read.
 * Returns sanitized error messages — NEVER raw CCXT errors.
 */
export async function verifyReadOnly(
  exchangeId: SupportedExchange,
  credentials: ExchangeCredentials
): Promise<{ valid: boolean; readOnly: boolean; error?: string }> {
  try {
    const exchange = createExchangeInstance(exchangeId, credentials);

    // Test: can we read balances? (should succeed for valid read-only keys)
    await exchange.fetchBalance();

    // Key is valid and can read. Exchange-side permission enforcement
    // is the real guard against trade/withdraw operations.
    return { valid: true, readOnly: true };
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : String(err);

    // Log raw error server-side for debugging (no credentials!)
    console.error(`[exchange] verifyReadOnly failed for ${exchangeId}: ${rawMessage}`);

    // Return SANITIZED error to client
    return {
      valid: false,
      readOnly: false,
      error: sanitizeExchangeError(rawMessage, exchangeId),
    };
  }
}

/**
 * Fetch portfolio balances from an exchange.
 */
export async function fetchPortfolio(
  exchangeId: SupportedExchange,
  credentials: ExchangeCredentials
): Promise<PortfolioSnapshot> {
  const exchange = createExchangeInstance(exchangeId, credentials);

  const balances: Balances = await exchange.fetchBalance();

  // Filter out zero balances and build holdings list
  const holdings: PortfolioHolding[] = [];
  let totalUsdValue = 0;

  for (const [asset, balance] of Object.entries(balances.total)) {
    const total = balance as number;
    if (total <= 0) continue;

    const freeMap = balances.free as unknown as Record<string, number>;
    const usedMap = balances.used as unknown as Record<string, number>;
    const free = freeMap[asset] || 0;
    const locked = usedMap[asset] || 0;

    // Try to get USD value via ticker
    let usdValue: number | null = null;
    if (asset === "USDT" || asset === "USDC" || asset === "USD" || asset === "BUSD") {
      usdValue = total;
    } else {
      try {
        const ticker = await exchange.fetchTicker(`${asset}/USDT`);
        if (ticker.last) {
          usdValue = total * ticker.last;
        }
      } catch {
        // No USDT pair available, try USD
        try {
          const ticker = await exchange.fetchTicker(`${asset}/USD`);
          if (ticker.last) {
            usdValue = total * ticker.last;
          }
        } catch {
          // Can't price this asset
        }
      }
    }

    if (usdValue !== null) {
      totalUsdValue += usdValue;
    }

    holdings.push({ asset, free, locked, total, usdValue });
  }

  // Sort by USD value descending
  holdings.sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

  return {
    exchange: exchangeId,
    holdings,
    totalUsdValue,
    fetchedAt: new Date().toISOString(),
  };
}
