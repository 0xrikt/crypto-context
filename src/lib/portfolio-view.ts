import type { PortfolioSnapshot } from './exchange';
import type { WalletSnapshot } from './wallet';
import { generatePortfolioContext, type SourceStatus } from './context';

export function portfolioView(snapshots: PortfolioSnapshot[], walletSnapshots: WalletSnapshot[], statuses: SourceStatus[]) {
  const totalUsdValue = [...snapshots, ...walletSnapshots].reduce((n, s) => n + s.totalUsdValue, 0);
  const rows = new Map<string, {asset:string; amount:number; usdValue:number; priceUnavailable:boolean; sources:string[]}>();
  for (const snapshot of [...snapshots, ...walletSnapshots]) {
    for (const h of snapshot.holdings) {
      const source = 'exchange' in snapshot ? snapshot.exchange : ('source' in h ? h.source : snapshot.chain);
      const row = rows.get(h.asset) ?? {asset:h.asset,amount:0,usdValue:0,priceUnavailable:false,sources:[]};
      row.amount += h.total;
      row.usdValue += h.usdValue ?? 0;
      row.priceUnavailable ||= h.usdValue === null;
      if (!row.sources.includes(source)) row.sources.push(source);
      rows.set(h.asset, row);
    }
  }
  const holdings = [...rows.values()].filter(h => h.priceUnavailable || h.usdValue >= 1)
    .sort((a,b) => b.usdValue-a.usdValue)
    .map(h => ({...h,allocation:totalUsdValue > 0 ? Number((h.usdValue/totalUsdValue*100).toFixed(1)) : 0}));
  return {
    context: generatePortfolioContext(snapshots, walletSnapshots, statuses), totalUsdValue, holdings,
    snapshots: snapshots.map(s => ({exchange:s.exchange,totalUsdValue:s.totalUsdValue,holdingsCount:s.holdings.length,fetchedAt:s.fetchedAt})),
    walletSnapshots: walletSnapshots.map(s => ({address:s.address,chain:s.chain,totalUsdValue:s.totalUsdValue,holdingsCount:s.holdings.length,fetchedAt:s.fetchedAt})),
    statuses,
    incomplete: statuses.some(s => s.status !== 'live') || holdings.some(h => h.priceUnavailable),
    errors: statuses.filter(s => s.status !== 'live').map(s => ({source:s.label,error:s.status === 'cached' ? 'Showing cached snapshot; live fetch failed' : 'Unavailable; holdings unknown'})),
  };
}
