// tool-definitions.js
// ShotFlow MCP Server — 7个工具的 JSON Schema 定义
// 遵循 MCP (Model Context Protocol) 1.0 规范

const TOOLS = [
  {
    name: "generate_storyboard",
    description: "从剧本/创意描述生成专业分镜脚本。支持6种创作类型和7种视觉风格，输出包含场景-镜头层级结构、台词、声音设计、情绪标注、导演备注和AI图像提示词。这是ShotFlow的核心能力。",
    inputSchema: {
      type: "object",
      properties: {
        script: {
          type: "string",
          description: "剧本文本或创意描述。可以是完整剧本、简短创意概念、或关键场景描述。"
        },
        creativeType: {
          type: "string",
          enum: ["film_short", "short_video", "product_ad", "drama", "documentary", "music_mv"],
          description: "创作类型: film_short=电影短片, short_video=短视频/抖音, product_ad=产品广告, drama=短剧/剧情, documentary=纪录片/宣传, music_mv=MV/音乐",
          default: "short_video"
        },
        visualStyle: {
          type: "string",
          enum: ["cinematic", "cyberpunk", "retro_film", "realistic", "film_noir", "warm_bright", "minimalist"],
          description: "视觉风格: cinematic=电影感, cyberpunk=赛博朋克, retro_film=复古胶片, realistic=写实, film_noir=黑色电影, warm_bright=温暖明亮, minimalist=极简主义",
          default: "cinematic"
        },
        aspectRatio: {
          type: "string",
          enum: ["16:9", "2.35:1", "9:16", "4:3", "1:1"],
          description: "画幅比例",
          default: "16:9"
        },
        aiModel: {
          type: "string",
          enum: ["deepseek", "agnes", "openai", "glm", "qwen", "custom"],
          description: "AI模型选择。deepseek=DeepSeek Chat(推荐), agnes=Agnes AI(免费), openai=GPT-4o, glm=智谱GLM, qwen=通义千问, custom=用户自有Key",
          default: "deepseek"
        },
        customApiKey: {
          type: "string",
          description: "当 aiModel=custom 时，用户自有的 API Key。可选。"
        },
        customApiBase: {
          type: "string",
          description: "当 aiModel=custom 时，自定义 API Base URL。可选。"
        },
        referenceColors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              hex: { type: "string", description: "颜色HEX值, 如 #FF5733" },
              name: { type: "string", description: "颜色名称, 如 橙红" }
            }
          },
          description: "参考色调数组。从参考图提取的主色调，会注入AI图像提示词中。可选。"
        }
      },
      required: ["script", "creativeType", "visualStyle"]
    }
  },

  {
    name: "generate_video",
    description: "从分镜镜头描述或AI提示词生成短视频片段。支持多种分辨率，返回任务ID用于后续状态查询。需要Pro会员权限。",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "视频内容描述。可直接使用 generate_storyboard 输出的 aiPrompt 字段。"
        },
        negativePrompt: {
          type: "string",
          description: "负面提示词，排除不想要的元素。可选。",
          default: ""
        },
        imageSize: {
          type: "string",
          enum: ["16:9", "9:16", "1:1", "4:3", "3:4"],
          description: "视频分辨率/画幅",
          default: "16:9"
        },
        model: {
          type: "string",
          enum: ["agnes", "siliconflow"],
          description: "视频生成引擎。agnes=Agnes AI(免费Pro用户), siliconflow=SiliconFlow Wan2.2",
          default: "agnes"
        }
      },
      required: ["prompt", "imageSize"]
    }
  },

  {
    name: "check_video_status",
    description: "查询视频生成任务的当前状态。任务完成后可获取视频文件URL。",
    inputSchema: {
      type: "object",
      properties: {
        requestId: {
          type: "string",
          description: "generate_video 返回的任务ID"
        }
      },
      required: ["requestId"]
    }
  },

  {
    name: "regenerate_shot",
    description: "对分镜脚本中的单个镜头重新生成AI描述和提示词。可修改镜头类型、情绪方向等参数，其他镜头保持不变。",
    inputSchema: {
      type: "object",
      properties: {
        originalShot: {
          type: "object",
          description: "原始镜头数据",
          properties: {
            shotNumber: { type: "integer" },
            shotType: { type: "string" },
            description: { type: "string" },
            dialogue: { type: "string" },
            emotion: { type: "string" },
            aiPrompt: { type: "string" }
          }
        },
        modifications: {
          type: "object",
          description: "要修改的字段和新的值。未指定的字段保持原样。",
          properties: {
            shotType: { type: "string", description: "新镜头类型" },
            emotion: { type: "string", description: "新情绪方向" },
            directorNote: { type: "string", description: "新导演备注" }
          }
        },
        visualStyle: {
          type: "string",
          description: "视觉风格 (沿用原脚本风格)",
          enum: ["cinematic", "cyberpunk", "retro_film", "realistic", "film_noir", "warm_bright", "minimalist"]
        }
      },
      required: ["originalShot", "modifications", "visualStyle"]
    }
  },

  {
    name: "list_video_tasks",
    description: "列出最近的视频生成任务及状态。",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "返回条数上限",
          default: 20,
          maximum: 50
        }
      }
    }
  },

  {
    name: "check_quota",
    description: "查询当前用户的免费配额剩余次数或Pro会员状态。",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },

  {
    name: "check_health",
    description: "检查ShotFlow服务运行状态、版本号、可用功能列表。",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

module.exports = { TOOLS };
