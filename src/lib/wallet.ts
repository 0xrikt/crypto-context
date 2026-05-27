import { createPublicClient, http, formatUnits } from "viem";
import { CHAIN_CONFIGS, ERC20_ABI, type SupportedChain } from "./chains";

export interface WalletHolding {
  asset: string;
  total: number;
  usdValue: number | null;
  source: string;
}

export interface WalletSnapshot {
  address: string;
  chain: SupportedChain;
  holdings: WalletHolding[];
  totalUsdValue: number;
  fetchedAt: string;
}

async function fetchNativePriceUsd(coingeckoId: string): Promise<number> {
  const ids: Record<string, string> = {
    ethereum: "ethereum",
    bsc: "binancecoin",
    polygon: "matic-network",
    arbitrum: "ethereum",
    base: "ethereum",
  };
  const id = ids[coingeckoId] ?? coingeckoId;

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data[id]?.usd ?? 0;
}

async function fetchTokenPricesUsd(
  coingeckoIds: string[]
): Promise<Record<string, number>> {
  if (coingeckoIds.length === 0) return {};

  const ids = [...new Set(coingeckoIds)].join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return {};
  const data = await res.json();

  const prices: Record<string, number> = {};
  for (const id of coingeckoIds) {
    prices[id] = data[id]?.usd ?? 0;
  }
  return prices;
}

export async function fetchWalletPortfolio(
  address: `0x${string}`,
  chain: SupportedChain
): Promise<WalletSnapshot> {
  const config = CHAIN_CONFIGS[chain];
  const client = createPublicClient({
    chain: config.chain,
    transport: http(),
  });

  const holdings: WalletHolding[] = [];
  let totalUsdValue = 0;
  const source = `${chain}:${address.slice(0, 6)}...${address.slice(-4)}`;

  // Fetch native balance
  const nativeBalance = await client.getBalance({ address });
  const nativeAmount = parseFloat(formatUnits(nativeBalance, 18));

  // Fetch ERC-20 balances via multicall
  const tokenCalls = config.tokens.map((token) => ({
    address: token.address,
    abi: ERC20_ABI,
    functionName: "balanceOf" as const,
    args: [address] as const,
  }));

  let tokenBalances: bigint[] = [];
  if (tokenCalls.length > 0) {
    const results = await client.multicall({ contracts: tokenCalls });
    tokenBalances = results.map((r) =>
      r.status === "success" ? (r.result as bigint) : BigInt(0)
    );
  }

  // Fetch all prices in one batch
  const coingeckoIds = config.tokens
    .filter((_, i) => tokenBalances[i] > BigInt(0))
    .map((t) => t.coingeckoId);

  const [nativePrice, tokenPrices] = await Promise.all([
    nativeAmount > 0 ? fetchNativePriceUsd(chain) : Promise.resolve(0),
    fetchTokenPricesUsd(coingeckoIds),
  ]);

  // Add native token
  if (nativeAmount > 0.00001) {
    const usdValue = nativeAmount * nativePrice;
    holdings.push({
      asset: config.nativeSymbol,
      total: nativeAmount,
      usdValue: usdValue > 0 ? usdValue : null,
      source,
    });
    if (usdValue > 0) totalUsdValue += usdValue;
  }

  // Add ERC-20 tokens
  for (let i = 0; i < config.tokens.length; i++) {
    const raw = tokenBalances[i];
    if (!raw || raw === BigInt(0)) continue;

    const token = config.tokens[i];
    const amount = parseFloat(formatUnits(raw, token.decimals));
    if (amount < 0.01) continue;

    const price = tokenPrices[token.coingeckoId] ?? 0;
    const usdValue = amount * price;

    holdings.push({
      asset: token.symbol,
      total: amount,
      usdValue: usdValue > 0 ? usdValue : null,
      source,
    });
    if (usdValue > 0) totalUsdValue += usdValue;
  }

  holdings.sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

  return {
    address,
    chain,
    holdings,
    totalUsdValue,
    fetchedAt: new Date().toISOString(),
  };
}
