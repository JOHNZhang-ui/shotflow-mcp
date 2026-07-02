// prompt-builder.js
// ShotFlow MCP Server — Prompt 构造模板
// 将 MCP 工具参数转换为 ShotFlow 内部使用的 AI prompt

const TYPE_LABELS = {
  film_short: '电影短片',
  short_video: '短视频/抖音',
  product_ad: '产品广告',
  drama: '短剧/剧情',
  documentary: '纪录片/宣传',
  music_mv: 'MV/音乐'
};

const STYLE_LABELS = {
  cinematic: '电影感',
  cyberpunk: '赛博朋克',
  retro_film: '复古胶片',
  realistic: '写实',
  film_noir: '黑色电影',
  warm_bright: '温暖明亮',
  minimalist: '极简主义'
};

const STYLE_KEYWORDS = {
  cinematic: 'cinematic lighting, dramatic shadows, film grain, anamorphic lens, shallow depth of field',
  cyberpunk: 'neon lights, futuristic city, holographic displays, rain-soaked streets, blade runner aesthetic',
  retro_film: 'vintage film look, warm tones, soft focus, kodak portra colors, 35mm grain',
  realistic: 'natural lighting, real-world textures, documentary style, no stylization, true colors',
  film_noir: 'high contrast black and white, deep shadows, mysterious atmosphere, venetian blind shadows',
  warm_bright: 'golden hour, soft warm light, pastel tones, airy composition, sun-kissed',
  minimalist: 'clean lines, minimal composition, negative space, monochromatic accents, studio lighting'
};

const TYPE_PROMPT_PREFIX = {
  film_short: '创作一部电影短片分镜脚本，注重叙事节奏和画面张力。场景之间要有情绪起伏，开头要有悬念，结尾要有回味。',
  short_video: '创作一条短视频分镜脚本，节奏明快，前3秒必须抓住眼球。适合抖音/快手竖屏观看，每个镜头不超过5秒。',
  product_ad: '创作一支产品广告分镜脚本，突出产品核心卖点和使用场景。要有情感共鸣点，最后以产品特写和品牌Logo收尾。',
  drama: '创作一部短剧分镜脚本，注重人物关系和情感冲突。每集结尾要有钩子(cliffhanger)，让观众想看下一集。',
  documentary: '创作一部纪录片分镜脚本，真实记录与艺术表达并重。要有旁白引导，画面要有信息量和感染力。',
  music_mv: '创作一支MV分镜脚本，画面与音乐节奏高度契合。要有视觉记忆点(visual hook)，转场要跟随节拍。'
};

function buildStoryboardPrompt(params) {
  const { script, creativeType, visualStyle, aspectRatio, referenceColors } = params;

  const typeLabel = TYPE_LABELS[creativeType] || '短视频';
  const styleLabel = STYLE_LABELS[visualStyle] || '电影感';
  const styleKeywords = STYLE_KEYWORDS[visualStyle] || '';
  const typePrefix = TYPE_PROMPT_PREFIX[creativeType] || '';

  let prompt = `${typePrefix}\n\n`;
  prompt += `【创作类型】${typeLabel}\n`;
  prompt += `【视觉风格】${styleLabel}（关键词: ${styleKeywords}）\n`;
  prompt += `【画幅比例】${aspectRatio}\n\n`;
  prompt += `【剧本/创意内容】\n${script}\n\n`;

  prompt += `请输出严格的JSON格式（不要包裹在markdown代码块中），结构如下：\n`;
  prompt += `{\n`;
  prompt += `  "title": "分镜标题",\n`;
  prompt += `  "totalScenes": 场景数,\n`;
  prompt += `  "totalShots": 总镜头数,\n`;
  prompt += `  "scenes": [\n`;
  prompt += `    {\n`;
  prompt += `      "sceneNumber": 1,\n`;
  prompt += `      "sceneTitle": "场景标题",\n`;
  prompt += `      "location": "拍摄地点",\n`;
  prompt += `      "timeOfDay": "时间(日/夜/晨/暮)",\n`;
  prompt += `      "mood": "场景情绪",\n`;
  prompt += `      "shots": [\n`;
  prompt += `        {\n`;
  prompt += `          "shotNumber": 1,\n`;
  prompt += `          "shotType": "镜头类型(特写/近景/中景/全景/远景)",\n`;
  prompt += `          "description": "画面详细描述",\n`;
  prompt += `          "dialogue": "台词(无声则填无)",\n`;
  prompt += `          "soundDesign": "声音设计(配乐/音效/环境音)",\n`;
  prompt += `          "emotion": "情绪标注",\n`;
  prompt += `          "directorNote": "导演备注",\n`;
  prompt += `          "aiPrompt": "AI图像生成英文提示词,融入风格关键词: ${styleKeywords}",\n`;
  prompt += `          "duration": "预估时长(如3s)",\n`;
  prompt += `          "cameraMovement": "镜头运动(固定/推/拉/摇/移/跟/航拍)"\n`;
  prompt += `        }\n`;
  prompt += `      ]\n`;
  prompt += `    }\n`;
  prompt += `  ]\n`;
  prompt += `}\n`;

  if (referenceColors && referenceColors.length > 0) {
    const colorStr = referenceColors.map(c => `${c.name}(${c.hex})`).join(', ');
    prompt += `\n【参考色调】${colorStr}\n请在aiPrompt字段中融入这些色调，确保生成的画面色彩与参考图一致。\n`;
  }

  prompt += `\n要求：\n`;
  prompt += `1. 每个场景至少2个镜头\n`;
  prompt += `2. aiPrompt必须是英文，描述具体可生成\n`;
  prompt += `3. 镜头类型要多样化，不要全是同一类型\n`;
  prompt += `4. 声音设计要具体(什么配乐、什么音效)\n`;
  prompt += `5. 情绪要有层次变化，不要全程一种情绪\n`;

  return prompt;
}

function buildRegenerateShotPrompt(params) {
  const { originalShot, modifications, visualStyle } = params;

  const styleLabel = STYLE_LABELS[visualStyle] || '电影感';
  const styleKeywords = STYLE_KEYWORDS[visualStyle] || '';

  let prompt = `请重新生成以下分镜镜头，保持视觉风格为${styleLabel}（关键词: ${styleKeywords}）。\n\n`;

  prompt += `【原始镜头】\n`;
  prompt += `镜头编号: ${originalShot.shotNumber || '未指定'}\n`;
  prompt += `镜头类型: ${originalShot.shotType || '未指定'}\n`;
  prompt += `画面描述: ${originalShot.description || '未指定'}\n`;
  prompt += `台词: ${originalShot.dialogue || '无'}\n`;
  prompt += `情绪: ${originalShot.emotion || '未指定'}\n`;
  prompt += `原AI提示词: ${originalShot.aiPrompt || '未指定'}\n\n`;

  prompt += `【修改要求】\n`;
  if (modifications.shotType) prompt += `镜头类型改为: ${modifications.shotType}\n`;
  if (modifications.emotion) prompt += `情绪方向改为: ${modifications.emotion}\n`;
  if (modifications.directorNote) prompt += `导演备注: ${modifications.directorNote}\n`;

  prompt += `\n请输出严格的JSON格式（不要包裹在markdown代码块中），只返回这一个镜头的对象：\n`;
  prompt += `{\n`;
  prompt += `  "shotNumber": ${originalShot.shotNumber || 1},\n`;
  prompt += `  "shotType": "镜头类型",\n`;
  prompt += `  "description": "新的画面详细描述",\n`;
  prompt += `  "dialogue": "台词",\n`;
  prompt += `  "soundDesign": "声音设计",\n`;
  prompt += `  "emotion": "新情绪",\n`;
  prompt += `  "directorNote": "新导演备注",\n`;
  prompt += `  "aiPrompt": "新的AI图像生成英文提示词,融入: ${styleKeywords}",\n`;
  prompt += `  "duration": "预估时长",\n`;
  prompt += `  "cameraMovement": "镜头运动"\n`;
  prompt += `}\n`;

  return prompt;
}

const MODEL_CONFIG = {
  deepseek: {
    apiBase: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    useServerKey: true,
    keyEnv: 'DEEPSEEK_API_KEY'
  },
  agnes: {
    apiBase: 'https://apihub.agnes-ai.com/v1',
    model: 'agnes-chat-v2.0',
    useServerKey: true,
    keyEnv: 'AGNES_API_KEY'
  },
  openai: {
    apiBase: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    useServerKey: false,
    keyEnv: 'OPENAI_API_KEY'
  },
  glm: {
    apiBase: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    useServerKey: false,
    keyEnv: 'GLM_API_KEY'
  },
  qwen: {
    apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    useServerKey: false,
    keyEnv: 'QWEN_API_KEY'
  },
  custom: {
    apiBase: null,
    model: null,
    useServerKey: false,
    keyEnv: null
  }
};

function resolveModelConfig(aiModel, customApiKey, customApiBase) {
  if (aiModel === 'custom') {
    return {
      apiBase: customApiBase,
      apiKey: customApiKey,
      model: 'custom-model',
      useServerKey: false
    };
  }

  const config = MODEL_CONFIG[aiModel] || MODEL_CONFIG.deepseek;
  const serverKey = config.useServerKey ? (process.env[config.keyEnv] || '') : '';

  return {
    apiBase: config.apiBase,
    apiKey: serverKey,
    model: config.model,
    useServerKey: config.useServerKey
  };
}

module.exports = {
  buildStoryboardPrompt,
  buildRegenerateShotPrompt,
  resolveModelConfig,
  TYPE_LABELS,
  STYLE_LABELS,
  MODEL_CONFIG
};
