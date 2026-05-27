export type CapabilityType = 'skill' | 'tool' | 'knowledge'

export interface Capability {
  type: CapabilityType
  name: string
  description?: string
  /** Optional sub-category within the type — e.g. aime skills are split
   *  into 飞书 / 研发 / 数据 / 信息检索 / 创作. Drives the sub-section
   *  grouping in ResourceDetailView. */
  category?: string
}

/** Helper: build a list of `type: 'skill'` capabilities from a record of
 *  category → skill names. Keeps long catalogs (iDA, mira, aime) readable
 *  while preserving the category metadata. */
function skillsByCategory(map: Record<string, string[]>): Capability[] {
  const out: Capability[] = []
  for (const [category, names] of Object.entries(map)) {
    for (const name of names) {
      out.push({ type: 'skill', name, category })
    }
  }
  return out
}

/** All first-level tree nodes. `官方` is a virtual aggregator — no
 *  resources sit under it directly; selecting it shows the union of
 *  resources from the four official domains. */
export type PrimaryCategory =
  | '官方'
  | '业务平台'
  | '舆情监控'
  | '内容理解与生成'
  | '数据分析和处理'
  | '开发和效率'
  | '官方引入'
  | '空间'

export interface Resource {
  id: string
  name: string
  description: string
  primaryCategory: PrimaryCategory
  secondaryCategory: string
  url?: string
  capabilities: Capability[]
}

export const PRIMARY_CATEGORIES: PrimaryCategory[] = [
  '官方',
  '业务平台',
  '舆情监控',
  '内容理解与生成',
  '数据分析和处理',
  '开发和效率',
  '官方引入',
  '空间',
]

/** Subset that `官方` virtually aggregates — selecting 官方 in the tree
 *  shows the union of resources whose primaryCategory is in this set. */
export const OFFICIAL_DOMAINS: PrimaryCategory[] = [
  '业务平台',
  '舆情监控',
  '内容理解与生成',
  '数据分析和处理',
  '开发和效率',
  '官方引入',
]

/* ─── Two orthogonal filter dimensions for capabilities:
 *    • SCENE_TAGS  — which surface the capability lives on (抖音 Feed /
 *      直播内容 …). Selecting one in the 场景 dropdown narrows the
 *      list. Capabilities whose name doesn't match a scene are simply
 *      excluded by that filter (no "其他" bucket here).
 *    • CAPABILITY_TAGS — what the capability *does* (灵感创作 / 开发工具
 *      …), driven by keyword rules. Falls back to "其他" when none
 *      match. This is the tag shown on every card. */

export const SCENE_TAGS = [
  '抖音 Feed',
  '抖音评论',
  '抖音群聊',
  '抖音搜索',
  '抖音热点',
  '视频内容',
  '直播内容',
] as const

export type SceneTag = (typeof SCENE_TAGS)[number]

export const CAPABILITY_TAGS = [
  '灵感创作',
  '账号信息',
  '内容处理',
  '视觉制作',
  '办公效率',
  '联网搜索',
  '开发工具',
  '系统工具',
  '行业工具',
  '娱乐互动',
  '治理服务',
  '其他',
] as const

export type CapabilityTag = (typeof CAPABILITY_TAGS)[number]

/* ─── New taxonomy (capability-centric).
 *  Replaces the old platform-centric tree (官方/业务平台/空间/...) with a
 *  flat capability classification: each capability is sorted into one
 *  of these (primary → secondary) buckets by keyword inference. Drives
 *  the left tree, the right-side grouped grids, and the per-card tag. */
export const NEW_PRIMARY_CATEGORIES = [
  '抖音',
  '灵感创作',
  '数据分析和处理',
  '开发工具',
  '安全审核',
  '办公效率',
  '其他',
  '空间',
] as const
export type NewPrimaryCategory = (typeof NEW_PRIMARY_CATEGORIES)[number]

/** Resources nested under the `广场` aggregator in the UI — every primary
 *  except the personal 空间 bucket. The tree component splits 空间 off
 *  into a sticky-bottom footer (mirroring the old 官方 / 空间 layout). */
export const PLAZA_PRIMARIES: NewPrimaryCategory[] = [
  '抖音',
  '灵感创作',
  '数据分析和处理',
  '开发工具',
  '安全审核',
  '办公效率',
  '其他',
]

export const NEW_SECONDARIES_BY_PRIMARY: Record<NewPrimaryCategory, readonly string[]> = {
  抖音: [
    '抖音 Feed',
    '抖音评论',
    '抖音群聊',
    '抖音搜索',
    '抖音热点',
    '视频内容',
    '直播内容',
    '账号信息',
    '舆情监控',
    '娱乐互动',
    '治理服务',
    '客服能力',
  ],
  灵感创作: [
    '内容生成',
    '文本处理',
    '视觉制作',
    '图片生成',
    '图片编辑',
    '视频制作',
  ],
  数据分析和处理: ['Libra', 'TEA', 'Aeolus', '数据分析', '数据处理'],
  开发工具: ['后端开发', '前端开发', '自动化工具', '效率与集成', '系统管理'],
  安全审核: ['监控', '安全', '审核'],
  办公效率: ['飞书', '联网搜索', '系统工具', '行业工具', '销售与营销', '文件处理'],
  其他: [],
  // 空间 capabilities pass through the same secondary inference as
  // 广场 ones, so the union below covers any keyword-inferred bucket
  // they might land in. The tree only shows secondaries that actually
  // have ≥1 capability, so the unused entries are harmless.
  空间: [],
}

const NEW_SECONDARY_TO_PRIMARY: Record<string, NewPrimaryCategory> = (() => {
  const out: Record<string, NewPrimaryCategory> = {}
  for (const primary of NEW_PRIMARY_CATEGORIES) {
    for (const sec of NEW_SECONDARIES_BY_PRIMARY[primary]) {
      out[sec] = primary
    }
  }
  return out
})()

/* Keyword rules for the new secondary classification. First match wins.
 * Each rule maps name-keywords → secondary; secondary determines primary
 * via NEW_SECONDARY_TO_PRIMARY. Capabilities that match no rule fall
 * back to the 其他 primary. */
const NEW_CAPABILITY_RULES: { tag: string; patterns: string[] }[] = [
  // 抖音 (platform-specific surfaces — checked first since 抖音 keywords
  // also overlap with content-creation / governance keywords)
  { tag: '抖音 Feed', patterns: ['抖音 feed', '抖音feed', 'feed流', 'feed 流', '信息流'] },
  { tag: '抖音评论', patterns: ['抖音评论', '评论区', '评论'] },
  { tag: '抖音群聊', patterns: ['抖音群聊', '群聊', '抖音群', 'im-chat', 'lark-im', '飞书群'] },
  { tag: '抖音搜索', patterns: ['抖音搜索', '搜索抖音', 'douyin-search', '看后搜'] },
  { tag: '抖音热点', patterns: ['热点', '热搜', '热门', '热榜', 'hot', 'trending', '榜单', '战报'] },
  { tag: '直播内容', patterns: ['直播', 'live', 'livestream'] },
  { tag: '视频内容', patterns: ['视频', 'video', 'videocut', '短剧', 'short-drama', 'drama', '妙记'] },
  { tag: '舆情监控', patterns: ['舆情'] },
  { tag: '娱乐互动', patterns: ['互动', '游戏', 'game', '抽奖', '问答', 'quiz', '玩法', 'play', '活动', 'campaign', '娱乐'] },
  { tag: '客服能力', patterns: ['客服', 'customer', 'service-desk', 'helpdesk', '工单'] },
  { tag: '账号信息', patterns: ['账号', '作者', 'author', '用户画像', '人设', 'profile', 'persona', '粉丝'] },
  { tag: '治理服务', patterns: ['治理', '违规', '风控', '反作弊', 'anti-'] },

  // 安全审核
  { tag: '审核', patterns: ['审核', 'review', '复核'] },
  { tag: '安全', patterns: ['合规', 'compliance', 'security', '风险', 'risk'] },
  { tag: '监控', patterns: ['monitor', '监测', '巡检', '告警', 'alert', '预警'] },

  // 灵感创作
  { tag: '图片编辑', patterns: ['图片编辑', '修图', 'retouch', '抠图', 'cutout', 'photoshop', 'lightroom'] },
  { tag: '图片生成', patterns: ['图片生成', '生图', 'image-gen', 'midjourney', 'sd', 'stable diffusion', 'flux'] },
  { tag: '视觉制作', patterns: ['图片', 'image', '图像', 'banner', 'screenshot', 'svg', 'logo', '设计', 'design', '海报', '视觉', '渲染'] },
  { tag: '视频制作', patterns: ['剪辑', '视频制作', 'video-edit', '视频生成'] },
  { tag: '文本处理', patterns: ['改写', '润色', '总结', 'summary', '解读', '摘要', '校对', '翻译', 'translate'] },
  { tag: '内容生成', patterns: ['灵感', '头脑风暴', 'brainstorm', '创意', '选题', '草稿', '撰写', '文案', 'creator', 'gen-', '创作', '创建', '生成', 'generate', 'write'] },

  // 数据分析和处理
  { tag: 'Libra', patterns: ['libra'] },
  { tag: 'TEA', patterns: ['tea ', 'tea-', 'tea埋点', 'app log', 'apptea'] },
  { tag: 'Aeolus', patterns: ['aeolus', '风神'] },
  { tag: '数据处理', patterns: ['数据处理', 'etl', '清洗', 'cleanse', 'transform', '入库', 'pipeline', '建模'] },
  { tag: '数据分析', patterns: ['数据分析', '分析', '拆解', '归因', '指标', 'kpi', 'olap', 'sql', '数据库', 'query', '查询数据', '看板', 'dashboard', '报表'] },

  // 开发工具
  { tag: '后端开发', patterns: ['backend', '后端', 'api', '服务端', 'kitex'] },
  { tag: '前端开发', patterns: ['frontend', '前端', '页面', 'web ', 'webpack', 'vite', 'react', 'vue'] },
  { tag: '自动化工具', patterns: ['自动化', 'automation', '脚本', 'script', '触发器'] },
  { tag: '效率与集成', patterns: ['集成', 'integration', '接入', 'webhook', '中间件'] },
  { tag: '系统管理', patterns: ['运维', 'ops', 'devops', '日志', 'log', '服务', '部署', 'deploy', 'kibana', 'k8s', '容器'] },

  // 办公效率
  { tag: '飞书', patterns: ['飞书', 'lark-', 'lark ', 'feishu', '云文档', '多维表格', '飞书卡片', '飞书日历', '飞书任务', '飞书会议'] },
  { tag: '联网搜索', patterns: ['网络搜索', '全网搜索', '联网', 'web-search'] },
  { tag: '系统工具', patterns: ['system-', '系统工具', '工具集', 'toolset'] },
  { tag: '行业工具', patterns: ['行业', '财务', 'finance', '法务', 'legal', '采购', 'procurement', 'finai', '电商'] },
  { tag: '销售与营销', patterns: ['销售', 'sales', '营销', 'marketing', '广告', 'ad', 'crm', '获客', 'lead'] },
  { tag: '文件处理', patterns: ['文档', 'doc', 'pdf', 'ppt', 'docx', '一页纸', 'onepage', 'easy-read', 'sheet', '表格', 'xlsx', '多维', '审批', 'approval', '任务', '待办', 'todo', '邮件', 'mail', '日历', 'calendar', '日程', 'schedule', '会议', 'meeting'] },

  // (其他 is the fallback — no rules)
]

/** Map a capability name → new secondary category. Falls back to "其他"
 *  when no keyword matches. Primary is then derived via
 *  NEW_SECONDARY_TO_PRIMARY (defaulting to "其他" primary). */
export function inferCapabilitySecondary(name: string): string {
  const lower = name.toLowerCase()
  for (const rule of NEW_CAPABILITY_RULES) {
    if (rule.patterns.some((p) => lower.includes(p.toLowerCase()))) {
      return rule.tag
    }
  }
  return '其他'
}

export function inferCapabilityPrimaryNew(name: string): NewPrimaryCategory {
  const sec = inferCapabilitySecondary(name)
  return NEW_SECONDARY_TO_PRIMARY[sec] ?? '其他'
}

/** Resource-aware primary classifier. Capabilities on the 空间 resource
 *  always bucket under '空间' regardless of name — the personal space is
 *  about ownership, not topic. Everything else falls through to the
 *  keyword-based primary inference. */
export function inferCapabilityPrimaryForResource(
  capabilityName: string,
  resource: Resource,
): NewPrimaryCategory {
  if (resource.primaryCategory === '空间') return '空间'
  return inferCapabilityPrimaryNew(capabilityName)
}

/** Back-compat alias — older callers refer to `inferCapabilityTag`,
 *  which we now redirect to the new secondary classifier. The result
 *  shape (string) is unchanged but values come from the new taxonomy. */
export function inferCapabilityTag(name: string): string {
  return inferCapabilitySecondary(name)
}

const SCENE_RULES: { tag: SceneTag; patterns: string[] }[] = [
  // Order matters — first match wins, so put more specific patterns first.
  { tag: '抖音 Feed', patterns: ['抖音 feed', '抖音feed', 'douyin feed', 'feed流', 'feed 流', '信息流'] },
  { tag: '抖音评论', patterns: ['抖音评论', '评论区', '评论'] },
  { tag: '抖音群聊', patterns: ['群聊', '抖音群', 'im-chat', 'lark-im', '飞书群'] },
  { tag: '抖音搜索', patterns: ['抖音搜索', '搜索抖音', 'douyin-search', '看后搜'] },
  { tag: '抖音热点', patterns: ['热点', '热搜', '热门', '热榜', 'hot', 'trending', '榜单', '舆情', '战报'] },
  { tag: '直播内容', patterns: ['直播', 'live', 'livestream'] },
  { tag: '视频内容', patterns: ['视频', 'video', '剪辑', 'videocut', '短剧', 'short-drama', 'drama', '妙记'] },
]

const CAPABILITY_RULES: { tag: Exclude<CapabilityTag, '其他'>; patterns: string[] }[] = [
  // Order matters — first match wins, so put more specific patterns first.
  {
    tag: '账号信息',
    patterns: ['账号', '作者', 'author', '用户画像', '人设', 'profile', 'persona', '粉丝'],
  },
  {
    tag: '视觉制作',
    patterns: ['图片', 'image', '图像', '渲染图片', 'banner', 'screenshot', 'svg', 'logo', '设计', 'design', '原型', 'mockup', '海报', '视觉'],
  },
  {
    tag: '办公效率',
    patterns: [
      '会议', 'meeting', '邮件', 'mail', '日历', 'calendar', '日程', 'schedule',
      '文档', 'doc', 'pdf', 'ppt', 'docx', '一页纸', 'onepage', 'easy-read',
      'sheet', '表格', 'xlsx', '多维', 'table', '飞书', 'lark-', 'feishu',
      '审批', 'approval', '任务', '待办', 'todo',
    ],
  },
  {
    tag: '联网搜索',
    patterns: ['网络搜索', '全网搜索', '联网', 'web-search'],
  },
  {
    tag: '开发工具',
    patterns: ['code', '代码', 'codebase', 'meego', 'meegle', 'frontend', 'backend', '研发', 'api', 'dev', 'cli', 'devmind'],
  },
  {
    tag: '系统工具',
    patterns: ['sql', '数据库', 'database', '查询', 'query', 'monitor', '监控', '日志', 'log', 'service', '服务', '部署', 'deploy', 'kibana'],
  },
  {
    tag: '行业工具',
    patterns: ['行业', '财务', 'finance', '法务', 'legal', '采购', 'procurement', 'finai', '电商'],
  },
  {
    tag: '娱乐互动',
    patterns: ['互动', '游戏', 'game', '抽奖', '问答', 'quiz', '玩法', 'play', '活动', 'campaign', '娱乐'],
  },
  {
    tag: '治理服务',
    patterns: ['治理', '违规', '风险', '风控', '合规', '安全', 'security', 'risk', 'governance', '审核', '检测', 'detection', '反作弊', 'anti'],
  },
  {
    tag: '内容处理',
    patterns: ['改写', '润色', '总结', 'summary', '内容处理', '解读', '分析', '拆解'],
  },
  {
    tag: '灵感创作',
    patterns: ['灵感', '头脑风暴', 'brainstorm', '创意', '选题', '草稿', '撰写', '文案', 'creator', 'gen-', '创作', '创建', '生成', 'generate', 'write'],
  },
]

/** Map a capability name → scene tag. Returns `null` when no scene
 *  pattern matches; callers should treat that as "no scene" rather than
 *  bucketing into "其他". */
export function inferSceneTag(name: string): SceneTag | null {
  const lower = name.toLowerCase()
  for (const rule of SCENE_RULES) {
    if (rule.patterns.some((p) => lower.includes(p.toLowerCase()))) {
      return rule.tag
    }
  }
  return null
}

/** @deprecated Renamed to inferOldCapabilityTag — left here so scene/
 *  filter logic that previously called it still has a stable entry
 *  point. The exported `inferCapabilityTag` (below) now maps to the
 *  new secondary classifier for card pills. */
function inferOldCapabilityTag(name: string): CapabilityTag {
  const lower = name.toLowerCase()
  for (const rule of CAPABILITY_RULES) {
    if (rule.patterns.some((p) => lower.includes(p.toLowerCase()))) {
      return rule.tag
    }
  }
  return '其他'
}
// Touch to satisfy unused-warning rules.
void inferOldCapabilityTag

/* ─── Per-product skill catalogs (sourced from internal skill registry) ─── */

const AIME_SKILLS: Record<string, string[]> = {
  飞书: [
    '云文档',
    '多维表格',
    '单聊 / 群聊',
    '飞书卡片',
    '飞书日历',
    '飞书任务',
    '飞书会议 / 飞书妙记',
    '邮件',
    '代发消息',
  ],
  研发: [
    'Meego',
    'Codebase / 代码库',
    'Slardar',
    'Argos',
    'Bits / 发布单',
    'PSM 服务元信息',
    'Trae cli',
  ],
  数据: ['Libra', 'Coral', 'DevMind'],
  信息检索: ['ByteTech 内部知识库', '网络搜索'],
  创作: [
    '图片 / Banner 生成',
    '语音输入识别执行',
    'AI 多媒体分析',
    'PPT',
    'Artifacts',
  ],
}

const MIRA_SKILLS: Record<string, string[]> = {
  数据分析: [
    'aeolus-query',
    'consulting-charts',
    'data-comparison',
    'report-template',
    'sensight',
  ],
  设计: [
    'ai-design-guidelines',
    'frontend-design',
    'frontend-slides',
    'svg-chart-gen',
    'universe-design',
    'universe-design-dictionary',
    'vchart-development-assistant',
  ],
  效率协作: [
    'byte-approval',
    'consulting-charts',
    'daily-llm-demo-tracker',
    'depression-screening',
    'docx',
    'finai-statement-review',
    'frontend-design',
    'generate-mockup-html',
    'im-chat-manager',
    'interview-emergency-kit',
    'lark-docs',
    'lark-docs-skill',
    'legal-contract-review',
    'meegle-skill',
    'mira-remote-browser',
    'mira-scheduler',
    'okrs-by-bco',
    'pdf',
    'people-leave-expert',
    'prettydoc',
    'skill-creator',
    'slides',
    'xlsx',
  ],
  财务与法务: [
    'finai-budget-execution-forecast',
    'finai-finance-onboarding',
    'finai-statement-review',
    'finai-tech-focal-assistant',
    'finance-rule-qa',
    'legal-contract-compare-review',
    'legal-contract-review',
    'legal-paper-reviewer',
    'legal-patent-quality-check',
    'legal-review-info-completeness',
    'legal-review-info-summary',
    'payment-finance-compliance',
    'workstation-expenses-audit',
  ],
  生活方式: [
    'a-share-quant',
    'business-sparring',
    'chat-love-debugger',
    'daily-llm-demo-tracker',
    'depression-screening',
    'eden',
    'first-principles-thinker',
    'short-drama-original',
  ],
  企业采购: [
    'procurement-se',
    'procurement-shared',
    'procurement-sp',
    'procurement-sr',
    'sourcing-document-summary',
    'sourcing-document-title',
    'supplier-comprision-price',
  ],
  自动化工具: [
    'activity-onepage',
    'autopilot',
    'byte-approval',
    'docx',
    'easy-read-doc',
    'generate-mockup-html',
    'group-message-sync',
    'high-end-ppt-generator',
    'im-chat-manager',
    'interview-emergency-kit',
    'job-profile-optimizer',
    'lark-docs',
    'lark-docs-skill',
    'meegle-skill',
    'mira-memory',
    'mira-remote-browser',
    'mira-scheduler',
    'nl2data',
    'okrs-by-bco',
    'pdf',
    'people-leave-expert',
    'pm-all-in-one-assistant',
    'prettydoc',
    'skill-creator',
    'skill-guide-writer',
    'slides',
    'web-page-creator',
    'weekly-report-writer',
    'xlsx',
  ],
  销售和营销: ['brand-strategy-analyst', 'group-feedback-analysis'],
}

const IDA_SKILLS: Record<string, string[]> = {
  数据分析: [
    'TEA 统一入口',
    'TEA 数据查询',
    'hotel-check-medal',
    'TEA 创建看板 & 图表',
    'TEA 资源解析',
    'TEA 根因分析',
    'TEA 报告生成',
    'TEA 行为细查',
    'TEA 会话回放 Oncall 分析',
    'Libra CLI',
    '指标归因分析',
    'Libra - 实验指标归因 & 核心数据总结',
    'Libra - 多实验分类总结',
    'Libra - 智能实验分析 & 写报告',
    '指标异常检测',
    'databp-life-data-analysis',
    'talent-live-settlement-gmv-analysis',
    'Libra - 兜底技能（beta 版）',
    '渠道经理拜访一页纸',
    'dau-attribution-videocut',
    'query_bd_morning_report',
    'stream-data-analysis',
    'videocut-analysis-report-local',
    'lark-sheets',
    'fibp_ecom_analysis_weekly_report',
    '商品外链路渲染图片',
    'oa-insight-session-lifecycle-summari…',
    'slardar-web',
    'extract-analysis-methodology',
    'Tea CLI',
    'oa-insight-cross-line-synthesizer',
    'TEA 会话回放 logid 提取',
    'customer-origin-attribution',
    'TeaCli',
    'Libra - 敏感维度洞察分析（JS 散度）',
    'kani-data-expert',
    'bdm-evening-report',
    'videocut-analysis-report',
    '数据分析',
    'voc-detective',
    'BIGDAY 战报 - 查询分析',
    '飞书【图表助手】',
    '【PPE】TEA 统一入口',
    'volcano-security-score-analyzer',
    'slardar-dashboard-fetcher',
    'dw-requirement-assistant-text',
    'jianying-wiki-query',
    'oa-insight-component-health-summa…',
  ],
  知识问答: [
    'hotel-check-medal',
    'Libra CLI',
    'Libra - 智能实验分析 & 写报告',
    '学术搜索',
    'databp-life-data-analysis',
    'query_bd_morning_report',
    'deep-research',
    'stream-data-analysis',
    'gvn-skill-data-req-aist-feishu',
    'A 股分析',
    'extract-analysis-methodology',
    'TEA 会话回放 logid 提取',
    'gvn-skill-data-req-ast-meego',
    'sensight',
    'kani-data-expert',
    'writeback-methodology-to-kb',
    '飞书【图表助手】',
    'volcano-security-score-analyzer',
    'dw-requirement-assistant-text',
    'slardar-dashboard-fetcher',
    'event-puttable-mapping',
    '智能接待收入渗透归因',
    'gvn-skill-data-req-ast-template-oth…',
    'gvn-skill-data-req-ast-template-sent…',
    'PDF 工具',
    'hotspot-poi-selection',
    'metric-group-latency-investigation',
    'ugc_target_message_tool',
    'ugc-data-query-router',
    'toil-skl-skill-bundle',
    '实验工具包',
    'databp-life-home-get-data',
    'voc-detective-v11',
    'data-security-score-analyzer',
    'risk_info_analyzer',
    'identify-external-tool-shops',
    'arena-sop',
    'hotel-check-medal-test',
    'home-ida',
    'personal-nutritionist',
    'lark-im',
    'humanizer',
    'databp-life-channel-performance-an…',
    'prd-requirement-rating',
    'shangtu-asset-search',
    'volcano-security-awareness-specialist',
    'video-ld-gaia-quick-query',
    'liujuanhui-test',
  ],
  方案策划: [
    '图片生成',
    'Libra CLI',
    'Libra - 智能实验分析 & 写报告',
    'PPT 生成',
    '视频生成',
    '头脑风暴',
    'kani-data-expert',
    '飞书【图表助手】',
    'PDF 工具',
    '月付筛推一体运营计划创建',
    'hotspot-poi-selection',
    '架构图绘制工具',
    'voc-detective-v11',
    'pop-lab-infographic',
    '文字去 AI 感',
    'theme-mario-platformer',
    'databp-life-channel-performance-an…',
    '产品经理技能包',
    '短视频脚本创作',
    'industry-trend-report',
    'pixel-platformer',
    'real-estate-video-diagnosis-skill',
    'liujuanhui-test',
    '三率查询',
    'paul-graham-perspective',
    'lark-card-generator',
    'search-restaurants',
    '原型图设计',
  ],
  数据处理类: ['风神 / Aeolus skill'],
  数据处理: [
    '数据网页绘制',
    'Libra CLI',
    'Libra - 多实验分类总结',
    'Libra - 智能实验分析 & 写报告',
    'Libra - 兜底技能（beta 版）',
    'lark-cli-fixed-app-installer',
    'lark-sheets-style-clone',
    'lark-sheets',
    '商品外链渲染图片',
    'slardar-web',
    'Tea CLI',
    'kani-data-expert',
    '飞书【图表助手】',
    '仲裁客服绩效气泡图',
    'slardar-dashboard-fetcher',
    '智能接待收入渗透归因',
    'LibraToSheet2.1',
    'vchart-development-assistant',
    'hotspot-poi-selection',
    'sql-date-clarifier',
    'vchart-to-png-screenshot',
    '抖音直播 - 语义驱动消费',
    'spc-monitor',
    'abtest-data-handler',
    'dongchedi-series-params',
    'prod-main-img-sheet',
    'metric-volatility-attribution-v0',
  ],
  报告撰写: [
    'Libra CLI',
    'Libra - 智能实验分析 & 写报告',
    'PPT 生成',
    '渠道经理拜访一页纸',
    'query_bd_morning_report',
    'deep-research',
    'libra-report-format & 引用',
    'gvn-skill-data-req-aist-feishu',
    'fibp_ecom_analysis_weekly_report',
    'slardar-web',
    'gvn-skill-data-req-ast-meego',
    'kani-data-expert',
    '飞书【图表助手】',
    '信息图生成',
    'slardar-dashboard-fetcher',
    'dw-requirement-assistant-text',
    'gvn-skill-data-req-ast-template-oth…',
    '报告生成专家',
    '图表助手 - 飞书文档数据报告生成',
    '智能接待收入渗透归因',
    'gvn-skill-data-req-ast-template-sent…',
    'LibraToSheet2.1',
    'PDF 工具',
    'syh-debug-experiment-analysis',
    'vchart-development-assistant',
    'vchart-to-png-screenshot',
    'feishu-cli-bitable',
    'risk_info_analyzer',
    'home-ida',
    'magibook',
    'pptx',
    'abtest-report',
    'databp-life-channel-performance-an…',
    'industry-trend-report',
    'real-estate-video-diagnosis-skill',
    'feishu-automation',
    'gen-version-report-ida',
    'liujuanhui-test',
    'docx',
    '三率查询',
    '财务预案分析',
    'easy-read-doc',
    'dataagent-trace',
    'search-flights',
    'T2T 逐步生成器',
    'data-visualization',
  ],
  字节数据工具: [
    '风神 / Aeolus skill',
    'TEA 会话回放 Oncall 分析',
    'Libra CLI',
    'Libra - 实验指标归因 & 核心数据总结',
    'Libra - 多实验分类总结',
    'Libra - 智能实验分析 & 写报告',
    'Libra - 实验与指标格式化导出 (beta 版)',
    'Libra - 兜底技能（beta 版）',
    'tea-oncall-troubleshooter',
    'query_bd_morning_report',
    'libra-report-format & 引用',
    'fibp_ecom_analysis_weekly_report',
    'slardar-web',
    'Tea CLI',
    'TeaCli',
    'APP 稳定性诊断',
    'Libra - 敏感维度洞察分析（JS 散度）',
    'kani-data-expert',
    'volcano-security-score-analyzer',
    'slardar-dashboard-fetcher',
    'dw-requirement-assistant-text',
    '图表助手 - 飞书文档数据报告生成',
    '智能接待收入渗透归因',
    'Libra 统一入口',
    'voc-detective-v9',
    'syh-debug-experiment-analysis',
    'sql-date-clarifier',
    '长周期查询',
    'aeolus-git',
    '数据瀑布图生成',
    'databp-life-home-get-data',
    'TEA 会话回放：基础分析',
    'risk_info_analyzer',
    'home-ida',
    'ab-experiment-analysis',
    '投放周报',
    'doubao-audio-tech-weekly-report',
    '指标趋势解读',
    'slardar-app',
    'magibook',
    'DE_caijing_business_skills',
    'aeolus-inspection-report',
    'abtest-report',
    'web-application-git',
    'qcpx-ab-report-skill',
    '旧版存档_财经_异常监测',
    '电商内容策略核心指标归因',
    'volcano-security-awareness-specialist',
    'cn-data-arch-cpu-memcore-analysis',
    'data-agent-intent-router',
    'search-restaurants',
    'search-flights',
    'sql-query-generation',
    'doubao-audio-weekly-report',
    'voc-detective-v10',
    'lark-push_skill',
    'ui-ux-pro-max',
    'bytedance-aeolus-opensource',
  ],
}

export const RESOURCES: Resource[] = [
  /* ─── 官方 → 业务平台 ─── */
  {
    id: 'live-ops',
    name: '直播运营平台',
    description: '抖音直播管理后台，支持活动配置、数据监控等功能',
    primaryCategory: '业务平台',
    secondaryCategory: '直播',
    capabilities: [
      { type: 'skill', name: '查询主播开播时长' },
      { type: 'skill', name: '直播间观众画像分析' },
      { type: 'skill', name: '直播热度趋势分析' },
      { type: 'skill', name: '主播带货 GMV 拆解' },
      { type: 'tool', name: '调整直播间排序权重' },
      { type: 'tool', name: '直播流量加热配置' },
      { type: 'knowledge', name: '直播运营 SOP' },
    ],
  },
  {
    id: 'music-ops',
    name: '音乐人运营平台',
    description: '汽水音乐创作者管理平台，支持音乐上传、数据统计等功能',
    primaryCategory: '业务平台',
    secondaryCategory: '音乐',
    capabilities: [],
  },
  {
    id: 'kesong-ops',
    name: '可颂运营平台',
    description: '可颂业务运营管理平台，支持商品管理、活动配置等功能',
    primaryCategory: '业务平台',
    secondaryCategory: '可颂',
    capabilities: [],
  },
  {
    id: 'gaia',
    name: '盖亚',
    description: '抖音运营项目管理平台，支持项目立项、资源申请、活动搭建等功能',
    primaryCategory: '业务平台',
    secondaryCategory: '作者运营',
    capabilities: [
      { type: 'skill', name: '查询作者激励状态' },
      { type: 'tool', name: '提交资源申请单' },
      { type: 'knowledge', name: '作者分层运营手册' },
    ],
  },
  {
    id: 'hotspot-ops',
    name: '热点运营平台',
    description: '抖音热点、榜单、热点事件、热点活动管理平台',
    primaryCategory: '业务平台',
    secondaryCategory: '内容运营',
    capabilities: [
      { type: 'skill', name: '查询热点榜单实时数据' },
      { type: 'tool', name: '热点话题加权配置' },
      { type: 'knowledge', name: '热点运营策略库' },
    ],
  },
  {
    id: 'wenyu-ops',
    name: '文娱运营平台',
    description: '抖音文娱运营管理平台，支持影视、综艺、明星等内容运营',
    primaryCategory: '业务平台',
    secondaryCategory: '文娱',
    capabilities: [
      { type: 'skill', name: '查询明星阵地数据' },
      { type: 'tool', name: '内容专题搭建' },
      { type: 'knowledge', name: '文娱内容标签词表' },
    ],
  },
  {
    id: 'ip-mid',
    name: '世界观',
    description: 'IP 中台 — 抖音 IP 资源管理、授权流转、内容引入与活动绑定',
    primaryCategory: '业务平台',
    secondaryCategory: 'IP 中台（世界观）',
    capabilities: [],
  },
  {
    id: 'douyin-select',
    name: '抖音精选',
    description: '抖音精选内容运营后台，支持选品、活动配置、流量调度',
    primaryCategory: '业务平台',
    secondaryCategory: '抖音精选',
    capabilities: [],
  },
  {
    id: 'role-fx',
    name: '角色',
    description: '创作与特效平台 — 虚拟形象 / 滤镜 / 特效 / 道具管理',
    primaryCategory: '业务平台',
    secondaryCategory: '创作与特效（角色）',
    capabilities: [],
  },
  {
    id: 'search-ops',
    name: '搜索运营平台',
    description: '抖音搜索榜单、流量分发、SEO 关键词运营后台',
    primaryCategory: '业务平台',
    secondaryCategory: '搜索',
    capabilities: [],
  },
  {
    id: 'comment-ops',
    name: '评论运营平台',
    description: '评论区策略、置顶、风险评论检测与处置',
    primaryCategory: '业务平台',
    secondaryCategory: '评论',
    capabilities: [],
  },
  {
    id: 'ug-ops',
    name: 'UG 运营平台',
    description: '用户增长侧：拉新、激活、留存策略配置 + 数据看板',
    primaryCategory: '业务平台',
    secondaryCategory: 'UG',
    capabilities: [],
  },
  {
    id: 'qianxun',
    name: '千寻',
    description: '抖音全业务安全搜索查询、实体画像分析、AI 智能风险研判、多维度风控平台',
    primaryCategory: '业务平台',
    secondaryCategory: '平台 & 社区治理',
    capabilities: [
      { type: 'skill', name: '实体安全画像查询' },
      { type: 'skill', name: '风险事件溯源' },
      { type: 'knowledge', name: '风控规则库' },
    ],
  },
  {
    id: 'ola',
    name: 'Ola 平台',
    description: '抖音 AI 智能客服搭建平台，支持对话流配置、知识管理等功能',
    primaryCategory: '业务平台',
    secondaryCategory: '体验与服务',
    capabilities: [
      { type: 'tool', name: '对话流编排' },
      { type: 'tool', name: '知识库挂载' },
      { type: 'knowledge', name: '客服话术规范' },
    ],
  },

  /* ─── 舆情监控 ─── */
  {
    id: 'owls',
    name: 'OWLS 猫头鹰',
    description: '抖音一站式信息洞察 Agent 平台，支持风险预警、行业监测等功能',
    primaryCategory: '舆情监控',
    secondaryCategory: 'OWLS 猫头鹰',
    capabilities: [
      { type: 'skill', name: '舆情实时监测' },
      { type: 'skill', name: '行业事件追踪' },
      { type: 'tool', name: '预警订阅配置' },
      { type: 'knowledge', name: '舆情处置 SOP' },
    ],
  },

  /* ─── 内容理解与生成 ─── */
  {
    id: 'holmes',
    name: '福尔摩斯 Holmes',
    description: '推荐系统架构下的研发工具平台，包含 Code Review 质检、灰度指标看板',
    primaryCategory: '内容理解与生成',
    secondaryCategory: '福尔摩斯（Holmes）',
    capabilities: [
      { type: 'skill', name: '推荐效果归因' },
      { type: 'tool', name: '灰度指标对比' },
      { type: 'knowledge', name: '推荐策略基线' },
    ],
  },
  {
    id: 'lucy',
    name: '内容理解中台',
    description: '原 Lucy — 抖音内容理解中台，覆盖结构化标签、内容向量检索、内容审核策略',
    primaryCategory: '内容理解与生成',
    secondaryCategory: '内容理解中台（原Lucy）',
    capabilities: [],
  },

  /* ─── 数据分析和处理 ─── */
  {
    id: 'tea',
    name: 'TEA',
    description: '字节跳动统一数据分析平台，提供事件、漏斗、留存、热图等行为分析能力',
    primaryCategory: '数据分析和处理',
    secondaryCategory: 'TEA',
    capabilities: [],
  },
  {
    id: 'libra',
    name: 'Libra',
    description: '字节跳动 A/B 实验平台，覆盖实验设计、分流、指标核算与归因分析',
    primaryCategory: '数据分析和处理',
    secondaryCategory: 'Libra',
    capabilities: [],
  },
  {
    id: 'aeolus',
    name: '风神 Aeolus',
    description: '字节跳动内部自研的敏捷 BI（商业智能）平台，提供灵活易用的数据查询能力',
    primaryCategory: '数据分析和处理',
    secondaryCategory: 'Aeolus（风神）',
    capabilities: [
      { type: 'skill', name: '即席 SQL 查询' },
      { type: 'tool', name: '看板搭建' },
      { type: 'knowledge', name: '常用指标口径' },
    ],
  },
  {
    id: 'zidian',
    name: '资典平台',
    description: '统一指标 / 词表 / 资产管理平台，沉淀业务对齐口径与数据资产元信息',
    primaryCategory: '数据分析和处理',
    secondaryCategory: '资典平台',
    capabilities: [],
  },

  /* ─── 开发和效率 ─── */
  {
    id: 'aime',
    name: 'Aime（国内版）',
    description: '面向字节内部的复杂任务异步自动化智能体，支持多步任务自主规划、长任务执行',
    primaryCategory: '开发和效率',
    secondaryCategory: 'Aime',
    capabilities: skillsByCategory(AIME_SKILLS),
  },
  {
    id: 'mira',
    name: 'Mira',
    description: '企业级可信赖的办公 AI 平台，集成多种业界顶尖的 SOTA 大模型',
    primaryCategory: '开发和效率',
    secondaryCategory: 'Mira',
    capabilities: skillsByCategory(MIRA_SKILLS),
  },
  {
    id: 'ida',
    name: 'iDA',
    description: '数据平台官方为全体字节同学打造的 AI Agent 产品，支持知识检索、数据分析',
    primaryCategory: '开发和效率',
    secondaryCategory: 'iDA',
    capabilities: skillsByCategory(IDA_SKILLS),
  },
  {
    id: 'meego',
    name: 'Meego',
    description: '字节内部项目协作平台，支持需求 / 缺陷 / 迭代管理',
    primaryCategory: '开发和效率',
    secondaryCategory: 'Meego',
    capabilities: [],
  },
  {
    id: 'lark',
    name: 'Lark',
    description: '飞书办公套件 — 云文档、多维表格、IM、日历、会议',
    primaryCategory: '开发和效率',
    secondaryCategory: 'Lark',
    capabilities: [],
  },
  {
    id: 'slardar',
    name: 'Slardar',
    description: '前端 / 移动端性能与异常监控平台，提供线上 RUM 数据洞察',
    primaryCategory: '开发和效率',
    secondaryCategory: 'Slardar',
    capabilities: [],
  },

  /* ─── 官方 → 官方引入 (vetted third-party ecosystems we bridge into
   *     vibecoding via official adapters) ─── */
  {
    id: 'notion',
    name: 'Notion',
    description: '团队知识库 / 文档同步，支持页面拉取和写回',
    primaryCategory: '官方引入',
    secondaryCategory: 'Notion',
    capabilities: [
      { type: 'tool', name: '读取 Notion 页面' },
      { type: 'tool', name: '写入 Notion 数据库' },
      { type: 'knowledge', name: '团队 wiki 索引' },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: '开源代码托管平台，可拉取仓库、Issue、PR、Workflow 状态',
    primaryCategory: '官方引入',
    secondaryCategory: 'GitHub',
    capabilities: [
      { type: 'tool', name: '拉取仓库代码' },
      { type: 'tool', name: '查询 Issue 列表' },
      { type: 'tool', name: '查询 PR 状态' },
      { type: 'skill', name: '代码 Review 总结' },
      { type: 'knowledge', name: '仓库 README 索引' },
    ],
  },
  {
    id: 'tencent',
    name: '腾讯',
    description: '腾讯生态接入：企业微信、腾讯文档、腾讯会议',
    primaryCategory: '官方引入',
    secondaryCategory: '腾讯',
    capabilities: [
      { type: 'tool', name: '企业微信群通知' },
      { type: 'tool', name: '腾讯文档读写' },
      { type: 'tool', name: '腾讯会议日程' },
      { type: 'skill', name: '会议纪要生成' },
    ],
  },
  {
    id: 'alibaba',
    name: '阿里',
    description: '阿里生态接入：钉钉、阿里云 OSS、阿里云日志服务',
    primaryCategory: '官方引入',
    secondaryCategory: '阿里',
    capabilities: [
      { type: 'tool', name: '钉钉机器人推送' },
      { type: 'tool', name: 'OSS 文件读写' },
      { type: 'tool', name: 'SLS 日志查询' },
    ],
  },
  {
    id: 'figma',
    name: 'Figma',
    description: '设计稿读取、组件库导出，支持把 Frame 作为上下文喂给 AI',
    primaryCategory: '官方引入',
    secondaryCategory: 'Figma',
    capabilities: [
      { type: 'tool', name: '读取 Figma 文件' },
      { type: 'tool', name: '导出 Frame 截图' },
      { type: 'skill', name: '设计稿组件抽取' },
    ],
  },

  /* ─── 空间 — 用户 / 团队自建的资源空间，沉淀草稿、知识、项目记忆、
   *     人设。与 官方 / 官方引入 互补：这里是「我自己 / 我们团队」的
   *     资产，全部归到单个「空间」一级节点下展示。 ─── */
  {
    id: 'space',
    name: '空间',
    description: '团队 / 个人自建的资源沉淀：草稿 · 知识 · 项目档案 · 人设',
    primaryCategory: '空间',
    secondaryCategory: '空间',
    capabilities: [
      { type: 'skill', name: '召回最近草稿' },
      { type: 'tool', name: '保存当前对话片段' },
      { type: 'knowledge', name: '提示词收藏夹' },
      { type: 'skill', name: '团队 wiki 检索' },
      { type: 'knowledge', name: '行业 SOP 库' },
      { type: 'knowledge', name: '会议纪要档案' },
      { type: 'tool', name: '上传新文档' },
      { type: 'skill', name: '相似项目检索' },
      { type: 'knowledge', name: '历史提案库' },
      { type: 'tool', name: '复用项目模板' },
      { type: 'skill', name: '匹配相近人设' },
      { type: 'knowledge', name: '人设设定档' },
    ],
  },

  /* ─── 我的抖音知识库 — 用户基于自己的抖音账号沉淀的私有知识资产。
   *     用于知识库列表页第二组「我的抖音知识库」的填充数据。
   *     primaryCategory 选 '空间' 仅为类型合法，分桶通过资源 id 判定，
   *     不会污染 工具 / Skills 的树（这些条目都是 knowledge 类型）。 ─── */
  {
    id: 'my-douyin-knowledge',
    name: '我的抖音知识库',
    description: '基于本账号历史内容、互动、选题沉淀的私有知识库',
    primaryCategory: '空间',
    secondaryCategory: '我的抖音',
    capabilities: [
      { type: 'knowledge', name: '我的爆款脚本库' },
      { type: 'knowledge', name: '我的选题灵感本' },
      { type: 'knowledge', name: '我的粉丝问答 FAQ' },
      { type: 'knowledge', name: '我的开播话术' },
      { type: 'knowledge', name: '我的视频文案归档' },
      { type: 'knowledge', name: '我的评论回复模板' },
      { type: 'knowledge', name: '我的合作品牌档案' },
      { type: 'knowledge', name: '我的人设记忆库' },
    ],
  },

  /* ─── 抖音标准知识库 — 平台官方维护的标准化知识库，覆盖品牌、运营、
   *     合规、商业化等横切主题，作为「抖音标准知识库」第一组的补充。
   *     primaryCategory: '业务平台' 复用既有取值（树没有为知识库画一个独立
   *     primary，统一通过 classifyKnowledgeBucket 分桶）。 ─── */
  {
    id: 'douyin-standard-knowledge',
    name: '抖音标准知识库',
    description: '抖音平台官方维护的标准化知识资产（品牌、运营、合规、商业化）',
    primaryCategory: '业务平台',
    secondaryCategory: '抖音标准知识库',
    capabilities: [
      { type: 'knowledge', name: '抖音品牌指南' },
      { type: 'knowledge', name: '抖音运营规范手册' },
      { type: 'knowledge', name: '抖音商业化政策汇编' },
      { type: 'knowledge', name: '抖音内容合规红线' },
      { type: 'knowledge', name: '抖音激励政策档案' },
      { type: 'knowledge', name: '抖音 IP 授权指引' },
      { type: 'knowledge', name: '抖音电商行业词表' },
      { type: 'knowledge', name: '抖音搜索热词词典' },
    ],
  },

  /* ─── Coverage seeds — synthetic platforms whose capability NAMES are
   *     crafted so every new (primary → secondary) bucket has at least
   *     one skill and one tool. primaryCategory falls back to a generic
   *     existing value (the new tree infers everything from name, so the
   *     legacy field is just a placeholder here). ─── */
  {
    id: 'mock-douyin-pack',
    name: '抖音能力包',
    description: '覆盖抖音相关一级分类下各二级类目的示意数据',
    primaryCategory: '业务平台',
    secondaryCategory: '抖音能力包',
    capabilities: [
      // 抖音 Feed
      { type: 'skill', name: '抖音 Feed 信息流加热建议' },
      { type: 'tool', name: '抖音 feed 数据导出' },
      { type: 'skill', name: '抖音 Feed 推送策略建议' },
      { type: 'skill', name: '信息流流量诊断' },
      { type: 'tool', name: '抖音 feed 命中关键词配置' },
      { type: 'tool', name: 'Feed 流投放配置' },
      // 抖音评论
      { type: 'skill', name: '抖音评论情感分析' },
      { type: 'tool', name: '抖音评论批量管理' },
      { type: 'skill', name: '评论区舆情归集' },
      { type: 'skill', name: '抖音评论自动回复建议' },
      { type: 'skill', name: '评论高赞内容挖掘' },
      { type: 'tool', name: '抖音评论批量导出 API' },
      // 抖音群聊
      { type: 'skill', name: '抖音群聊话术建议' },
      { type: 'tool', name: '抖音群聊批量推送' },
      { type: 'skill', name: '抖音群聊活跃度分析' },
      { type: 'skill', name: '抖音群聊运营策略' },
      { type: 'skill', name: '抖音群聊欢迎语生成' },
      { type: 'tool', name: '抖音群管理 API' },
      // 抖音搜索
      { type: 'skill', name: '抖音搜索词洞察' },
      { type: 'tool', name: 'douyin-search 数据接口' },
      { type: 'skill', name: '抖音搜索黑词建议' },
      { type: 'skill', name: '抖音搜索权重诊断' },
      { type: 'skill', name: '看后搜推荐策略' },
      { type: 'tool', name: '抖音搜索 API' },
      // 抖音热点
      { type: 'skill', name: '热点选题推荐' },
      { type: 'tool', name: '热榜实时拉取 API' },
      { type: 'skill', name: '热点趋势预测' },
      { type: 'skill', name: '热搜话题分析' },
      { type: 'skill', name: '热门话题战报' },
      { type: 'tool', name: 'trending topics API' },
      { type: 'tool', name: '抖音热榜订阅' },
      // 视频内容
      { type: 'skill', name: '视频选题归因分析' },
      { type: 'tool', name: '视频上传 API' },
      { type: 'skill', name: '视频脚本创作建议' },
      { type: 'skill', name: '视频封面建议' },
      { type: 'skill', name: '视频热门片段提取' },
      { type: 'tool', name: 'video 数据查询 API' },
      { type: 'tool', name: 'short-drama 数据查询' },
      // 直播内容
      { type: 'skill', name: '直播带货话术建议' },
      { type: 'tool', name: '直播间运营 API' },
      { type: 'skill', name: '直播弹幕分析' },
      { type: 'skill', name: 'live-streaming SOP 建议' },
      { type: 'tool', name: '直播开播提醒' },
      { type: 'tool', name: '直播 GMV 实时拉取' },
      // 账号信息
      { type: 'skill', name: '账号成长建议' },
      { type: 'tool', name: '账号画像查询' },
      { type: 'skill', name: '粉丝画像分析' },
      { type: 'skill', name: '作者标签建议' },
      { type: 'skill', name: '账号违规风险评估' },
      { type: 'tool', name: 'profile 详情接口' },
      // 舆情监控
      { type: 'skill', name: '舆情趋势分析' },
      { type: 'tool', name: '舆情监测告警 API' },
      { type: 'skill', name: '舆情事件处置建议' },
      { type: 'skill', name: '舆情聚类标签' },
      { type: 'skill', name: '舆情趋势日报' },
      { type: 'tool', name: '舆情批量导出' },
      // 娱乐互动
      { type: 'skill', name: '互动玩法策划' },
      { type: 'tool', name: '抽奖活动配置' },
      { type: 'skill', name: '互动玩法素材库' },
      { type: 'skill', name: '游戏化任务体系' },
      { type: 'tool', name: 'quiz 答题活动 API' },
      { type: 'tool', name: 'campaign 活动效果分析' },
      // 治理服务
      { type: 'skill', name: '违规识别建议' },
      { type: 'skill', name: '治理策略建议' },
      { type: 'skill', name: '违规判定模型' },
      { type: 'skill', name: '反作弊报告生成' },
      { type: 'tool', name: '治理标签批量打' },
      { type: 'tool', name: '风控规则配置' },
      // 客服能力
      { type: 'skill', name: '客服话术建议' },
      { type: 'tool', name: '客服工单系统对接' },
      { type: 'skill', name: '客服 FAQ 自动回复' },
      { type: 'skill', name: '客服满意度分析' },
      { type: 'skill', name: '客服质检报告' },
      { type: 'tool', name: 'helpdesk 工单分发' },
      { type: 'tool', name: '工单批量分配' },
    ],
  },
  {
    id: 'mock-inspiration-pack',
    name: '灵感创作能力包',
    description: '覆盖灵感创作分类下各二级类目的示意数据',
    primaryCategory: '内容理解与生成',
    secondaryCategory: '灵感创作能力包',
    capabilities: [
      // 内容生成
      { type: 'skill', name: '灵感主题生成' },
      { type: 'tool', name: '草稿批量生成 API' },
      { type: 'skill', name: '创意选题脑暴' },
      { type: 'skill', name: '短文案撰写' },
      { type: 'skill', name: '营销文案生成' },
      { type: 'skill', name: '创意金句生成' },
      { type: 'skill', name: '创作模板库' },
      { type: 'tool', name: 'AIGC creator 工具集' },
      { type: 'tool', name: 'gen-text API' },
      { type: 'tool', name: 'write-article API' },
      // 文本处理
      { type: 'skill', name: '文章改写润色' },
      { type: 'tool', name: '翻译 API' },
      { type: 'skill', name: '长文摘要提炼' },
      { type: 'skill', name: '文本校对建议' },
      { type: 'skill', name: '长文解读概要' },
      { type: 'skill', name: 'summary 长文总结' },
      { type: 'tool', name: '多语翻译 API' },
      { type: 'tool', name: 'translate batch API' },
      // 视觉制作
      { type: 'skill', name: '海报视觉建议' },
      { type: 'tool', name: 'banner 渲染 API' },
      { type: 'skill', name: 'logo 设计建议' },
      { type: 'skill', name: '视觉风格指南' },
      { type: 'skill', name: '海报版式建议' },
      { type: 'tool', name: 'screenshot 批量截图' },
      { type: 'tool', name: 'svg 图标生成器' },
      { type: 'tool', name: 'design system 上线工具' },
      // 图片生成
      { type: 'skill', name: 'image-gen 提示词建议' },
      { type: 'tool', name: 'stable diffusion 调用' },
      { type: 'skill', name: 'midjourney 提示词模板' },
      { type: 'skill', name: '生图角色参考库' },
      { type: 'skill', name: '图片生成预设管理' },
      { type: 'tool', name: 'flux 模型调用' },
      { type: 'tool', name: 'stable diffusion 训练 API' },
      // 图片编辑
      { type: 'skill', name: '图片编辑修图建议' },
      { type: 'tool', name: '抠图 cutout API' },
      { type: 'skill', name: 'AI 修图模板' },
      { type: 'skill', name: 'retouch 工作流' },
      { type: 'skill', name: 'lightroom 预设建议' },
      { type: 'tool', name: 'photoshop 动作脚本' },
      { type: 'tool', name: '抠图批量处理 API' },
      // 视频制作
      { type: 'skill', name: '视频制作分镜建议' },
      { type: 'tool', name: 'video-edit 工具调用' },
      { type: 'skill', name: '剪辑模板推荐' },
      { type: 'skill', name: '视频生成提示词库' },
      { type: 'skill', name: '视频制作工作流' },
      { type: 'tool', name: '剪辑特效 API' },
      { type: 'tool', name: 'AI 视频生成调度器' },
    ],
  },
  {
    id: 'mock-data-pack',
    name: '数据分析能力包',
    description: '覆盖数据分析和处理分类下各二级类目的示意数据',
    primaryCategory: '数据分析和处理',
    secondaryCategory: '数据分析能力包',
    capabilities: [
      // Libra
      { type: 'skill', name: 'Libra A/B 实验设计建议' },
      { type: 'tool', name: 'Libra 实验配置 API' },
      { type: 'skill', name: 'Libra 实验显著性诊断' },
      { type: 'skill', name: 'Libra 多变量分析' },
      { type: 'tool', name: 'Libra 流量分流配置' },
      // TEA
      { type: 'skill', name: 'TEA 埋点数据洞察' },
      { type: 'tool', name: 'TEA 埋点上报 API' },
      { type: 'skill', name: 'TEA 漏斗分析' },
      { type: 'skill', name: 'TEA 留存分析' },
      { type: 'tool', name: 'TEA 用户路径查询' },
      // Aeolus
      { type: 'skill', name: 'Aeolus 风神趋势解读' },
      { type: 'tool', name: 'Aeolus 监控配置 API' },
      { type: 'skill', name: 'Aeolus 风神实时大盘' },
      { type: 'skill', name: 'Aeolus 数据看板' },
      { type: 'tool', name: 'Aeolus 风神预案' },
      // 数据分析
      { type: 'skill', name: '数据分析报告生成' },
      { type: 'tool', name: '数据库 SQL 查询 API' },
      { type: 'skill', name: '指标拆解归因' },
      { type: 'skill', name: '数据看板搭建' },
      { type: 'skill', name: 'SQL 跑数助手' },
      { type: 'tool', name: 'OLAP 多维查询' },
      // 数据处理
      { type: 'skill', name: '数据建模建议' },
      { type: 'tool', name: 'ETL pipeline 调度' },
      { type: 'skill', name: '数据清洗工作流' },
      { type: 'skill', name: '数据建模模板' },
      { type: 'tool', name: '数据入库自动化' },
      { type: 'tool', name: 'transform 数据转换 API' },
    ],
  },
  {
    id: 'mock-dev-pack',
    name: '开发工具能力包',
    description: '覆盖开发工具分类下各二级类目的示意数据',
    primaryCategory: '开发和效率',
    secondaryCategory: '开发工具能力包',
    capabilities: [
      // 后端开发
      { type: 'skill', name: '后端 API 设计建议' },
      { type: 'tool', name: 'Kitex 后端服务脚手架' },
      { type: 'skill', name: '后端性能诊断' },
      { type: 'tool', name: 'Kitex 接口测试工具' },
      { type: 'tool', name: '后端 API 文档生成' },
      // 前端开发
      { type: 'skill', name: '前端组件设计建议' },
      { type: 'tool', name: 'Vite 前端脚手架' },
      { type: 'skill', name: '前端调试器接入' },
      { type: 'tool', name: 'React 组件库浏览' },
      { type: 'tool', name: 'Vue 项目脚手架' },
      // 自动化工具
      { type: 'skill', name: '自动化流程脚本建议' },
      { type: 'tool', name: '自动化任务调度' },
      { type: 'skill', name: '自动化测试用例编排' },
      { type: 'tool', name: 'script 工作流' },
      { type: 'tool', name: '触发器配置中心' },
      // 效率与集成
      { type: 'skill', name: '集成方案建议' },
      { type: 'tool', name: 'Webhook 集成配置' },
      { type: 'skill', name: '接入第三方平台' },
      { type: 'tool', name: 'API 集成中间件' },
      { type: 'tool', name: 'integration test 中台' },
      // 系统管理
      { type: 'skill', name: '运维事件分析' },
      { type: 'tool', name: 'K8s 容器部署' },
      { type: 'skill', name: '服务部署清单' },
      { type: 'tool', name: '日志大盘检索' },
      { type: 'tool', name: 'kibana 仪表盘' },
    ],
  },
  {
    id: 'mock-safety-pack',
    name: '安全审核能力包',
    description: '覆盖安全审核分类下各二级类目的示意数据',
    primaryCategory: '业务平台',
    secondaryCategory: '安全审核能力包',
    capabilities: [
      { type: 'skill', name: '监控告警优化建议' },
      { type: 'tool', name: '监测告警规则配置' },
      { type: 'skill', name: '风险合规评估' },
      { type: 'tool', name: '合规扫描 API' },
      { type: 'skill', name: '内容审核建议' },
      { type: 'tool', name: '审核复核工单 API' },
    ],
  },
  {
    id: 'mock-office-pack',
    name: '办公效率能力包',
    description: '覆盖办公效率分类下各二级类目的示意数据',
    primaryCategory: '开发和效率',
    secondaryCategory: '办公效率能力包',
    capabilities: [
      { type: 'skill', name: '飞书云文档结构建议' },
      { type: 'tool', name: '飞书多维表格 API' },
      { type: 'skill', name: '联网搜索结果归纳' },
      { type: 'tool', name: 'web-search 联网搜索 API' },
      { type: 'skill', name: '系统工具使用建议' },
      { type: 'tool', name: '系统工具集查询' },
      { type: 'skill', name: '行业财务洞察' },
      { type: 'tool', name: '财务报表查询 API' },
      { type: 'skill', name: '销售营销活动策划' },
      { type: 'tool', name: 'CRM 获客 lead API' },
      { type: 'skill', name: '文档结构化建议' },
      { type: 'tool', name: 'PDF 文档解析 API' },
    ],
  },
]

export interface CategoryTreeNode {
  primary: PrimaryCategory
  secondaries: string[]
}

/** Build the 2-level hierarchy used by the category tree. 官方 is a
 *  virtual aggregator with no direct children; it relies on a row-level
 *  selector in the UI instead of any nested secondaries. */
export function buildCategoryTree(
  resources: Resource[] = RESOURCES,
): CategoryTreeNode[] {
  const buckets = new Map<PrimaryCategory, string[]>()
  const seen = new Map<PrimaryCategory, Set<string>>()
  for (const cat of PRIMARY_CATEGORIES) {
    buckets.set(cat, [])
    seen.set(cat, new Set())
  }
  for (const r of resources) {
    const list = buckets.get(r.primaryCategory)!
    const sset = seen.get(r.primaryCategory)!
    if (!sset.has(r.secondaryCategory)) {
      sset.add(r.secondaryCategory)
      list.push(r.secondaryCategory)
    }
  }
  return PRIMARY_CATEGORIES.map((primary) => ({
    primary,
    secondaries: buckets.get(primary) ?? [],
  }))
}

export interface NewCategoryTreeNode {
  primary: NewPrimaryCategory
  secondaries: string[]
}

/** Build the new capability-centric 2-level hierarchy. Walks every
 *  capability on every resource of the requested kind ('skill' / 'tool')
 *  and groups by inferred (primary → secondary). Returns the primaries
 *  in NEW_PRIMARY_CATEGORIES order; secondaries follow the spec order
 *  defined in NEW_SECONDARIES_BY_PRIMARY (plus any "other" leaves at
 *  the end). */
export function buildCapabilityTree(
  kind: CapabilityType,
  resources: Resource[] = RESOURCES,
): NewCategoryTreeNode[] {
  const present = new Map<NewPrimaryCategory, Set<string>>()
  for (const p of NEW_PRIMARY_CATEGORIES) present.set(p, new Set())
  for (const r of resources) {
    for (const c of r.capabilities) {
      if (c.type !== kind) continue
      const primary = inferCapabilityPrimaryForResource(c.name, r)
      const secondary = inferCapabilitySecondary(c.name)
      present.get(primary)!.add(secondary)
    }
  }
  return NEW_PRIMARY_CATEGORIES.map((primary) => {
    const spec = NEW_SECONDARIES_BY_PRIMARY[primary]
    const seen = present.get(primary)!
    // Preserve the spec order for known secondaries; append anything
    // unexpected at the end (defensive). For 空间 the spec is empty so
    // every present secondary just lands as an extra in source order.
    const ordered = spec.filter((s) => seen.has(s))
    const extras = [...seen].filter((s) => !spec.includes(s))
    return { primary, secondaries: [...ordered, ...extras] }
  })
}

export function filterResources(
  primary: PrimaryCategory | null,
  secondary: string | null,
  resources: Resource[] = RESOURCES,
): Resource[] {
  return resources.filter((r) => {
    if (primary && r.primaryCategory !== primary) return false
    if (secondary && r.secondaryCategory !== secondary) return false
    return true
  })
}

export function findResource(
  id: string | null,
  resources: Resource[] = RESOURCES,
): Resource | null {
  if (!id) return null
  return resources.find((r) => r.id === id) ?? null
}

export const CAPABILITY_LABEL: Record<CapabilityType, string> = {
  skill: 'Skill',
  tool: 'MCP',
  knowledge: '知识库',
}

/* ─── Knowledge-only bucketing ───
 * 资源库 → 知识库 列表页左侧只有三档：抖音标准知识库 / 我的抖音知识库
 * / 空间知识库。与 工具 / Skills 的 8 类树正交，单独建一套分桶以避免
 * 与 inferCapabilityPrimaryForResource 的语义冲突。
 */

export const KNOWLEDGE_BUCKETS = ['standard', 'mine', 'space'] as const
export type KnowledgeBucket = (typeof KNOWLEDGE_BUCKETS)[number]

export const KNOWLEDGE_BUCKET_LABEL: Record<KnowledgeBucket, string> = {
  standard: '抖音标准知识库',
  mine: '我的抖音知识库',
  space: '空间知识库',
}

/** Decide which knowledge bucket a (capability, resource) pair belongs
 *  to. Order matters: the dedicated mock resources for 我的 / 标准 are
 *  matched by id first so they win over the generic primaryCategory
 *  fallback. */
export function classifyKnowledgeBucket(
  _cap: Capability,
  resource: Resource,
): KnowledgeBucket {
  if (resource.id === 'my-douyin-knowledge') return 'mine'
  if (resource.id === 'douyin-standard-knowledge') return 'standard'
  if (resource.primaryCategory === '空间') return 'space'
  return 'standard'
}

/* ─── Project usage / lineage ───
 * Maps each project (matches PROJECT_KINDS keys in VibeCodingPage) to
 * the resources / capabilities it depends on. Used by the detail views
 * to surface "项目血缘" — which projects pull from this capability or
 * platform — and to count its reach.
 */

export interface ProjectCapabilityRef {
  platformId: string
  /** Optional — when omitted, the project is using the platform broadly
   *  (any capability) and the dependency rolls up to the platform level
   *  rather than a single capability row. */
  name?: string
  category?: string | null
}

export interface ProjectUsage {
  project: string
  uses: ProjectCapabilityRef[]
}

export const PROJECT_USAGE: ProjectUsage[] = [
  {
    project: '陶白白 Sensei 分身',
    uses: [
      { platformId: 'aime', name: '单聊 / 群聊', category: '飞书' },
      { platformId: 'aime', name: '飞书会议 / 飞书妙记', category: '飞书' },
      { platformId: 'aime', name: '网络搜索', category: '信息检索' },
      { platformId: 'mira', name: 'lark-docs', category: '效率协作' },
      { platformId: 'mira', name: 'short-drama-original', category: '生活方式' },
      { platformId: 'ida', name: 'TEA 数据查询', category: '数据分析' },
      { platformId: 'mirror', name: '用户标签查询' },
      { platformId: 'holmes', name: '推荐效果归因' },
    ],
  },
  {
    project: '粉丝互动机器人',
    uses: [
      { platformId: 'aime', name: '单聊 / 群聊', category: '飞书' },
      { platformId: 'aime', name: '代发消息', category: '飞书' },
      { platformId: 'aime', name: 'AI 多媒体分析', category: '创作' },
      { platformId: 'mira', name: 'im-chat-manager', category: '效率协作' },
      { platformId: 'mirror', name: '用户标签查询' },
      { platformId: 'mirror', name: '人群圈选' },
      { platformId: 'owls', name: '舆情实时监测' },
    ],
  },
  {
    project: '第五人格塔罗小程序',
    uses: [
      { platformId: 'aime', name: '图片 / Banner 生成', category: '创作' },
      { platformId: 'mira', name: 'svg-chart-gen', category: '设计' },
      { platformId: 'mira', name: 'frontend-design', category: '设计' },
      { platformId: 'ida', name: '指标归因分析', category: '数据分析' },
      { platformId: 'live-ops', name: '直播间观众画像分析' },
      { platformId: 'gaia', name: '提交资源申请单' },
    ],
  },
  {
    project: '每日打卡小程序',
    uses: [
      { platformId: 'aime', name: '飞书任务', category: '飞书' },
      { platformId: 'aime', name: '飞书日历', category: '飞书' },
      { platformId: 'aime', name: '云文档', category: '飞书' },
      { platformId: 'mira', name: 'okrs-by-bco', category: '效率协作' },
      { platformId: 'ida', name: 'TEA 数据查询', category: '数据分析' },
      { platformId: 'hotspot-ops', name: '查询热点榜单实时数据' },
    ],
  },
  {
    project: '探店视频创作助手',
    uses: [
      { platformId: 'aime', name: '图片 / Banner 生成', category: '创作' },
      { platformId: 'aime', name: 'AI 多媒体分析', category: '创作' },
      { platformId: 'aime', name: 'PPT', category: '创作' },
      { platformId: 'ida', name: 'dau-attribution-videocut', category: '数据分析' },
      { platformId: 'ida', name: 'videocut-analysis-report', category: '数据分析' },
      { platformId: 'wenyu-ops', name: '查询明星阵地数据' },
      { platformId: 'mirror', name: '人群圈选' },
    ],
  },
]

/** Find the projects using a specific capability. A capability match
 *  requires platformId + name + category equality. */
export function projectsUsingCapability(
  platformId: string,
  name: string,
  category: string | null,
): string[] {
  const out: string[] = []
  for (const u of PROJECT_USAGE) {
    if (
      u.uses.some(
        (c) =>
          c.platformId === platformId &&
          c.name === name &&
          (c.category ?? null) === category,
      )
    ) {
      out.push(u.project)
    }
  }
  return out
}

/** Find the projects using ANY capability of a given platform — surfaces
 *  the platform's overall reach in the platform detail view. */
export function projectsUsingPlatform(platformId: string): string[] {
  const out: string[] = []
  for (const u of PROJECT_USAGE) {
    if (u.uses.some((c) => c.platformId === platformId)) {
      out.push(u.project)
    }
  }
  return out
}
