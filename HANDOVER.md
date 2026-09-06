# CryptoContext 交接文档

> 最后更新：2026-09-06 ·（**本文件在公开仓库中——禁止写入任何真实余额/账户/密钥**）
>
> 这是给下一个研发的单一入口：读完即可接手。代码与文档全部在 `app/` 子目录（独立 git 仓库，push `main` 即 Vercel 自动部署）。

> **2026-09-06 · 0.1.1 发布批次**：用户已授权修复完成后通过 Git Integration 正式部署。本批包含认证故障提示、持仓权限隔离、钱包故障/缓存/缺价处理、历史完整性与超时、笔记串行保存、来源删除后派生画像失效和 UI 可访问性修复；旧钱包接口也复用同一采集路径。参见 [CHANGELOG](CHANGELOG.md)。
>
> **工程验证**：108 项测试通过（16 文件），Lint、TypeScript、生产构建及 diff 检查通过；本地浏览器用虚构数据验证笔记切页保留与弹窗键盘操作。本批未新增数据库迁移或环境变量。
>
> **上线边界**：部署状态需以 Vercel 当前 main 部署及域名回读为准。自动化测试不代表真实账户验收；真实账户邮件登录/恢复、私有交易所对账、RLS 双账号、真实 MCP 客户端与手机完整流程仍未验证。
>
> **产品待办**：AI 画像首次开启与外发说明尚未确认，当前流程未改；完整账户删除、首次 agent 成功读取引导、画像输入版本与并发失效仍需后续处理。现有美元遮罩不能隐藏钱包身份或防止由币数推算金额。覆盖范围是支持的现货/钱包资产，不能视为完整净资产。
>
> **基础设施**：Supabase 已从 paused 恢复 Healthy；独立保活表写入及回读曾通过，Vercel 每日调度、数据库每 3 天更新，下次写入预计 2026-09-09。尚未观察自动调度执行，不承诺永不暂停。见 [保活证据](docs/keepalive.md)。

---

## 1. 状态与入口

**当前状态见文首 2026-09-06 收尾记录。** 下文功能与架构说明主要保留自 6 月版本，不作为本次真实认证流程验收证据。

| 项 | 地址 |
|----|------|
| 线上（canonical） | https://cryptocontext.earthonline.site |
| 公开演示（无需注册，全虚构数据） | https://cryptocontext.earthonline.site/demo |
| GitHub（MIT，公开） | https://github.com/EarthOnlineLabs/crypto-context |
| MCP 端点（JSON-RPC 2.0，Bearer token） | `https://cryptocontext.earthonline.site/api/mcp` |
| Context 导出（cookie 或 Bearer 双鉴权，text/markdown） | `GET /api/context/full` |

旧 Vercel 域名的人类页面 308 跳转到 canonical；其 `/api/*` 仍可用（不破坏既有 MCP 配置）。

### 怎么跑起来

```bash
cd app
pnpm install
pnpm dev            # 本地开发
pnpm test           # = vitest run（当前发布 108 测试 / 16 文件）
pnpm build          # 生产构建
```

- **必须用 pnpm，不要用 npm。**
- **⚠ `AGENTS.md` 铁律**：这是 Next.js **16.2.6**（React 19），与训练数据差异大。动代码前先读 `node_modules/next/dist/docs/` 里相关指南，留意 deprecation。`CLAUDE.md` 只是 `@AGENTS.md`。
- 环境变量（名称见 `.env.example`，**值不入库**）：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`ENCRYPTION_KEY`（64 hex）、`GLM_API_KEY`（可选，缺省走规则画像）。本地 `.env.local` 另含 `SUPABASE_ACCESS_TOKEN`（Management API 应用 migration 用）、`RESEND_*`（发信）。
- **部署**：Vercel git-integration，push `main` 自动部署，**不要** `vercel --prod`。

---

## 2. 产品一句话

把用户散落在 16 家交易所 + 8 条链钱包的全部加密持仓、**交易行为**、以及他自己写的策略笔记，装配成一份结构化 context，让任意 AI agent 通过 MCP / 复制粘贴 / 可下载 skill 读取——agent 从此基于用户**真实**处境给建议，而不是泛泛而谈。Slogan：*Not your context, not your AI.*

核心价值是 **comprehensiveness（全局完整画像）**：部分画面比没有更糟，因为会给 agent 错误的自信。

---

## 3. 架构总览（按子系统）

```
连接源 (CCXT 只读 key / 链上地址)
   │  ① SYNC（写入 context_documents：trading_profile + fund_flow）
   │  ② ASSEMBLY（请求时实时装配，带快照兜底）
   ▼
context-assembler.ts  ← 单一事实源，MCP 与 /api/context/full 共用
   ▼
一份 Markdown context  →  MCP get_context / 复制全文 / skill curl
```

### 3.1 Context 引擎（产品核心）

`src/lib/` —— `context-assembler.ts`（装配单一事实源）、`context.ts`（纯 markdown 渲染）、`generators/{trading-profile,fund-flow,investor-profile}.ts`、`exchange-history.ts`、`sync.ts`。

**两阶段数据流：**
- **① SYNC**（`sync.ts` → `context_documents`）：每个交易所连接，`loadMarkets` → 探测能力 → 取余额得到 symbol 列表 → 取 trades/orders/transfers（`exchange-history.ts`，分页 `MAX_PAGES=20` / `PAGE_SIZE=100` / `45s` 预算 / 90 天窗口）→ `generateTradingProfile` / `generateFundFlow` 渲染每venue markdown+metadata → 经注入的 `upsertFn` 写入 `trading_profile` / `fund_flow` 维度。
- **② ASSEMBLY**（`context-assembler.ts`，请求时）：`assemblePortfolioMd()` 并行 `fetchAllPortfolios()`+`fetchAllWallets()`——实时抓取裹在 `withTimeout`（交易所 20s / 钱包 15s）里，成功则 fire-and-forget 回写 `snapshots`/`wallet_snapshots` 缓存，超时/失败则回退到存储快照。每个 venue 产出一个 `SourceStatus`（live/cached/unreachable）。`assembleFullContext()` 再读 `context_documents`+`investor_profiles`+`strategy_notes`，渲染画像，`generateFullContext()` 织出最终文档。

**全文 context 区块顺序**（`generateFullContext`）：
1. `# Crypto Investor Context` 头：生成时间 + 给 AI 的阅读指引（"基于这些数字、别编造、看 Data Sources 判断完整性"）+ 动态 `> Contents:` 行
2. `# Investor Notes`（用户自己的话，**领头**，仅当有笔记）
3. Investor Profile（+ 可选过期警示）
4. Portfolio Snapshot（始终实时）+ `## Data Sources` 表
5. 每交易所 Trading Profile
6. 每交易所 Fund Flow

**两条必须理解的设计不变量（invariants）：**

- **绝不跨币种加总（NO CROSS-CURRENCY SUMS）。** fund-flow 按币种产出 `CurrencyFlow` 行、净值只在单一币种内计算；trading-profile 只把 USD 稳定币计价（`USD_QUOTES`）的成交聚合为 `$`，非 USD 计价按 quote 分别报告，手续费按 `feesByCurrency` 分组。**改这两个 generator 时不要把不同单位相加**——这正是上一轮修掉的核心 bug。
- **"没数据" ≠ "取不到数据"，是两条独立的诚实性维度：**
  - `SourceStatus`（per venue，请求时）：`live` / `cached`（实时取失败、用缓存）/ `unreachable`（无缓存）——关于 portfolio 快照新鲜度。全部源 unreachable 且无缓存时，文档明确写"持仓 UNKNOWN，**不可**当作零持仓"。
  - `FetchQuality`（per history fetch，sync 时，定义于 `exchange-history.ts`）：`unsupported`（API 不暴露）/ `error`（取失败，"缺席≠不活跃"）/ `empty`（确实无活动）/ `partial`（有数据但不完整，数字是下限）。写入 `metadata.dataStatus`，dashboard 据此渲染。

**画像（investor-profile）**：`generateInvestorProfile` 在无持仓或 GLM 未配置时直接走 `deterministicProfile`；否则调 GLM（json 模式，48s 超时），任何失败（限流/超时/格式错）都 log 并回退规则版。`source` 记 `llm`/`deterministic` 并在渲染署名里体现。**隐私不变量**：只有聚合派生事实进 LLM，绝不含 key/地址。当 `notesUpdatedAt > profileGeneratedAt` 时追加"以用户笔记为准"警示（同日编辑会省略日期括号避免假矛盾）。

> **单一事实源**：`assemblePortfolioMd()` / `assembleFullContext()` 是**唯二**装配入口，MCP（token）与 `/api/context/full`（cookie 或 token）都走它们，所以任何渲染改动两边自动一致。所有读取用 `createServiceClient()`（service role，绕过 RLS）——**调用方必须先鉴权用户**。

### 3.2 Dashboard / UI

`src/components/dashboard/` + `src/app/dashboard/`（4 个路由：overview / strategy(notes) / sources / mcp）。

- `DashboardProvider.tsx` 持有全部状态与 handler，两种模式：真实模式（打 Supabase + `/api/*`）与 **mock/demo 模式**（传 `mock` prop 即 `isMock=true`，所有网络调用短路为乐观本地状态 + 虚构数据，`src/components/demo/` 是演示壳）。
- 关键 handler：`sync`、`generateProfile`、`saveNotes`、`getFullContext`、`connectExchange`、`connectWallet`/`connectWallets`(批量)、`disconnectWallet`/`disconnectWalletGroup`、`generateToken`/`revokeToken`。
- `ContextInsights` 按 venue 分组（`${exchange}|${label}`）+ 交易所 logo 头 + 紧凑空状态；`ContextExport` 全文滚动预览 + 分节清单；`InvestorProfile` 在 `notesUpdatedAt > profile.generatedAt` 时显示琥珀色 Regenerate 提示；Holdings/Allocation 用真实 token logo（`TokenIcon`）。

### 3.3 品牌 / Logo 系统（铁律：第三方标只用真实资产）

`src/components/icons/{BrandLogo,TokenIcon}.tsx`、`src/lib/brand-assets.ts`（清单）、`src/lib/wallets/brands.ts`（注册表 + 颜色/字母兜底 + 钱包 ecosystem）、`src/components/Logo.tsx`（自有 "aperture" 标，**全站唯一手绘的标**）。

- **资产来源（权威，绝不手绘）**：交易所=CoinGecko 官方资产库；钱包 app=各项目方 GitHub 官方组织头像；链=原生币标（Base 用 base-org）；币种=CoinGecko 市值 top150 + 平台币。
- 全部本地打包：`public/brands/`（**32** 个）+ `public/tokens/`（**151** 个），零运行时第三方依赖。
- `BrandLogo` 渲染真图（白底 inset tile 统一观感），未知 id 降级注册表 monogram；`TokenIcon` 圆形真标，未知符号降级字母盘。id-alias（`coinbase-wallet→coinbase` 等）内联在 `BrandLogo.tsx`。
- **铁律**（见 `tasks/lessons.md` 2026-06-12）：任何第三方品牌标一律用真实权威资产，**绝不近似临摹**——手绘会被识别为山寨，比不放更伤信任。

### 3.4 钱包品牌优先导入

`src/components/dashboard/AddWalletForm.tsx` + `src/app/api/wallet/scan/route.ts` + `wallet/connect`。

心智模型从"链+地址"换成"我的 MetaMask"：选品牌（ecosystem `evm`/`solana`/`multi`；Keplr 因 Cosmos-only 隐藏）→ 贴地址 → `POST /api/wallet/scan` 并行探测 7 条 EVM 链余额（每链 8s 预算，route maxDuration 30s）→ 有钱的链预勾选 → 一键批量加为多条 `(address, chain)` 行 → DataSources 按 `${brand}|${address.toLowerCase()}` 重新分组成"一卡=一个钱包账户、链为 chip"。

**存储模型不变**：仍是一行一个 `(address, chain)`，brand-first 只用了既有的 `wallets.brand` 列（migration 0002），**零新表零 migration**。scan 需登录账户；失败优雅降级为手动勾选（demo 未登录即走此路径）。"Other address" 保留原始链+地址路径。

### 3.5 落地页

`src/app/page.tsx` + `globals.css`。文案与信息架构未动，视觉升级：blueprint 网格、墨色证言终端/代码块/CTA 终章（grain + emerald 辉光）、带 logo 的 venue ticker、**"Works with what you already use" logo 墙**（16 交易所 / 8 链 / 钱包行，钱包行诚实标注 "any address · zero keys"）、Newsreader 衬线宣言、hero 入场动画。移动端已验证。OG/Twitter 卡为墨色新版。

---

## 4. 数据模型与迁移

Supabase/Postgres，**8 张表**，每张 `user_id → auth.users` 且 RLS 按 `auth.uid() = user_id` 隔离（service-role key 为 MCP 鉴权绕过 RLS）。`src/lib/store.ts` 是数据访问层。

| 表 | 用途 | 写法 | 引入 |
|----|------|------|------|
| `connections` | 加密的交易所 API 凭证 | INSERT | base schema |
| `snapshots` | 每连接最新 portfolio（`connection_id` UNIQUE）| upsert | base |
| `wallets` | 链上地址，`unique(user_id, address, chain)` + 可空 `brand` | INSERT | base / brand=0002 |
| `mcp_tokens` | MCP token 的 **sha256 哈希** | INSERT | base |
| `context_documents` | 每连接的 trading_profile / fund_flow（`unique(connection_id, dimension)`）| upsert | base |
| `investor_profiles` | 整体画像，一用户一行 | upsert | **0001** |
| `strategy_notes` | 用户策略笔记，一用户一行 | upsert | **0003** |
| `wallet_snapshots` | 每钱包最新快照（`wallet_id` UNIQUE），兜底缓存 | upsert | **0004** |

**4 个 migration**：`0001` investor_profiles · `0002` wallets.brand · `0003` strategy_notes · `0004` wallet_snapshots。**均已应用到生产。** `supabase-schema.sql` 是自托管全量 schema，与 migration 一致。

> **⚠ 迁移是手工应用的**（Supabase Management API + PAT，或 psql；文件头有说明），**没有自动 runner**。`getInvestorProfile` / `getStrategyNotes` 在表不存在时返回软空值而非崩溃——好处是缺迁移不挂，**坏处是环境会静默漂移**，部署新环境务必确认 0001/0003/0004 都跑过。`saveWallet` 写前 `normalizeWalletAddress`（EVM 小写、Solana 大小写敏感），dedup 正确性依赖它与 unique 约束匹配。

---

## 5. API 一览

`src/app/api/` 下 **17 个 route**，三种鉴权：**cookie**（全部 dashboard 端点）/ **Bearer MCP token**（sha256 比对，仅 agent 面）/ **dual**（仅 `/api/context/full` 两者皆可）。

- `mcp/` —— JSON-RPC 2.0（protocol `2024-11-05`），**两个工具** `get_portfolio` / `get_context`。`get_context` 默认返回全部维度（**无语义路由/向量检索**——整块返回是刻意设计）。
- `context/full/` —— dual auth，`text/markdown`，与 MCP 共用装配器。
- `context/` —— dashboard 取 context_documents（join connections 带 `exchange`/`label`）。
- `wallet/scan/`（新）—— 并行探 7 条 EVM 链余额，只读，登录+限流。
- `wallet/connect`、`exchange/sync`、`exchange/connect`、`profile`、`notes`、`mcp/tokens` 等。

`permissionLevel`（`full` / `portfolio_only` / `anonymized`）仅在 MCP 与 `/context/full` 路径经 `applyPermission()` 生效（`anonymized` 把美元金额打码）；cookie dashboard 读永远是全量。

**限流桶**（`lib/security.ts`，per IP，60s 窗口）：`exchangeConnect 5` · `portfolioFetch 10` · `mcp 30` · `tokenGenerate 5` · `profileGenerate 3` · `general 20`。**注意限流是单实例内存版**（见 §9）。

---

## 6. 安全

- 交易所 key：**AES-256-GCM** 加密存储，每次 `randomBytes(16)` 独立 IV，KEK（`ENCRYPTION_KEY`）每次 encrypt/decrypt 校验 64-hex。`getConnectionCredentials` 是唯一解密路径——别在别处读原始密文列。
- MCP token 存 **sha256 哈希**；revoke 用 service-role 但靠 `.eq('user_id', user.id)` 防越权，**永远别删这个过滤**。
- RLS 隔离；`middleware.ts` 注入安全头 + legacy→canonical 308 跳转（保 `/api` 不破 MCP 配置）+ `/dashboard` 鉴权。
- **只读 by design**：全代码无 `createOrder`/`withdraw`（一条 grep 可验，见 `SECURITY.md`）。
- 详见 `SECURITY.md`（含威胁模型与"不防什么"）。

---

## 7. 测试与部署

- **56 单测 / 6 文件**（`src/lib/__tests__/`）：覆盖 security/crypto、context 装配、generators、profile-facts、brand 资产映射，以及 brand-assets 清单 ↔ `public/` 文件的漂移守卫（断言每个 manifest id 都有对应 PNG、无孤儿文件、符号小写、数量锁定 32/151）。**无集成/E2E 层**（测试金字塔缺口）。
- `pnpm build` exit 0（38 静态页）。**ESLint 存量 7 个 error**（react-hooks 新规则对旧组件的告警，先于本轮存在，不阻断 Vercel 构建）。
- 部署：push `main` → Vercel 自动部署。

---

## 8. 重要运维须知

- **存储的 trading/fund-flow 文档是缓存的，只在 Sync 时按新 generator 重生成。** 实时装配的部分（portfolio、画像、Data Sources 表）已反映新代码，但既有用户的 `context_documents` 仍是旧格式（如 "Total fees paid: $0"、"15,394.51 across currencies"）**直到他们点一次 Sync**。这是预期行为，不是 bug——升级 generator 后老用户需 re-sync。
- 创始人的真实账户持有真实持仓：**仅用于功能验证**，所有可公开的截图/物料一律用虚构数据。
- 生产截图 `docs/demo-dashboard.png` 已用真实 logo 版重拍（带 venue 分组 Context Insights）。

---

## 9. 已知限制 / 重构 backlog（按价值排序）

**可靠性 / 正确性**
- 限流是**单实例内存版**（`lib/security.ts` 的 Map），Vercel 多实例下每实例独立、冷启动重置——规模化需 Upstash Redis / Vercel KV 才是真正分布式限流。
- `getClientIp` 无校验地信任 `x-forwarded-for` 首项，非 Vercel 环境可被伪造投毒限流 key。
- 交易所历史 per-symbol 兜底只构造 `${asset}/USDT` 市场——非 USDT 计价的 pair（如 BTC/ETH、KRW）在 per-symbol 路径会漏抓。
- GLM 免费层慢（48s），持续限流时每次画像静默退化为规则版，无 retry/backoff、无"GLM 挂了 vs GLM 没产出"的区分信号。
- 快照兜底无 max-age 保护：很旧的缓存仍标 `cached` 带原 `fetchedAt`，靠 AI 看时间戳判断陈旧。
- `wallet/portfolio` 顺序抓取且静默丢弃失败的链（不返回 `errors[]`），与 `exchange/portfolio` 的 `errors[]` 行为不一致。

**安全（生产硬化）**
- 登录/注册路由**无 app 层限流**，纯靠 Supabase Auth 自身限流。
- CSP 含 `unsafe-eval`/`unsafe-inline`（`lib/security.ts`），应改 nonce/hash。
- 无 KEK 轮换支持（无 key versioning / envelope），`ENCRYPTION_KEY` 轮换会孤立既有密文。

**可维护性 / 脆弱耦合**
- `ContextExport` 的分节清单靠精确匹配后端 markdown 头串（`# Investor Notes`、`/^# Trading Profile — /gm` 等）；后端改头文案会**静默断掉** chips。前后端无共享常量。
- `AddWalletForm` 重复了 `chains.ts` 的链常量/校验器（`EVM_CHAINS`/`EVM_RE` 等），加链时有漂移风险。
- `connectWallets` 顺序 POST（7 链 MetaMask = 7 次串行请求），可并行化。
- `brands.ts` 头注释仍描述未实现的"per-entry SVG logo 升级路径"，与现实（PNG + manifest）不符，应清理。

**功能缺口**
- 仅现货余额（无合约持仓）；行情依赖交易所 ticker + CoinGecko。
- MCP token 无过期/last-used 审计（revoke 可用）。
- 交易/转账固定 90 天窗口；活跃账户常触 `partial` 报下限值。

---

## 10. 发布执行清单（launch operator）

物料在 `launch/`（README 是运行手册）。已与产品事实对齐：**16 交易所 + 8 链**（非 10/EVM-only）；**绝不说 "no LLM"**（数字确定性计算，仅可选 LLM 写画像叙述、只读聚合事实）。

发帖前操作员仍需手工完成：
1. `pnpm build` 绿 + 生产健康（landing 加载、注册可用、能建 MCP token、`get_context` 对已连 venue 返回）。
2. 仓库 public 且含 LICENSE/SECURITY.md/README；repo metadata（description/topics/homepage）**已设置**。仓库现归属 `EarthOnlineLabs` 组织（`github.com/EarthOnlineLabs/crypto-context`，旧 `0xrikt/crypto-context` 链接自动 301 跳转）；本地 `gh` 账号 `EarthOnlineDev` 是组织 owner，可直接改 metadata（不再 404，无需切账号）。
3. 干净 transcript 截图备用（落地页墨色证言区或 /demo）。
4. **下一个 HN 窗口：周二–周四，具体 Jun 16–18，8–10am ET**；Day-0 目录提交可提前。提交 **repo URL**（非营销站）到 HN，立即贴准备好的首评，守帖 3+ 小时。
5. 跨平台不复制同文；不刷票；只在有 standing 的社区发、首行披露作者身份。

---

## 11. 近期变更摘要（2026-06-12 三轮打磨）

1. **Context 正确性与溯源**：按币种计算（消除跨币种加总 bug）、FetchQuality 四态、wallet_snapshots 兜底缓存（migration 0004）、Data Sources 每源新鲜度、画像生成时间/来源/过期警示、全文阅读指引 + Contents 行。
2. **看板修复**：Context Insights 按 venue 分组带标签、Copy-full-context 全文预览 + 分节清单。
3. **品牌升级**：自有 "aperture" logo（favicon/apple-icon/OG 全套）、落地页视觉升级、宣发物料事实对齐。
4. **品牌识别**：BrandLogo/TokenIcon 系统、品牌优先钱包导入（`/api/wallet/scan`）、落地页 logo 墙。
5. **真实 logo 资产**：手绘标全部替换为 CoinGecko/GitHub 官方真标（`public/brands` 32 + `public/tokens` 151），铁律入 lessons.md。
