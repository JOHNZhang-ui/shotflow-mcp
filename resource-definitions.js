// resource-definitions.js
// ShotFlow MCP Server — 2个 MCP Resource 定义
// Resources 是可读取的数据资源（不同于可执行的 Tools）

const RESOURCES = [
  {
    uri: "shotflow://templates/creative-types",
    name: "创作类型模板",
    description: "ShotFlow支持的6种创作类型及其默认参数配置",
    mimeType: "application/json",
    contents: [
      {
        id: "film_short",
        name: "电影短片",
        defaultStyle: "cinematic",
        defaultRatio: "2.35:1",
        typicalScenes: 5,
        promptTemplate: "创作一部电影短片分镜脚本，注重叙事节奏和画面张力"
      },
      {
        id: "short_video",
        name: "短视频/抖音",
        defaultStyle: "warm_bright",
        defaultRatio: "9:16",
        typicalScenes: 3,
        promptTemplate: "创作一条短视频分镜脚本，节奏明快，前3秒抓眼球"
      },
      {
        id: "product_ad",
        name: "产品广告",
        defaultStyle: "minimalist",
        defaultRatio: "16:9",
        typicalScenes: 4,
        promptTemplate: "创作一支产品广告分镜脚本，突出产品卖点和使用场景"
      },
      {
        id: "drama",
        name: "短剧/剧情",
        defaultStyle: "cinematic",
        defaultRatio: "16:9",
        typicalScenes: 8,
        promptTemplate: "创作一部短剧分镜脚本，注重人物关系和情感冲突"
      },
      {
        id: "documentary",
        name: "纪录片/宣传",
        defaultStyle: "realistic",
        defaultRatio: "16:9",
        typicalScenes: 6,
        promptTemplate: "创作一部纪录片分镜脚本，真实记录与艺术表达并重"
      },
      {
        id: "music_mv",
        name: "MV/音乐",
        defaultStyle: "cyberpunk",
        defaultRatio: "16:9",
        typicalScenes: 8,
        promptTemplate: "创作一支MV分镜脚本，画面与音乐节奏高度契合"
      }
    ]
  },
  {
    uri: "shotflow://templates/visual-styles",
    name: "视觉风格参考",
    description: "ShotFlow支持的7种视觉风格及其关键词提示词",
    mimeType: "application/json",
    contents: [
      {
        id: "cinematic",
        name: "电影感",
        keywords: ["cinematic lighting", "dramatic shadows", "film grain", "anamorphic lens"],
        colorTone: "暖调暗调混合",
        description: "好莱坞电影级画面质感，强调光影对比和景深层次"
      },
      {
        id: "cyberpunk",
        name: "赛博朋克",
        keywords: ["neon lights", "futuristic city", "holographic displays", "rain-soaked streets"],
        colorTone: "冷调霓虹色",
        description: "未来都市美学，霓虹灯光与暗黑城市交织"
      },
      {
        id: "retro_film",
        name: "复古胶片",
        keywords: ["vintage film look", "warm tones", "soft focus", "kodak portra colors"],
        colorTone: "暖调复古色",
        description: "胶片摄影的温暖质感，色彩柔和带有颗粒感"
      },
      {
        id: "realistic",
        name: "写实",
        keywords: ["natural lighting", "real-world textures", "documentary style", "no stylization"],
        colorTone: "自然本色",
        description: "真实还原场景原貌，不加风格化处理"
      },
      {
        id: "film_noir",
        name: "黑色电影",
        keywords: ["high contrast black and white", "deep shadows", "mysterious atmosphere", "smoke and mirrors"],
        colorTone: "黑白高对比",
        description: "经典黑色电影风格，极致明暗对比营造悬疑氛围"
      },
      {
        id: "warm_bright",
        name: "温暖明亮",
        keywords: ["golden hour", "soft warm light", "pastel tones", "airy composition"],
        colorTone: "暖调明亮色",
        description: "阳光充沛的温暖画面，适合生活化和正能量内容"
      },
      {
        id: "minimalist",
        name: "极简主义",
        keywords: ["clean lines", "minimal composition", "negative space", "monochromatic accents"],
        colorTone: "低饱和极简色",
        description: "少即是多，大量留白和干净构图突出主体"
      }
    ]
  }
];

function findResource(uri) {
  return RESOURCES.find(r => r.uri === uri);
}

module.exports = { RESOURCES, findResource };
