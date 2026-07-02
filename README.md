# ShotFlow MCP Server

> 让 AI Agent 直接调用专业分镜脚本生成能力

[![MCP Version](https://img.shields.io/badge/MCP-1.0-blue)](https://modelcontextprotocol.io)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Online](https://img.shields.io/badge/status-Online-brightgreen)](https://aishotflow.cn/mcp/health)

ShotFlow MCP Server 是 [ShotFlow](https://aishotflow.cn) 的 Model Context Protocol 接口实现，让任何支持 MCP 的 AI 客户端（Claude Desktop、Cursor、Cline、VS Code Copilot 等）都能直接调用专业分镜脚本与视频生成能力。

---

## 在线使用

**无需安装，直接配置 URL 即可使用：**

```
https://aishotflow.cn/mcp
```

---

## 功能一览

| Tool | 说明 |
|------|------|
| `generate_storyboard` | 从剧本/创意描述生成专业分镜脚本（6种创作类型 × 7种视觉风格） |
| `generate_video` | 从分镜镜头生成视频（Pro 功能） |
| `check_video_status` | 查询视频生成状态 |
| `regenerate_shot` | 单镜头重新生成 |
| `list_video_tasks` | 列出视频任务历史 |
| `check_quota` | 查询今日配额 |
| `check_health` | 检查服务健康状态 |

| Resource | 说明 |
|----------|------|
| `shotflow://templates/creative-types` | 6种创作类型模板与默认参数 |
| `shotflow://templates/visual-styles` | 7种视觉风格参考与关键词 |

---

## 快速接入

### Claude Desktop

编辑配置文件（macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`，Windows: `%APPDATA%\Claude\claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "shotflow": {
      "url": "https://aishotflow.cn/mcp"
    }
  }
}
```

重启 Claude Desktop，点击「Attached tools」确认 `shotflow` 已加载。

### Cursor IDE

在项目根目录创建 `.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "shotflow": {
      "url": "https://aishotflow.cn/mcp"
    }
  }
}
```

### VS Code（1.99+）

在项目根目录创建 `.vscode/mcp.json`：

```json
{
  "servers": {
    "shotflow": {
      "type": "http",
      "url": "https://aishotflow.cn/mcp"
    }
  }
}
```

### Cline / Roo-Cline

编辑 `~/.cline/mcp_settings.json`：

```json
{
  "mcpServers": {
    "shotflow": {
      "url": "https://aishotflow.cn/mcp"
    }
  }
}
```

---

## 调用示例

### 生成短视频分镜

告诉你的 AI 客户端：

> 用 shotflow 的 generate_storyboard 工具，帮我生成一个短视频分镜：一个创业者熬夜做产品的故事，3个场景，温情风格，9:16竖屏

AI 会自动调用 MCP Tool，返回结构化分镜结果。

### 查看可用创作类型

> 读取 shotflow 的 creative-types 资源，告诉我有哪些创作类型可选

---

## Agent Card（A2A 协议）

其他 AI Agent 可通过以下 URL 自动发现 ShotFlow 的能力：

```
https://aishotflow.cn/mcp/agent-card
```

---

## 部署自己的实例

### 要求

- Node.js 18+
- ShotFlow Express Server 运行在 `localhost:3003`

### 安装

```bash
git clone https://github.com/YOUR_USERNAME/shotflow-mcp.git
cd shotflow-mcp
# 无需 npm install，零依赖
```

### 启动

```bash
# 开发模式
node shotflow-mcp-server.js
# 默认端口 3004

# 生产部署（systemd）
sudo cp shotflow-mcp.service /etc/systemd/system/
sudo systemctl enable shotflow-mcp
sudo systemctl start shotflow-mcp
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MCP_PORT` | `3004` | MCP Server 监听端口 |
| `SHOTFLOW_API_URL` | `http://localhost:3003` | ShotFlow Express 地址 |
| `NODE_ENV` | `development` | 环境模式 |

---

## 架构

```
AI Client (Claude/Cursor/...)
    ↓ Streamable HTTP (JSON-RPC 2.0)
Nginx :443
    └── /mcp → ShotFlow MCP Server :3004
                    └── HTTP → ShotFlow Express :3003
```

- **协议**: MCP 1.0（Streamable HTTP + SSE）
- **传输**: JSON-RPC 2.0 over HTTP
- **依赖**: 零外部依赖（纯 Node.js 实现）
- **SSE 支持**: `proxy_buffering off` 配合 Nginx 实现流式进度推送

---

## 文件结构

```
shotflow-mcp/
├── shotflow-mcp-server.js   # MCP Server 主文件
├── tool-definitions.js       # 7个 Tool 的 JSON Schema 定义
├── resource-definitions.js   # 2个 Resource 定义
├── prompt-builder.js        # Prompt 构造与模型配置解析
├── package.json             # npm 包配置
├── shotflow-mcp.service     # systemd 服务文件
├── INTEGRATION.md          # 详细接入文档
├── README.md               # 本文件
└── test/
    └── test-mcp.js        # 测试套件
```

---

## 测试

```bash
# 启动本地服务
node shotflow-mcp-server.js &

# 运行测试
node test/test-mcp.js
```

---

## 相关链接

- **ShotFlow 主站**: https://aishotflow.cn
- **MCP 端点**: https://aishotflow.cn/mcp
- **Agent Card**: https://aishotflow.cn/mcp/agent-card
- **MCP 协议规范**: https://modelcontextprotocol.io
- **ShotFlow 公众号**: 扫码关注获取最新更新

---

## 许可证

MIT License — 自由使用、修改和分发。

---

## 支持

- GitHub Issues: https://github.com/YOUR_USERNAME/shotflow-mcp/issues
- 邮件: admin@aishotflow.cn
