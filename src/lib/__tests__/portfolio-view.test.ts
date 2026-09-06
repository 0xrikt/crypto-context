import {expect,it} from 'vitest';
import {portfolioView} from '../portfolio-view';
it('keeps unpriced amounts and states the total is incomplete',()=>{
 const result=portfolioView([{exchange:'binance',holdings:[{asset:'BTC',total:1,free:1,locked:0,usdValue:null}],totalUsdValue:0,fetchedAt:'2026-09-06T00:00:00Z'}],[],[{label:'binance',kind:'exchange',status:'live',fetchedAt:'2026-09-06T00:00:00Z'}]);
 expect(result.holdings[0]).toMatchObject({asset:'BTC',amount:1,priceUnavailable:true});
 expect(result.incomplete).toBe(true);expect(result.context).toContain('price unavailable');
});
it('all unavailable is unknown, not disconnected',()=>{
 const result=portfolioView([],[],[{label:'binance',kind:'exchange',status:'unreachable',fetchedAt:null}]);
 expect(result.context).toContain('UNKNOWN');expect(result.errors).toHaveLength(1);expect(result.incomplete).toBe(true);
});
it('successfully fetched zero balances is a valid empty portfolio',()=>{
 const result=portfolioView([{exchange:'binance',holdings:[],totalUsdValue:0,fetchedAt:'2026-09-06T00:00:00Z'}],[],[{label:'binance',kind:'exchange',status:'live',fetchedAt:'2026-09-06T00:00:00Z'}]);
 expect(result.incomplete).toBe(false);expect(result.snapshots).toHaveLength(1);expect(result.errors).toEqual([]);
});
