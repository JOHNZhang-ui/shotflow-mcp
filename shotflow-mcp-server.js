// shotflow-mcp-server.js
// ShotFlow MCP Server — MCP 1.0 (Model Context Protocol) 实现
// 传输方式: Streamable HTTP (JSON-RPC 2.0 over HTTP + SSE)
//
// 启动方式:
//   node shotflow-mcp-server.js
//
// 环境变量:
//   MCP_PORT          — MCP Server 端口 (默认 3004)
//   SHOTFLOW_BASE_URL — ShotFlow Express API 地址 (默认 http://localhost:3003)
//   MCP_API_KEY       — MCP 认证 Key (可选, 不设则无认证)
//   DEEPSEEK_API_KEY  — DeepSeek API Key
//   AGNES_API_KEY     — Agnes AI API Key
//   OPENAI_API_KEY    — OpenAI API Key
//   GLM_API_KEY       — 智谱GLM API Key
//   QWEN_API_KEY      — 通义千问 API Key

const http = require('http');
const { TOOLS } = require('./tool-definitions');
const { RESOURCES, findResource } = require('./resource-definitions');
const {
  buildStoryboardPrompt,
  buildRegenerateShotPrompt,
  resolveModelConfig
} = require('./prompt-builder');

// ====== 配置 ======
const MCP_PORT = parseInt(process.env.MCP_PORT || '3004', 10);
const SHOTFLOW_BASE_URL = (process.env.SHOTFLOW_BASE_URL || 'http://localhost:3003').replace(/\/+$/, '');
const MCP_API_KEY = process.env.MCP_API_KEY || '';

const SERVER_INFO = {
  name: 'shotflow-mcp-server',
  version: '1.0.0',
  protocolVersion: '2025-03-26',
  capabilities: {
    tools: { listChanged: false },
    resources: { listChanged: false },
    streaming: true
  }
};

// ====== JSON-RPC 辅助函数 ======

function makeResponse(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function makeError(id, code, message, data) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return { jsonrpc: '2.0', id, error };
}

function isJsonRpcRequest(body) {
  return body && body.jsonrpc === '2.0' && typeof body.method === 'string';
}

// ====== 认证 ======

function authenticate(req) {
  if (!MCP_API_KEY) return true;

  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() === MCP_API_KEY;
  }

  const query = new URL(req.url, 'http://localhost').searchParams;
  const apiKey = query.get('api_key');
  if (apiKey === MCP_API_KEY) return true;

  return false;
}

// ====== ShotFlow 内部 API 调用 ======

async function callShotFlowAPI(method, path, body, headers) {
  const url = SHOTFLOW_BASE_URL + path;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { text: await response.text() };
    }

    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ====== 工具执行器 ======

async function executeTool(name, args, clientIp) {
  switch (name) {
    case 'generate_storyboard':
      return await execGenerateStoryboard(args);
    case 'generate_video':
      return await execGenerateVideo(args);
    case 'check_video_status':
      return await execCheckVideoStatus(args);
    case 'regenerate_shot':
      return await execRegenerateShot(args);
    case 'list_video_tasks':
      return await execListVideoTasks(args);
    case 'check_quota':
      return await execCheckQuota();
    case 'check_health':
      return await execCheckHealth();
    default:
      throw { code: -32601, message: `Unknown tool: ${name}` };
  }
}

// --- generate_storyboard ---
async function execGenerateStoryboard(args) {
  const { script, creativeType, visualStyle, aspectRatio, aiModel, customApiKey, customApiBase, referenceColors } = args;

  if (!script || !script.trim()) {
    throw { code: -32602, message: "Parameter 'script' is required and must not be empty" };
  }

  const modelConfig = resolveModelConfig(aiModel, customApiKey, customApiBase);
  if (!modelConfig.apiBase || (!modelConfig.apiKey && !modelConfig.useServerKey)) {
    throw {
      code: -32602,
      message: `Cannot resolve API key for model '${aiModel}'. Set the corresponding environment variable or use aiModel='custom' with customApiKey.`
    };
  }

  const prompt = buildStoryboardPrompt({ script, creativeType, visualStyle, aspectRatio, referenceColors });

  const requestBody = {
    apiBase: modelConfig.apiBase,
    apiKey: modelConfig.apiKey,
    useServerKey: modelConfig.useServerKey,
    body: {
      model: modelConfig.model,
      messages: [
        { role: 'system', content: 'You are a professional storyboard director and cinematographer. You create detailed shot lists in JSON format. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 8000,
      response_format: { type: 'json_object' }
    }
  };

  const result = await callShotFlowAPI('POST', '/api/ai/proxy', requestBody);

  if (!result.ok) {
    throw { code: -32603, message: `AI proxy error: ${result.data?.error || result.status}` };
  }

  const aiResponse = result.data;
  let storyboard;
  try {
    const content = aiResponse.choices?.[0]?.message?.content || '{}';
    storyboard = typeof content === 'string' ? JSON.parse(content) : content;
  } catch (parseErr) {
    throw { code: -32603, message: `Failed to parse AI response as JSON: ${parseErr.message}` };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(storyboard, null, 2)
      }
    ],
    structuredContent: storyboard
  };
}

// --- generate_video ---
async function execGenerateVideo(args) {
  const { prompt, negativePrompt, imageSize, model } = args;

  if (!prompt || !prompt.trim()) {
    throw { code: -32602, message: "Parameter 'prompt' is required" };
  }

  const requestBody = {
    prompt: prompt.trim(),
    negativePrompt: negativePrompt || '',
    imageSize: imageSize || '16:9',
    model: model || 'agnes'
  };

  const result = await callShotFlowAPI('POST', '/api/video/generate', requestBody);

  if (!result.ok) {
    if (result.status === 402) {
      throw { code: -32001, message: 'Pro membership required for video generation', data: { code: 'PRO_REQUIRED' } };
    }
    throw { code: -32603, message: `Video generation failed: ${result.data?.error || result.status}` };
  }

  const task = result.data;
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          requestId: task.requestId || task.id,
          status: 'pending',
          message: 'Video generation submitted. Use check_video_status to poll for completion.'
        }, null, 2)
      }
    ],
    structuredContent: {
      requestId: task.requestId || task.id,
      status: 'pending'
    }
  };
}

// --- check_video_status ---
async function execCheckVideoStatus(args) {
  const { requestId } = args;
  if (!requestId) {
    throw { code: -32602, message: "Parameter 'requestId' is required" };
  }

  const result = await callShotFlowAPI('GET', `/api/video/status/${encodeURIComponent(requestId)}`);

  if (!result.ok) {
    throw { code: -32603, message: `Status check failed: ${result.data?.error || result.status}` };
  }

  const status = result.data;
  const normalized = {
    requestId,
    status: mapVideoStatus(status.status),
    videoUrl: status.videoUrl || null,
    duration: status.duration || null,
    errorMessage: status.reason || null
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(normalized, null, 2) }],
    structuredContent: normalized
  };
}

function mapVideoStatus(raw) {
  const s = (raw || '').toLowerCase();
  if (s === 'succeed' || s === 'completed' || s === 'success') return 'completed';
  if (s === 'failed' || s === 'error') return 'failed';
  if (s === 'processing' || s === 'running') return 'processing';
  return 'pending';
}

// --- regenerate_shot ---
async function execRegenerateShot(args) {
  const { originalShot, modifications, visualStyle } = args;

  if (!originalShot) {
    throw { code: -32602, message: "Parameter 'originalShot' is required" };
  }

  const prompt = buildRegenerateShotPrompt({ originalShot, modifications, visualStyle });

  const modelConfig = resolveModelConfig('deepseek');

  const requestBody = {
    apiBase: modelConfig.apiBase,
    apiKey: modelConfig.apiKey,
    useServerKey: true,
    body: {
      model: modelConfig.model,
      messages: [
        { role: 'system', content: 'You are a professional storyboard director. Regenerate a single shot in JSON format. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    }
  };

  const result = await callShotFlowAPI('POST', '/api/ai/proxy', requestBody);

  if (!result.ok) {
    throw { code: -32603, message: `AI proxy error: ${result.data?.error || result.status}` };
  }

  let shot;
  try {
    const content = result.data.choices?.[0]?.message?.content || '{}';
    shot = typeof content === 'string' ? JSON.parse(content) : content;
  } catch (parseErr) {
    throw { code: -32603, message: `Failed to parse AI response: ${parseErr.message}` };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(shot, null, 2) }],
    structuredContent: shot
  };
}

// --- list_video_tasks ---
async function execListVideoTasks(args) {
  const limit = Math.min(args?.limit || 20, 50);
  const result = await callShotFlowAPI('GET', `/api/video/tasks?limit=${limit}`);

  if (!result.ok) {
    throw { code: -32603, message: `Failed to list tasks: ${result.data?.error || result.status}` };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
    structuredContent: result.data
  };
}

// --- check_quota ---
async function execCheckQuota() {
  const result = await callShotFlowAPI('GET', '/api/quota');

  if (!result.ok) {
    throw { code: -32603, message: `Quota check failed: ${result.data?.error || result.status}` };
  }

  const data = result.data;
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        remaining: data.remaining,
        total: data.total,
        isPro: data.pro || data.unlimited || false,
        date: data.date
      }, null, 2)
    }],
    structuredContent: {
      remaining: data.remaining,
      total: data.total,
      isPro: data.pro || data.unlimited || false,
      date: data.date
    }
  };
}

// --- check_health ---
async function execCheckHealth() {
  const result = await callShotFlowAPI('GET', '/api/health');

  if (!result.ok) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ status: 'down', error: result.data?.error || `HTTP ${result.status}` }, null, 2)
      }],
      structuredContent: { status: 'down' }
    };
  }

  const data = result.data;
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: data.status || 'ok',
        version: data.version,
        uptime: data.uptime,
        features: data.features || {}
      }, null, 2)
    }],
    structuredContent: {
      status: data.status || 'ok',
      version: data.version,
      uptime: data.uptime,
      features: data.features || {}
    }
  };
}

// ====== MCP 方法处理器 ======

async function handleInitialize(params) {
  return {
    protocolVersion: SERVER_INFO.protocolVersion,
    serverInfo: {
      name: SERVER_INFO.name,
      version: SERVER_INFO.version
    },
    capabilities: SERVER_INFO.capabilities
  };
}

async function handleToolsList() {
  return { tools: TOOLS };
}

async function handleToolsCall(params, clientIp) {
  const { name, arguments: args } = params;

  if (!name) {
    throw { code: -32602, message: "Parameter 'name' is required" };
  }

  const tool = TOOLS.find(t => t.name === name);
  if (!tool) {
    throw { code: -32601, message: `Unknown tool: ${name}` };
  }

  try {
    return await executeTool(name, args || {}, clientIp);
  } catch (err) {
    if (err.code) throw err;
    throw { code: -32603, message: `Tool execution error: ${err.message}` };
  }
}

async function handleResourcesList() {
  return {
    resources: RESOURCES.map(r => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType
    }))
  };
}

async function handleResourcesRead(params) {
  const { uri } = params;
  const resource = findResource(uri);

  if (!resource) {
    throw { code: -32602, message: `Unknown resource: ${uri}` };
  }

  return {
    contents: [
      {
        uri: resource.uri,
        mimeType: resource.mimeType,
        text: JSON.stringify(resource.contents, null, 2)
      }
    ]
  };
}

async function handlePing() {
  return {};
}

// ====== JSON-RPC 方法路由 ======

async function routeMethod(method, params, clientIp) {
  switch (method) {
    case 'initialize':
      return await handleInitialize(params);
    case 'initialized':
    case 'notifications/initialized':
      return null;
    case 'ping':
      return await handlePing();
    case 'tools/list':
      return await handleToolsList();
    case 'tools/call':
      return await handleToolsCall(params, clientIp);
    case 'resources/list':
      return await handleResourcesList();
    case 'resources/read':
      return await handleResourcesRead(params);
    default:
      throw { code: -32601, message: `Method not found: ${method}` };
  }
}

// ====== HTTP Server ======

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json)
  });
  res.end(json);
}

function sendSseHeaders(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
}

function sendSseEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/mcp/health') {
    return sendJson(res, 200, {
      status: 'ok',
      server: SERVER_INFO.name,
      version: SERVER_INFO.version,
      uptime: process.uptime(),
      shotflowBaseUrl: SHOTFLOW_BASE_URL
    });
  }

  if (req.method === 'GET' && req.url === '/mcp/agent-card') {
    return sendJson(res, 200, {
      name: 'ShotFlow Storyboard Agent',
      endpoint: `http://localhost:${MCP_PORT}/mcp`,
      protocol: 'MCP/1.0',
      capabilities: [
        'storyboard_generation',
        'video_generation',
        'shot_regeneration',
        'creative_type_selection',
        'visual_style_application'
      ],
      authentication: MCP_API_KEY ? 'apikey' : 'none',
      version: SERVER_INFO.version,
      description: 'AI分镜脚本与视频生成智能体。支持6种创作类型、7种视觉风格，从文本创意到成品视频的全流程自动化。',
      tags: ['photography', 'storyboard', 'video', 'creative', 'filmmaking']
    });
  }

  if (req.method !== 'POST' || !req.url.startsWith('/mcp')) {
    return sendJson(res, 404, { error: 'Not found. MCP endpoint: POST /mcp' });
  }

  if (!authenticate(req)) {
    return sendJson(res, 401, { error: 'Unauthorized: invalid or missing API key' });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    return sendJson(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: ' + e.message } });
  }

  if (!isJsonRpcRequest(body)) {
    return sendJson(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request: not a JSON-RPC 2.0 message' } });
  }

  const { jsonrpc, id, method, params } = body;
  const clientIp = getClientIp(req);

  const isStreaming = method === 'tools/call' && params?.name === 'generate_storyboard';

  if (isStreaming) {
    sendSseHeaders(res);
    sendSseEvent(res, 'progress', { step: 'processing', method, tool: params?.name });

    try {
      const result = await routeMethod(method, params, clientIp);
      sendSseEvent(res, 'result', makeResponse(id, result));
    } catch (err) {
      const errResp = err.code
        ? makeError(id, err.code, err.message, err.data)
        : makeError(id, -32603, err.message);
      sendSseEvent(res, 'error', errResp);
    }

    res.end();
    return;
  }

  try {
    const result = await routeMethod(method, params, clientIp);

    if (result === null) {
      return sendJson(res, 204, {});
    }

    return sendJson(res, 200, makeResponse(id, result));
  } catch (err) {
    const errResp = err.code
      ? makeError(id, err.code, err.message, err.data)
      : makeError(id, -32603, err.message);
    return sendJson(res, 200, errResp);
  }
});

server.listen(MCP_PORT, () => {
  console.log('========================================');
  console.log('  ShotFlow MCP Server v1.0.0');
  console.log('========================================');
  console.log(`  MCP Endpoint:  http://localhost:${MCP_PORT}/mcp`);
  console.log(`  Health Check:  http://localhost:${MCP_PORT}/mcp/health`);
  console.log(`  Agent Card:    http://localhost:${MCP_PORT}/mcp/agent-card`);
  console.log(`  ShotFlow API:  ${SHOTFLOW_BASE_URL}`);
  console.log(`  Auth:          ${MCP_API_KEY ? 'API Key required' : 'No auth (open)'}`);
  console.log(`  Tools:         ${TOOLS.length} tools registered`);
  console.log(`  Resources:     ${RESOURCES.length} resources registered`);
  console.log('========================================');
  console.log('');
  console.log('Available MCP methods:');
  console.log('  - initialize');
  console.log('  - ping');
  console.log('  - tools/list');
  console.log('  - tools/call');
  console.log('  - resources/list');
  console.log('  - resources/read');
  console.log('');
  console.log(`Listening on port ${MCP_PORT}...`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => process.exit(0));
});
