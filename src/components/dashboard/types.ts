export interface Holding {
  asset: string;
  amount: number;
  usdValue: number;
  allocation: number;
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
}
