import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Sun, Moon, Languages, Cpu } from 'lucide-react'

// ── i18n ─────────────────────────────────────────────────────────────────────
const translations = {
  en: {
    title: 'Systemd Unit Generator',
    subtitle: 'Generate systemd .service files with [Unit], [Service], and [Install] sections. Presets for Node.js, Python, Go. Client-side only.',
    config: 'Configuration',
    output: 'Output',
    outputDesc: 'Generated .service file',
    preset: 'Preset',
    presetNodejs: 'Node.js App',
    presetPython: 'Python App',
    presetGo: 'Go Binary',
    presetCustom: 'Custom',
    unitSection: '[Unit] Section',
    serviceSection: '[Service] Section',
    installSection: '[Install] Section',
    description: 'Description',
    descriptionPlaceholder: 'My application service',
    after: 'After',
    afterPlaceholder: 'network.target',
    requires: 'Requires',
    requiresPlaceholder: 'e.g. postgresql.service',
    wants: 'Wants',
    wantsPlaceholder: 'e.g. redis.service',
    serviceType: 'Type',
    execStart: 'ExecStart',
    execStartPlaceholder: '/usr/bin/node /app/server.js',
    execStop: 'ExecStop',
    execStopPlaceholder: 'optional, e.g. /bin/kill -s QUIT $MAINPID',
    workingDirectory: 'WorkingDirectory',
    workingDirectoryPlaceholder: '/opt/myapp',
    user: 'User',
    userPlaceholder: 'www-data',
    group: 'Group',
    groupPlaceholder: 'www-data',
    restart: 'Restart',
    restartSec: 'RestartSec',
    envVars: 'Environment Variables',
    addEnvVar: 'Add Variable',
    key: 'KEY',
    value: 'VALUE',
    standardOutput: 'StandardOutput',
    standardError: 'StandardError',
    wantedBy: 'WantedBy',
    wantedByPlaceholder: 'multi-user.target',
    copy: 'Copy',
    copied: 'Copied!',
    builtBy: 'Built by',
    limitNoFile: 'LimitNOFILE',
  },
  pt: {
    title: 'Gerador de Unit Systemd',
    subtitle: 'Gere arquivos .service do systemd com secoes [Unit], [Service] e [Install]. Presets para Node.js, Python, Go. Tudo no navegador.',
    config: 'Configuracao',
    output: 'Saida',
    outputDesc: 'Arquivo .service gerado',
    preset: 'Preset',
    presetNodejs: 'App Node.js',
    presetPython: 'App Python',
    presetGo: 'Binario Go',
    presetCustom: 'Personalizado',
    unitSection: 'Secao [Unit]',
    serviceSection: 'Secao [Service]',
    installSection: 'Secao [Install]',
    description: 'Descricao',
    descriptionPlaceholder: 'Servico da minha aplicacao',
    after: 'After',
    afterPlaceholder: 'network.target',
    requires: 'Requires',
    requiresPlaceholder: 'ex: postgresql.service',
    wants: 'Wants',
    wantsPlaceholder: 'ex: redis.service',
    serviceType: 'Type',
    execStart: 'ExecStart',
    execStartPlaceholder: '/usr/bin/node /app/server.js',
    execStop: 'ExecStop',
    execStopPlaceholder: 'opcional, ex: /bin/kill -s QUIT $MAINPID',
    workingDirectory: 'WorkingDirectory',
    workingDirectoryPlaceholder: '/opt/myapp',
    user: 'User',
    userPlaceholder: 'www-data',
    group: 'Group',
    groupPlaceholder: 'www-data',
    restart: 'Restart',
    restartSec: 'RestartSec',
    envVars: 'Variaveis de Ambiente',
    addEnvVar: 'Adicionar Variavel',
    key: 'CHAVE',
    value: 'VALOR',
    standardOutput: 'StandardOutput',
    standardError: 'StandardError',
    wantedBy: 'WantedBy',
    wantedByPlaceholder: 'multi-user.target',
    copy: 'Copiar',
    copied: 'Copiado!',
    builtBy: 'Criado por',
    limitNoFile: 'LimitNOFILE',
  },
} as const

type Lang = keyof typeof translations

let _uid = 0
const nextId = () => `e-${++_uid}`

interface EnvVar { id: string; key: string; value: string }

interface UnitConfig {
  description: string
  after: string
  requires: string
  wants: string
  serviceType: string
  execStart: string
  execStop: string
  workingDirectory: string
  user: string
  group: string
  restart: string
  restartSec: string
  standardOutput: string
  standardError: string
  limitNoFile: string
  envVars: EnvVar[]
  wantedBy: string
}

const defaultConfig: UnitConfig = {
  description: 'My Application Service',
  after: 'network.target',
  requires: '',
  wants: '',
  serviceType: 'simple',
  execStart: '/usr/bin/node /opt/myapp/server.js',
  execStop: '',
  workingDirectory: '/opt/myapp',
  user: 'myapp',
  group: 'myapp',
  restart: 'always',
  restartSec: '5',
  standardOutput: 'journal',
  standardError: 'journal',
  limitNoFile: '65536',
  envVars: [],
  wantedBy: 'multi-user.target',
}

type Preset = Omit<UnitConfig, 'envVars'>

const presets: Record<string, Preset> = {
  nodejs: {
    description: 'Node.js Application Service',
    after: 'network.target',
    requires: '',
    wants: '',
    serviceType: 'simple',
    execStart: '/usr/bin/node /opt/myapp/server.js',
    execStop: '',
    workingDirectory: '/opt/myapp',
    user: 'myapp',
    group: 'myapp',
    restart: 'always',
    restartSec: '5',
    standardOutput: 'journal',
    standardError: 'journal',
    limitNoFile: '65536',
    wantedBy: 'multi-user.target',
  },
  python: {
    description: 'Python Application Service',
    after: 'network.target',
    requires: '',
    wants: '',
    serviceType: 'simple',
    execStart: '/opt/myapp/venv/bin/python /opt/myapp/main.py',
    execStop: '',
    workingDirectory: '/opt/myapp',
    user: 'myapp',
    group: 'myapp',
    restart: 'on-failure',
    restartSec: '10',
    standardOutput: 'journal',
    standardError: 'journal',
    limitNoFile: '4096',
    wantedBy: 'multi-user.target',
  },
  go: {
    description: 'Go Application Service',
    after: 'network.target',
    requires: '',
    wants: '',
    serviceType: 'simple',
    execStart: '/usr/local/bin/myapp',
    execStop: '',
    workingDirectory: '/opt/myapp',
    user: 'myapp',
    group: 'myapp',
    restart: 'always',
    restartSec: '3',
    standardOutput: 'journal',
    standardError: 'journal',
    limitNoFile: '65536',
    wantedBy: 'multi-user.target',
  },
}

function generateUnit(c: UnitConfig): string {
  const lines: string[] = []

  lines.push('[Unit]')
  lines.push(`Description=${c.description}`)
  if (c.after.trim()) lines.push(`After=${c.after.trim()}`)
  if (c.requires.trim()) lines.push(`Requires=${c.requires.trim()}`)
  if (c.wants.trim()) lines.push(`Wants=${c.wants.trim()}`)

  lines.push('')
  lines.push('[Service]')
  lines.push(`Type=${c.serviceType}`)
  if (c.user.trim()) lines.push(`User=${c.user.trim()}`)
  if (c.group.trim()) lines.push(`Group=${c.group.trim()}`)
  if (c.workingDirectory.trim()) lines.push(`WorkingDirectory=${c.workingDirectory.trim()}`)

  const validEnv = c.envVars.filter(e => e.key.trim())
  for (const e of validEnv) {
    lines.push(`Environment="${e.key.trim()}=${e.value.trim()}"`)
  }

  if (c.execStart.trim()) lines.push(`ExecStart=${c.execStart.trim()}`)
  if (c.execStop.trim()) lines.push(`ExecStop=${c.execStop.trim()}`)
  lines.push(`Restart=${c.restart}`)
  if (c.restartSec.trim()) lines.push(`RestartSec=${c.restartSec.trim()}`)
  if (c.standardOutput.trim()) lines.push(`StandardOutput=${c.standardOutput.trim()}`)
  if (c.standardError.trim()) lines.push(`StandardError=${c.standardError.trim()}`)
  if (c.limitNoFile.trim()) lines.push(`LimitNOFILE=${c.limitNoFile.trim()}`)

  lines.push('')
  lines.push('[Install]')
  lines.push(`WantedBy=${c.wantedBy || 'multi-user.target'}`)

  return lines.join('\n')
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SystemdUnitGenerator() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [config, setConfig] = useState<UnitConfig>(defaultConfig)
  const [copied, setCopied] = useState(false)

  const t = translations[lang]

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const output = generateUnit(config)

  const patch = (p: Partial<UnitConfig>) => setConfig(c => ({ ...c, ...p }))

  const applyPreset = (key: keyof typeof presets) => setConfig(c => ({ ...c, ...presets[key] }))

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }, [output])

  const addEnvVar = () => setConfig(c => ({ ...c, envVars: [...c.envVars, { id: nextId(), key: '', value: '' }] }))
  const updateEnvVar = (id: string, field: 'key' | 'value', val: string) =>
    setConfig(c => ({ ...c, envVars: c.envVars.map(e => e.id === id ? { ...e, [field]: val } : e) }))
  const removeEnvVar = (id: string) =>
    setConfig(c => ({ ...c, envVars: c.envVars.filter(e => e.id !== id) }))

  const inputCls = 'w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500'
  const labelCls = 'block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1'
  const sectionCls = 'space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-4'

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-600 rounded-lg flex items-center justify-center">
              <Cpu size={18} className="text-white" />
            </div>
            <span className="font-semibold">Systemd Unit Generator</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Languages size={14} />{lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/systemd-unit-generator" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {/* Config panel */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5">
              <div>
                <h2 className="font-semibold">{t.config}</h2>
              </div>

              {/* Presets */}
              <div>
                <label className={labelCls}>{t.preset}</label>
                <div className="flex flex-wrap gap-2">
                  {(['nodejs', 'python', 'go'] as const).map(key => (
                    <button key={key} onClick={() => applyPreset(key)} className="rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-600 hover:text-white hover:border-zinc-600 transition-colors">
                      {key === 'nodejs' ? t.presetNodejs : key === 'python' ? t.presetPython : t.presetGo}
                    </button>
                  ))}
                </div>
              </div>

              {/* [Unit] */}
              <div className={sectionCls}>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t.unitSection}</p>
                <div>
                  <label className={labelCls}>{t.description}</label>
                  <input className={inputCls} placeholder={t.descriptionPlaceholder} value={config.description} onChange={e => patch({ description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{t.after}</label>
                    <input className={inputCls} placeholder={t.afterPlaceholder} value={config.after} onChange={e => patch({ after: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>{t.requires}</label>
                    <input className={inputCls} placeholder={t.requiresPlaceholder} value={config.requires} onChange={e => patch({ requires: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t.wants}</label>
                  <input className={inputCls} placeholder={t.wantsPlaceholder} value={config.wants} onChange={e => patch({ wants: e.target.value })} />
                </div>
              </div>

              {/* [Service] */}
              <div className={sectionCls}>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t.serviceSection}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>{t.serviceType}</label>
                    <select className={inputCls} value={config.serviceType} onChange={e => patch({ serviceType: e.target.value })}>
                      {['simple', 'exec', 'forking', 'oneshot', 'notify', 'idle'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t.user}</label>
                    <input className={inputCls} placeholder={t.userPlaceholder} value={config.user} onChange={e => patch({ user: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>{t.group}</label>
                    <input className={inputCls} placeholder={t.groupPlaceholder} value={config.group} onChange={e => patch({ group: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t.workingDirectory}</label>
                  <input className={inputCls} placeholder={t.workingDirectoryPlaceholder} value={config.workingDirectory} onChange={e => patch({ workingDirectory: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>{t.execStart}</label>
                  <input className={inputCls} placeholder={t.execStartPlaceholder} value={config.execStart} onChange={e => patch({ execStart: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>{t.execStop}</label>
                  <input className={inputCls} placeholder={t.execStopPlaceholder} value={config.execStop} onChange={e => patch({ execStop: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>{t.restart}</label>
                    <select className={inputCls} value={config.restart} onChange={e => patch({ restart: e.target.value })}>
                      {['always', 'on-failure', 'on-abnormal', 'on-watchdog', 'on-abort', 'no'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t.restartSec}</label>
                    <input className={inputCls} value={config.restartSec} onChange={e => patch({ restartSec: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>{t.limitNoFile}</label>
                    <input className={inputCls} value={config.limitNoFile} onChange={e => patch({ limitNoFile: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{t.standardOutput}</label>
                    <select className={inputCls} value={config.standardOutput} onChange={e => patch({ standardOutput: e.target.value })}>
                      {['journal', 'syslog', 'kmsg', 'journal+console', 'null', 'inherit'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t.standardError}</label>
                    <select className={inputCls} value={config.standardError} onChange={e => patch({ standardError: e.target.value })}>
                      {['journal', 'syslog', 'kmsg', 'journal+console', 'null', 'inherit'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>

                {/* Env vars */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={labelCls + ' mb-0'}>{t.envVars}</label>
                    <button onClick={addEnvVar} className="flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      + {t.addEnvVar}
                    </button>
                  </div>
                  {config.envVars.map(e => (
                    <div key={e.id} className="flex items-center gap-2">
                      <input className={inputCls} placeholder={t.key} value={e.key} onChange={ev => updateEnvVar(e.id, 'key', ev.target.value)} />
                      <span className="text-zinc-400 text-sm shrink-0">=</span>
                      <input className={inputCls} placeholder={t.value} value={e.value} onChange={ev => updateEnvVar(e.id, 'value', ev.target.value)} />
                      <button onClick={() => removeEnvVar(e.id)} className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors text-xs">x</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* [Install] */}
              <div className={sectionCls}>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t.installSection}</p>
                <div>
                  <label className={labelCls}>{t.wantedBy}</label>
                  <input className={inputCls} placeholder={t.wantedByPlaceholder} value={config.wantedBy} onChange={e => patch({ wantedBy: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h2 className="font-semibold text-sm">{t.output}</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.outputDesc}</p>
                </div>
                <button onClick={handleCopy} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  {copied ? t.copied : t.copy}
                </button>
              </div>
              <pre className="flex-1 overflow-auto p-4 font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre">{output}</pre>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
