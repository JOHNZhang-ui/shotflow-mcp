# ShotFlow MCP Server 提交清单

## 已完成的准备工作

- [x] GitHub 仓库: https://github.com/JOHNZhang-ui/shotflow-mcp
- [x] MCP Server 已部署: https://aishotflow.cn/mcp
- [x] package.json 已包含 repository / homepage / mcpName 元数据
- [x] server.json 已创建（用于官方 MCP Registry）
- [x] 7 个 MCP Tools + 2 个 Resources 已上线验证

---

## 1. Glama.ai — 自动收录

**方式**: Glama.ai 会自动从 GitHub 抓取公开仓库，无需手动提交。通常在仓库公开后 24-72 小时内出现。

**验证地址**: https://glama.ai/mcp/servers?q=shotflow

---

## 2. mcp.so — 通过 GitHub Issue 提交

**推荐方式**: 使用 `mcp-submit` 一键提交工具。

```bash
# 在仓库目录执行
npx mcp-submit --dry-run

# 确认无误后提交
npx mcp-submit --yes
```

`mcp-submit` 会自动为 mcp.so 创建 GitHub Issue，为 awesome-mcp-servers 提交 PR，并提交到 Official MCP Registry / Smithery / MCPCentral 等。

---

## 3. MCP Market (mcpmarket.com) — 表单提交

**提交地址**: https://mcpmarket.com/submit

**表单内容**:

- **GitHub Repository URL**: https://github.com/JOHNZhang-ui/shotflow-mcp
- **提交类型**: MCP Server
- **可选**: 支付 $29 获得 "Official" 徽章和 "Try Now" 链接

---

## 4. 官方 MCP Registry — 使用 mcp-publisher

**前置条件**:
1. 将 npm 包发布到 npmjs.com（可选，但 registry 要求 package 验证）
2. 安装 mcp-publisher

**步骤**:

```bash
# 1. 安装 mcp-publisher (Linux/macOS)
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher && sudo mv mcp-publisher /usr/local/bin/

# 2. 登录（GitHub 设备码授权）
mcp-publisher login github

# 3. 发布
mcp-publisher publish
```

---

## 5. 备用手动提交（网络不好时）

### mcp.so 手动提交
在 chatmcp/mcpso 仓库提交 Issue:
https://github.com/chatmcp/mcpso/issues/new

内容模板:
```
Title: Add ShotFlow MCP Server

Repository: https://github.com/JOHNZhang-ui/shotflow-mcp
Description: ShotFlow MCP Server — AI分镜脚本与视频生成智能体，支持7个MCP Tools和2个Resources。
Transport: Streamable HTTP
URL: https://aishotflow.cn/mcp
License: MIT
```

### awesome-mcp-servers 手动提交
Fork 后提交 PR:
https://github.com/punkpeye/awesome-mcp-servers

---

## 提交状态跟踪

| 平台 | 方式 | 状态 | 验证链接 |
|------|------|------|----------|
| Glama.ai | 自动 | 等待抓取 | https://glama.ai/mcp/servers?q=shotflow |
| mcp.so | mcp-submit | 待执行 | - |
| MCP Market | 表单 | 待执行 | https://mcpmarket.com/submit |
| Official MCP Registry | mcp-publisher | 待执行 | - |
