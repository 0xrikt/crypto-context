import { expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('@/lib/store', () => ({rowToInvestorProfile: vi.fn()}));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/context-assembler', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  authenticateMcpToken: async () => ({userId:'synthetic-user',permissionLevel:'portfolio_only'}),
  assemblePortfolioMd: async () => '# Portfolio Snapshot\nBTC',
  assembleFullContext: async () => '# Investor Notes\nPRIVATE_NOTE\n# Portfolio Snapshot\nBTC',
}));
import {POST} from '../src/app/api/mcp/route';
import {GET} from '../src/app/api/context/full/route';
const req = (body: unknown) => new NextRequest('https://example.invalid/api/mcp', {method:'POST',headers:{authorization:'Bearer synthetic-audit-token'},body:JSON.stringify(body)});
it('MCP get_context must enforce portfolio_only at the route', async () => {
 const response = await POST(req({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'get_context'}}));
 expect(await response.text()).not.toContain('PRIVATE_NOTE');
});
it('markdown export must enforce portfolio_only at the route', async () => {
 const response = await GET(new NextRequest('https://example.invalid/api/context/full', {headers:{authorization:'Bearer synthetic-audit-token'}}));
 expect(await response.text()).not.toContain('PRIVATE_NOTE');
});
it('initialized notification must receive 202 with no body', async () => {
 const response = await POST(req({jsonrpc:'2.0',method:'notifications/initialized'}));
 expect(response.status).toBe(202);
 expect(await response.text()).toBe('');
});
it('JSON null must produce a controlled invalid-request response', async () => {
 const response = await POST(req(null));
 expect(response.status).toBe(400);
});
