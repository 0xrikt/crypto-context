export interface Holding {
  asset: string;
  amount: number;
  usdValue: number;
  allocation: number;
  priceUnavailable?: boolean;
  sources: string[];
}

export interface ExchangeSnapshot {
  exchange: string;
  totalUsdValue: number;
  holdingsCount: number;
  fetchedAt: string;
}

export interface WalletSnapshotSummary {
  address: string;
  chain: string;
  totalUsdValue: number;
  holdingsCount: number;
  fetchedAt: string;
}

export interface PortfolioData {
  context: string;
  totalUsdValue: number;
  holdings: Holding[];
  snapshots: ExchangeSnapshot[];
  walletSnapshots?: WalletSnapshotSummary[];
  incomplete?: boolean;
  statuses?: Array<{label:string;kind:string;status:string;fetchedAt:string|null}>;
  errors?: Array<{ source: string; error: string }>;
}

export interface Connection {
  id: string;
  exchange: string;
  label: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  address: string;
  chain: string;
  label: string;
  /** Optional self-custody wallet app id (e.g. 'metamask'); see lib/wallets/brands. */
  brand?: string | null;
  created_at: string;
}

export interface McpToken {
  id: string;
  name: string;
  permission_level: string;
  revoked: boolean;
  created_at: string;
}

export interface ContextDoc {
  dimension: string;
  content: string;
  metadata: Record<string, unknown>;
  updatedAt: string;
  /** Exchange id this document was computed from (e.g. "bitget"). */
  exchange?: string | null;
  /** The connection's user-facing label (e.g. "API key" or a custom name). */
  label?: string | null;
}

export interface InvestorProfile {
  summary: string;
  tradingStyle: string;
  riskProfile: string;
  preferences: string[];
  behaviors: string[];
  agentGuidance: string[];
  generatedAt: string;
  source: "llm" | "deterministic";
}
