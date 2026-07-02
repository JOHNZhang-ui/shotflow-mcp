# ShotFlow MCP Server — 接入文档

> **端点地址**: `https://aishotflow.cn/mcp`  
> **协议**: MCP 1.0 (Streamable HTTP + SSE)  
> **认证**: 无需认证（公开创意工具）/ 支持 API Key（可选）

---

## 快速开始

任何支持 MCP 的 AI 客户端，只需配置一个 URL 即可接入 ShotFlow：

```
https://aishotflow.cn/mcp
```

---

## 支持的能力

| 类型 | 名称 | 说明 |
|------|------|------|
| **Tool** | `generate_storyboard` | 从剧本/创意生成专业分镜脚本 |
| **Tool** | `generate_video` | 从分镜镜头生成视频（Pro） |
| **Tool** | `check_video_status` | 查询视频生成状态 |
| **Tool** | `regenerate_shot` | 单镜头重新生成 |
| **Tool** | `list_video_tasks` | 列出视频任务历史 |
| **Tool** | `check_quota` | 查询今日配额 |
| **Tool** | `check_health` | 检查服务健康状态 |
| **Resource** | `shotflow://templates/creative-types` | 6种创作类型模板 |
| **Resource** | `shotflow://templates/visual-styles` | 7种视觉风格参考 |

---

## 客户端配置

### Claude Desktop

**配置文件路径**:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**配置（Streamable HTTP）**:

```json
{
  "mcpServers": {
    "shotflow": {
      "url": "https://aishotflow.cn/mcp"
    }
  }
}
```

> 保存后重启 Claude Desktop。点击左下角「Attached tools」确认 `shotflow` 的 7 个工具已加载。

---

### Cursor IDE

**配置文件**: 项目级 `.cursor/mcp.json` 或全局 `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "shotflow": {
      "url": "https://aishotflow.cn/mcp"
    }
  }
}
```

> 配置后 Cursor 会自动连接。在 Chat 面板中输入 `#shotflow` 可引用工具。

---

### VS Code / GitHub Copilot

**配置文件**: `.vscode/mcp.json`（项目级）或全局设置

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

> VS Code 1.99+ 原生支持 MCP。在 Settings 中搜索 `mcp` 可管理服务器。

---

### Cline / Roo-Cline

**配置文件**: `~/.cline/mcp_settings.json`

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

### 自定义客户端（Python / Node.js）

**Python（使用 `mcp` SDK）**:

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import asyncio

async def main():
    # 使用 Streamable HTTP 传输
    from mcp.client.streamable_http import streamable_http_client
    
    async with streamable_http_client(
        base_url="https://aishotflow.cn/mcp"
    ) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            print(f"可用工具: {[t.name for t in tools.tools]}")

asyncio.run(main())
```

**Node.js（使用 `@modelcontextprotocol/sdk`）**:

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamable-http.js";

const transport = new StreamableHTTPClientTransport(
  new URL("https://aishotflow.cn/mcp")
);
const client = new Client({ name: "my-app", version: "1.0.0" }, { capabilities: {} });

await client.connect(transport);
const { tools } = await client.listTools();
console.log("可用工具:", tools.map(t => t.name));
```

---

## 调用示例

### 示例 1：生成短视频分镜

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "id": 1,
  "params": {
    "name": "generate_storyboard",
    "arguments": {
      "script": "一个创业者熬夜做产品的故事，3个场景，温情风格",
      "creativeType": "short_video",
      "visualStyle": "warm_bright",
      "aspectRatio": "9:16",
      "sceneCount": 3
    }
  }
}
```

**返回**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": " scenes: [{\"sceneIndex\":1, \"sceneName\":\"深夜的灵感\", ...}]"
    }]
  }
}
```

---

### 示例 2：查询创作类型模板（Resource）

```json
{
  "jsonrpc": "2.0",
  "method": "resources/read",
  "id": 2,
  "params": {
    "uri": "shotflow://templates/creative-types"
  }
}
```

---

### 示例 3：检查服务健康状态

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "id": 3,
  "params": {
    "name": "check_health",
    "arguments": {}
  }
}
```

**返回**:
```json
{
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"status\":\"ok\",\"shotflowStatus\":\"ok\",\"shotflowVersion\":\"v3.0.0\",...}"
    }]
  }
}
```

---

## Agent Card（A2A 协议）

ShotFlow 支持 Agent-to-Agent 协议，其他 Agent 可通过以下 URL 自动发现 ShotFlow 的能力：

```
GET https://aishotflow.cn/mcp/agent-card
```

**返回示例**:
```json
{
  "name": "ShotFlow Storyboard Agent",
  "endpoint": "https://aishotflow.cn/mcp",
  "protocol": "MCP/1.0",
  "capabilities": [
    "storyboard_generation",
    "video_generation",
    "shot_regeneration"
  ],
  "authentication": "none",
  "version": "1.0.0",
  "description": "AI分镜脚本与视频生成智能体",
  "tags": ["photography", "storyboard", "video", "creative"]
}
```

---

## 认证（可选）

如果 ShotFlow 管理员配置了 API Key 认证，在请求头中携带：

```
Authorization: Bearer <YOUR_API_KEY>
```

或在 URL 参数中传递：

```
https://aishotflow.cn/mcp?api_key=<YOUR_API_KEY>
```

> 当前 `aishotflow.cn/mcp` 为公开访问，无需认证。

---

## 常见问题

### Q: 工具列表为空？
**A**: 检查客户端是否支持 Streamable HTTP 传输。旧版 MCP 客户端仅支持 stdio，需要升级。

### Q: 调用 `generate_storyboard` 超时？
**A**: 分镜生成通常需要 30-90 秒。确保客户端超时设置 ≥ 120 秒。MCP Server 支持 SSE 流式进度推送。

### Q: `generate_video` 返回 Pro Required？
**A**: 视频生成是 Pro 功能。需要在 ShotFlow 主站（`https://aishotflow.cn`）完成 Pro 激活。

### Q: 如何查看 MCP Server 日志？
**A**: 在生产服务器上：
```bash
journalctl -u shotflow-mcp.service -f
```

### Q: 本地开发如何对接？
**A**: 启动本地 MCP Server 后，在客户端配置 `url: http://localhost:3004/mcp`。

---

## 相关链接

- **ShotFlow 主站**: https://aishotflow.cn
- **MCP Server 端点**: https://aishotflow.cn/mcp
- **Agent Card**: https://aishotflow.cn/mcp/agent-card
- **健康检查**: https://aishotflow.cn/mcp/health
- **GitHub**: https://github.com/YOUR_USERNAME/shotflow-mcp （待创建）
- **MCP 协议规范**: https://modelcontextprotocol.io

---

## 支持与反馈

遇到问题或有功能建议，请通过以下方式联系：

- GitHub Issues: https://github.com/YOUR_USERNAME/shotflow-mcp/issues
- 邮件: admin@aishotflow.cn
- 微信: <YOUR_WECHAT_ID>
