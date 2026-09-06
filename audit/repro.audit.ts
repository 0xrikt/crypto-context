import { safeReturnPath } from '../src/lib/return-path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Exchange } from 'ccxt';
import { fetchTradeHistory } from '../src/lib/exchange-history';
import { generatePortfolioContext } from '../src/lib/context';
import { buildFactsMarkdown } from '../src/lib/generators/investor-profile';

vi.mock('@/lib/store', () => ({ rowToInvestorProfile: vi.fn() }));
import { applyPermission } from '../src/lib/context-assembler';

const rpc = vi.hoisted(() => ({ getBalance: vi.fn(), multicall: vi.fn() }));
vi.mock('viem', async (importOriginal) => ({ ...(await importOriginal<object>()), createPublicClient: () => rpc }));
import { fetchWalletPortfolio } from '../src/lib/wallet';
import { fetchSolanaPortfolio } from '../src/lib/chains/solana';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

// Regression contracts converted from the original audit failures.
describe('2026-09-06 audit regression contracts', () => {
  it('anonymized must mask negative USD amounts', () => {
    expect(applyPermission('Net: $-12,345.67', 'anonymized')).not.toContain('12,345');
  });
  it('EVM RPC failures must not resolve as a healthy empty snapshot', async () => {
    rpc.getBalance.mockRejectedValue(new Error('synthetic RPC outage'));
    rpc.multicall.mockRejectedValue(new Error('synthetic RPC outage'));
    await expect(fetchWalletPortfolio('0x0000000000000000000000000000000000000001', 'ethereum')).rejects.toThrow();
  });
  it('0.005 WBTC must remain a holding', async () => {
    rpc.getBalance.mockResolvedValue(BigInt(0));
    rpc.multicall.mockResolvedValue([BigInt(0), BigInt(0), BigInt(500000), BigInt(0), BigInt(0), BigInt(0)].map(result => ({status:'success', result})));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({'wrapped-bitcoin': {usd:100000}}))));
    const data = await fetchWalletPortfolio('0x0000000000000000000000000000000000000001', 'ethereum');
    expect(data.holdings.some(h => h.asset === 'WBTC')).toBe(true);
  });
  it('Solana RPC outage must not resolve as a healthy empty snapshot', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('synthetic RPC outage')));
    await expect(fetchSolanaPortfolio('11111111111111111111111111111111')).rejects.toThrow();
  });
  it('unpriced known holdings must not disappear from context', () => {
    const text = generatePortfolioContext([{exchange:'binance', holdings:[{asset:'BTC', free:1, locked:0, total:1, usdValue:null}], totalUsdValue:0, fetchedAt:'2026-09-06T00:00:00Z'}]);
    expect(text).toContain('| BTC |');
  });
  it('trade API failure with only stablecoin holdings must retain error state', async () => {
    const exchange = {has:{fetchMyTrades:true}, fetchMyTrades:vi.fn().mockRejectedValue(new Error('synthetic outage'))} as unknown as Exchange;
    const result = await fetchTradeHistory(exchange, [{asset:'USDT'}]);
    expect(result.complete).toBe(false);
  });
  it('hitting 20 full history pages must flag truncation', async () => {
    const exchange = {has:{fetchMyTrades:true}, fetchMyTrades:vi.fn(async (_symbol: unknown, since: number) => Array.from({length:100}, (_,i) => ({id:String(since+i), timestamp:since+i, symbol:'BTC/USDT', side:'buy', amount:1, price:1, cost:1})))} as unknown as Exchange;
    const result = await fetchTradeHistory(exchange, [{asset:'BTC'}], 1000);
    expect(result.data).toHaveLength(2000);
    expect(result.complete).toBe(false);
  });
  it('documents actual GLM egress: dollar totals and raw note text', () => {
    const facts = buildFactsMarkdown({totalUsdValue:12345,exchangeCount:1,walletCount:0, holdings:[],venues:[],tradingDocs:[],fundFlowDocs:[],notes:'SYNTHETIC_PRIVATE_NOTE'});
    expect(facts).toContain('$12.3k');
    expect(facts).toContain('SYNTHETIC_PRIVATE_NOTE');
  });
  it('confirmation next must not permit external backslash URLs', () => {
    const next = '/\\example.invalid';
    const accepted = safeReturnPath(next, 'https://cryptocontext.earthonline.site');
    expect(new URL(accepted, 'https://cryptocontext.earthonline.site').origin).toBe('https://cryptocontext.earthonline.site');
  });
});
