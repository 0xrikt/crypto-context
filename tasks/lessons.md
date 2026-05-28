# Lessons Learned

## 2026-05-27: Wallet Portfolio Fetch on Vercel Serverless

### Problem
Wallet data not appearing in portfolio context. Multiple cascading issues.

### Root Causes & Fixes

1. **`{ next: { revalidate: 300 } }` is invalid in Route Handlers**
   - Only works in Server Components. In Route Handlers it causes fetch to fail silently.
   - Fix: Use `{ cache: 'no-store', signal: AbortSignal.timeout(ms) }` instead.

2. **Viem's default public RPCs are unreliable from Vercel**
   - `http()` with no URL uses chain defaults (Cloudflare for Ethereum) which timeout from cloud IPs.
   - Ankr public RPCs now require API keys (changed since 2025).
   - Fix: Use explicit `PublicNode` RPC URLs (`https://ethereum-rpc.publicnode.com`, etc.) — free, no API key, ~1.5s response.

3. **Sequential fetches cause 504 on Vercel**
   - Exchange fetch + wallet fetch in sequential for-loops exceeds Vercel function timeout.
   - Even `maxDuration: 60` isn't enough if individual operations are slow.
   - Fix: Use `Promise.all` for all independent operations (exchange fetches, wallet fetches, getBalance + multicall).

4. **Dashboard should never block on slow API calls**
   - `await fetchPortfolio()` in `init()` prevents the entire dashboard from rendering.
   - Fix: Set `loading = false` before starting portfolio fetch. Fire-and-forget the fetch; portfolio section appears when data arrives.

5. **Always use per-source timeouts for aggregation endpoints**
   - A single slow/failing source shouldn't block the entire response.
   - Fix: Wrap each data source fetch in a `withTimeout` helper that returns null on timeout. Return partial results with error metadata.

### Pattern: Reliable External Data Fetching on Vercel Serverless
```
1. Use explicit RPC URLs (never rely on library defaults)
2. Set aggressive timeouts (5s for RPC, 5s for CoinGecko)
3. Parallelize all independent operations
4. Add per-source timeout wrappers
5. Return partial results on failure
6. Make UI non-blocking — show structure first, data later
```

---

## 2026-05-28: MCP Registration in Claude Code

### Problem
User had an MCP token in the dashboard but assumed the MCP was already connected to Claude Code. It was not — having a token ≠ having the MCP registered.

### Key Insight
MCP token is the "key", but it still needs to be registered in Claude Code via `claude mcp add`. These are two separate steps:
1. **Generate token** — done in the CryptoContext dashboard (creates auth credential)
2. **Register MCP** — done via CLI `claude mcp add` (tells Claude Code where the server is and how to authenticate)

### Registration Command
```bash
claude mcp add -t http -s user \
  -H "Authorization: Bearer <TOKEN>" \
  -- crypto-ctx https://app-rho-jet-70.vercel.app/api/mcp
```

### Gotcha: Tools not available mid-session
MCP tools are loaded at **session startup**. If you register a new MCP mid-session, the tools won't appear until the next session. Workaround: call the MCP endpoint directly via curl/JSON-RPC 2.0 for immediate testing.

### Pattern: MCP Deployment Checklist
```
1. Deploy MCP endpoint (JSON-RPC 2.0)
2. Generate auth token in dashboard
3. Register with `claude mcp add` (user scope for personal, project scope for team)
4. Verify: `claude mcp list` → should show ✓ Connected
5. Start new session to get tools loaded
6. Test: call get_portfolio / get_context from Claude Code
```
