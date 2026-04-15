import { useEffect, useState } from 'react'
import { getConfig, getConfigOptions, getPlatforms, invalidateConfigCache, invalidateConfigOptionsCache, invalidatePlatformsCache } from '@/lib/app-data'
import type { ChoiceOption, ConfigOptionsResponse, ProviderDriver, ProviderOption, ProviderSetting } from '@/lib/config-options'
import { getCaptchaStrategyLabel } from '@/lib/config-options'
import { apiFetch } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Save, Eye, EyeOff, Mail, Shield, Cpu, RefreshCw, CheckCircle, XCircle, Sliders, Plus, X, Orbit, Package2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type ProviderType = 'mailbox' | 'captcha'

function SettingsMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: any
}) {
  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-pane)]/58 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.16em] text-[var(--text-muted)]">{label}</div>
          <div className="mt-0.5 text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{value}</div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-[12px] border border-[var(--border-soft)] bg-[var(--chip-bg)] text-[var(--accent)]">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  )
}

function PlatformCapsTab() {
  const [platforms, setPlatforms] = useState<any[]>([])
  const [drafts, setDrafts] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  useEffect(() => {
    getPlatforms().then((list: any[]) => {
      setPlatforms(list)
      const init: Record<string, any> = {}
      list.forEach(p => {
        init[p.name] = {
          supported_executors: [...p.supported_executors],
          supported_identity_modes: [...p.supported_identity_modes],
          supported_oauth_providers: [...p.supported_oauth_providers],
        }
      })
      setDrafts(init)
    })
  }, [])

  const toggle = (name: string, field: string, value: string) => {
    setDrafts(d => {
      const arr: string[] = [...(d[name]?.[field] || [])]
      const idx = arr.indexOf(value)
      if (idx >= 0) arr.splice(idx, 1); else arr.push(value)
      return { ...d, [name]: { ...d[name], [field]: arr } }
    })
  }

  const save = async (name: string) => {
    setSaving(s => ({ ...s, [name]: true }))
    try {
      await apiFetch(`/platforms/${name}/capabilities`, { method: 'PUT', body: JSON.stringify(drafts[name]) })
      invalidatePlatformsCache()
      setSaved(s => ({ ...s, [name]: true }))
      setTimeout(() => setSaved(s => ({ ...s, [name]: false })), 2000)
    } finally { setSaving(s => ({ ...s, [name]: false })) }
  }

  const reset = async (name: string) => {
    await apiFetch(`/platforms/${name}/capabilities`, { method: 'DELETE' })
    invalidatePlatformsCache()
    const list = await getPlatforms({ force: true })
    const p = list.find((x: any) => x.name === name)
    if (p) setDrafts(d => ({
      ...d,
      [name]: {
        supported_executors: [...p.supported_executors],
        supported_identity_modes: [...p.supported_identity_modes],
        supported_oauth_providers: [...p.supported_oauth_providers],
      },
    }))
  }

  return (
    <div className="space-y-4">
      {platforms.map(p => {
        const draft = drafts[p.name] || {}
        const executors: string[] = draft.supported_executors || []
        const modes: string[] = draft.supported_identity_modes || []
        const oauths: string[] = draft.supported_oauth_providers || []
        const executorOptions: ChoiceOption[] = p.supported_executor_options || []
        const identityOptions: ChoiceOption[] = p.supported_identity_mode_options || []
        const oauthOptions: ChoiceOption[] = p.supported_oauth_provider_options || []
        return (
          <div key={p.name} className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-pane)]/56 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{p.display_name}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{p.name} v{p.version}</p>
              </div>
              <button onClick={() => reset(p.name)}
                className="table-action-btn">
                Reset Default
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-2">Metode Eksekusi</p>
                <div className="flex flex-wrap gap-4">
                  {executorOptions.map(option => (
                    <label key={option.value} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
                      <input type="checkbox" checked={executors.includes(option.value)}
                        onChange={() => toggle(p.name, 'supported_executors', option.value)}
                        className="checkbox-accent" />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-2">Identitas Registrasi</p>
                <div className="flex gap-4">
                  {identityOptions.map(option => (
                    <label key={option.value} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
                      <input type="checkbox" checked={modes.includes(option.value)}
                        onChange={() => toggle(p.name, 'supported_identity_modes', option.value)}
                        className="checkbox-accent" />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-2">Entri Pihak Ketiga</p>
                <div className="flex flex-wrap gap-4">
                  {oauthOptions.map(option => (
                    <label key={option.value} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
                      <input type="checkbox" checked={oauths.includes(option.value)}
                        onChange={() => toggle(p.name, 'supported_oauth_providers', option.value)}
                        className="checkbox-accent" />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button size="sm" onClick={() => save(p.name)} disabled={saving[p.name]}>
                <Save className="h-3.5 w-3.5 mr-1" />
                {saved[p.name] ? 'Tersimpan ✓' : saving[p.name] ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const TABS: { id: string; label: string; icon: any; sections?: any[] }[] = [
  {
    id: 'register', label: 'Strategi Registrasi', icon: Cpu,
    sections: [{
      section: 'DefaultStrategi Registrasi',
      desc: 'Konfigurasi perilaku default di sini, daftar akun dan halaman registrasi akan langsung menggunakan pengaturan ini.',
      items: [
        { key: 'default_identity_provider', label: 'DefaultIdentitas Registrasi' },
        { key: 'default_oauth_provider', label: 'DefaultEntri Pihak Ketiga', placeholder: '' },
        { key: 'default_executor', label: 'DefaultMetode Eksekusi' },
      ],
    }, {
      section: 'Reuse Browser',
      desc: 'Ketika akun pihak ketiga menggunakan browser latar belakang otomatis, biasanya perlu menggunakan browser yang sudah login di mesin lokal.',
      items: [
        { key: 'oauth_email_hint', label: 'Email Login yang Diharapkan', placeholder: 'your-account@example.com' },
        { key: 'chrome_user_data_dir', label: 'Path Chrome Profile', placeholder: '~/Library/Application Support/Google/Chrome' },
        { key: 'chrome_cdp_url', label: 'Alamat Chrome CDP', placeholder: 'http://localhost:9222' },
      ],
    }],
  },
  {
    id: 'mailbox', label: 'Layanan Email', icon: Mail,
    sections: [],
  },
  {
    id: 'captcha', label: 'Layanan Verifikasi', icon: Shield,
    sections: [],
  },
  {
    id: 'platform_caps', label: 'Lanjutan: Kemampuan Platform', icon: Sliders,
    sections: [],
  },
  {
    id: 'chatgpt', label: 'ChatGPT', icon: Shield,
    sections: [{
      section: 'Panel CPA',
      desc: 'Otomatis unggah ke platform manajemen CPA setelah registrasi selesai',
      items: [
        { key: 'cpa_api_url', label: 'API URL', placeholder: 'https://your-cpa.example.com' },
        { key: 'cpa_api_key', label: 'API Key', secret: true },
      ],
    }, {
      section: 'Team Manager',
      desc: 'Unggah ke sistem Team Manager self-hosted',
      items: [
        { key: 'team_manager_url', label: 'API URL', placeholder: 'https://your-tm.example.com' },
        { key: 'team_manager_key', label: 'API Key', secret: true },
      ],
    }],
  },
]

function Field({ field, form, setForm, showSecret, setShowSecret, selectOptions }: any) {
  const { key, label, placeholder, secret } = field
  const options = (field.options && field.options.length > 0)
    ? field.options
    : ((selectOptions && selectOptions.length > 0) ? selectOptions : null)
  return (
    <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5 last:border-0">
      <label className="text-sm text-[var(--text-secondary)] font-medium">{label}</label>
      <div className="col-span-2 relative">
        {options ? (
          <select
            value={form[key] || options[0].value}
            onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
            className="control-surface appearance-none"
          >
            {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <>
            <input
              type={secret && !showSecret[key] ? 'password' : 'text'}
              value={form[key] || ''}
              onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="control-surface pr-10"
            />
            {secret && (
              <button
                onClick={() => setShowSecret((s: any) => ({ ...s, [key]: !s[key] }))}
                className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                {showSecret[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ProviderField({ field, value, onChange, showSecret, setShowSecret, secretKey, disabled = false }: any) {
  const { label, placeholder, secret } = field
  return (
    <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5 last:border-0">
      <label className="text-sm text-[var(--text-secondary)] font-medium">{label}</label>
      <div className="col-span-2 relative">
        <input
          type={secret && !showSecret[secretKey] ? 'password' : 'text'}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="control-surface pr-10 disabled:opacity-70"
        />
        {secret && (
          <button
            onClick={() => setShowSecret((s: any) => ({ ...s, [secretKey]: !s[secretKey] }))}
            disabled={disabled}
            className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            {showSecret[secretKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

function ProviderDetailModal({
  title,
  item,
  readOnly,
  saving,
  saved,
  showSecret,
  setShowSecret,
  onClose,
  onEdit,
  onChangeName,
  onChangeAuthMode,
  onChangeField,
  onSave,
}: any) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-panel dialog-panel-md overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.display_name || item.catalog_label} · {item.provider_key}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-hover)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
              {item.auth_modes.find((mode: any) => mode.value === item.auth_mode)?.label || item.auth_mode || 'Autentikasi belum diatur'}
            </span>
            {item.is_default ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">Provider Default</span>
            ) : null}
          </div>
          {item.description ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] px-3 py-2 text-xs text-[var(--text-secondary)]">
              {item.description}
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5">
            <label className="text-sm text-[var(--text-secondary)] font-medium">Nama Konfigurasi</label>
            <div className="col-span-2">
              <input
                type="text"
                value={item.display_name || ''}
                onChange={e => onChangeName(e.target.value)}
                disabled={readOnly}
                placeholder={item.catalog_label}
                className="control-surface disabled:opacity-70"
              />
            </div>
          </div>
          {item.auth_modes?.length > 0 && (
            <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5">
              <label className="text-sm text-[var(--text-secondary)] font-medium">Metode Autentikasi</label>
              <div className="col-span-2">
                <select
                  value={item.auth_mode}
                  onChange={e => onChangeAuthMode(e.target.value)}
                  disabled={readOnly}
                  className="control-surface appearance-none disabled:opacity-70"
                >
                  {item.auth_modes.map((mode: any) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                </select>
              </div>
            </div>
          )}
          {item.fields.length === 0 ? (
            <div className="text-sm text-[var(--text-muted)] py-3">Provider ini saat ini tidak memerlukan konfigurasi tambahan.</div>
          ) : item.fields.map((field: any) => (
            <ProviderField
              key={field.key}
              field={field}
              value={field.category === 'auth' ? item.auth?.[field.key] : item.config?.[field.key]}
              onChange={(value: string) => onChangeField(field, value)}
              showSecret={showSecret}
              setShowSecret={setShowSecret}
              secretKey={`${item.provider_key}:${field.key}`}
              disabled={readOnly}
            />
          ))}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-[var(--border)]">
          {readOnly ? (
            <>
              <Button onClick={onEdit} className="flex-1">Beralih ke Edit</Button>
              <Button variant="outline" onClick={onClose} className="flex-1">Tutup</Button>
            </>
          ) : (
            <>
              <Button onClick={onSave} disabled={saving} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {saved ? 'Tersimpan ✓' : saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">Batal</Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AddProviderModal({
  title,
  providerType,
  providers,
  selectedKey,
  creating,
  onSelect,
  onClose,
  onCreate,
}: any) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-panel dialog-panel-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{providerType === 'mailbox' ? 'Pilih dari katalog provider email' : 'Pilih dari katalog provider verifikasi'}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-4">
          {providers.length === 0 ? (
            <div className="empty-state-panel">
              Semua provider yang bisa ditambahkan sudah ada dalam daftar.
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm text-[var(--text-secondary)]">Pilih Provider</label>
              <select
                value={selectedKey}
                onChange={e => onSelect(e.target.value)}
                className="control-surface appearance-none"
              >
                {providers.map((provider: ProviderOption) => (
                  <option key={provider.value} value={provider.value}>{provider.label}</option>
                ))}
              </select>
              {providers.find((provider: ProviderOption) => provider.value === selectedKey)?.description ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                  {providers.find((provider: ProviderOption) => provider.value === selectedKey)?.description}
                </div>
              ) : null}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-[var(--border)]">
          <Button
            onClick={() => onCreate(selectedKey)}
            disabled={providers.length === 0 || !selectedKey || creating}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            {creating ? 'Menambahkan...' : 'Tambah'}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">Batal</Button>
        </div>
      </div>
    </div>
  )
}

function CreateProviderDefinitionModal({
  title,
  providerType,
  drivers,
  form,
  creating,
  showSecret,
  setShowSecret,
  onChange,
  onClose,
  onCreate,
}: any) {
  const currentDriver = drivers.find((item: ProviderDriver) => item.driver_type === form.driver_type) || null
  const currentAuthModes = currentDriver?.auth_modes || []
  const currentFields = currentDriver?.fields || []

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-panel dialog-panel-md overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Tambahkan definisi provider dinamis baru dan buat konfigurasi pertama yang tersedia.</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5">
            <label className="text-sm text-[var(--text-secondary)] font-medium">Nama Provider</label>
            <div className="col-span-2">
              <input value={form.label} onChange={e => onChange('label', e.target.value)} placeholder="My Mail Provider" className="control-surface" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5">
            <label className="text-sm text-[var(--text-secondary)] font-medium">Provider Key</label>
            <div className="col-span-2">
              <input value={form.provider_key} onChange={e => onChange('provider_key', e.target.value)} placeholder="my_mail_provider" className="control-surface" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5">
            <label className="text-sm text-[var(--text-secondary)] font-medium">Deskripsi</label>
            <div className="col-span-2">
              <input value={form.description} onChange={e => onChange('description', e.target.value)} placeholder="Opsional" className="control-surface" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5">
            <label className="text-sm text-[var(--text-secondary)] font-medium">Driver</label>
            <div className="col-span-2">
              <select value={form.driver_type} onChange={e => onChange('driver_type', e.target.value)} className="control-surface appearance-none">
                {drivers.map((driver: ProviderDriver) => (
                  <option key={driver.driver_type} value={driver.driver_type}>{driver.label}</option>
                ))}
              </select>
              {currentDriver?.description ? <p className="mt-2 text-xs text-[var(--text-muted)]">{currentDriver.description}</p> : null}
            </div>
          </div>
          {currentAuthModes.length > 0 && (
            <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5">
              <label className="text-sm text-[var(--text-secondary)] font-medium">Metode Autentikasi</label>
              <div className="col-span-2">
                <select value={form.auth_mode} onChange={e => onChange('auth_mode', e.target.value)} className="control-surface appearance-none">
                  {currentAuthModes.map((mode: any) => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {currentFields.length === 0 ? (
            <div className="text-sm text-[var(--text-muted)] py-3">Driver ini saat ini tidak memerlukan bidang konfigurasi tambahan.</div>
          ) : currentFields.map((field: any) => (
            <ProviderField
              key={field.key}
              field={field}
              value={field.category === 'auth' ? form.auth[field.key] : form.config[field.key]}
              onChange={(value: string) => {
                if (field.category === 'auth') {
                  onChange('auth', { ...form.auth, [field.key]: value })
                } else {
                  onChange('config', { ...form.config, [field.key]: value })
                }
              }}
              showSecret={showSecret}
              setShowSecret={setShowSecret}
              secretKey={`create:${providerType}:${field.key}`}
            />
          ))}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-[var(--border)]">
          <Button onClick={onCreate} disabled={creating} className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            {creating ? 'Membuat...' : 'Buat dan Aktifkan'}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">Batal</Button>
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('register')
  const [form, setForm] = useState<Record<string, string>>({})
  const [configOptions, setConfigOptions] = useState<ConfigOptionsResponse>({
    mailbox_providers: [],
    captcha_providers: [],
    mailbox_drivers: [],
    captcha_drivers: [],
    captcha_policy: {},
    executor_options: [],
    identity_mode_options: [],
    oauth_provider_options: [],
  })
  const [providerSettings, setProviderSettings] = useState<{ mailbox: ProviderSetting[]; captcha: ProviderSetting[] }>({ mailbox: [], captcha: [] })
  const [newProviderKey, setNewProviderKey] = useState<{ mailbox: string; captcha: string }>({ mailbox: '', captcha: '' })
  const [providerDialog, setProviderDialog] = useState<{ providerType: ProviderType | null; providerKey: string; readOnly: boolean }>({ providerType: null, providerKey: '', readOnly: false })
  const [providerAddDialog, setProviderAddDialog] = useState<ProviderType | null>(null)
  const [providerCreateDialog, setProviderCreateDialog] = useState<ProviderType | null>(null)
  const [providerDefinitionCreating, setProviderDefinitionCreating] = useState<Record<string, boolean>>({})
  const [providerDefinitionForm, setProviderDefinitionForm] = useState<Record<ProviderType, any>>({
    mailbox: { provider_key: '', label: '', description: '', driver_type: '', auth_mode: '', config: {}, auth: {} },
    captcha: { provider_key: '', label: '', description: '', driver_type: '', auth_mode: '', config: {}, auth: {} },
  })
  const [optionsError, setOptionsError] = useState('')
  const [providerNotice, setProviderNotice] = useState<{ mailbox: string; captcha: string }>({ mailbox: '', captcha: '' })
  const [providerError, setProviderError] = useState<{ mailbox: string; captcha: string }>({ mailbox: '', captcha: '' })
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [providerSaving, setProviderSaving] = useState<Record<string, boolean>>({})
  const [providerSaved, setProviderSaved] = useState<Record<string, boolean>>({})
  const [providerDeleting, setProviderDeleting] = useState<Record<string, boolean>>({})
  const [providerCreating, setProviderCreating] = useState<Record<string, boolean>>({})
  const [solverRunning, setSolverRunning] = useState<boolean | null>(null)

  const loadConfigData = async () => {
    const [cfg, options] = await Promise.all([
      getConfig().catch(() => ({})),
      getConfigOptions().catch(() => null),
    ])
    setForm(cfg)
    if (options) {
      setConfigOptions(options)
      const nextMailbox = options.mailbox_settings || []
      const nextCaptcha = options.captcha_settings || []
      setProviderSettings({
        mailbox: nextMailbox,
        captcha: nextCaptcha,
      })
      setOptionsError('')
    } else {
      setConfigOptions({
        mailbox_providers: [],
        captcha_providers: [],
        mailbox_drivers: [],
        captcha_drivers: [],
        captcha_policy: {},
        executor_options: [],
        identity_mode_options: [],
        oauth_provider_options: [],
      })
      setProviderSettings({ mailbox: [], captcha: [] })
      setOptionsError('Gagal memuat metadata provider. Silakan restart backend dan segarkan halaman.')
    }
  }

  useEffect(() => {
    loadConfigData()
  }, [])

  const checkSolver = async () => {
    try { const d = await apiFetch('/solver/status'); setSolverRunning(d.running) }
    catch { setSolverRunning(false) }
  }
  const restartSolver = async () => {
    await apiFetch('/solver/restart', { method: 'POST' })
    setSolverRunning(null)
    setTimeout(checkSolver, 4000)
  }
  useEffect(() => { checkSolver() }, [])

  const save = async () => {
    setSaving(true)
    try {
      await apiFetch('/config', { method: 'PUT', body: JSON.stringify({ data: form }) })
      invalidateConfigCache()
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  const tab = TABS.find(t => t.id === activeTab) ?? TABS[0]
  const sections = tab.sections ?? []
  const getSelectOptions = (key: string) => {
    if (key === 'default_executor') return configOptions.executor_options || []
    if (key === 'default_identity_provider') return configOptions.identity_mode_options || []
    if (key === 'default_oauth_provider') {
      return [
        { label: 'Tidak dipilih sebelumnya, pilih dari halaman saat ini', value: '' },
        ...((configOptions.oauth_provider_options || []).filter(option => option.value !== '')),
      ]
    }
    return []
  }
  const mailboxCatalog = configOptions.mailbox_providers || []
  const captchaCatalog = configOptions.captcha_providers || []
  const mailboxDrivers = configOptions.mailbox_drivers || []
  const captchaDrivers = configOptions.captcha_drivers || []
  const unusedMailboxProviders = mailboxCatalog.filter(item => !providerSettings.mailbox.some(setting => setting.provider_key === item.value))
  const unusedCaptchaProviders = captchaCatalog.filter(item => !providerSettings.captcha.some(setting => setting.provider_key === item.value))

  useEffect(() => {
    setNewProviderKey(current => {
      const nextMailbox = unusedMailboxProviders.some(item => item.value === current.mailbox) ? current.mailbox : (unusedMailboxProviders[0]?.value || '')
      const nextCaptcha = unusedCaptchaProviders.some(item => item.value === current.captcha) ? current.captcha : (unusedCaptchaProviders[0]?.value || '')
      if (current.mailbox === nextMailbox && current.captcha === nextCaptcha) {
        return current
      }
      return {
        mailbox: nextMailbox,
        captcha: nextCaptcha,
      }
    })
  }, [mailboxCatalog, captchaCatalog, providerSettings.mailbox, providerSettings.captcha])

  useEffect(() => {
    setProviderDefinitionForm(current => {
      const next = { ...current }
      const mailboxDriver = mailboxDrivers.find(item => item.driver_type === current.mailbox.driver_type) || mailboxDrivers[0] || null
      const captchaDriver = captchaDrivers.find(item => item.driver_type === current.captcha.driver_type) || captchaDrivers[0] || null
      next.mailbox = {
        ...next.mailbox,
        driver_type: mailboxDriver?.driver_type || '',
        auth_mode: mailboxDriver?.auth_modes?.some(mode => mode.value === next.mailbox.auth_mode)
          ? next.mailbox.auth_mode
          : (mailboxDriver?.default_auth_mode || mailboxDriver?.auth_modes?.[0]?.value || ''),
      }
      next.captcha = {
        ...next.captcha,
        driver_type: captchaDriver?.driver_type || '',
        auth_mode: captchaDriver?.auth_modes?.some(mode => mode.value === next.captcha.auth_mode)
          ? next.captcha.auth_mode
          : (captchaDriver?.default_auth_mode || captchaDriver?.auth_modes?.[0]?.value || ''),
      }
      return next
    })
  }, [mailboxDrivers, captchaDrivers])

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
      return error.message
    }
    return fallback
  }

  const updateProviderDefinitionForm = (providerType: ProviderType, key: string, value: any) => {
    setProviderDefinitionForm(current => {
      const next = {
        ...current,
        [providerType]: {
          ...current[providerType],
          [key]: value,
        },
      }
      if (key === 'driver_type') {
        const drivers = providerType === 'mailbox' ? mailboxDrivers : captchaDrivers
        const driver = drivers.find(item => item.driver_type === value) || null
        next[providerType].auth_mode = driver?.default_auth_mode || driver?.auth_modes?.[0]?.value || ''
        next[providerType].config = {}
        next[providerType].auth = {}
      }
      return next
    })
  }

  const updateProviderSetting = (providerType: ProviderType, providerKey: string, updater: (item: ProviderSetting) => ProviderSetting) => {
    setProviderSettings(current => ({
      ...current,
      [providerType]: current[providerType].map(item => item.provider_key === providerKey ? updater(item) : item),
    }))
  }

  const updateProviderSettingField = (providerType: ProviderType, providerKey: string, field: any, value: string) => {
    updateProviderSetting(providerType, providerKey, item => {
      if (field.category === 'auth') {
        return { ...item, auth: { ...item.auth, [field.key]: value } }
      }
      return { ...item, config: { ...item.config, [field.key]: value } }
    })
  }

  const markProviderDefault = (providerType: ProviderType, providerKey: string) => {
    setProviderSettings(current => ({
      ...current,
      [providerType]: current[providerType].map(item => ({
        ...item,
        is_default: item.provider_key === providerKey,
      })),
    }))
  }

  const persistProviderDefault = async (providerType: ProviderType, item: ProviderSetting) => {
    markProviderDefault(providerType, item.provider_key)
    await saveProviderSetting(providerType, {
      ...item,
      is_default: true,
    })
  }

  const saveProviderSetting = async (providerType: ProviderType, item: ProviderSetting) => {
    const stateKey = `${providerType}:${item.provider_key}`
    setProviderSaving(current => ({ ...current, [stateKey]: true }))
    setProviderError(current => ({ ...current, [providerType]: '' }))
    try {
      await apiFetch('/provider-settings', {
        method: 'PUT',
        body: JSON.stringify({
          id: item.id || undefined,
          provider_type: providerType,
          provider_key: item.provider_key,
          display_name: item.display_name,
          auth_mode: item.auth_mode,
          enabled: item.enabled,
          is_default: item.is_default,
          config: item.config,
          auth: item.auth,
          metadata: item.metadata || {},
        }),
      })
      invalidateConfigOptionsCache()
      invalidateConfigCache()
      await loadConfigData()
      setProviderNotice(current => ({ ...current, [providerType]: `Tersimpan ${item.catalog_label || item.provider_key} konfigurasi` }))
      setProviderSaved(current => ({ ...current, [stateKey]: true }))
      setTimeout(() => setProviderSaved(current => ({ ...current, [stateKey]: false })), 2000)
    } catch (error) {
      setProviderError(current => ({ ...current, [providerType]: getErrorMessage(error, 'Gagal menyimpan konfigurasi provider') }))
    } finally {
      setProviderSaving(current => ({ ...current, [stateKey]: false }))
    }
  }

  const createProviderSetting = async (providerType: ProviderType, providerKey: string) => {
    if (!providerKey) return
    const catalog = (providerType === 'mailbox' ? mailboxCatalog : captchaCatalog).find(item => item.value === providerKey)
    if (!catalog) return
    const existing = providerSettings[providerType].some(item => item.provider_key === providerKey)
    if (existing) {
      setProviderDialog({ providerType, providerKey, readOnly: false })
      return
    }
    const stateKey = `${providerType}:${providerKey}`
    setProviderCreating(current => ({ ...current, [stateKey]: true }))
    setProviderError(current => ({ ...current, [providerType]: '' }))
    try {
      await apiFetch('/provider-settings', {
        method: 'POST',
        body: JSON.stringify({
          provider_type: providerType,
          provider_key: providerKey,
          display_name: catalog.label,
          auth_mode: catalog.default_auth_mode || catalog.auth_modes?.[0]?.value || '',
          enabled: true,
          is_default: providerSettings[providerType].length === 0,
          config: {},
          auth: {},
          metadata: {},
        }),
      })
      invalidateConfigOptionsCache()
      await loadConfigData()
      setProviderNotice(current => ({ ...current, [providerType]: `Berhasil menambahkan ${catalog.label}` }))
      setProviderAddDialog(null)
    } catch (error) {
      setProviderError(current => ({ ...current, [providerType]: getErrorMessage(error, 'Gagal menambah provider') }))
    } finally {
      setProviderCreating(current => ({ ...current, [stateKey]: false }))
    }
  }

  const createProviderDefinitionAndSetting = async (providerType: ProviderType) => {
    const payload = providerDefinitionForm[providerType]
    const driverList = providerType === 'mailbox' ? mailboxDrivers : captchaDrivers
    const driver = driverList.find(item => item.driver_type === payload.driver_type) || null
    const definitionKey = `${providerType}:${payload.provider_key || 'new'}`
    if (!payload.provider_key || !payload.label || !payload.driver_type) {
      setProviderError(current => ({ ...current, [providerType]: 'Silakan isi Nama Provider, Key, dan Driver terlebih dahulu' }))
      return
    }
    setProviderDefinitionCreating(current => ({ ...current, [definitionKey]: true }))
    setProviderError(current => ({ ...current, [providerType]: '' }))
    try {
      await apiFetch('/provider-definitions', {
        method: 'POST',
        body: JSON.stringify({
          provider_type: providerType,
          provider_key: payload.provider_key,
          label: payload.label,
          description: payload.description || '',
          driver_type: payload.driver_type,
          enabled: true,
          default_auth_mode: payload.auth_mode || driver?.default_auth_mode || '',
          metadata: {},
        }),
      })
      await apiFetch('/provider-settings', {
        method: 'POST',
        body: JSON.stringify({
          provider_type: providerType,
          provider_key: payload.provider_key,
          display_name: payload.label,
          auth_mode: payload.auth_mode || driver?.default_auth_mode || '',
          enabled: true,
          is_default: providerSettings[providerType].length === 0,
          config: payload.config || {},
          auth: payload.auth || {},
          metadata: {},
        }),
      })
      invalidateConfigOptionsCache()
      await loadConfigData()
      setProviderNotice(current => ({ ...current, [providerType]: `Berhasil membuat provider dinamis ${payload.label}` }))
      setProviderCreateDialog(null)
      setProviderDefinitionForm(current => ({
        ...current,
        [providerType]: {
          provider_key: '',
          label: '',
          description: '',
          driver_type: driver?.driver_type || '',
          auth_mode: driver?.default_auth_mode || driver?.auth_modes?.[0]?.value || '',
          config: {},
          auth: {},
        },
      }))
    } catch (error) {
      setProviderError(current => ({ ...current, [providerType]: getErrorMessage(error, 'Gagal membuat provider dinamis') }))
    } finally {
      setProviderDefinitionCreating(current => ({ ...current, [definitionKey]: false }))
    }
  }

  const deleteProviderSetting = async (providerType: ProviderType, item: ProviderSetting) => {
    const stateKey = `${providerType}:${item.provider_key}`
    setProviderDeleting(current => ({ ...current, [stateKey]: true }))
    setProviderError(current => ({ ...current, [providerType]: '' }))
    try {
      await apiFetch(`/provider-settings/${item.id}`, { method: 'DELETE' })
      invalidateConfigOptionsCache()
      await loadConfigData()
      setProviderNotice(current => ({ ...current, [providerType]: `Berhasil menghapus ${item.catalog_label || item.provider_key}` }))
    } catch (error) {
      setProviderError(current => ({ ...current, [providerType]: getErrorMessage(error, 'Gagal menghapus provider') }))
    } finally {
      setProviderDeleting(current => ({ ...current, [stateKey]: false }))
    }
  }

  const dialogItem = providerDialog.providerType
    ? providerSettings[providerDialog.providerType].find(item => item.provider_key === providerDialog.providerKey) || null
    : null
  const openProviderDialog = (providerType: ProviderType, providerKey: string, readOnly: boolean) => {
    setProviderDialog({ providerType, providerKey, readOnly })
  }

  const mailboxCount = providerSettings.mailbox.length
  const captchaCount = providerSettings.captcha.length
  const solverLabel = solverRunning === null ? 'Memeriksa' : solverRunning ? 'Berjalan' : 'Tidak Berjalan'
  const currentTabMeta = TABS.find(item => item.id === activeTab) ?? TABS[0]

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Konfigurasi</div>
            <Badge variant="default">{currentTabMeta.label}</Badge>
            <Badge variant={solverRunning ? 'success' : solverRunning === false ? 'danger' : 'secondary'}>{solverLabel}</Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SettingsMetric label="Layanan Email" value={mailboxCount} icon={Mail} />
        <SettingsMetric label="Layanan CAPTCHA" value={captchaCount} icon={Shield} />
        <SettingsMetric label="Solver" value={solverLabel} icon={Orbit} />
        <SettingsMetric label="Modul" value={TABS.length} icon={Package2} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="h-fit bg-[var(--bg-pane)]/60 xl:sticky xl:top-4">
          <div className="space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Modul</div>
              <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">Pilih panel kontrol yang akan dioperasikan</div>
            </div>
            <div className="space-y-1.5">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'w-full rounded-2xl border px-3 py-3 text-left transition-colors',
                    activeTab === id
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                      : 'border-transparent text-[var(--text-muted)] hover:border-[var(--border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('h-4 w-4', activeTab === id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--chip-bg)] p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                <Sparkles className="h-3.5 w-3.5" />
                Solver
              </div>
              <div className="mt-3 flex items-center gap-2">
                {solverRunning === null
                  ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-[var(--text-muted)]" />
                  : solverRunning
                    ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                <span className={cn('text-sm font-medium', solverRunning ? 'text-emerald-400' : 'text-[var(--text-secondary)]')}>
                  {solverLabel}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={restartSolver} className="mt-4 w-full">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Restart Solver
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {activeTab === 'platform_caps' ? (
            <PlatformCapsTab />
          ) : (
            <>
              {activeTab === 'register' && (
                <div className="rounded-[22px] border border-[var(--accent-edge)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  Pengguna biasa hanya perlu memahami dua hal: identitas registrasi memilih "Email Sistem" atau "Akun Pihak Ketiga", metode eksekusi memilih "Mode Protokol / Browser Latar Belakang Otomatis / Browser Visual Otomatis". Konfigurasi di sini hanya mengatur nilai default.
                </div>
              )}
              {activeTab === 'mailbox' && (
                <>
                  {optionsError && (
                    <div className="rounded-[22px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {optionsError}
                    </div>
                  )}
                  {providerError.mailbox && (
                    <div className="rounded-[22px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {providerError.mailbox}
                    </div>
                  )}
                  {providerNotice.mailbox && !providerError.mailbox && (
                    <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      {providerNotice.mailbox}
                    </div>
                  )}
                  <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
                    Konfigurasi layanan email di sini hanya digunakan ketika identitas registrasi memilih "Email Sistem". Anda bisa langsung melihat detail, mengedit, mengatur default, dan menghapus dari baris daftar.
                  </div>
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-pane)]/56 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Daftar Provider Email</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{providerSettings.mailbox.length}  konfigurasi, mendukung lihat detail, edit, atur default, hapus.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {unusedMailboxProviders.length === 0 ? (
                          <span className="text-xs text-[var(--text-muted)]">Tidak ada provider email yang bisa ditambahkan</span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">Masih ada {unusedMailboxProviders.length} provider email yang bisa ditambahkan</span>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setProviderCreateDialog('mailbox')}>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Buat Provider Dinamis
                        </Button>
                        <Button size="sm" onClick={() => setProviderAddDialog('mailbox')}>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Tambah Provider
                        </Button>
                      </div>
                    </div>
                    {providerSettings.mailbox.length === 0 ? (
                      <div className="empty-state-panel">
                        Tidak ada konfigurasi provider email, silakan tambahkan provider terlebih dahulu.
                      </div>
                    ) : (
                      <div className="glass-table-wrap rounded-xl border border-[var(--border)]">
                        <table className="w-full min-w-[980px] text-sm">
                          <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)] text-xs text-[var(--text-muted)]">
                              <th className="px-4 py-3 text-left">Nama</th>
                              <th className="px-4 py-3 text-left">Provider Key</th>
                              <th className="px-4 py-3 text-left">Metode Autentikasi</th>
                              <th className="px-4 py-3 text-left">Default</th>
                              <th className="px-4 py-3 text-left">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {providerSettings.mailbox.map(provider => {
                              const stateKey = `mailbox:${provider.provider_key}`
                              return (
                                <tr key={provider.provider_key} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-hover)]/60 transition-colors">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="font-medium text-[var(--text-primary)]">{provider.display_name || provider.catalog_label}</span>
                                    {provider.display_name && provider.display_name !== provider.catalog_label ? (
                                      <span className="ml-2 text-[11px] text-[var(--text-muted)]">({provider.catalog_label})</span>
                                    ) : null}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[var(--text-secondary)]">{provider.provider_key}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[var(--text-secondary)]">{provider.auth_modes.find(mode => mode.value === provider.auth_mode)?.label || provider.auth_mode || '-'}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {provider.is_default ? <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">Default</span> : <span className="text-[var(--text-muted)]">-</span>}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => openProviderDialog('mailbox', provider.provider_key, true)} className="table-action-btn">Detail</button>
                                      <button onClick={() => openProviderDialog('mailbox', provider.provider_key, false)} className="table-action-btn">Edit</button>
                                      <button onClick={() => persistProviderDefault('mailbox', provider)} className="table-action-btn">
                                        {provider.is_default ? 'Default Saat Ini' : 'Atur Default'}
                                      </button>
                                      <button
                                        onClick={() => deleteProviderSetting('mailbox', provider)}
                                        disabled={providerDeleting[stateKey]}
                                        className="table-action-btn table-action-btn-danger"
                                      >
                                        {providerDeleting[stateKey] ? 'Menghapus...' : 'Hapus'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
              {activeTab === 'captcha' && (
                <>
                  {optionsError && (
                    <div className="rounded-[22px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {optionsError}
                    </div>
                  )}
                  {providerError.captcha && (
                    <div className="rounded-[22px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {providerError.captcha}
                    </div>
                  )}
                  {providerNotice.captcha && !providerError.captcha && (
                    <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      {providerNotice.captcha}
                    </div>
                  )}
                  <div className="rounded-[22px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
                    Mode protokol akan otomatis memilih layanan decoding remote berdasarkan urutan yang diaktifkan; mode browser menggunakan provider CAPTCHA default saat ini. Anda bisa langsung melihat detail, edit, atur default, hapus dari baris.
                  </div>
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-pane)]/56 p-5">
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Strategi Saat Ini</h3>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">{getCaptchaStrategyLabel('protocol', configOptions.captcha_policy, configOptions.captcha_providers)}</div>
                    <div className="text-sm text-[var(--text-secondary)] mt-2">{getCaptchaStrategyLabel('headless', configOptions.captcha_policy, configOptions.captcha_providers)}</div>
                  </div>
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-pane)]/56 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Daftar Provider Verifikasi</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{providerSettings.captcha.length}  konfigurasi, mode protokol akan membaca item yang tersedia di sini secara berurutan.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {unusedCaptchaProviders.length === 0 ? (
                          <span className="text-xs text-[var(--text-muted)]">Tidak ada provider verifikasi yang bisa ditambahkan</span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">Masih ada {unusedCaptchaProviders.length} provider verifikasi yang bisa ditambahkan</span>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setProviderCreateDialog('captcha')}>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Buat Provider Dinamis
                        </Button>
                        <Button size="sm" onClick={() => setProviderAddDialog('captcha')}>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Tambah Provider
                        </Button>
                      </div>
                    </div>
                    {providerSettings.captcha.length === 0 ? (
                      <div className="empty-state-panel">
                        Tidak ada konfigurasi provider verifikasi, silakan tambahkan provider terlebih dahulu.
                      </div>
                    ) : (
                      <div className="glass-table-wrap rounded-xl border border-[var(--border)]">
                        <table className="w-full min-w-[980px] text-sm">
                          <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)] text-xs text-[var(--text-muted)]">
                              <th className="px-4 py-3 text-left">Nama</th>
                              <th className="px-4 py-3 text-left">Provider Key</th>
                              <th className="px-4 py-3 text-left">Metode Autentikasi</th>
                              <th className="px-4 py-3 text-left">Default</th>
                              <th className="px-4 py-3 text-left">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {providerSettings.captcha.map(provider => {
                              const stateKey = `captcha:${provider.provider_key}`
                              return (
                                <tr key={provider.provider_key} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-hover)]/60 transition-colors">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="font-medium text-[var(--text-primary)]">{provider.display_name || provider.catalog_label}</span>
                                    {provider.display_name && provider.display_name !== provider.catalog_label ? (
                                      <span className="ml-2 text-[11px] text-[var(--text-muted)]">({provider.catalog_label})</span>
                                    ) : null}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[var(--text-secondary)]">{provider.provider_key}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[var(--text-secondary)]">{provider.auth_modes.find(mode => mode.value === provider.auth_mode)?.label || provider.auth_mode || '-'}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {provider.is_default ? <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">Default</span> : <span className="text-[var(--text-muted)]">-</span>}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => openProviderDialog('captcha', provider.provider_key, true)} className="table-action-btn">Detail</button>
                                      <button onClick={() => openProviderDialog('captcha', provider.provider_key, false)} className="table-action-btn">Edit</button>
                                      <button onClick={() => persistProviderDefault('captcha', provider)} className="table-action-btn">
                                        {provider.is_default ? 'Default Saat Ini' : 'Atur Default'}
                                      </button>
                                      <button
                                        onClick={() => deleteProviderSetting('captcha', provider)}
                                        disabled={providerDeleting[stateKey]}
                                        className="table-action-btn table-action-btn-danger"
                                      >
                                        {providerDeleting[stateKey] ? 'Menghapus...' : 'Hapus'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
              {activeTab !== 'mailbox' && activeTab !== 'captcha' && sections.map(({ section, desc, items }) => (
                <div key={section} className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-pane)]/56 p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{section}</h3>
                    {desc && <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>}
                  </div>
                  {items.map((field: any) => (
                    <Field key={field.key} field={field} form={form} setForm={setForm}
                      showSecret={showSecret} setShowSecret={setShowSecret}
                      selectOptions={getSelectOptions(field.key)} />
                  ))}
                </div>
              ))}
              {activeTab !== 'mailbox' && activeTab !== 'captcha' && (
                <Button onClick={save} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saved ? 'Tersimpan ✓' : saving ? 'Menyimpan...' : 'SimpanKonfigurasi'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      {providerDialog.providerType && dialogItem && (
        <ProviderDetailModal
          title={providerDialog.providerType === 'mailbox' ? 'Detail Provider Email' : 'Detail Provider Verifikasi'}
          item={dialogItem}
          readOnly={providerDialog.readOnly}
          saving={providerSaving[`${providerDialog.providerType}:${dialogItem.provider_key}`]}
          saved={providerSaved[`${providerDialog.providerType}:${dialogItem.provider_key}`]}
          showSecret={showSecret}
          setShowSecret={setShowSecret}
          onClose={() => setProviderDialog({ providerType: null, providerKey: '', readOnly: false })}
          onEdit={() => setProviderDialog(current => ({ ...current, readOnly: false }))}
          onChangeName={(value: string) => updateProviderSetting(providerDialog.providerType as ProviderType, dialogItem.provider_key, item => ({ ...item, display_name: value }))}
          onChangeAuthMode={(value: string) => updateProviderSetting(providerDialog.providerType as ProviderType, dialogItem.provider_key, item => ({ ...item, auth_mode: value }))}
          onChangeField={(field: any, value: string) => updateProviderSettingField(providerDialog.providerType as ProviderType, dialogItem.provider_key, field, value)}
          onSave={() => saveProviderSetting(providerDialog.providerType as ProviderType, dialogItem)}
        />
      )}
      {providerAddDialog && (
        <AddProviderModal
          title={providerAddDialog === 'mailbox' ? 'Tambah Provider Email' : 'Tambah Provider Verifikasi'}
          providerType={providerAddDialog}
          providers={providerAddDialog === 'mailbox' ? unusedMailboxProviders : unusedCaptchaProviders}
          selectedKey={newProviderKey[providerAddDialog]}
          creating={Boolean(newProviderKey[providerAddDialog] && providerCreating[`${providerAddDialog}:${newProviderKey[providerAddDialog]}`])}
          onSelect={(value: string) => setNewProviderKey(current => ({ ...current, [providerAddDialog]: value }))}
          onClose={() => setProviderAddDialog(null)}
          onCreate={(providerKey: string) => createProviderSetting(providerAddDialog, providerKey)}
        />
      )}
      {providerCreateDialog && (
        <CreateProviderDefinitionModal
          title={providerCreateDialog === 'mailbox' ? 'Buat Provider Email Dinamis' : 'Buat Provider Verifikasi Dinamis'}
          providerType={providerCreateDialog}
          drivers={providerCreateDialog === 'mailbox' ? mailboxDrivers : captchaDrivers}
          form={providerDefinitionForm[providerCreateDialog]}
          creating={Boolean(providerDefinitionCreating[`${providerCreateDialog}:${providerDefinitionForm[providerCreateDialog].provider_key || 'new'}`])}
          showSecret={showSecret}
          setShowSecret={setShowSecret}
          onChange={(key: string, value: any) => updateProviderDefinitionForm(providerCreateDialog, key, value)}
          onClose={() => setProviderCreateDialog(null)}
          onCreate={() => createProviderDefinitionAndSetting(providerCreateDialog)}
        />
      )}
    </div>
  )
}
