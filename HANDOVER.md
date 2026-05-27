# CryptoContext 项目交接文档

> 最后更新：2026-05-27

## 当前状态：V1.1 开发完成

**线上地址**：https://app-rho-jet-70.vercel.app

### ✅ 已完成并验证

| 功能 | 状态 | 验证方式 |
|------|------|----------|
| 用户注册/登录 | ✅ 正常 | 浏览器测试 |
| 邮箱确认流程 | ✅ 正常 | 实际注册测试 |
| Bitget 连接 | ✅ 正常 | 生产环境浏览器验证，portfolio 显示 $6,555 (BGB) |
| Portfolio 同步 | ✅ 正常 | Bitget 验证通过，dashboard + MCP 双通道 |
| 10 交易所支持 | ✅ 代码就绪 | 浏览器验证下拉框 10 家交易所、passphrase 字段逻辑 |
| MCP 端到端 | ✅ 正常 | JSON-RPC 2.0 完整验证（initialize, tools/list, tools/call, ping） |
| MCP get_portfolio | ✅ 正常 | curl 端到端测试，asset 过滤正常 |
| MCP get_context | ✅ 正常 | V1 返回全量 portfolio |
| MCP Token 管理 | ✅ 正常 | 自定义名称 + 权限级别 + Revoke |
| 匿名化权限 | ✅ 正常 | anonymized token 的 USD 值全部替换为 `$***` |
| MCP 鉴权拒绝 | ✅ 正常 | 无/无效/已撤销 token 均正确拒绝 |
| 安全加固 | ✅ 已实施 | 7 种安全响应头、速率限制、输入校验、错误脱敏 |
| 前端 Light Theme | ✅ 完成 | 全站白色主题，浏览器验证 |
| 钱包追踪 (V1.1) | ✅ 代码就绪 | 5 条 EVM 链支持，需实际钱包地址测试 |

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

### ⏳ 待用户验收

| 功能 | 说明 |
|------|------|
| 其他 9 家交易所 | 代码已就绪，需各交易所 API key 实际测试 |
| 钱包追踪 | 代码已就绪，需输入实际钱包地址测试 |
| 多源聚合 | 交易所 + 钱包聚合逻辑已就绪，需多数据源实测 |

### 🔧 已知限制

1. **ENCRYPTION_KEY 敏感**：Vercel 环境变量必须精确 64 位 hex，设置时用 `printf '%s'`
2. **速率限制是内存级**：Vercel Serverless 每个实例独立，重启后重置
3. **get_context 工具**：V1 返回全量 portfolio，语义检索待后续
4. **CoinGecko 免费限制**：30 次/分钟，大量钱包可能触发限流
5. **ERC-20 覆盖**：每条链预置 3-6 种主流代币，长尾代币需手动添加
6. **公共 RPC**：使用 viem 默认公共 RPC，高并发可能不稳定

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

## 下一步

### 短期（用户验收）
- 用户提供其他交易所 API key 实际测试连接
- 用户提供钱包地址测试链上追踪
- 确定产品正式名称和自定义域名

### 中期
- get_context 增加语义检索
- 支持用户自定义投资笔记/thesis
- portfolio 历史快照和趋势
- 扩展 ERC-20 Token 列表（用户自定义）

### 长期（V2）
- DEX 交易历史追踪
- 多用户共享 context（团队版）
- 更多 MCP 工具（交易历史、PnL 分析）
- 非 EVM 链支持（Solana, Sui 等）
