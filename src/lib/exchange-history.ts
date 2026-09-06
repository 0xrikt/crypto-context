import { withTimeout } from "./timeout";
import type { Exchange, Trade, Order, Transaction } from "ccxt";
import { createExchangeInstance } from "./exchange";

export interface TradeRecord {
  id: string;
  timestamp: number;
  symbol: string;
  side: "buy" | "sell";
  price: number;
  amount: number;
  cost: number;
  fee: number;
  feeCurrency: string;
  takerOrMaker: string;
}

export interface OrderRecord {
  id: string;
  timestamp: number;
  symbol: string;
  type: string;
  side: "buy" | "sell";
  price: number;
  amount: number;
  filled: number;
  remaining: number;
  cost: number;
  status: string;
}

export interface TransferRecord {
  id: string;
  timestamp: number;
  type: "deposit" | "withdrawal";
  currency: string;
  amount: number;
  fee: number;
  status: string;
  txid: string | null;
}

export interface ExchangeCapabilities {
  fetchMyTrades: boolean;
  fetchClosedOrders: boolean;
  fetchOpenOrders: boolean;
  fetchDeposits: boolean;
  fetchWithdrawals: boolean;
}

export interface HistoryFetchResult<T> {
  data: T[];
  complete: boolean;
  error: string | null;
}

/**
 * How much to trust a history fetch. Generators use this to distinguish
 * "no activity" from "couldn't look" — conflating the two misleads the AI
 * that reads the resulting context.
 */
export interface FetchQuality {
  /** The exchange API exposes this data type at all. */
  supported: boolean;
  /** The fetch finished without hitting a page/time limit. */
  complete: boolean;
  error: string | null;
}

export function toFetchQuality<T>(
  supported: boolean,
  result: HistoryFetchResult<T>,
): FetchQuality {
  return { supported, complete: result.complete, error: result.error };
}

const PAGE_SIZE = 100;
const MAX_PAGES = 20;
const MAX_FETCH_TIME_MS = 45_000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export function detectCapabilities(exchange: Exchange): ExchangeCapabilities {
  return {
    fetchMyTrades: !!exchange.has["fetchMyTrades"],
    fetchClosedOrders: !!exchange.has["fetchClosedOrders"],
    fetchOpenOrders: !!exchange.has["fetchOpenOrders"],
    fetchDeposits: !!exchange.has["fetchDeposits"],
    fetchWithdrawals: !!exchange.has["fetchWithdrawals"],
  };
}

async function fetchPaginated<T>(
  fetchFn: (since: number, limit: number) => Promise<T[]>,
  since: number,
  getTimestamp: (item: T) => number,
  deadline = Date.now() + MAX_FETCH_TIME_MS,
): Promise<HistoryFetchResult<T>> {
  const all: T[] = [];
  let cursor = since;
  const startTime = Date.now();

  for (let page = 0; page < MAX_PAGES; page++) {
    if (Date.now() >= deadline || Date.now() - startTime > MAX_FETCH_TIME_MS) {
      return { data: all, complete: false, error: "time limit reached" };
    }

    try {
      const batch = await withTimeout(fetchFn(cursor, PAGE_SIZE), Math.min(deadline - Date.now(), MAX_FETCH_TIME_MS - (Date.now() - startTime)));
      if (!batch) return { data: all, complete: false, error: "time limit reached" };
      if (batch.length === 0) return { data: all, complete: true, error: null };

      all.push(...batch);
      const lastTimestamp = getTimestamp(batch[batch.length - 1]);
      cursor = lastTimestamp + 1;

      if (batch.length < PAGE_SIZE) return { data: all, complete: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      return { data: all, complete: false, error: msg };
    }
  }

  return { data: all, complete: false, error: "page limit reached" };
}

function toTradeRecord(t: Trade): TradeRecord {
  return {
    id: t.id ?? `${t.timestamp}-${t.symbol}`,
    timestamp: t.timestamp ?? 0,
    symbol: t.symbol ?? "",
    side: t.side as "buy" | "sell",
    price: t.price ?? 0,
    amount: t.amount ?? 0,
    cost: t.cost ?? 0,
    fee: t.fee?.cost ?? 0,
    feeCurrency: t.fee?.currency ?? "",
    takerOrMaker: ((t as unknown as Record<string, unknown>).takerOrMaker as string) ?? "unknown",
  };
}

function toOrderRecord(o: Order): OrderRecord {
  return {
    id: o.id ?? "",
    timestamp: o.timestamp ?? 0,
    symbol: o.symbol ?? "",
    type: o.type ?? "unknown",
    side: o.side as "buy" | "sell",
    price: o.price ?? 0,
    amount: o.amount ?? 0,
    filled: o.filled ?? 0,
    remaining: o.remaining ?? 0,
    cost: o.cost ?? 0,
    status: o.status ?? "unknown",
  };
}

function toTransferRecord(t: Transaction, type: "deposit" | "withdrawal"): TransferRecord {
  return {
    id: t.id ?? `${t.timestamp}-${t.currency}`,
    timestamp: t.timestamp ?? 0,
    type,
    currency: t.currency ?? "",
    amount: t.amount ?? 0,
    fee: t.fee?.cost ?? 0,
    status: t.status ?? "unknown",
    txid: t.txid ?? null,
  };
}

function getSymbolsFromHoldings(holdings: Array<{ asset: string }>): string[] {
  const stablecoins = new Set(["USDT", "USDC", "USD", "BUSD", "DAI", "TUSD"]);
  return holdings
    .filter((h) => !stablecoins.has(h.asset))
    .map((h) => `${h.asset}/USDT`);
}

export async function fetchTradeHistory(
  exchange: Exchange,
  holdings: Array<{ asset: string }>,
  since?: number,
  deadline = Date.now() + MAX_FETCH_TIME_MS,
): Promise<HistoryFetchResult<TradeRecord>> {
  if (!exchange.has["fetchMyTrades"]) {
    return { data: [], complete: true, error: "not supported" };
  }

  if (Date.now() >= deadline) return {data:[],complete:false,error:"time limit reached"};
  const sinceTs = since ?? Date.now() - NINETY_DAYS_MS;
  const allTrades: TradeRecord[] = [];
  let hitError: string | null = null;
  const startTime = Date.now();

  // Try fetching without symbol first (some exchanges support it)
  try {
    const result = await fetchPaginated<Trade>(
      (s, l) => exchange.fetchMyTrades(undefined, s, l),
      sinceTs,
      (t) => t.timestamp ?? 0,
      deadline,
    );
    if (result.data.length > 0 || result.complete) {
      return {
        data: result.data.map(toTradeRecord),
        complete: result.complete,
        error: result.error,
      };
    }
    hitError = result.error;
  } catch {
    // Symbol required — fall back to per-symbol fetching
  }

  // Per-symbol fetching for exchanges that require it
  const symbols = getSymbolsFromHoldings(holdings);
  hitError = "Partial history: scanned current holdings only; sold assets and other quote currencies may be missing";
  for (const symbol of symbols) {
    if (Date.now() >= deadline || Date.now() - startTime > MAX_FETCH_TIME_MS) {
      hitError = "time limit reached";
      break;
    }

    try {
      const result = await fetchPaginated<Trade>(
        (s, l) => exchange.fetchMyTrades(symbol, s, l),
        sinceTs,
        (t) => t.timestamp ?? 0,
      deadline,
      );
      allTrades.push(...result.data.map(toTradeRecord));
      if (!result.complete) hitError = result.error ?? "Incomplete history";
    } catch {
      // Symbol might not exist on this exchange — skip
    }
  }

  allTrades.sort((a, b) => a.timestamp - b.timestamp);
  return { data: allTrades, complete: hitError === null, error: hitError };
}

export async function fetchOrderHistory(
  exchange: Exchange,
  holdings: Array<{ asset: string }>,
  since?: number,
  deadline = Date.now() + MAX_FETCH_TIME_MS,
): Promise<HistoryFetchResult<OrderRecord>> {
  if (!exchange.has["fetchClosedOrders"]) {
    return { data: [], complete: true, error: "not supported" };
  }

  if (Date.now() >= deadline) return {data:[],complete:false,error:"time limit reached"};
  const sinceTs = since ?? Date.now() - NINETY_DAYS_MS;
  const allOrders: OrderRecord[] = [];
  let hitError: string | null = null;
  const startTime = Date.now();

  // Try without symbol first
  try {
    const result = await fetchPaginated<Order>(
      (s, l) => exchange.fetchClosedOrders(undefined, s, l),
      sinceTs,
      (o) => o.timestamp ?? 0,
      deadline,
    );
    if (result.data.length > 0 || result.complete) {
      return {
        data: result.data.map(toOrderRecord),
        complete: result.complete,
        error: result.error,
      };
    }
    hitError = result.error;
  } catch {
    // Fall back to per-symbol
  }

  const symbols = getSymbolsFromHoldings(holdings);
  hitError = "Partial history: scanned current holdings only; sold assets and other quote currencies may be missing";
  for (const symbol of symbols) {
    if (Date.now() >= deadline || Date.now() - startTime > MAX_FETCH_TIME_MS) {
      hitError = "time limit reached";
      break;
    }

    try {
      const result = await fetchPaginated<Order>(
        (s, l) => exchange.fetchClosedOrders(symbol, s, l),
        sinceTs,
        (o) => o.timestamp ?? 0,
      deadline,
      );
      allOrders.push(...result.data.map(toOrderRecord));
      if (!result.complete) hitError = result.error ?? "Incomplete history";
    } catch {
      // Skip unavailable symbols
    }
  }

  allOrders.sort((a, b) => a.timestamp - b.timestamp);
  return { data: allOrders, complete: hitError === null, error: hitError };
}

export async function fetchOpenOrdersList(
  exchange: Exchange,
  deadline = Date.now() + MAX_FETCH_TIME_MS,
): Promise<HistoryFetchResult<OrderRecord>> {
  if (!exchange.has["fetchOpenOrders"]) {
    return { data: [], complete: true, error: "not supported" };
  }

  try {
    if (Date.now() >= deadline) return {data:[],complete:false,error:"time limit reached"};
    const orders = await withTimeout(exchange.fetchOpenOrders(), deadline - Date.now());
    if (!orders) return {data:[],complete:false,error:"time limit reached"};
    return {
      data: orders.map(toOrderRecord),
      complete: true,
      error: null,
    };
  } catch (err) {
    return {
      data: [],
      complete: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function fetchTransferHistory(
  exchange: Exchange,
  since?: number,
  deadline = Date.now() + MAX_FETCH_TIME_MS,
): Promise<HistoryFetchResult<TransferRecord>> {
  if (Date.now() >= deadline) return {data:[],complete:false,error:"time limit reached"};
  const sinceTs = since ?? Date.now() - NINETY_DAYS_MS;
  const allTransfers: TransferRecord[] = [];
  let hitError: string | null = null;

  if (exchange.has["fetchDeposits"]) {
    try {
      const result = await fetchPaginated<Transaction>(
        (s, l) => exchange.fetchDeposits(undefined, s, l),
        sinceTs,
        (t) => t.timestamp ?? 0,
      deadline,
      );
      allTransfers.push(...result.data.map((t) => toTransferRecord(t, "deposit")));
      if (!result.complete) hitError = result.error ?? "Incomplete history";
    } catch (err) {
      hitError = err instanceof Error ? err.message : "unknown";
    }
  }

  if (exchange.has["fetchWithdrawals"]) {
    try {
      const result = await fetchPaginated<Transaction>(
        (s, l) => exchange.fetchWithdrawals(undefined, s, l),
        sinceTs,
        (t) => t.timestamp ?? 0,
      deadline,
      );
      allTransfers.push(...result.data.map((t) => toTransferRecord(t, "withdrawal")));
      if (!result.complete) hitError = hitError ?? result.error;
    } catch (err) {
      hitError = hitError ?? (err instanceof Error ? err.message : "unknown");
    }
  }

  allTransfers.sort((a, b) => a.timestamp - b.timestamp);
  return { data: allTransfers, complete: hitError === null, error: hitError };
}

export { createExchangeInstance };
