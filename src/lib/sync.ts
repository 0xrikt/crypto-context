import { createExchangeInstance, type SupportedExchange, type ExchangeCredentials } from "./exchange";
import {
  detectCapabilities,
  fetchTradeHistory,
  fetchOrderHistory,
  fetchOpenOrdersList,
  fetchTransferHistory,
  type TradeRecord,
  type OrderRecord,
  type TransferRecord,
  type ExchangeCapabilities,
} from "./exchange-history";
import { generateTradingProfile } from "./generators/trading-profile";
import { generateFundFlow } from "./generators/fund-flow";
import { decrypt } from "./crypto";

export interface SyncResult {
  connectionId: string;
  exchange: string;
  tradingProfile: { success: boolean; tradeCount: number; error: string | null };
  fundFlow: { success: boolean; transferCount: number; error: string | null };
  capabilities: ExchangeCapabilities;
  durationMs: number;
}

interface ConnectionData {
  id: string;
  exchange: string;
  encrypted_key: string;
  encrypted_secret: string;
  encrypted_password: string | null;
}

export async function syncExchangeContext(
  connection: ConnectionData,
  userId: string,
  upsertFn: (
    userId: string,
    connectionId: string,
    dimension: string,
    content: string,
    metadata: Record<string, unknown>,
  ) => Promise<void>,
): Promise<SyncResult> {
  const startTime = Date.now();
  const exchangeId = connection.exchange as SupportedExchange;

  const credentials: ExchangeCredentials = {
    apiKey: decrypt(connection.encrypted_key),
    secret: decrypt(connection.encrypted_secret),
    password: connection.encrypted_password
      ? decrypt(connection.encrypted_password)
      : undefined,
  };

  const exchange = createExchangeInstance(exchangeId, credentials);

  try {
    await exchange.loadMarkets();
  } catch (err) {
    console.error(`[sync] loadMarkets failed for ${exchangeId}:`, err instanceof Error ? err.message : "unknown");
  }

  const capabilities = detectCapabilities(exchange);

  // Fetch portfolio holdings for symbol list (needed for per-symbol trade fetching)
  let holdings: Array<{ asset: string }> = [];
  try {
    const balances = await exchange.fetchBalance();
    holdings = Object.entries(balances.total)
      .filter(([, amount]) => (amount as number) > 0)
      .map(([asset]) => ({ asset }));
  } catch {
    // If balance fetch fails, we'll try trades without symbol list
  }

  const result: SyncResult = {
    connectionId: connection.id,
    exchange: exchangeId,
    tradingProfile: { success: false, tradeCount: 0, error: null },
    fundFlow: { success: false, transferCount: 0, error: null },
    capabilities,
    durationMs: 0,
  };

  // Fetch trading data
  let trades: TradeRecord[] = [];
  let closedOrders: OrderRecord[] = [];
  let openOrders: OrderRecord[] = [];

  try {
    const [tradeResult, orderResult, openResult] = await Promise.all([
      fetchTradeHistory(exchange, holdings),
      fetchOrderHistory(exchange, holdings),
      fetchOpenOrdersList(exchange),
    ]);

    trades = tradeResult.data;
    closedOrders = orderResult.data;
    openOrders = openResult.data;

    const { markdown, metadata } = generateTradingProfile(
      trades,
      closedOrders,
      openOrders,
      exchangeId,
    );

    await upsertFn(userId, connection.id, "trading_profile", markdown, metadata);

    result.tradingProfile = {
      success: true,
      tradeCount: trades.length,
      error: tradeResult.error,
    };
  } catch (err) {
    result.tradingProfile.error = err instanceof Error ? err.message : "unknown";
    console.error(`[sync] Trading profile failed for ${exchangeId}:`, result.tradingProfile.error);
  }

  // Fetch fund flow data
  try {
    const transferResult = await fetchTransferHistory(exchange);

    const { markdown, metadata } = generateFundFlow(
      transferResult.data,
      exchangeId,
    );

    await upsertFn(userId, connection.id, "fund_flow", markdown, metadata);

    result.fundFlow = {
      success: true,
      transferCount: transferResult.data.length,
      error: transferResult.error,
    };
  } catch (err) {
    result.fundFlow.error = err instanceof Error ? err.message : "unknown";
    console.error(`[sync] Fund flow failed for ${exchangeId}:`, result.fundFlow.error);
  }

  result.durationMs = Date.now() - startTime;
  return result;
}
