# CryptoContext 项目交接文档

> 最后更新：2026-05-27

## 当前状态：V1 验收完成

**线上地址**：https://app-rho-jet-70.vercel.app

### ✅ 已完成并验证

| 功能 | 状态 | 验证方式 |
|------|------|----------|
| 用户注册/登录 | ✅ 正常 | 浏览器测试 |
| 邮箱确认流程 | ✅ 正常 | 实际注册测试 |
| Bitget 连接 | ✅ 正常 | 生产环境浏览器验证，portfolio 显示 $6,555 (BGB) |
| Portfolio 同步 | ✅ 正常 | Bitget 验证通过，dashboard + MCP 双通道 |
| 10 交易所支持 | ✅ 代码就绪 | 浏览器验证下拉框 10 家交易所、passphrase 字段逻辑 |
| MCP 发现端点 | ✅ 正常 | `GET /api/mcp` 返回 server info + tools |
| MCP initialize | ✅ 正常 | JSON-RPC 2.0，协议版本 2024-11-05 |
| MCP tools/list | ✅ 正常 | 返回 get_portfolio + get_context 含 inputSchema |
| MCP get_portfolio | ✅ 正常 | curl 端到端测试，返回实时 BGB 持仓 |
| MCP get_context | ✅ 正常 | V1 返回全量 portfolio |
| MCP asset 过滤 | ✅ 正常 | `get_portfolio(asset: "BGB")` 正确过滤 |
| MCP ping | ✅ 正常 | 返回空结果 |
| MCP Token 生成 | ✅ 正常 | 自定义名称 + 权限级别选择器 |
| MCP Token 撤销 | ✅ 正常 | Revoke 按钮 → 标记 revoked → MCP 拒绝该 token |
| 匿名化权限 | ✅ 正常 | anonymized token 的 USD 值全部替换为 `$***` |
| MCP 鉴权拒绝 | ✅ 正常 | 无 token / 无效 token / 已撤销 token 均返回正确错误 |
| 安全加固 | ✅ 已实施 | 7 种安全响应头全部验证（curl -I） |
| 速率限制 | ✅ 已实施 | 各端点独立限制 |
| 输入校验 | ✅ 已实施 | API key/secret/passphrase/UUID/token name 全校验 |
| 错误脱敏 | ✅ 已实施 | 原始 CCXT 错误不泄露给客户端 |
| 前端完整流程 | ✅ 正常 | 登录→连接交易所→查看portfolio→生成MCP token→MCP调用 |

### ⏳ 待用户验收

| 功能 | 说明 |
|------|------|
| 其他 9 家交易所 | 代码已就绪并经代码审查，需要各交易所 API key 实际测试 |
| 多交易所聚合 | 代码已就绪（context.ts 聚合逻辑），需要多个交易所 API key |

### 🔧 已知限制

1. **ENCRYPTION_KEY 敏感**：Vercel 环境变量必须精确 64 位 hex，设置时用 `printf '%s'` 不能用 `echo`（echo 会加换行符导致 66 字符）
2. **速率限制是内存级**：Vercel Serverless 每个实例独立，重启后重置。对 Hobby plan 足够，Scale 需要换 Redis
3. **get_context 工具**：V1 返回全量 portfolio，语义检索待 V1.1 实现
4. **mcp_tokens 缺少 UPDATE RLS**：已通过 service role client 绕过，schema.sql 已更新供新部署使用

## 最近修复

### MCP Token 管理完善（已完成）
- Token 创建 UI：自定义名称 + 权限级别选择器（full / portfolio_only / anonymized）
- PATCH /api/mcp/tokens：撤销端点，使用 service role client 绕过 RLS
- Dashboard：Revoke 按钮 + revoked 状态显示
- 修复浏览器自动填充干扰 API key 输入框

### Bitget 连接失败（已修复）
- **根因**：Vercel 上 ENCRYPTION_KEY 环境变量被 `echo` 加了换行符（66 字符而非 64），导致 AES-256-GCM 加密失败
- **修复**：用 `printf '%s'` 重新设置环境变量
- **额外改进**：CCXT Bitget 实例加了 `broker: "ccxt"` 配置

### 安全加固（已完成）
- 新增 `src/lib/security.ts`：速率限制、输入校验、错误脱敏、安全响应头
- 所有 API 端点加了速率限制和输入校验
- 错误信息脱敏：不向客户端泄露原始 CCXT 错误
- 中间件注入 7 种安全响应头（CSP, HSTS, X-Frame-Options 等）

### Vercel 超时优化（已完成）
- connect 端点不再同步拉取 portfolio（拆分为两步）
- 各端点 `maxDuration`：connect 30s, portfolio 60s, MCP 60s

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

## 下一步

### 短期（用户验收）
- 用户提供其他交易所 API key 实际测试连接
- 确定产品正式名称和自定义域名

### 中期（V1.1）
- get_context 工具增加语义检索
- 支持用户自定义投资笔记/thesis
- portfolio 历史快照和趋势

### 长期（V2）
- DEX/链上资产支持
- 多用户共享 context（团队版）
- 更多 MCP 工具（交易历史、PnL 分析）
