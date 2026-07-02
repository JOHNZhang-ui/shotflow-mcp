// test-mcp.js
// ShotFlow MCP Server — 本地测试脚本
// 用法: node test/test-mcp.js
//
// 测试前提: ShotFlow Express Server 需运行在 localhost:3003
// MCP Server 需运行在 localhost:3004 (先启动 node shotflow-mcp-server.js)

const MCP_URL = 'http://localhost:3004/mcp';

function rpcRequest(method, params) {
  return {
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 1000),
    method,
    params: params || {}
  };
}

async function callMcp(method, params) {
  const body = rpcRequest(method, params);
  const response = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

function log(title, data) {
  console.log('\n--- ' + title + ' ---');
  console.log(JSON.stringify(data, null, 2));
}

async function runTests() {
  console.log('========================================');
  console.log('  ShotFlow MCP Server — Test Suite');
  console.log('========================================\n');

  // Test 1: initialize
  const initResp = await callMcp('initialize', {
    protocolVersion: '2025-03-26',
    clientInfo: { name: 'test-client', version: '1.0.0' }
  });
  log('Test 1: initialize', initResp);
  if (initResp.error) console.log('FAIL'); else console.log('PASS');

  // Test 2: ping
  const pingResp = await callMcp('ping');
  log('Test 2: ping', pingResp);
  if (pingResp.error) console.log('FAIL'); else console.log('PASS');

  // Test 3: tools/list
  const toolsResp = await callMcp('tools/list');
  log('Test 3: tools/list', { toolCount: toolsResp.result?.tools?.length, toolNames: toolsResp.result?.tools?.map(t => t.name) });
  if (toolsResp.error) console.log('FAIL'); else console.log('PASS');

  // Test 4: resources/list
  const resourcesResp = await callMcp('resources/list');
  log('Test 4: resources/list', { resourceCount: resourcesResp.result?.resources?.length, uris: resourcesResp.result?.resources?.map(r => r.uri) });
  if (resourcesResp.error) console.log('FAIL'); else console.log('PASS');

  // Test 5: resources/read — creative-types
  const creativeTypesResp = await callMcp('resources/read', { uri: 'shotflow://templates/creative-types' });
  log('Test 5: resources/read creative-types', { uri: creativeTypesResp.result?.contents?.[0]?.uri, contentLength: creativeTypesResp.result?.contents?.[0]?.text?.length });
  if (creativeTypesResp.error) console.log('FAIL'); else console.log('PASS');

  // Test 6: resources/read — visual-styles
  const visualStylesResp = await callMcp('resources/read', { uri: 'shotflow://templates/visual-styles' });
  log('Test 6: resources/read visual-styles', { uri: visualStylesResp.result?.contents?.[0]?.uri, contentLength: visualStylesResp.result?.contents?.[0]?.text?.length });
  if (visualStylesResp.error) console.log('FAIL'); else console.log('PASS');

  // Test 7: tools/call — check_health
  const healthResp = await callMcp('tools/call', { name: 'check_health', arguments: {} });
  log('Test 7: tools/call check_health', healthResp.result?.structuredContent || healthResp.error);
  if (healthResp.error) console.log('FAIL (ShotFlow server may not be running)'); else console.log('PASS');

  // Test 8: tools/call — check_quota
  const quotaResp = await callMcp('tools/call', { name: 'check_quota', arguments: {} });
  log('Test 8: tools/call check_quota', quotaResp.result?.structuredContent || quotaResp.error);
  if (quotaResp.error) console.log('FAIL (ShotFlow server may not be running)'); else console.log('PASS');

  // Test 9: tools/call — list_video_tasks
  const tasksResp = await callMcp('tools/call', { name: 'list_video_tasks', arguments: { limit: 5 } });
  log('Test 9: tools/call list_video_tasks', tasksResp.result?.structuredContent || tasksResp.error);
  if (tasksResp.error) console.log('FAIL'); else console.log('PASS');

  // Test 10: tools/call — unknown tool (should return error)
  const unknownResp = await callMcp('tools/call', { name: 'nonexistent_tool', arguments: {} });
  log('Test 10: tools/call unknown (expect error)', unknownResp.error);
  if (unknownResp.error && unknownResp.error.code === -32601) console.log('PASS'); else console.log('FAIL');

  // Test 11: Agent Card
  const cardResp = await fetch('http://localhost:3004/mcp/agent-card');
  const card = await cardResp.json();
  log('Test 11: Agent Card', card);
  if (card.name) console.log('PASS'); else console.log('FAIL');

  console.log('\n========================================');
  console.log('  Tests complete');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test suite failed:', err.message);
  console.error('Make sure MCP Server is running: node shotflow-mcp-server.js');
  process.exit(1);
});
