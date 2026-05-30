import { type Chain, mainnet, bsc, polygon, arbitrum, base, optimism, avalanche } from "viem/chains";

export interface ChainConfig {
  chain: Chain;
  /** Explicit RPC URL — cloud-friendly, avoids slow/blocked defaults */
  rpcUrl: string;
  nativeSymbol: string;
  coingeckoPlatformId: string;
  tokens: TokenConfig[];
}

export interface TokenConfig {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  coingeckoId: string;
}

const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export { ERC20_ABI };

export type SupportedChain = "ethereum" | "bsc" | "polygon" | "arbitrum" | "base" | "optimism" | "avalanche";

export const CHAIN_CONFIGS: Record<SupportedChain, ChainConfig> = {
  ethereum: {
    chain: mainnet,
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    nativeSymbol: "ETH",
    coingeckoPlatformId: "ethereum",
    tokens: [
      { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", decimals: 6, coingeckoId: "tether" },
      { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
      { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", decimals: 8, coingeckoId: "wrapped-bitcoin" },
      { address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", symbol: "LINK", decimals: 18, coingeckoId: "chainlink" },
      { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", symbol: "UNI", decimals: 18, coingeckoId: "uniswap" },
      { address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", symbol: "AAVE", decimals: 18, coingeckoId: "aave" },
    ],
  },
  bsc: {
    chain: bsc,
    rpcUrl: "https://bsc-rpc.publicnode.com",
    nativeSymbol: "BNB",
    coingeckoPlatformId: "binance-smart-chain",
    tokens: [
      { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", decimals: 18, coingeckoId: "tether" },
      { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", symbol: "USDC", decimals: 18, coingeckoId: "usd-coin" },
      { address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", symbol: "ETH", decimals: 18, coingeckoId: "ethereum" },
      { address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", symbol: "BTCB", decimals: 18, coingeckoId: "binance-bitcoin" },
    ],
  },
  polygon: {
    chain: polygon,
    rpcUrl: "https://polygon-bor-rpc.publicnode.com",
    nativeSymbol: "POL",
    coingeckoPlatformId: "polygon-pos",
    tokens: [
      { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", decimals: 6, coingeckoId: "tether" },
      { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
      { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", symbol: "WETH", decimals: 18, coingeckoId: "ethereum" },
      { address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", symbol: "WBTC", decimals: 8, coingeckoId: "wrapped-bitcoin" },
    ],
  },
  arbitrum: {
    chain: arbitrum,
    rpcUrl: "https://arbitrum-one-rpc.publicnode.com",
    nativeSymbol: "ETH",
    coingeckoPlatformId: "arbitrum-one",
    tokens: [
      { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", symbol: "USDT", decimals: 6, coingeckoId: "tether" },
      { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
      { address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", symbol: "WBTC", decimals: 8, coingeckoId: "wrapped-bitcoin" },
      { address: "0x912CE59144191C1204E64559FE8253a0e49E6548", symbol: "ARB", decimals: 18, coingeckoId: "arbitrum" },
    ],
  },
  base: {
    chain: base,
    rpcUrl: "https://base-rpc.publicnode.com",
    nativeSymbol: "ETH",
    coingeckoPlatformId: "base",
    tokens: [
      { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
      { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, coingeckoId: "ethereum" },
      { address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", symbol: "DAI", decimals: 18, coingeckoId: "dai" },
    ],
  },
  optimism: {
    chain: optimism,
    rpcUrl: "https://optimism-rpc.publicnode.com",
    nativeSymbol: "ETH",
    coingeckoPlatformId: "optimistic-ethereum",
    tokens: [
      { address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
      { address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", symbol: "USDT", decimals: 6, coingeckoId: "tether" },
      { address: "0x4200000000000000000000000000000000000042", symbol: "OP", decimals: 18, coingeckoId: "optimism" },
      { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, coingeckoId: "ethereum" },
      { address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095", symbol: "WBTC", decimals: 8, coingeckoId: "wrapped-bitcoin" },
    ],
  },
  avalanche: {
    chain: avalanche,
    rpcUrl: "https://avalanche-c-chain-rpc.publicnode.com",
    nativeSymbol: "AVAX",
    coingeckoPlatformId: "avalanche",
    tokens: [
      { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
      { address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", symbol: "USDT", decimals: 6, coingeckoId: "tether" },
      { address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", symbol: "WAVAX", decimals: 18, coingeckoId: "avalanche-2" },
      { address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", symbol: "WETH.e", decimals: 18, coingeckoId: "ethereum" },
      { address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c", symbol: "WBTC.e", decimals: 8, coingeckoId: "wrapped-bitcoin" },
    ],
  },
};

export const SUPPORTED_CHAINS = Object.keys(CHAIN_CONFIGS) as SupportedChain[];

export function isValidEvmAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

// ---------- Solana (non-EVM) ----------

/** Default Solana JSON-RPC endpoint (no key required). Overridable via SOLANA_RPC_URL. */
export const SOLANA_RPC_DEFAULT = "https://solana-rpc.publicnode.com";

/** The full set of wallet chains: EVM chains plus Solana. */
export type WalletChain = SupportedChain | "solana";

export const SUPPORTED_WALLET_CHAINS: WalletChain[] = [...SUPPORTED_CHAINS, "solana"];

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_MAP: Record<string, number> = Object.fromEntries(
  [...BASE58_ALPHABET].map((c, i) => [c, i]),
);

/**
 * Validate a Solana address: base58-encoded, decoding to exactly 32 bytes (an
 * Ed25519 public key). Pure (no deps), so it works server- and client-side.
 */
export function isValidSolanaAddress(address: string): boolean {
  if (typeof address !== "string" || address.length < 32 || address.length > 44) return false;
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) return false;

  const bytes: number[] = [];
  for (const ch of address) {
    let carry = BASE58_MAP[ch];
    if (carry === undefined) return false;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry = Math.floor(carry / 256);
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry = Math.floor(carry / 256);
    }
  }
  // Each leading '1' encodes one zero byte.
  for (let k = 0; k < address.length && address[k] === "1"; k++) bytes.push(0);
  return bytes.length === 32;
}

/** Validate an address against the address format of its chain. */
export function isValidWalletAddress(chain: WalletChain, address: string): boolean {
  return chain === "solana" ? isValidSolanaAddress(address) : isValidEvmAddress(address);
}

/**
 * Normalize an address for storage/dedup. EVM addresses are lowercased; Solana
 * base58 addresses are case-sensitive and must be preserved exactly.
 */
export function normalizeWalletAddress(chain: WalletChain, address: string): string {
  const trimmed = address.trim();
  return chain === "solana" ? trimmed : trimmed.toLowerCase();
}
