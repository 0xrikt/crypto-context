import {beforeEach,expect,it,vi} from 'vitest';
const fake=vi.hoisted(()=>({tables:{} as Record<string, {data:unknown;error:unknown}>, writes:[] as unknown[], filters:[] as unknown[],wallet:vi.fn(),exchange:vi.fn()}));
vi.mock('@supabase/ssr',()=>({createServerClient:()=>({from:(table:string)=>{
 const chain={select:()=>chain,eq:(key:string,value:unknown)=>{fake.filters.push([table,key,value]);return chain;},single:()=>chain,maybeSingle:()=>chain,
 upsert:(value:unknown)=>{fake.writes.push(value);return Promise.resolve({error:null});},
 then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(fake.tables[table]??{data:[],error:null}).then(resolve)};
 return chain;
}})}));
vi.mock('../wallet',()=>({fetchWalletPortfolioForChain:fake.wallet}));
vi.mock('../exchange',()=>({fetchPortfolio:fake.exchange}));
vi.mock('../crypto',()=>({decrypt:()=> 'synthetic'}));
import {collectPortfolio,assembleFullContext,authenticateMcpToken} from '../context-assembler';
const cached={address:'synthetic-address',chain:'ethereum',holdings:[{asset:'ETH',total:1,usdValue:2000,source:'ethereum'}],totalUsdValue:2000,fetchedAt:'2026-09-01T00:00:00Z'};
beforeEach(()=>{
 fake.writes=[];fake.filters=[];fake.wallet.mockReset();fake.exchange.mockReset();
 fake.tables={wallets:{data:[{id:'wallet-1',address:'synthetic-address',chain:'ethereum'}],error:null},wallet_snapshots:{data:[{wallet_id:'wallet-1',data:cached}],error:null}};
});
it('RPC failure preserves cached balances and does not overwrite cache',async()=>{
 fake.wallet.mockRejectedValue(new Error('outage'));const result=await collectPortfolio('owner');
 expect(result.walletSnapshots).toEqual([cached]);expect(result.statuses[0].status).toBe('cached');expect(fake.writes).toHaveLength(0);
 expect(fake.filters).toContainEqual(['wallets','user_id','owner']);
});
it('failure without a cache is unreachable',async()=>{
 fake.tables.wallet_snapshots.data=[];fake.wallet.mockRejectedValue(new Error('outage'));
 const result=await collectPortfolio('owner');expect(result.walletSnapshots).toEqual([]);expect(result.statuses[0].status).toBe('unreachable');
});
it('healthy live balances are awaited into cache',async()=>{
 fake.wallet.mockResolvedValue(cached);const result=await collectPortfolio('owner');
 expect(result.statuses[0].status).toBe('live');expect(fake.writes).toHaveLength(1);
});
it('missing price does not replace a previously priced cache',async()=>{
 fake.wallet.mockResolvedValue({...cached,holdings:[{...cached.holdings[0],usdValue:null}],totalUsdValue:0});
 const result=await collectPortfolio('owner');expect(result.walletSnapshots[0].holdings[0].usdValue).toBeNull();expect(fake.writes).toHaveLength(0);
});
it('database read failure cannot masquerade as no connections',async()=>{
 fake.tables.connections={data:null,error:{message:'offline'}};fake.wallet.mockResolvedValue(cached);
 await expect(collectPortfolio('owner')).rejects.toThrow('Could not load exchange');
});
it('unknown token permission fails closed',async()=>{
 fake.tables.mcp_tokens={data:{user_id:'owner',permission_level:'future_scope'},error:null};
 expect(await authenticateMcpToken('synthetic')).toBeNull();
});
it('notes query failure must not silently omit notes',async()=>{
 fake.tables.strategy_notes={data:null,error:{message:'offline'}};
 await expect(assembleFullContext('owner','# Portfolio')).rejects.toThrow();
});
