import { create } from 'zustand'

/* ─── Database model for mini-program projects ─────────────────────────
 *
 * A project owns a `dev` and a `prod` env. Each env owns a list of
 * tables; tables share names across envs but the structure may diverge
 * (this is exactly what the diff badge surfaces). The store also
 * carries a few rows of sample data per table for the data tab, plus
 * a tiny in-memory SQL evaluator for the sandbox.
 *
 * Real product would wire to an actual SQL engine. The sandbox here
 * only supports `SELECT <cols|*> FROM <table> [WHERE col = 'literal']
 * [LIMIT n]` — enough for demos / exploration.
 */

export type DbEnv = 'dev' | 'prod'

export type ColType = 'bigint' | 'int' | 'varchar' | 'text' | 'datetime' | 'json' | 'bool'

export interface ColumnSpec {
  name: string
  type: ColType
  /** Max length for varchar etc. Free-text — purely cosmetic in the demo. */
  size?: string
  primary?: boolean
  unique?: boolean
  notNull?: boolean
  /** Free-text default value, shown as `DEFAULT …` in the schema view. */
  default?: string
  comment?: string
}

export interface IndexSpec {
  name: string
  columns: string[]
  /** primary | unique | normal */
  kind: 'primary' | 'unique' | 'normal'
}

export interface TableSpec {
  name: string
  comment?: string
  columns: ColumnSpec[]
  indexes: IndexSpec[]
}

/** A row is a typed map keyed by column name. */
export type DbRow = Record<string, string | number | boolean | null>

export interface TableData {
  rows: DbRow[]
}

export interface ProjectDb {
  projectId: string
  envs: Record<DbEnv, {
    tables: TableSpec[]
    /** Sample rows per table (keyed by table name). */
    sampleData: Record<string, TableData>
  }>
}

/* ─── Seed: 第五人格塔罗小程序 ────────────────────────────────────────── */

const tarotDevTables: TableSpec[] = [
  {
    name: 'users',
    comment: '用户主表',
    columns: [
      { name: 'id', type: 'bigint', primary: true, notNull: true, comment: '主键' },
      { name: 'openid', type: 'varchar', size: '64', unique: true, notNull: true, comment: '抖音 openid' },
      { name: 'nickname', type: 'varchar', size: '64', comment: '昵称' },
      { name: 'avatar', type: 'varchar', size: '255' },
      { name: 'created_at', type: 'datetime', notNull: true, default: 'CURRENT_TIMESTAMP' },
    ],
    indexes: [
      { name: 'PRIMARY', columns: ['id'], kind: 'primary' },
      { name: 'uniq_openid', columns: ['openid'], kind: 'unique' },
    ],
  },
  {
    name: 'tarot_logs',
    comment: '占卜历史',
    columns: [
      { name: 'id', type: 'bigint', primary: true, notNull: true },
      { name: 'user_id', type: 'bigint', notNull: true },
      { name: 'spread', type: 'varchar', size: '32', comment: '牌阵：three / celtic-cross' },
      { name: 'question', type: 'text' },
      { name: 'cards', type: 'json', comment: '抽到的卡牌列表' },
      { name: 'reading', type: 'text', comment: 'AI 生成的解读' },
      { name: 'created_at', type: 'datetime', notNull: true, default: 'CURRENT_TIMESTAMP' },
      { name: 'liked', type: 'bool', default: 'false', comment: '用户是否点赞此次解读' },
    ],
    indexes: [
      { name: 'PRIMARY', columns: ['id'], kind: 'primary' },
      { name: 'idx_user_created', columns: ['user_id', 'created_at'], kind: 'normal' },
    ],
  },
  {
    name: 'card_meta',
    comment: '塔罗牌牌面字典',
    columns: [
      { name: 'code', type: 'varchar', size: '16', primary: true, notNull: true, comment: '牌面编码' },
      { name: 'name_cn', type: 'varchar', size: '32', notNull: true },
      { name: 'name_en', type: 'varchar', size: '32' },
      { name: 'arcana', type: 'varchar', size: '16', comment: 'major / minor' },
      { name: 'upright_meaning', type: 'text' },
      { name: 'reversed_meaning', type: 'text' },
    ],
    indexes: [{ name: 'PRIMARY', columns: ['code'], kind: 'primary' }],
  },
]

// prod 比 dev 少一列（liked）和一张表（card_meta），用于演示 diff。
const tarotProdTables: TableSpec[] = [
  tarotDevTables[0], // users
  {
    ...tarotDevTables[1],
    columns: tarotDevTables[1].columns.filter((c) => c.name !== 'liked'),
  },
]

const tarotSampleData: Record<string, TableData> = {
  users: {
    rows: [
      { id: 1001, openid: 'oXk1d-aB...zX', nickname: '夜霜', avatar: 'https://…/a.jpg', created_at: '2026-04-21 18:32:10' },
      { id: 1002, openid: 'oXk1d-aB...yQ', nickname: '光阴', avatar: 'https://…/b.jpg', created_at: '2026-04-22 09:11:43' },
      { id: 1003, openid: 'oXk1d-aB...tR', nickname: 'Maple', avatar: 'https://…/c.jpg', created_at: '2026-05-02 13:44:55' },
    ],
  },
  tarot_logs: {
    rows: [
      { id: 50001, user_id: 1001, spread: 'three', question: '工作运势', cards: '["08", "02-r", "14"]', reading: '过去：力量 / 现在：女祭司逆位 / 未来：节制...', created_at: '2026-05-12 21:03:00', liked: true },
      { id: 50002, user_id: 1003, spread: 'celtic-cross', question: '感情', cards: '["00", "13", "07", "16", "12", "17", "01", "19", "21", "10"]', reading: '愚人开局，提示放下惯性...', created_at: '2026-05-18 14:22:30', liked: false },
    ],
  },
  card_meta: {
    rows: [
      { code: '00', name_cn: '愚人', name_en: 'The Fool', arcana: 'major', upright_meaning: '冒险 · 新开始', reversed_meaning: '鲁莽 · 不切实际' },
      { code: '01', name_cn: '魔术师', name_en: 'The Magician', arcana: 'major', upright_meaning: '掌控 · 创造', reversed_meaning: '欺骗 · 滥用才能' },
    ],
  },
}

const tarotProdSampleData: Record<string, TableData> = {
  users: tarotSampleData.users,
  tarot_logs: {
    rows: tarotSampleData.tarot_logs.rows.map(({ liked: _liked, ...rest }) => rest),
  },
}

/* ─── Seed: 每日打卡小程序 ────────────────────────────────────────────── */

const checkinDevTables: TableSpec[] = [
  {
    name: 'users',
    columns: [
      { name: 'id', type: 'bigint', primary: true, notNull: true },
      { name: 'openid', type: 'varchar', size: '64', unique: true, notNull: true },
      { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
    ],
    indexes: [
      { name: 'PRIMARY', columns: ['id'], kind: 'primary' },
      { name: 'uniq_openid', columns: ['openid'], kind: 'unique' },
    ],
  },
  {
    name: 'check_ins',
    comment: '每日打卡',
    columns: [
      { name: 'id', type: 'bigint', primary: true, notNull: true },
      { name: 'user_id', type: 'bigint', notNull: true },
      { name: 'date', type: 'varchar', size: '10', notNull: true, comment: 'YYYY-MM-DD' },
      { name: 'streak', type: 'int', default: '0', comment: '连续打卡天数' },
      { name: 'note', type: 'text' },
      { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
    ],
    indexes: [
      { name: 'PRIMARY', columns: ['id'], kind: 'primary' },
      { name: 'uniq_user_date', columns: ['user_id', 'date'], kind: 'unique' },
    ],
  },
]

const checkinDevData: Record<string, TableData> = {
  users: { rows: [{ id: 1, openid: 'ox-1', created_at: '2026-01-02 09:00' }] },
  check_ins: {
    rows: [
      { id: 1, user_id: 1, date: '2026-05-19', streak: 5, note: '今天 6 点起床跑了 3 公里', created_at: '2026-05-19 06:50' },
      { id: 2, user_id: 1, date: '2026-05-20', streak: 6, note: '继续保持～', created_at: '2026-05-20 07:01' },
    ],
  },
}

/* ─── Initial state ──────────────────────────────────────────────────── */

const SEED_DBS: ProjectDb[] = [
  {
    projectId: 'mp-tarot',
    envs: {
      dev: { tables: tarotDevTables, sampleData: tarotSampleData },
      prod: { tables: tarotProdTables, sampleData: tarotProdSampleData },
    },
  },
  {
    projectId: 'mp-checkin',
    envs: {
      dev: { tables: checkinDevTables, sampleData: checkinDevData },
      prod: { tables: checkinDevTables, sampleData: checkinDevData },
    },
  },
]

/* ─── Tiny mock SQL evaluator ─────────────────────────────────────────── */

export interface SqlResult {
  ok: boolean
  /** Column names in the result. */
  columns?: string[]
  rows?: DbRow[]
  /** Echo of the parsed plan, surfaced as an explanation under the
   *  result table so demos look credible. */
  plan?: string
  error?: string
  /** Wall-clock millis the executor pretended to take. */
  elapsedMs?: number
}

/** Very small parser — supports:
 *   SELECT <* | col1, col2, ...> FROM <table>
 *      [WHERE col = '...' | col = N]
 *      [LIMIT N]
 *  Case-insensitive. Strings must be single-quoted. */
export function runMockSql(sql: string, env: DbEnv, db: ProjectDb): SqlResult {
  const start = performance.now()
  const cleaned = sql.replace(/;+\s*$/g, '').trim()
  if (!cleaned) return { ok: false, error: '请输入 SQL 语句' }
  const m = cleaned.match(
    /^\s*select\s+(.+?)\s+from\s+([a-zA-Z_][\w]*)\s*(?:where\s+([a-zA-Z_][\w]*)\s*=\s*('([^']*)'|(-?\d+(?:\.\d+)?)|(true|false)))?\s*(?:limit\s+(\d+))?\s*$/i,
  )
  if (!m) {
    return {
      ok: false,
      error:
        '仅支持：SELECT <cols|*> FROM <table> [WHERE col = \'literal\'|N|true/false] [LIMIT N]',
    }
  }
  const colsRaw = m[1].trim()
  const tableName = m[2]
  const whereCol = m[3]
  const whereStr = m[5]
  const whereNum = m[6]
  const whereBool = m[7]
  const limit = m[8] ? parseInt(m[8], 10) : undefined

  const envData = db.envs[env]
  const tableSpec = envData.tables.find((t) => t.name === tableName)
  if (!tableSpec) {
    return { ok: false, error: `表 "${tableName}" 在 ${env} 环境不存在` }
  }
  const data = envData.sampleData[tableName]?.rows ?? []

  const wantedCols =
    colsRaw === '*'
      ? tableSpec.columns.map((c) => c.name)
      : colsRaw.split(/\s*,\s*/).map((c) => c.trim())

  // Verify cols exist
  for (const c of wantedCols) {
    if (!tableSpec.columns.some((x) => x.name === c)) {
      return { ok: false, error: `列 "${c}" 在表 "${tableName}" 不存在` }
    }
  }

  let rows = [...data]
  if (whereCol) {
    if (!tableSpec.columns.some((x) => x.name === whereCol)) {
      return { ok: false, error: `WHERE 列 "${whereCol}" 不存在` }
    }
    let val: string | number | boolean
    if (whereStr !== undefined) val = whereStr
    else if (whereNum !== undefined) val = Number(whereNum)
    else val = whereBool === 'true'
    rows = rows.filter((r) => r[whereCol] === val)
  }
  if (limit !== undefined) rows = rows.slice(0, limit)
  const projected = rows.map((r) => {
    const out: DbRow = {}
    for (const c of wantedCols) out[c] = r[c] ?? null
    return out
  })

  const planLines = [
    `SCAN ${env}.${tableName}`,
    whereCol ? `FILTER ${whereCol} = ${JSON.stringify(whereStr ?? whereNum ?? whereBool)}` : null,
    limit !== undefined ? `LIMIT ${limit}` : null,
    `PROJECT ${wantedCols.length} 列`,
  ].filter(Boolean) as string[]
  return {
    ok: true,
    columns: wantedCols,
    rows: projected,
    plan: planLines.join(' → '),
    elapsedMs: Math.round((performance.now() - start) * 10) / 10,
  }
}

/* ─── Diff helper ──────────────────────────────────────────────────── */

export interface SchemaDiff {
  /** Tables in dev that don't exist in prod. */
  newTables: string[]
  /** Tables in prod that don't exist in dev. */
  removedTables: string[]
  /** Per-table column-level differences. */
  changedTables: Array<{
    table: string
    newColumns: string[]
    removedColumns: string[]
  }>
}

export function diffEnvs(db: ProjectDb): SchemaDiff {
  const dev = db.envs.dev.tables
  const prod = db.envs.prod.tables
  const devSet = new Set(dev.map((t) => t.name))
  const prodSet = new Set(prod.map((t) => t.name))
  const newTables = [...devSet].filter((n) => !prodSet.has(n))
  const removedTables = [...prodSet].filter((n) => !devSet.has(n))
  const changedTables: SchemaDiff['changedTables'] = []
  for (const t of dev) {
    const counterpart = prod.find((x) => x.name === t.name)
    if (!counterpart) continue
    const devCols = new Set(t.columns.map((c) => c.name))
    const prodCols = new Set(counterpart.columns.map((c) => c.name))
    const newColumns = [...devCols].filter((c) => !prodCols.has(c))
    const removedColumns = [...prodCols].filter((c) => !devCols.has(c))
    if (newColumns.length > 0 || removedColumns.length > 0) {
      changedTables.push({ table: t.name, newColumns, removedColumns })
    }
  }
  return { newTables, removedTables, changedTables }
}

export function diffCount(diff: SchemaDiff): number {
  return (
    diff.newTables.length +
    diff.removedTables.length +
    diff.changedTables.reduce((n, t) => n + t.newColumns.length + t.removedColumns.length, 0)
  )
}

/* ─── Store ─────────────────────────────────────────────────────────── */

interface DbState {
  dbs: ProjectDb[]
  /** Per-project remembered env so toggle persists across project switches. */
  envByProject: Record<string, DbEnv>
  /** Per-project remembered selected table. */
  tableByProject: Record<string, string | null>
  /** SQL sandbox text, per project. */
  sqlByProject: Record<string, string>
  /** Most recent SQL result, per project. */
  resultByProject: Record<string, SqlResult | null>

  setEnv: (projectId: string, env: DbEnv) => void
  setSelectedTable: (projectId: string, table: string | null) => void
  setSql: (projectId: string, sql: string) => void
  runSql: (projectId: string) => SqlResult | null
}

export const useDbStore = create<DbState>((set, get) => ({
  dbs: SEED_DBS,
  envByProject: { 'mp-tarot': 'dev', 'mp-checkin': 'dev' },
  tableByProject: { 'mp-tarot': 'tarot_logs', 'mp-checkin': 'check_ins' },
  sqlByProject: {
    'mp-tarot': "SELECT id, user_id, spread, question FROM tarot_logs WHERE liked = true LIMIT 10;",
    'mp-checkin': 'SELECT * FROM check_ins LIMIT 10;',
  },
  resultByProject: {},

  setEnv: (projectId, env) =>
    set({ envByProject: { ...get().envByProject, [projectId]: env } }),
  setSelectedTable: (projectId, table) =>
    set({ tableByProject: { ...get().tableByProject, [projectId]: table } }),
  setSql: (projectId, sql) =>
    set({ sqlByProject: { ...get().sqlByProject, [projectId]: sql } }),
  runSql: (projectId) => {
    const db = get().dbs.find((d) => d.projectId === projectId)
    if (!db) return null
    const env = get().envByProject[projectId] ?? 'dev'
    const sql = get().sqlByProject[projectId] ?? ''
    const res = runMockSql(sql, env, db)
    set({ resultByProject: { ...get().resultByProject, [projectId]: res } })
    return res
  },
}))

export function getProjectDb(projectId: string, all: ProjectDb[]): ProjectDb | undefined {
  return all.find((d) => d.projectId === projectId)
}
