export const TASK_STATUS_VARIANTS: Record<string, any> = {
  pending: 'secondary',
  claimed: 'secondary',
  running: 'default',
  succeeded: 'success',
  failed: 'danger',
  interrupted: 'warning',
  cancel_requested: 'warning',
  cancelled: 'warning',
}

export const TERMINAL_TASK_STATUSES = new Set([
  'succeeded',
  'failed',
  'interrupted',
  'cancelled',
])

export function isTerminalTaskStatus(status: string) {
  return TERMINAL_TASK_STATUSES.has(status)
}

export function getTaskStatusText(status: string) {
  switch (status) {
    case 'succeeded':
      return 'Selesai'
    case 'failed':
      return 'Gagal'
    case 'interrupted':
      return 'Terputus'
    case 'cancelled':
      return 'Dibatalkan'
    case 'cancel_requested':
      return 'Sedang dibatalkan'
    case 'running':
      return 'Berjalan'
    case 'claimed':
      return 'Diambil'
    case 'pending':
      return 'Antrean'
    default:
      return status
  }
}
