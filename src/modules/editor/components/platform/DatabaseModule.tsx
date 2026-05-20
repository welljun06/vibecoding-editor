import { useState } from 'react'
import {
  ChevronRight,
  Database,
  Key,
  Play,
  Table as TableIcon,
} from 'lucide-react'
import {
  diffEnvs,
  getProjectDb,
  useDbStore,
  type DbEnv,
  type SqlResult,
  type TableSpec,
} from '../../store/db-store'

interface Props {
  projectId: string
}

export default function DatabaseModule({ projectId }: Props) {
  const dbs = useDbStore((s) => s.dbs)
  const env = useDbStore((s) => s.envByProject[projectId] ?? 'dev')
  const setEnv = useDbStore((s) => s.setEnv)
  const selectedTable = useDbStore((s) => s.tableByProject[projectId] ?? null)
  const setSelectedTable = useDbStore((s) => s.setSelectedTable)
  const db = getProjectDb(projectId, dbs)
  const [subTab, setSubTab] = useState<'schema' | 'data' | 'indexes' | 'sql'>('schema')

  if (!db) {
    return (
      <div className="flex h-full items-center justify-center text-[12.5px] text-[var(--color-ink)]/50">
        这个项目还没有挂载数据库
      </div>
    )
  }

  const diff = diffEnvs(db)
  const envData = db.envs[env]
  const tables = envData.tables
  const table =
    tables.find((t) => t.name === selectedTable) ?? tables[0] ?? undefined

  return (
    <div className="flex min-h-0 flex-1">
      {/* Tables column */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-[var(--divider-soft)] bg-[var(--color-surface-0)]">
        <div className="flex items-center gap-1 border-b border-[var(--divider-soft)] p-2">
          <div className="flex h-7 flex-1 items-center gap-0.5 rounded-md bg-[var(--fill-subtle)] p-0.5">
            {(['dev', 'prod'] as const).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEnv(projectId, e)}
                className={`flex h-6 flex-1 items-center justify-center rounded text-[11.5px] transition-colors ${
                  env === e
                    ? 'bg-[var(--color-ink)] text-[var(--color-ink-contrast)]'
                    : 'text-[var(--color-ink)]/65 hover:text-[var(--color-ink)]'
                }`}
              >
                {e === 'dev' ? '开发' : '生产'}
              </button>
            ))}
          </div>
        </div>
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          <div className="px-1 pb-1.5 text-[10.5px] uppercase tracking-[0.05em] text-[var(--color-ink)]/45">
            表 · {tables.length}
          </div>
          {tables.map((t) => {
            const isActive = t.name === table?.name
            const isNewInDev = env === 'dev' && diff.newTables.includes(t.name)
            const hasChange =
              diff.changedTables.some((c) => c.table === t.name) && env === 'dev'
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTable(projectId, t.name)}
                className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors ${
                  isActive
                    ? 'bg-[var(--fill-medium)] text-[var(--color-ink)]'
                    : 'text-[var(--color-ink)]/75 hover:bg-[var(--fill-soft)]'
                }`}
              >
                <TableIcon size={12} strokeWidth={1.7} className="text-[var(--color-ink)]/55" />
                <span className="flex-1 truncate">{t.name}</span>
                {isNewInDev && (
                  <span className="rounded-full bg-emerald-500/15 px-1 text-[9px] text-emerald-300">
                    新
                  </span>
                )}
                {hasChange && (
                  <span className="rounded-full bg-amber-500/15 px-1 text-[9px] text-amber-300">
                    diff
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </aside>
      {/* Main column */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Sub-tabs */}
        <div className="flex h-10 shrink-0 items-center gap-1 border-b border-[var(--divider-soft)] bg-[var(--color-surface-1)] px-3">
          {(['schema', 'data', 'indexes', 'sql'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              className={`flex h-7 items-center rounded-md px-2.5 text-[12px] transition-colors ${
                subTab === tab
                  ? 'bg-[var(--fill-medium)] text-[var(--color-ink)]'
                  : 'text-[var(--color-ink)]/60 hover:bg-[var(--fill-soft)]'
              }`}
            >
              {tab === 'schema'
                ? 'Schema'
                : tab === 'data'
                  ? '数据'
                  : tab === 'indexes'
                    ? '索引'
                    : 'SQL 沙盒'}
            </button>
          ))}
          <span className="ml-auto flex items-center gap-2 text-[11px] text-[var(--color-ink)]/50">
            <Database size={12} strokeWidth={1.6} />
            <span>{env === 'dev' ? '开发环境' : '生产环境'}</span>
            <ChevronRight size={11} className="text-[var(--color-ink)]/35" />
            <span className="text-[var(--color-ink)]/75">{table?.name ?? '—'}</span>
          </span>
        </div>
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto p-5">
          {!table ? (
            <div className="text-[12.5px] text-[var(--color-ink)]/50">从左侧选择一张表</div>
          ) : subTab === 'schema' ? (
            <SchemaTab table={table} />
          ) : subTab === 'data' ? (
            <DataTab table={table} rows={envData.sampleData[table.name]?.rows ?? []} />
          ) : subTab === 'indexes' ? (
            <IndexesTab table={table} />
          ) : (
            <SqlTab projectId={projectId} env={env} />
          )}
        </div>
      </div>
    </div>
  )
}

function SchemaTab({ table }: { table: TableSpec }) {
  return (
    <div className="rounded-xl border border-[var(--divider-soft)] bg-[var(--color-surface-1)]">
      <div className="flex items-baseline justify-between border-b border-[var(--divider-soft)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold text-[var(--color-ink)]">{table.name}</h2>
          {table.comment && (
            <span className="text-[11.5px] text-[var(--color-ink)]/55">— {table.comment}</span>
          )}
        </div>
        <span className="text-[11px] text-[var(--color-ink)]/45">{table.columns.length} 列</span>
      </div>
      <table className="w-full table-fixed text-left text-[12px]">
        <thead className="text-[10.5px] uppercase tracking-[0.05em] text-[var(--color-ink)]/45">
          <tr>
            <th className="w-[26%] px-4 py-2 font-normal">列名</th>
            <th className="w-[18%] px-4 py-2 font-normal">类型</th>
            <th className="w-[24%] px-4 py-2 font-normal">约束</th>
            <th className="w-[32%] px-4 py-2 font-normal">备注</th>
          </tr>
        </thead>
        <tbody>
          {table.columns.map((c) => (
            <tr
              key={c.name}
              className="border-t border-[var(--divider-soft)] text-[var(--color-ink)]/85"
            >
              <td className="px-4 py-2">
                <span className="flex items-center gap-1.5">
                  {c.primary && <Key size={10} className="text-amber-300" strokeWidth={2} />}
                  <span className={c.primary ? 'font-medium text-[var(--color-ink)]' : ''}>
                    {c.name}
                  </span>
                </span>
              </td>
              <td className="px-4 py-2 font-mono text-[11.5px] text-[var(--color-ink)]/75">
                {c.type}
                {c.size ? `(${c.size})` : ''}
              </td>
              <td className="px-4 py-2 text-[11px]">
                <div className="flex flex-wrap gap-1">
                  {c.primary && <Pill tone="amber">PK</Pill>}
                  {c.unique && <Pill tone="violet">UNIQUE</Pill>}
                  {c.notNull && <Pill tone="muted">NOT NULL</Pill>}
                  {c.default && <Pill tone="muted">DEFAULT {c.default}</Pill>}
                </div>
              </td>
              <td className="px-4 py-2 text-[11.5px] text-[var(--color-ink)]/55">{c.comment ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DataTab({ table, rows }: { table: TableSpec; rows: Array<Record<string, unknown>> }) {
  return (
    <div className="rounded-xl border border-[var(--divider-soft)] bg-[var(--color-surface-1)]">
      <div className="flex items-baseline justify-between border-b border-[var(--divider-soft)] px-4 py-2.5">
        <h2 className="text-[14px] font-semibold text-[var(--color-ink)]">{table.name} · 示例数据</h2>
        <span className="text-[11px] text-[var(--color-ink)]/45">{rows.length} 行</span>
      </div>
      <div className="thin-scroll max-w-full overflow-x-auto">
        <table className="w-full table-auto text-left text-[11.5px]">
          <thead className="text-[10px] uppercase tracking-[0.05em] text-[var(--color-ink)]/45">
            <tr>
              {table.columns.map((c) => (
                <th key={c.name} className="whitespace-nowrap px-3 py-2 font-normal">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[var(--divider-soft)] text-[var(--color-ink)]/85">
                {table.columns.map((c) => (
                  <td
                    key={c.name}
                    className="max-w-[260px] truncate whitespace-nowrap px-3 py-2 font-mono text-[11px]"
                    title={String(r[c.name] ?? '')}
                  >
                    {r[c.name] === null || r[c.name] === undefined ? (
                      <span className="text-[var(--color-ink)]/35">NULL</span>
                    ) : (
                      String(r[c.name])
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={table.columns.length} className="px-3 py-12 text-center text-[11.5px] text-[var(--color-ink)]/45">
                  暂无示例数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IndexesTab({ table }: { table: TableSpec }) {
  return (
    <div className="rounded-xl border border-[var(--divider-soft)] bg-[var(--color-surface-1)]">
      <div className="flex items-baseline justify-between border-b border-[var(--divider-soft)] px-4 py-2.5">
        <h2 className="text-[14px] font-semibold text-[var(--color-ink)]">{table.name} · 索引</h2>
        <span className="text-[11px] text-[var(--color-ink)]/45">{table.indexes.length} 个</span>
      </div>
      <table className="w-full table-fixed text-left text-[12px]">
        <thead className="text-[10.5px] uppercase tracking-[0.05em] text-[var(--color-ink)]/45">
          <tr>
            <th className="w-[36%] px-4 py-2 font-normal">名称</th>
            <th className="w-[18%] px-4 py-2 font-normal">类型</th>
            <th className="w-[46%] px-4 py-2 font-normal">列</th>
          </tr>
        </thead>
        <tbody>
          {table.indexes.map((i) => (
            <tr key={i.name} className="border-t border-[var(--divider-soft)]">
              <td className="px-4 py-2 font-mono text-[11.5px] text-[var(--color-ink)]/85">{i.name}</td>
              <td className="px-4 py-2">
                <Pill tone={i.kind === 'primary' ? 'amber' : i.kind === 'unique' ? 'violet' : 'muted'}>
                  {i.kind === 'primary' ? 'PRIMARY' : i.kind === 'unique' ? 'UNIQUE' : 'INDEX'}
                </Pill>
              </td>
              <td className="px-4 py-2 font-mono text-[11.5px] text-[var(--color-ink)]/75">
                ({i.columns.join(', ')})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SqlTab({ projectId, env }: { projectId: string; env: DbEnv }) {
  const sql = useDbStore((s) => s.sqlByProject[projectId] ?? '')
  const setSql = useDbStore((s) => s.setSql)
  const runSql = useDbStore((s) => s.runSql)
  const result = useDbStore((s) => s.resultByProject[projectId] ?? null)
  const handleRun = () => runSql(projectId)
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-[var(--divider-soft)] bg-[var(--color-surface-1)]">
        <div className="flex items-center justify-between border-b border-[var(--divider-soft)] px-4 py-2.5">
          <h2 className="text-[13px] font-semibold text-[var(--color-ink)]">
            SQL 沙盒 · {env === 'dev' ? '开发' : '生产'}
          </h2>
          <button
            type="button"
            onClick={handleRun}
            className="flex h-7 items-center gap-1 rounded-md bg-[var(--color-ink)] px-2.5 text-[11.5px] font-medium text-[var(--color-ink-contrast)] transition-opacity hover:opacity-90"
          >
            <Play size={11} strokeWidth={2.2} />
            运行
          </button>
        </div>
        <textarea
          value={sql}
          onChange={(e) => setSql(projectId, e.target.value)}
          rows={5}
          spellCheck={false}
          placeholder="SELECT * FROM users WHERE openid = 'oXk1d-aB...zX' LIMIT 10;"
          className="thin-scroll w-full resize-y bg-transparent p-3 font-mono text-[12px] leading-[1.55] text-[var(--color-ink)] outline-none"
        />
      </div>
      {result && <SqlResultView result={result} />}
    </div>
  )
}

function SqlResultView({ result }: { result: SqlResult }) {
  if (!result.ok) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-[12px] text-rose-200">
        <div className="mb-1 font-medium">执行失败</div>
        <div>{result.error}</div>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-[var(--divider-soft)] bg-[var(--color-surface-1)]">
      <div className="flex items-baseline justify-between border-b border-[var(--divider-soft)] px-4 py-2.5">
        <span className="text-[12px] font-medium text-[var(--color-ink)]">查询结果 · {result.rows?.length ?? 0} 行</span>
        <span className="text-[10.5px] text-[var(--color-ink)]/45">
          {result.plan} · {result.elapsedMs} ms
        </span>
      </div>
      <div className="thin-scroll max-w-full overflow-x-auto">
        <table className="w-full table-auto text-left text-[11.5px]">
          <thead className="text-[10px] uppercase tracking-[0.05em] text-[var(--color-ink)]/45">
            <tr>
              {(result.columns ?? []).map((c) => (
                <th key={c} className="whitespace-nowrap px-3 py-2 font-normal">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(result.rows ?? []).map((r, i) => (
              <tr key={i} className="border-t border-[var(--divider-soft)] text-[var(--color-ink)]/85">
                {(result.columns ?? []).map((c) => (
                  <td
                    key={c}
                    className="max-w-[260px] truncate whitespace-nowrap px-3 py-2 font-mono text-[11px]"
                    title={String(r[c] ?? '')}
                  >
                    {r[c] === null || r[c] === undefined ? (
                      <span className="text-[var(--color-ink)]/35">NULL</span>
                    ) : (
                      String(r[c])
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {(result.rows ?? []).length === 0 && (
              <tr>
                <td colSpan={(result.columns ?? []).length || 1} className="px-3 py-12 text-center text-[11.5px] text-[var(--color-ink)]/45">
                  没有匹配的行
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Pill({
  tone,
  children,
}: {
  tone: 'amber' | 'violet' | 'muted'
  children: React.ReactNode
}) {
  const toneClass = {
    amber: 'bg-amber-500/15 text-amber-200',
    violet: 'bg-violet-500/15 text-violet-200',
    muted: 'bg-[var(--fill-medium)] text-[var(--color-ink)]/65',
  }[tone]
  return (
    <span className={`inline-flex h-[16px] items-center rounded px-1.5 text-[9.5px] font-mono ${toneClass}`}>
      {children}
    </span>
  )
}
