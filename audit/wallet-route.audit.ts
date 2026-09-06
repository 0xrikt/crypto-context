import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({auth:{getUser:async()=>({data:{user:{id:'synthetic-owner'}}})}}) }));
const mocks=vi.hoisted(()=>({collect:vi.fn(), fetch:vi.fn()}));
vi.mock('@/lib/context-assembler',()=>({collectWalletPortfolio:mocks.collect}));
vi.mock('@/lib/store',()=>({getWallets:async()=>[{id:'synthetic',address:'synthetic',chain:'ethereum'}]}));
vi.mock('@/lib/wallet',()=>({fetchWalletPortfolioForChain:mocks.fetch}));
import {GET} from '../src/app/api/wallet/portfolio/route';
beforeEach(()=>{vi.clearAllMocks();mocks.fetch.mockRejectedValue(new Error('offline'));});
it('unreachable wallet is incomplete, never an authoritative zero',async()=>{
 mocks.collect.mockResolvedValue({snapshots:[],statuses:[{label:'ethereum',kind:'wallet',status:'unreachable',fetchedAt:null}]});
 const response=await GET();const body=await response.json();
 expect(body.incomplete).toBe(true);expect(body.statuses[0].status).toBe('unreachable');
 expect(response.headers.get('Cache-Control')).toBe('no-store');
});
it('wallet source database failure returns a retryable error',async()=>{
 mocks.collect.mockRejectedValue(new Error('database unavailable'));
 expect((await GET()).status).toBe(503);
});
