import {afterEach,expect,it,vi} from 'vitest';
import {withTimeout} from '../timeout';
import {fetchTradeHistory} from '../exchange-history';
import type {Exchange} from 'ccxt';
afterEach(()=>vi.useRealTimers());
it('success removes its timeout rather than firing later',async()=>{
 vi.useFakeTimers();expect(await withTimeout(Promise.resolve('done'),1000)).toBe('done');expect(vi.getTimerCount()).toBe(0);
});
it('a hanging history request returns within the shared remaining deadline',async()=>{
 vi.useFakeTimers();const exchange={has:{fetchMyTrades:true},fetchMyTrades:vi.fn(()=>new Promise(()=>{}))} as unknown as Exchange;
 const pending=fetchTradeHistory(exchange,[],undefined,Date.now()+1000);
 await vi.advanceTimersByTimeAsync(1001);const result=await pending;
 expect(result.complete).toBe(false);expect(result.error).toBeTruthy();expect(vi.getTimerCount()).toBe(0);
});
it('an expired deadline does not start another upstream request',async()=>{
 const call=vi.fn();const exchange={has:{fetchMyTrades:true},fetchMyTrades:call} as unknown as Exchange;
 expect((await fetchTradeHistory(exchange,[],undefined,Date.now()-1)).complete).toBe(false);expect(call).not.toHaveBeenCalled();
});
