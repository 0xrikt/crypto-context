import {it,expect,vi} from 'vitest';
vi.mock('../supabase/server',()=>({createClient:async()=>({from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null,error:{message:'synthetic database outage'}})})})})})}));
import {getStrategyNotes} from '../store';
it('database outage must not return an empty editable note',async()=>{await expect(getStrategyNotes('synthetic-user')).rejects.toThrow();});
