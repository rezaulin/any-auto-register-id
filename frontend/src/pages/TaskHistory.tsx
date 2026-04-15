import { useEffect, useState } from 'react'
import { getPlatforms } from '@/lib/app-data'
import { apiFetch } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getTaskStatusText, TASK_STATUS_VARIANTS } from '@/lib/tasks'
import { RefreshCw, Activity, CheckCircle2, AlertTriangle, Clock3 } from 'lucide-react'

export default function TaskHistory() {
  const [tasks, setTasks] = useState<any[]>([])
  const [platform, setPlatform] = useState('')
  const [status, setStatus] = useState('')
  const [platforms, setPlatforms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: '1', page_size: '50' })
      if (platform) params.set('platform', platform)
      if (status) params.set('status', status)
      const data = await apiFetch(`/tasks?${params}`)
      setTasks(data.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getPlatforms().then(data => setPlatforms(data || [])).catch(() => setPlatforms([]))
  }, [])

  useEffect(() => { load() }, [platform, status])

  const succeeded = tasks.filter(task => task.status === 'succeeded').length
  const failed = tasks.filter(task => task.status === 'failed').length
  const running = tasks.filter(task => ['running', 'claimed', 'pending', 'cancel_requested'].includes(task.status)).length
  const metricCards = [
    { label: 'Tugas', value: tasks.length, icon: Activity, tone: 'text-[var(--accent)]' },
    { label: 'Berhasil', value: succeeded, icon: CheckCircle2, tone: 'text-emerald-400' },
    { label: 'Gagal', value: failed, icon: AlertTriangle, tone: 'text-red-400' },
    { label: 'Berjalan', value: running, icon: Clock3, tone: 'text-amber-400' },
  ]

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Riwayat Tugas</div>
            <Badge variant="default">Tugas {tasks.length}</Badge>
            <Badge variant="secondary">Berjalan {running}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</div>
                <div className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{value}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-[16px] border border-[var(--border-soft)] bg-[var(--chip-bg)]">
                <Icon className={`h-5 w-5 ${tone}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="bg-[var(--bg-pane)]/60">
        <div className="space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Filter</div>
            <div className="mt-1 text-sm font-medium text-[var(--text-primary)]">Lihat tugas berdasarkan platform dan status</div>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,220px)_1fr]">
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="control-surface appearance-none"
            >
              <option value="">Semua Platform</option>
              {platforms.map((item: any) => (
                <option key={item.name} value={item.name}>{item.display_name}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="control-surface appearance-none"
            >
              <option value="">Semua Status</option>
              <option value="pending">pending</option>
              <option value="claimed">claimed</option>
              <option value="running">running</option>
              <option value="succeeded">succeeded</option>
              <option value="failed">failed</option>
              <option value="interrupted">interrupted</option>
              <option value="cancel_requested">cancel_requested</option>
              <option value="cancelled">cancelled</option>
            </select>
            <div className="toolbar-strip justify-start md:justify-end">
              {platform ? <Badge variant="secondary">{platform}</Badge> : null}
              {status ? <Badge variant="warning">{status}</Badge> : null}
              {!platform && !status ? <Badge variant="secondary">Semua Tugas</Badge> : null}
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
          Tugas Terbaru
        </div>
        <div className="glass-table-wrap">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
              <th className="px-4 py-2.5 text-left">Waktu</th>
              <th className="px-4 py-2.5 text-left">Task ID</th>
              <th className="px-4 py-2.5 text-left">Platform</th>
              <th className="px-4 py-2.5 text-left">Status</th>
              <th className="px-4 py-2.5 text-left">Progres</th>
              <th className="px-4 py-2.5 text-left">Hasil</th>
              <th className="px-4 py-2.5 text-left">Kesalahan</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8">
                  <div className="empty-state-panel">Tidak ada catatan tugas untuk filter saat ini.</div>
                </td>
              </tr>
            )}
            {tasks.map(task => (
              <tr key={task.id} className="border-b border-[var(--border)]/40 hover:bg-[var(--bg-hover)]/70">
                <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">
                  {task.created_at ? new Date(task.created_at).toLocaleString('zh-CN', { hour12: false }) : '-'}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-[var(--text-secondary)]">{task.id}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="secondary">{task.platform || '-'}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={TASK_STATUS_VARIANTS[task.status] || 'secondary'}>
                    {getTaskStatusText(task.status)}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                  <span className="rounded-full border border-[var(--border-soft)] bg-[var(--chip-bg)] px-2.5 py-1 text-xs">
                    {task.progress || '-'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">
                  Berhasil {task.success || 0} / Gagal {task.error_count || 0}
                </td>
                <td className="px-4 py-2.5 text-xs">
                  <span className={task.error ? 'text-red-400' : 'text-[var(--text-muted)]'}>{task.error || '-'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  )
}
