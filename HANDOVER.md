# CryptoContext 项目交接文档

> 最后更新：2026-05-28

## 当前状态：V1.1 已验收上线

**线上地址**：https://app-rho-jet-70.vercel.app
**GitHub**：https://github.com/0xrikt/crypto-context
**MCP 端点**：`https://app-rho-jet-70.vercel.app/api/mcp`

### ✅ 已完成并验证

| 功能 | 状态 | 验证方式 |
|------|------|----------|
| 用户注册/登录 | ✅ 正常 | 浏览器测试 |
| 邮箱确认流程 | ✅ 正常 | 实际注册测试 |
| Bitget 连接 | ✅ 正常 | 生产环境验证，portfolio 显示 BGB + 聚合数据 |
| Portfolio 同步 | ✅ 正常 | 交易所 + 钱包聚合验证，总值 ~$6,700 |
| 10 交易所支持 | ✅ 代码就绪 | 浏览器验证下拉框 10 家交易所、passphrase 字段逻辑 |
| MCP 端到端 | ✅ 正常 | JSON-RPC 2.0 完整验证（initialize, tools/list, tools/call, ping） |
| MCP get_portfolio | ✅ 正常 | Claude Code 实际调用验证，asset 过滤正常 |
| MCP get_context | ✅ 正常 | Claude Code 实际调用验证，返回全量 portfolio |
| MCP Claude Code 集成 | ✅ 已连接 | `claude mcp add` 注册完成，user scope，端到端工具调用验证通过 |
| MCP Token 管理 | ✅ 正常 | 自定义名称 + 权限级别 + Revoke |
| 匿名化权限 | ✅ 正常 | anonymized token 的 USD 值全部替换为 `$***` |
| MCP 鉴权拒绝 | ✅ 正常 | 无/无效/已撤销 token 均正确拒绝 |
| 安全加固 | ✅ 已实施 | 7 种安全响应头、速率限制、输入校验、错误脱敏 |
| 前端 Light Theme | ✅ 完成 | 全站白色主题，浏览器验证 |
| 钱包追踪 (V1.1) | ✅ 已验证 | 5 条 EVM 链支持，钱包数据已出现在 Portfolio 中（ETH + USDT） |

### V1.1 新增功能

#### Light Theme
- 全站从暗色主题转为白色主题
- 修改文件：globals.css, layout.tsx, page.tsx, login, signup, dashboard
- 配色：白色背景 + 灰色文字 + emerald 强调色

#### 链上钱包追踪
- **支持链**：Ethereum, BSC, Polygon, Arbitrum, Base（EVM only）
- **工作原理**：输入钱包地址 → 读取链上余额（原生代币 + ERC-20）→ CoinGecko 定价 → 聚合到 portfolio context
- **技术栈**：viem multicall + CoinGecko Free API + 公共 RPC
- **零成本**：无需 API key，使用公共 RPC 和 CoinGecko 免费端点
- **安全**：只读取公开的链上余额，不需要私钥或签名
- **新增文件**：
  - `src/lib/chains.ts` — 链配置 + Token 列表
  - `src/lib/wallet.ts` — 余额获取 + 定价
  - `src/app/api/wallet/connect/route.ts` — 添加钱包
  - `src/app/api/wallet/disconnect/route.ts` — 移除钱包
  - `src/app/api/wallet/portfolio/route.ts` — 钱包 portfolio
- **数据库**：wallets 表（已在 Supabase 创建，含 RLS 策略）
- **MCP 整合**：钱包数据自动聚合到 get_portfolio 和 get_context
- **Dashboard**：钱包区块（添加/移除/展示），与交易所区块并列

### ✅ 用户已验收

| 功能 | 结果 |
|------|------|
| Bitget 交易所 | ✅ 实际 API key 连接验证通过 |
| 钱包追踪 | ✅ 实际钱包 0x3641...dcc3 (Ethereum) 验证通过 |
| 多源聚合 | ✅ 交易所 + 钱包聚合验证通过（BGB $6,483 + ETH $160 + USDT $32） |
| MCP → Claude Code | ✅ 端到端工具调用验证通过（get_portfolio + get_context） |

### ⏳ 待后续测试

| 功能 | 说明 |
|------|------|
| 其他 9 家交易所 | 代码已就绪，需各交易所 API key 实际测试 |

### 🔧 V1.1 Bug 修复记录

1. **钱包数据不显示**：`fetchWalletPortfolio` 使用 `{ next: { revalidate: 300 } }` 在 Route Handler 无效导致抛错，所有 CoinGecko 请求静默失败 → 改用 `cache: 'no-store'` + `AbortSignal.timeout`
2. **504 Gateway Timeout**：交易所和钱包 portfolio 串行获取导致超时（45-60s），Vercel 返回 504 → 全部改为 `Promise.all` 并行获取
3. **RPC 无超时**：viem `http()` 无超时参数，公共 RPC 可能无限挂起 → 添加 5s 显式超时
4. **getBalance + multicall 串行**：两个独立 RPC 调用不必要串行 → 改为 `Promise.all` 并行
5. **Dashboard 加载阻塞**：`await fetchPortfolio()` 阻塞整个 dashboard 渲染 → 改为非阻塞，dashboard 立即显示，portfolio 后台加载
6. **默认 RPC 不可用**：viem 默认 Cloudflare Ethereum RPC 从 Vercel serverless 超时 → 切换到 PublicNode 免费 RPC（~1.5s 响应）
7. **Ankr 需要 API Key**：Ankr 公共 RPC 已改为需要 API key → 使用 PublicNode（无需 API key）
8. **per-source timeout**：为每个数据源添加独立超时（交易所 20s，钱包 15s），确保部分数据源失败时仍返回可用数据

### 🔧 已知限制

1. **ENCRYPTION_KEY 敏感**：Vercel 环境变量必须精确 64 位 hex，设置时用 `printf '%s'`
2. **速率限制是内存级**：Vercel Serverless 每个实例独立，重启后重置
3. **get_context 工具**：V1 返回全量 portfolio，语义检索待后续
4. **CoinGecko 免费限制**：30 次/分钟，大量钱包可能触发限流
5. **ERC-20 覆盖**：每条链预置 3-6 种主流代币，长尾代币需手动添加
6. **公共 RPC**：使用 PublicNode 免费公共 RPC，高并发可能不稳定（可切换到付费 RPC 提升可靠性）

## 基础设施

| 服务 | 详情 |
|------|------|
| Vercel | Team: riks-projects-ff86846d, Project: app |
| Supabase | Project: crypto-context (ckviuhczbifmroggxfto), Region: us-east-1 |
| GitHub | https://github.com/0xrikt/crypto-context |
| 部署 | 推 main 分支自动部署（Vercel Git Integration） |

## 环境变量（Vercel Production + Preview）

| 变量 | 状态 |
|------|------|
| NEXT_PUBLIC_SUPABASE_URL | ✅ 已设置 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ 已设置 |
| SUPABASE_SERVICE_ROLE_KEY | ✅ 已设置 |
| ENCRYPTION_KEY | ✅ 已修复（64 位 hex，production + preview） |

## 数据库表

| 表 | 用途 | RLS |
|------|------|-----|
| connections | 交易所 API key（加密存储）| ✅ SELECT/INSERT/DELETE |
| snapshots | Portfolio 快照（最新数据）| ✅ SELECT/INSERT/UPDATE |
| wallets | 链上钱包地址 | ✅ SELECT/INSERT/DELETE |
| mcp_tokens | MCP 令牌（hash 存储）| ✅ SELECT/INSERT/UPDATE |

## MCP 接入信息

### Claude Code 注册命令
```bash
claude mcp add -t http -s user \
  -H "Authorization: Bearer <TOKEN>" \
  -- crypto-ctx https://app-rho-jet-70.vercel.app/api/mcp
```

### 当前活跃 Token
| 名称 | 权限 | 用途 |
|------|------|------|
| Claude Code Live | full | Claude Code 已注册连接 |
| Claude Code | full | 备用（未注册到 Claude Code） |

### 可用工具
| 工具 | 功能 |
|------|------|
| `get_portfolio` | 返回完整持仓（支持按 asset 过滤） |
| `get_context` | 返回完整投资者画像：持仓快照 + 交易画像 + 资金流向 |

### V2 新增：多维度 Context 文档体系

#### 三个维度
1. **Portfolio Snapshot** — 实时持仓（余额 + 定价，每次 MCP 调用实时获取）
2. **Trading Profile** — 交易画像（基于 CCXT fetchMyTrades + fetchClosedOrders + fetchOpenOrders）
   - 交易频率、偏好交易对、买卖比例、仓位大小、限价单占比、DCA 检测
3. **Fund Flow** — 资金流向（基于 CCXT fetchDeposits + fetchWithdrawals）
   - 存取款统计、按币种分布、资金模式（定投/大额/混合）、最近活动

#### 技术实现
- **新表**：`context_documents`（connection_id + dimension 唯一，存生成的 markdown + metadata）
- **新文件**：
  - `src/lib/exchange-history.ts` — CCXT 历史数据获取（分页、超时、per-symbol fallback）
  - `src/lib/generators/trading-profile.ts` — 交易画像分析 + markdown 生成
  - `src/lib/generators/fund-flow.ts` — 资金流向分析 + markdown 生成
  - `src/lib/sync.ts` — Sync 编排（获取 → 分析 → 存储）
  - `src/app/api/exchange/sync/route.ts` — POST 端点触发 context sync
- **Sync 触发**：交易所 connect 后自动触发 + Dashboard Sync 按钮手动触发
- **MCP 响应**：get_context 返回三维度 markdown（~1.3KB），AI agent 整块消化

#### 已验证
- Bitget 真实数据：7 trades, 7 transfers, 12s sync 完成
- MCP get_context 端到端验证通过，Claude Code 调用确认收到完整三维度 context

## 下一步

### 优先级 1：前端视觉与信息架构优化
- **现状**：所有内容在一个页面上垂直平铺，功能齐全但布局质朴
- **目标**：信息架构更精致好用，数据可视化（图表、占比图），交互体验提升
- **参考**：可在 Variant.com 上找参考风格

### 中期
- 扩展 ERC-20 Token 列表（用户自定义）
- portfolio 历史快照和趋势
- 确定产品正式名称和自定义域名

### 长期
- DEX 交易历史 / LP 仓位 / DeFi 协议追踪
- 非 EVM 链支持（Solana, Sui 等）
- 多用户共享 context（团队版）
- 更多 MCP 工具（交易历史、PnL 分析）
