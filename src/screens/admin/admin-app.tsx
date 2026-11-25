import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Gavel,
  History,
  LayoutDashboard,
  Lock,
  Menu,
  MessageSquare,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserX,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { Button, StatusChip, Toast } from '../../components/ui/ds'
import { AuthFeedbackAlert, DemoCredentialsBlock } from '../alumno/auth'
import { ListState } from '../../components/ui/list-state'
import {
  INITIAL_ADMIN_PAYMENTS,
  INITIAL_REPORTED_PROFILES,
  INITIAL_REPORTED_REVIEWS,
  INITIAL_USERS,
  INITIAL_VERIFICATIONS,
  formatMoney,
} from '../../data/mock'
import type {
  AdminPaymentRow,
  AdminUserRecord as AdminUser,
  ClassSession,
  PaymentStatus,
  VerificationRecord,
} from '../../types'
import {
  loginWithPassword,
  logout,
  useAuthSession,
  verifyAdminTwoFactor,
  type AuthRole,
  type LoginAttemptResult,
} from '../../services/auth'

const cx = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ')

type AdminSection =
  | 'home'
  | 'users'
  | 'verification'
  | 'moderation'
  | 'payments'
  | 'commissions'
  | 'metrics'
  | 'settings'

const SIDEBAR_ITEMS: [AdminSection, string, typeof LayoutDashboard][] = [
  ['home', 'Inicio', LayoutDashboard],
  ['users', 'Usuarios', Users],
  ['verification', 'Verificación', FileCheck2],
  ['moderation', 'Moderación', Gavel],
  ['payments', 'Pagos y disputas', CreditCard],
  ['commissions', 'Comisiones y planes', CircleDollarSign],
  ['metrics', 'Métricas', BarChart3],
  ['settings', 'Ajustes', Settings],
]

export function AdminLogin({
  initialEmail = '',
  initialPassword = '',
  onBack,
  onSwitchRole,
}: {
  initialEmail?: string
  initialPassword?: string
  onBack?: () => void
  onSwitchRole?: (role: 'alumno' | 'tutor', draft: { email: string; password: string }) => void
}) {
  const [step, setStep] = useState<'credentials' | 'code' | 'enroll'>('credentials')
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState(initialPassword)
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attemptError, setAttemptError] = useState<Exclude<LoginAttemptResult, { ok: true }> | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)

  return (
    <div className="grid min-h-dvh w-full place-items-center bg-g100 p-6">
      <main className="w-full max-w-md rounded-card border border-g200 bg-white p-8 shadow-sm">
        {step === 'credentials' && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 mb-4 inline-flex min-h-11 items-center gap-1 rounded-btn px-2 font-semibold text-ink hover:bg-g100"
          >
            <ChevronLeft size={18} aria-hidden /> Volver
          </button>
        )}
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-btn bg-ink text-white"><ShieldCheck size={24} aria-hidden /></span>
          <div>
            <p className="text-[12px] font-semibold text-g600">TutorClick</p>
            <h1 className="text-[24px] font-bold">Acceso administrativo</h1>
          </div>
        </div>

        {step === 'credentials' ? (
          <form
            noValidate
            className="mt-7 flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault()
              setIsSubmitting(true)
              try {
                const result = await loginWithPassword('admin', email, password)
                if (!result.ok) {
                  setAttemptError(result)
                  return
                }
                setAttemptError(null)
                setCode('')
                setCodeError(null)
                if (result.requiresEnrollment) {
                  setQrCode(result.qrCode ?? '')
                  setSecret(result.secret ?? '')
                  setStep('enroll')
                } else {
                  setStep('code')
                }
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="admin-email" className="text-[12px] font-semibold text-g700">Correo corporativo</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setAttemptError(null)
                }}
                placeholder="correo@tutorclick.com"
                autoComplete="email"
                className="min-h-12 rounded-btn border border-g500 px-4 outline-none focus:border-ink"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="admin-password" className="text-[12px] font-semibold text-g700">Contraseña</label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setAttemptError(null)
                  }}
                  autoComplete="current-password"
                  className="min-h-12 w-full rounded-btn border border-g500 pl-4 pr-24 outline-none focus:border-ink"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 flex min-h-11 -translate-y-1/2 items-center gap-1.5 rounded-btn px-3 text-[14px] font-semibold hover:bg-g100"
                >
                  {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            {attemptError && (
              <AuthFeedbackAlert
                result={attemptError}
                onSwitchRole={(targetRole: AuthRole) => {
                  setAttemptError(null)
                  if (targetRole === 'alumno' || targetRole === 'tutor') {
                    onSwitchRole?.(targetRole, { email, password })
                  }
                }}
              />
            )}
            <Button full icon={Lock} type="submit" loading={isSubmitting}>Continuar</Button>
            <DemoCredentialsBlock
              role="admin"
              onFill={(demoEmail, demoPass) => {
                setEmail(demoEmail)
                setPassword(demoPass)
                setAttemptError(null)
              }}
            />
          </form>
        ) : (
          <form
            noValidate
            className="mt-7 flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault()
              setIsSubmitting(true)
              const verification = await verifyAdminTwoFactor(code)
              if (!verification.ok) {
                setCodeError(verification.message)
                setIsSubmitting(false)
                return
              }
              setCodeError(null)
              setIsSubmitting(false)
            }}
          >
            <button type="button" onClick={() => setStep('credentials')} className="inline-flex min-h-11 w-fit items-center gap-1 font-semibold underline underline-offset-4">
              <ChevronLeft size={17} aria-hidden /> Volver
            </button>
            <div>
              <h2 className="text-[20px] font-bold">
                {step === 'enroll' ? 'Configura la verificación en dos pasos' : 'Verificación en dos pasos'}
              </h2>
              <p className="mt-1 text-g600">
                {step === 'enroll'
                  ? 'Escanea el código QR con una aplicación autenticadora y escribe el código de 6 dígitos.'
                  : 'Ingresa el código de 6 dígitos de tu aplicación autenticadora.'}
              </p>
            </div>
            {step === 'enroll' && (
              <div className="flex flex-col items-center gap-3 rounded-card border border-g200 p-4">
                {qrCode && <img src={qrCode} alt="Código QR para configurar MFA" className="size-48" />}
                <p className="text-center text-[12px] text-g600">Si no puedes escanearlo, ingresa esta clave manualmente:</p>
                <code className="break-all rounded bg-g100 p-2 text-center font-mono text-[14px]">{secret}</code>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label htmlFor="admin-code" className="text-[12px] font-semibold text-g700">Código de verificación</label>
              <input
                id="admin-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  setCodeError(null)
                }}
                className="min-h-14 rounded-btn border-2 border-g500 px-4 text-center text-[24px] font-bold tracking-[.35em] tabular-nums outline-none focus:border-ink"
              />
            </div>
            {codeError && (
              <p role="alert" className="flex items-center gap-2 rounded-btn border border-err bg-err-bg p-3 font-semibold text-err">
                <AlertTriangle size={17} aria-hidden />
                {codeError}
              </p>
            )}
            <Button full icon={ShieldCheck} type="submit" loading={isSubmitting}>Verificar y entrar</Button>
            <DemoCredentialsBlock
              role="admin"
              mode="twoFactor"
              onFillCode={(demoCode) => {
                setCode(demoCode)
                setCodeError(null)
              }}
            />
          </form>
        )}
      </main>
    </div>
  )
}

function KpiCard({ label, value, detail, icon: Icon, tone = 'neutral' }: { label: string; value: string; detail: string; icon: typeof Users; tone?: 'neutral' | 'warn' | 'err' }) {
  return (
    <article className={cx('rounded-card border bg-white p-4 shadow-sm', tone === 'err' ? 'border-err' : tone === 'warn' ? 'border-warn' : 'border-g200')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-g600">{label}</p>
        <span className={cx('grid size-9 place-items-center rounded-full', tone === 'err' ? 'bg-err-bg text-err' : tone === 'warn' ? 'bg-warn-bg text-warn' : 'bg-g100 text-ink')}><Icon size={18} aria-hidden /></span>
      </div>
      <p className="mt-2 text-[26px] font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-[12px] text-g600">{detail}</p>
    </article>
  )
}

function AdminHome({ onNavigate }: { onNavigate: (section: AdminSection) => void }) {
  const graphHeights = ['h-12', 'h-16', 'h-10', 'h-20', 'h-24', 'h-16', 'h-28', 'h-20', 'h-32', 'h-24', 'h-36', 'h-28', 'h-40', 'h-32', 'h-44']
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] font-bold">Inicio</h1>
        <p className="text-g600">Lunes 23 de noviembre de 2026 · Mérida (UTC-6)</p>
      </div>
      <section className="grid grid-cols-5 gap-3">
        <KpiCard label="Usuarios activos" value="2,418" detail="+8.4% vs. periodo anterior" icon={Users} />
        <KpiCard label="Clases hoy" value="186" detail="142 en línea · 44 presenciales" icon={CalendarIcon} />
        <KpiCard label="Ingresos MXN" value="$46,500" detail="Cobrado hoy" icon={CircleDollarSign} />
        <KpiCard label="Comisiones" value="$6,975" detail="15% promedio" icon={CreditCard} />
        <KpiCard label="Disputas abiertas" value="7" detail="2 requieren respuesta hoy" icon={AlertTriangle} tone="err" />
      </section>
      <div className="grid grid-cols-[1.7fr_1fr] gap-4">
        <section className="rounded-card border border-g200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div><h2 className="text-[18px] font-bold">Ingresos de los últimos 30 días</h2><p className="text-[12px] text-g600">Cobros procesados en MXN</p></div>
            <p className="text-[22px] font-bold">$1,284,750.00 MXN</p>
          </div>
          <div className="mt-5 flex h-52 items-end gap-2 border-b border-l border-g300 px-3">
            {graphHeights.map((height, index) => (
              <div key={index} className={cx('flex-1 rounded-t bg-ink', height)} title={`Día ${index * 2 + 1}`} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[12px] text-g600"><span>25 oct</span><span>8 nov</span><span>23 nov</span></div>
        </section>
        <section className="rounded-card border border-g200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-[18px] font-bold">Pendientes</h2><span className="rounded-full bg-err-bg px-3 py-1 font-bold text-err">16</span></div>
          <div className="mt-3 flex flex-col gap-2">
            {[
              ['Credenciales', '4 expedientes · 1 supera 48 h', 'verification', true],
              ['Reportes', '5 reportes de conducta', 'moderation', false],
              ['Disputas', '7 pagos retenidos', 'payments', false],
            ].map(([title, detail, section, overdue]) => (
              <button key={title as string} type="button" onClick={() => onNavigate(section as AdminSection)} className={cx('flex min-h-16 items-center justify-between rounded-btn border p-3 text-left', overdue ? 'border-err bg-err-bg' : 'border-g200 bg-g50')}>
                <span><span className="block font-bold">{title as string}</span><span className={cx('text-[12px]', overdue ? 'text-err' : 'text-g600')}>{detail as string}</span></span>
                <ChevronRight size={18} aria-hidden />
              </button>
            ))}
          </div>
        </section>
      </div>
      <section className="rounded-card border border-g200 bg-white p-5 shadow-sm">
        <h2 className="text-[18px] font-bold">Actividad reciente</h2>
        <div className="mt-3 divide-y divide-g200">
          {[
            ['3:48 PM', 'Pago PAG-7001 retenido', '$275.00 MXN · RES-1001'],
            ['3:32 PM', 'Valeria Ortiz obtuvo insignia', 'Verificación aprobada por Admin'],
            ['3:05 PM', 'Disputa DSP-0892 abierta', 'Cobro incorrecto · $275.00 MXN'],
            ['2:44 PM', 'Nueva cuenta de Tutor', 'Jorge Mora · Inglés'],
          ].map(([time, title, detail]) => (
            <div key={time} className="flex items-center gap-4 py-3">
              <span className="w-20 text-[12px] font-semibold text-g600">{time}</span>
              <span className="grid size-8 place-items-center rounded-full bg-g100"><Activity size={15} aria-hidden /></span>
              <div><p className="font-semibold">{title}</p><p className="text-[12px] text-g600">{detail}</p></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const CalendarIcon = Clock

function UserStatus({ status }: { status: AdminUser['status'] }) {
  if (status === 'Suspendido') return <StatusChip status="Suspendido" />
  if (status === 'En revisión') return <StatusChip status="En revisión" />
  return <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-ok-bg px-3 font-semibold text-ok"><CheckCircle2 size={15} aria-hidden />Activo</span>
}

function UsersSection({ sessions }: { sessions: ClassSession[] }) {
  const [users, setUsers] = useState(INITIAL_USERS)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('Todos')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [suspendId, setSuspendId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState(false)
  const selected = users.find((user) => user.id === selectedId)
  const filtered = users.filter((user) => {
    const matchesQuery = `${user.name} ${user.email} ${user.id}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (roleFilter === 'Todos' || user.role === roleFilter) && (statusFilter === 'Todos' || user.status === statusFilter)
  })
  const pageItems = filtered.slice((page - 1) * 4, page * 4)

  return (
    <div className="relative min-h-full">
      <div><h1 className="text-[28px] font-bold">Usuarios</h1><p className="text-g600">Gestiona cuentas de Alumnos y Tutores.</p></div>
      <section className="mt-5 rounded-card border border-g200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_180px_180px] gap-3 border-b border-g200 p-4">
          <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-g500" aria-hidden /><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Buscar nombre, correo o ID" className="min-h-11 w-full rounded-btn border border-g500 pl-10 pr-3 outline-none focus:border-ink" /></div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }} className="min-h-11 rounded-btn border border-g500 bg-white px-3"><option>Todos</option><option>Alumno</option><option>Tutor</option></select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="min-h-11 rounded-btn border border-g500 bg-white px-3"><option>Todos</option><option>Activo</option><option>En revisión</option><option>Suspendido</option></select>
        </div>
        <ListState
          count={pageItems.length}
          emptyTitle="No encontramos usuarios"
          emptyDescription="Ajusta la búsqueda o limpia los filtros para consultar todas las cuentas."
          emptyAction="Limpiar filtros"
          onEmptyAction={() => { setQuery(''); setRoleFilter('Todos'); setStatusFilter('Todos'); setPage(1) }}
          loadingLabel="Cargando usuarios"
          className="p-4"
        >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-g100 text-[12px] text-g600"><tr><th className="p-3">Usuario</th><th className="p-3">Rol</th><th className="p-3">Estado</th><th className="p-3">Registro</th><th className="p-3">Clases</th><th className="p-3">Acciones</th></tr></thead>
            <tbody className="divide-y divide-g200">
              {pageItems.map((user) => (
                <tr key={user.id}>
                  <td className="p-3"><p className="font-semibold">{user.name}</p><p className="text-[12px] text-g600">{user.id} · {user.email}</p></td>
                  <td className="p-3">{user.role}</td><td className="p-3"><UserStatus status={user.status} /></td><td className="p-3">{user.joined}</td><td className="p-3">{user.classes}</td>
                  <td className="p-3"><div className="flex gap-2"><button onClick={() => setSelectedId(user.id)} className="min-h-11 rounded-btn border border-g300 px-3 font-semibold">Ver detalle</button>{user.status === 'Suspendido' ? <button onClick={() => setUsers((prev) => prev.map((item) => item.id === user.id ? { ...item, status: 'Activo' } : item))} className="min-h-11 rounded-btn bg-ok-bg px-3 font-semibold text-ok">Reactivar</button> : <button onClick={() => { setSuspendId(user.id); setReason('') }} className="min-h-11 rounded-btn bg-err-bg px-3 font-semibold text-err">Suspender</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </ListState>
        <div className="flex items-center justify-between border-t border-g200 p-4"><p className="text-[12px] text-g600">Mostrando {pageItems.length} de {filtered.length} usuarios</p><div className="flex items-center gap-2"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="grid size-11 place-items-center rounded-btn border border-g300 disabled:text-g300"><ChevronLeft size={18} aria-hidden /></button><span className="font-semibold">Página {page}</span><button disabled={page * 4 >= filtered.length} onClick={() => setPage((value) => value + 1)} className="grid size-11 place-items-center rounded-btn border border-g300 disabled:text-g300"><ChevronRight size={18} aria-hidden /></button></div></div>
      </section>

      {selected && (
        <div className="absolute inset-y-0 right-0 z-20 w-[440px] overflow-y-auto border-l border-g200 bg-white p-5 shadow-xl">
          <div className="flex items-center justify-between"><h2 className="text-[20px] font-bold">Detalle del usuario</h2><button onClick={() => setSelectedId(null)} className="grid size-11 place-items-center rounded-full hover:bg-g100" aria-label="Cerrar detalle"><X size={20} /></button></div>
          <section className="mt-4 rounded-card bg-g100 p-4"><div className="flex items-center gap-3"><span className="grid size-14 place-items-center rounded-full bg-ink font-bold text-white">{selected.name.split(' ').map((item) => item[0]).join('')}</span><div><h3 className="text-[18px] font-bold">{selected.name}</h3><p className="text-g600">{selected.id} · {selected.role}</p></div></div><dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]"><div><dt className="text-g600">Correo</dt><dd className="font-semibold">{selected.email}</dd></div><div><dt className="text-g600">Estado</dt><dd><UserStatus status={selected.status} /></dd></div><div><dt className="text-g600">Clases</dt><dd className="font-semibold">{selected.classes}</dd></div><div><dt className="text-g600">Reportes</dt><dd className="font-semibold">{selected.reports}</dd></div></dl></section>
          <h3 className="mb-2 mt-5 text-[16px] font-bold">Historial de clases</h3>
          <div className="flex flex-col gap-2">{sessions.filter((item) => item.studentId === selected.id || item.tutorId === selected.id).slice(0, 4).map((item) => <article key={item.id} className="rounded-btn border border-g200 p-3"><div className="flex justify-between"><p className="font-semibold">{item.subject}</p><StatusChip status={item.status} /></div><p className="mt-1 text-[12px] text-g600">{item.id} · {formatMoney(item.hourlyRate * 1.1)}</p></article>)}</div>
          <h3 className="mb-2 mt-5 text-[16px] font-bold">Reportes</h3>
          {selected.reports > 0 ? <div className="rounded-btn border border-warn bg-warn-bg p-3 text-warn"><p className="font-semibold">{selected.reports} {selected.reports === 1 ? 'reporte asociado' : 'reportes asociados'}</p><p className="text-[12px]">Revisar conducta, asistencia y pagos protegidos.</p></div> : <p className="rounded-btn bg-ok-bg p-3 font-semibold text-ok">Sin reportes activos</p>}
        </div>
      )}

      {suspendId && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-6">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-card bg-white p-6 shadow-xl"><h2 className="text-[20px] font-bold">Suspender usuario</h2><p className="mt-1 text-g600">El usuario perderá acceso y recibirá un aviso con el motivo.</p><label htmlFor="suspend-reason" className="mt-4 block text-[12px] font-semibold text-g700">Motivo claro y obligatorio</label><textarea id="suspend-reason" rows={4} value={reason} onChange={(e) => { setReason(e.target.value); setReasonError(false) }} className={cx('mt-1 w-full rounded-btn border p-3 outline-none', reasonError ? 'border-2 border-err' : 'border-g500')} placeholder="Explica la regla incumplida y los pasos para apelar." />{reasonError && <p className="mt-1 font-semibold text-err">Escribe un motivo claro antes de suspender.</p>}<div className="mt-5 flex justify-end gap-2"><Button variant="text" onClick={() => setSuspendId(null)}>Cancelar</Button><Button variant="destructive" onClick={() => { if (reason.trim().length < 12) { setReasonError(true); return }; setUsers((prev) => prev.map((item) => item.id === suspendId ? { ...item, status: 'Suspendido' } : item)); setSuspendId(null) }}>Suspender y avisar</Button></div></div>
        </div>
      )}
    </div>
  )
}

function VerificationSection() {
  const [records, setRecords] = useState(INITIAL_VERIFICATIONS)
  const [selectedId, setSelectedId] = useState('VER-1024')
  const [checks, setChecks] = useState({ name: true, institution: true, license: false })
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState(false)
  const selected = records.find((item) => item.id === selectedId) ?? records[0]
  const allChecked = checks.name && checks.institution && checks.license

  return (
    <div className="flex h-full flex-col">
      <div><h1 className="text-[28px] font-bold">Verificación</h1><p className="text-g600">Revisa expedientes profesionales dentro del plazo de 48 h.</p></div>
      <ListState count={records.length} emptyTitle="Sin expedientes pendientes" emptyDescription="Los nuevos documentos enviados por Tutores aparecerán aquí." emptyAction="Actualizar expedientes" onEmptyAction={() => setRecords(INITIAL_VERIFICATIONS)} loadingLabel="Cargando expedientes" className="mt-5 min-h-0 flex-1">
      <div className="mt-5 grid min-h-0 flex-1 grid-cols-[340px_1fr] overflow-hidden rounded-card border border-g200 bg-white shadow-sm">
        <aside className="overflow-y-auto border-r border-g200 bg-g50 p-3">
          <p className="mb-2 px-2 text-[12px] font-semibold text-g600">{records.filter((item) => item.status === 'En revisión').length} expedientes pendientes</p>
          <div className="flex flex-col gap-2">
            {records.map((item) => (
              <button key={item.id} onClick={() => { setSelectedId(item.id); setChecks({ name: true, institution: true, license: false }) }} className={cx('w-full rounded-btn border p-3 text-left', selectedId === item.id ? 'border-ink bg-white shadow-sm' : 'border-g200 bg-white')}>
                <div className="flex justify-between gap-2"><p className="font-bold">{item.tutor}</p><StatusChip status={item.status} /></div>
                <p className="mt-1 text-[12px] text-g600">{item.id} · {item.subject}</p>
                <p className={cx('mt-2 flex items-center gap-1 text-[12px] font-bold', item.ageHours > 48 ? 'text-err' : 'text-g600')}><Clock size={13} aria-hidden />{item.ageHours} h en espera {item.ageHours > 48 && '· Supera 48 h'}</p>
              </button>
            ))}
          </div>
        </aside>
        <main className="grid min-h-0 grid-cols-[1fr_360px]">
          <section className="overflow-y-auto p-5">
            <div className="flex items-center justify-between"><div><h2 className="text-[20px] font-bold">Expediente de {selected.tutor}</h2><p className="text-g600">{selected.subject} · {selected.id}</p></div><span className={cx('inline-flex min-h-8 items-center gap-1 rounded-full px-3 font-bold', selected.ageHours > 48 ? 'bg-err-bg text-err' : 'bg-warn-bg text-warn')}><Clock size={15} aria-hidden />{selected.ageHours} h</span></div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[['Título profesional', selected.institution, 'titulo-profesional.pdf'], ['Cédula profesional', selected.license, 'cedula-profesional.jpg']].map(([title, detail, file]) => (
                <article key={title} className="rounded-card border border-g200 p-4"><FileText size={24} aria-hidden /><h3 className="mt-3 font-bold">{title}</h3><p className="mt-1 text-[12px] text-g600">{detail}</p><p className="mt-3 truncate rounded-btn bg-g100 p-2 text-[12px] font-semibold">{file}</p><Button full variant="secondary" className="mt-3">Abrir en visor</Button></article>
              ))}
            </div>
            <section className="mt-5 rounded-card border border-g200 p-4"><h3 className="font-bold">Datos del Tutor</h3><dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]"><div><dt className="text-g600">Nombre</dt><dd className="font-semibold">{selected.tutor}</dd></div><div><dt className="text-g600">Institución</dt><dd className="font-semibold">{selected.institution}</dd></div><div><dt className="text-g600">Cédula</dt><dd className="font-semibold">{selected.license}</dd></div><div><dt className="text-g600">Zona</dt><dd className="font-semibold">Mérida, zona norte</dd></div></dl></section>
          </section>
          <aside className="overflow-y-auto border-l border-g200 bg-g50 p-5">
            <h2 className="text-[18px] font-bold">Checklist</h2>
            <p className="mt-1 text-[12px] text-g600">Confirma cada punto contra los documentos del visor.</p>
            <div className="mt-4 flex flex-col gap-2">
              {([
                ['name', 'Nombre coincide', 'El nombre es idéntico en cuenta, título y cédula.'],
                ['institution', 'Institución reconocida', 'La institución y el programa son válidos.'],
                ['license', 'Cédula válida', 'El número y datos profesionales son vigentes.'],
              ] as const).map(([key, title, detail]) => (
                <button key={key} type="button" role="checkbox" aria-checked={checks[key]} onClick={() => setChecks((prev) => ({ ...prev, [key]: !prev[key] }))} className={cx('flex min-h-16 items-center gap-3 rounded-btn border p-3 text-left', checks[key] ? 'border-ok bg-ok-bg' : 'border-g300 bg-white')}>
                  {checks[key] ? <CheckCircle2 size={21} className="shrink-0 text-ok" aria-hidden /> : <span className="size-5 shrink-0 rounded border-2 border-g500" />}
                  <span><span className="block font-bold">{title}</span><span className="block text-[12px] text-g600">{detail}</span></span>
                </button>
              ))}
            </div>
            <Button full icon={BadgeCheck} className="mt-5" disabled={!allChecked || selected.status !== 'En revisión'} onClick={() => setRecords((prev) => prev.map((item) => item.id === selected.id ? { ...item, status: 'Verificado' } : item))}>Aprobar y otorgar insignia</Button>
            <Button full variant="destructive" className="mt-2" disabled={selected.status !== 'En revisión'} onClick={() => { setRejecting(true); setReason('') }}>Rechazar</Button>
          </aside>
        </main>
      </div>
      </ListState>
      {rejecting && <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-6"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-card bg-white p-6 shadow-xl"><h2 className="text-[20px] font-bold">Rechazar expediente</h2><p className="mt-1 text-g600">El Tutor recibirá el motivo y podrá volver a subir sus documentos.</p><label htmlFor="reject-reason" className="mt-4 block text-[12px] font-semibold text-g700">Motivo obligatorio</label><textarea id="reject-reason" rows={4} value={reason} onChange={(e) => { setReason(e.target.value); setReasonError(false) }} className={cx('mt-1 w-full rounded-btn border p-3', reasonError ? 'border-2 border-err' : 'border-g500')} placeholder="Describe qué documento o dato debe corregirse." />{reasonError && <p className="mt-1 font-semibold text-err">Escribe un motivo antes de rechazar.</p>}<div className="mt-5 flex justify-end gap-2"><Button variant="text" onClick={() => setRejecting(false)}>Cancelar</Button><Button variant="destructive" onClick={() => { if (!reason.trim()) { setReasonError(true); return }; setRecords((prev) => prev.map((item) => item.id === selected.id ? { ...item, status: 'Rechazado' } : item)); setRejecting(false) }}>Rechazar y notificar</Button></div></div></div>}
    </div>
  )
}

type ModerationAction = 'Advertir' | 'Suspender perfil' | 'Descartar' | 'Mantener' | 'Ocultar'

function ModerationSection() {
  const [tab, setTab] = useState<'profiles' | 'reviews'>('profiles')
  const [action, setAction] = useState<ModerationAction | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState(false)
  const [notice, setNotice] = useState('')
  const profiles = INITIAL_REPORTED_PROFILES
  const reviews = INITIAL_REPORTED_REVIEWS

  const openAction = (next: ModerationAction) => {
    setAction(next)
    setReason('')
    setError(false)
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <div><h1 className="text-[28px] font-bold">Moderación</h1><p className="text-g600">Revisa evidencia y aplica cada acción de forma independiente.</p></div>
        {notice && <p role="status" className="rounded-btn bg-ok-bg px-4 py-3 font-semibold text-ok"><CheckCircle2 size={17} className="mr-2 inline" aria-hidden />{notice}</p>}
      </div>
      <div className="mt-5 flex gap-2 border-b border-g300" role="tablist">
        <button role="tab" aria-selected={tab === 'profiles'} onClick={() => setTab('profiles')} className={cx('min-h-12 border-b-2 px-5 font-semibold', tab === 'profiles' ? 'border-ink text-ink' : 'border-transparent text-g600')}>Perfiles reportados <span className="ml-1 rounded-full bg-err-bg px-2 py-1 text-[12px] text-err">6</span></button>
        <button role="tab" aria-selected={tab === 'reviews'} onClick={() => setTab('reviews')} className={cx('min-h-12 border-b-2 px-5 font-semibold', tab === 'reviews' ? 'border-ink text-ink' : 'border-transparent text-g600')}>Reseñas <span className="ml-1 rounded-full bg-warn-bg px-2 py-1 text-[12px] text-warn">4</span></button>
      </div>

      {tab === 'profiles' ? (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <article key={profile.id} className="rounded-card border border-g200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between"><div><p className="text-[12px] font-semibold text-g600">{profile.id}</p><h2 className="text-[18px] font-bold">{profile.name}</h2></div><span className="rounded-full bg-err-bg px-3 py-1 font-bold text-err">{profile.reports} reportes</span></div>
              <div className="mt-4 rounded-btn border border-err bg-err-bg p-3"><p className="text-[12px] font-semibold text-err">Infracción detectada</p><p className="font-bold text-err">{profile.issue}</p></div>
              <div className="mt-3 rounded-btn border border-g200 bg-g50 p-3"><p className="text-[12px] font-semibold text-g600">Evidencia · {profile.source}</p><p className="mt-1 font-medium">{profile.evidence}</p></div>
              <div className="mt-4 flex flex-wrap gap-2"><Button icon={MessageSquare} onClick={() => openAction('Advertir')}>Advertir</Button><Button variant="destructive" icon={UserX} onClick={() => openAction('Suspender perfil')}>Suspender perfil</Button><Button variant="secondary" onClick={() => openAction('Descartar')}>Descartar</Button></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <div className="mb-4 flex items-start gap-3 rounded-card border border-info bg-info-bg p-4 text-info"><ShieldCheck size={22} className="shrink-0" aria-hidden /><div><p className="font-bold">Regla de moderación</p><p>Las críticas honestas no se ocultan; solo reseñas con insultos, datos personales o spam.</p></div></div>
          <div className="grid grid-cols-2 gap-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-card border border-g200 bg-white p-5 shadow-sm">
                <div className="flex justify-between"><div><p className="font-bold">{review.author} sobre {review.tutor}</p><p className="text-[12px] text-g600">{review.id}</p></div><span className="font-semibold text-err">{review.reports} {review.reports === 1 ? 'reporte' : 'reportes'}</span></div>
                <blockquote className="my-4 rounded-btn bg-g100 p-4 font-medium">“{review.text}”</blockquote>
                <p className="text-[12px] font-semibold text-g600">Evaluación</p><p className={cx('font-bold', review.issue === 'Crítica honesta' ? 'text-ok' : 'text-err')}>{review.issue}</p>
                <div className="mt-4 flex gap-2"><Button icon={Check} onClick={() => openAction('Mantener')}>Mantener</Button><Button variant="destructive" onClick={() => openAction('Ocultar')}>Ocultar</Button></div>
              </article>
            ))}
          </div>
        </div>
      )}

      {action && <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-6"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-card bg-white p-6 shadow-xl"><h2 className="text-[20px] font-bold">Confirmar: {action}</h2><p className="mt-1 text-g600">La decisión quedará registrada y se notificará a la persona correspondiente.</p><label htmlFor="moderation-reason" className="mt-4 block text-[12px] font-semibold text-g700">Motivo obligatorio</label><textarea id="moderation-reason" rows={4} value={reason} onChange={(event) => { setReason(event.target.value); setError(false) }} className={cx('mt-1 w-full rounded-btn border p-3 outline-none', error ? 'border-2 border-err' : 'border-g500')} placeholder="Describe la evidencia y la regla aplicada." />{error && <p className="mt-1 font-semibold text-err">Escribe un motivo claro para continuar.</p>}<div className="mt-5 flex justify-end gap-2"><Button variant="text" onClick={() => setAction(null)}>Cancelar</Button><Button variant={action === 'Suspender perfil' || action === 'Ocultar' ? 'destructive' : 'primary'} onClick={() => { if (reason.trim().length < 10) { setError(true); return }; setNotice(`${action} aplicado correctamente.`); setAction(null) }}>Confirmar acción</Button></div></div></div>}
    </div>
  )
}

function PaymentsSection() {
  const [selected, setSelected] = useState('PAG-7001')
  const [resolution, setResolution] = useState('Reembolsar')
  const [action, setAction] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState(false)
  const [resolvedNotice, setResolvedNotice] = useState('')
  const [payments, setPayments] = useState<AdminPaymentRow[]>(INITIAL_ADMIN_PAYMENTS)
  const disputeStatus = payments.find((payment) => payment.payment === 'PAG-7001')?.status ?? 'En disputa'

  return (
    <div>
      <div className="flex items-start justify-between"><div><h1 className="text-[28px] font-bold">Pagos y disputas</h1><p className="text-g600">Operaciones en MXN · corte del 23 de noviembre de 2026, UTC-6.</p></div>{resolvedNotice && <div className="w-96"><Toast kind="ok" text={resolvedNotice} /></div>}</div>
      <section className="mt-5 grid grid-cols-4 gap-3"><KpiCard label="Volumen hoy" value="$46,500" detail="186 operaciones" icon={CircleDollarSign} /><KpiCard label="Fondos retenidos" value={disputeStatus === 'En disputa' ? '$18,925' : '$18,650'} detail="48 h de protección" icon={Lock} tone="warn" /><KpiCard label="Disputas abiertas" value={disputeStatus === 'En disputa' ? '7' : '6'} detail={disputeStatus === 'En disputa' ? '$2,145.00 MXN' : '$1,870.00 MXN'} icon={AlertTriangle} tone={disputeStatus === 'En disputa' ? 'err' : 'neutral'} /><KpiCard label="Reembolsos" value={disputeStatus === 'Reembolsado' ? '$3,755' : '$3,480'} detail="Últimos 30 días" icon={RotateCcw} /></section>
      <div className="mt-4 grid grid-cols-[1.15fr_1fr] gap-4">
        <ListState count={payments.length} emptyTitle="Sin pagos registrados" emptyDescription="Los pagos y disputas aparecerán cuando existan operaciones." emptyAction="Actualizar pagos" onEmptyAction={() => setSelected('PAG-7001')} loadingLabel="Cargando pagos y disputas">
        <section className="overflow-hidden rounded-card border border-g200 bg-white shadow-sm">
          <table className="w-full text-left text-[13px]"><thead className="bg-g100 text-[12px] text-g600"><tr><th className="p-3">Pago / reserva</th><th className="p-3">Partes</th><th className="p-3">Monto</th><th className="p-3">Estado</th></tr></thead><tbody className="divide-y divide-g200">{payments.map((payment) => <tr key={payment.payment} onClick={() => setSelected(payment.payment)} className={cx('cursor-pointer', selected === payment.payment && 'bg-info-bg')}><td className="p-3"><p className="font-bold">{payment.payment}</p><p className="text-g600">{payment.reservation}</p>{payment.series && <p className="mt-1 font-semibold text-err">{payment.series}</p>}</td><td className="p-3">{payment.people}</td><td className="p-3 font-bold">{payment.amount} MXN</td><td className="p-3"><StatusChip status={payment.status} /></td></tr>)}</tbody></table>
        </section>
        </ListState>
        <aside className="rounded-card border border-g200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between"><div><p className="text-[12px] font-semibold text-g600">DSP-0892 · PAG-7001 · RES-1001</p><h2 className="text-[20px] font-bold">Detalle de disputa</h2><p>Sofía Mena (Alumno) · Carlos Chan (Tutor)</p></div><StatusChip status={disputeStatus} /></div>
          <div className={cx('mt-4 flex items-center justify-between rounded-btn p-3', disputeStatus === 'En disputa' ? 'bg-warn-bg text-warn' : 'bg-ok-bg text-ok')}><span className="font-semibold">{disputeStatus === 'En disputa' ? 'Fondos retenidos' : 'Resolución aplicada'}</span><strong className="text-[20px]">$275.00 MXN</strong></div>
          <h3 className="mt-4 font-bold">Línea de tiempo</h3>
          <ol className="mt-2 border-l-2 border-g300 pl-4 text-[12px]">{[['4:00 PM', 'Clase confirmada'], ['4:00 PM', 'Check-in del Alumno'], ['4:15 PM', 'Ventana de 15 min finalizada'], ['4:16 PM', 'Sin check-in del Tutor'], ['4:22 PM', 'Reporte del Alumno']].map(([time, text]) => <li key={`${time}-${text}`} className="relative pb-2 before:absolute before:-left-[21px] before:top-1 before:size-2 before:rounded-full before:bg-ink"><span className="font-bold">{time}</span> · {text}</li>)}</ol>
          <div className="mt-2 grid grid-cols-2 gap-2"><div className="rounded-btn bg-ok-bg p-3 text-ok"><CheckCircle2 size={17} aria-hidden /><p className="mt-1 font-bold">Check-in Alumno</p><p className="text-[12px]">3:59 PM · confirmado</p></div><div className="rounded-btn bg-err-bg p-3 text-err"><XCircle size={17} aria-hidden /><p className="mt-1 font-bold">Check-in Tutor</p><p className="text-[12px]">No registrado</p></div></div>
          <div className="mt-2 rounded-btn border border-g200 p-3"><p className="flex items-center gap-2 font-bold"><MessageSquare size={17} aria-hidden />Chat asociado</p><p className="mt-1 text-[12px] text-g600">“Estoy conectado, ¿iniciamos?” · Alumno, 4:07 PM</p><p className="text-[12px] text-g600">Sin respuesta del Tutor.</p></div>
          <div className="mt-3 rounded-btn border border-info bg-info-bg p-3 text-info"><p className="font-bold">Resolución sugerida automática</p><p>Sin check-in del tutor: reembolso al alumno</p><select aria-label="Resolución elegida" value={resolution} onChange={(event) => setResolution(event.target.value)} className="mt-2 min-h-11 w-full rounded-btn border border-info bg-white px-3 text-ink"><option>Reembolsar</option><option>Liberar</option><option>Reembolso parcial</option></select></div>
          {disputeStatus === 'En disputa' ? <div className="mt-3 grid grid-cols-3 gap-2"><Button className="!px-2" onClick={() => setAction('Reembolsar')}>Reembolsar</Button><Button variant="secondary" className="!px-2" onClick={() => setAction('Liberar')}>Liberar</Button><Button variant="secondary" className="!px-2" onClick={() => setAction('Reembolso parcial')}>Parcial</Button></div> : <p className="mt-3 flex items-center gap-2 rounded-btn bg-ok-bg p-3 font-semibold text-ok"><CheckCircle2 size={18} aria-hidden />DSP-0892 cerrada y ambas partes notificadas.</p>}
        </aside>
      </div>
      {action && <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-6"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-card bg-white p-6 shadow-xl"><h2 className="text-[20px] font-bold">{action} fondos</h2><p className="mt-1 text-g600">Confirma la resolución de DSP-0892. Se avisará al Alumno y al Tutor.</p><label htmlFor="resolution-note" className="mt-4 block text-[12px] font-semibold text-g700">Nota obligatoria</label><textarea id="resolution-note" rows={4} value={note} onChange={(event) => { setNote(event.target.value); setError(false) }} className={cx('mt-1 w-full rounded-btn border p-3', error ? 'border-2 border-err' : 'border-g500')} placeholder="Explica la evidencia y el monto de la resolución." />{action === 'Reembolso parcial' && <label className="mt-3 block text-[12px] font-semibold text-g700">Monto parcial (MXN)<input defaultValue="137.50" inputMode="decimal" className="mt-1 min-h-11 w-full rounded-btn border border-g500 px-3 text-[16px]" /></label>}{error && <p className="mt-1 font-semibold text-err">Agrega una nota antes de confirmar.</p>}<div className="mt-5 flex justify-end gap-2"><Button variant="text" onClick={() => setAction(null)}>Cancelar</Button><Button onClick={() => { if (note.trim().length < 10) { setError(true); return }; const nextStatus: PaymentStatus = action === 'Liberar' ? 'Liberado' : 'Reembolsado'; setPayments((current) => current.map((payment) => payment.payment === 'PAG-7001' ? { ...payment, status: nextStatus, series: `Serie semanal · clase 2 de 4 · ${action.toLowerCase()}` } : payment)); setResolvedNotice(`DSP-0892 resuelta: ${action.toLowerCase()}. Se notificó a ambas partes.`); window.setTimeout(() => setResolvedNotice(''), 2400); setAction(null); setNote('') }}>Confirmar y avisar a ambos</Button></div></div></div>}
    </div>
  )
}

function CommissionsSection() {
  const [tab, setTab] = useState<'rules' | 'history'>('rules')
  const [commission, setCommission] = useState(15)
  const [studentFee, setStudentFee] = useState(10)
  const [modal, setModal] = useState(false)
  const adjust = (value: number, delta: number) => Math.min(30, Math.max(0, value + delta))
  return (
    <div>
      <div><h1 className="text-[28px] font-bold">Comisiones y planes</h1><p className="text-g600">Configura tarifas, retenciones y políticas en MXN.</p></div>
      <div className="mt-5 flex gap-2 border-b border-g300" role="tablist"><button role="tab" aria-selected={tab === 'rules'} onClick={() => setTab('rules')} className={cx('min-h-12 border-b-2 px-5 font-semibold', tab === 'rules' ? 'border-ink' : 'border-transparent text-g600')}>Tarifas y planes</button><button role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')} className={cx('min-h-12 border-b-2 px-5 font-semibold', tab === 'history' ? 'border-ink' : 'border-transparent text-g600')}>Historial de tarifas</button></div>
      {tab === 'rules' ? <div className="mt-4 grid grid-cols-[1.2fr_1fr] gap-4">
        <div className="flex flex-col gap-4">
          <section className="rounded-card border border-g200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><SlidersHorizontal size={20} aria-hidden /><h2 className="text-[18px] font-bold">Reglas de cobro</h2></div><div className="mt-4 grid grid-cols-2 gap-3">
            {[['Comisión al Tutor', commission, setCommission], ['Cargo al Alumno', studentFee, setStudentFee]].map(([label, value, setter]) => <div key={label as string} className="rounded-btn border border-g200 p-4"><p className="text-[12px] font-semibold text-g600">{label as string}</p><div className="mt-2 flex items-center justify-between"><button aria-label={`Reducir ${label}`} onClick={() => (setter as typeof setCommission)(adjust(value as number, -0.5))} className="grid size-11 place-items-center rounded-btn border border-g300"><Minus size={17} /></button><strong className="text-[24px] tabular-nums">{value as number}%</strong><button aria-label={`Aumentar ${label}`} onClick={() => (setter as typeof setCommission)(adjust(value as number, 0.5))} className="grid size-11 place-items-center rounded-btn border border-g300"><Plus size={17} /></button></div><input aria-label={`${label} de 0 a 30%`} type="range" min="0" max="30" step="0.5" value={value as number} onChange={(event) => (setter as typeof setCommission)(Number(event.target.value))} className="mt-3 w-full accent-ink" /><p className="text-center text-[12px] text-g600">0% a 30% · pasos de 0.5%</p></div>)}
            <div className="rounded-btn border border-g200 p-4"><p className="text-[12px] text-g600">Retención</p><p className="mt-1 text-[22px] font-bold">48 h</p><p className="text-[12px] text-g600">Después de la clase</p></div><div className="rounded-btn border border-g200 p-4"><p className="text-[12px] text-g600">Descuento máximo en paquetes</p><p className="mt-1 text-[22px] font-bold">20%</p><p className="text-[12px] text-g600">Sobre la tarifa regular</p></div>
          </div><div className="mt-3 rounded-btn bg-g100 p-4"><p className="font-bold">Política de cancelación</p><p className="mt-1">Reembolso total con más de 24 h · 50% con menos de 24 h.</p></div><Button className="mt-4" onClick={() => setModal(true)}>Guardar cambios</Button></section>
          <section className="rounded-card border border-g200 bg-white p-5 shadow-sm"><h2 className="text-[18px] font-bold">Planes editables</h2><div className="mt-3 grid grid-cols-2 gap-3"><article className="rounded-btn border border-g300 p-4"><p className="font-bold">Estándar</p><p className="text-[22px] font-bold">$0 MXN</p><p className="text-g600">15% de comisión</p><Button variant="secondary" className="mt-3">Editar plan</Button></article><article className="rounded-btn border-2 border-ink p-4"><p className="font-bold">Tutor Destacado</p><p className="text-[22px] font-bold">$299 MXN</p><p className="text-g600">5% de comisión</p><Button variant="secondary" className="mt-3">Editar plan</Button></article></div></section>
        </div>
        <aside className="h-fit rounded-card bg-ink p-6 text-white shadow-sm"><p className="text-[12px] font-semibold text-g300">Simulador · clase de $250.00 MXN</p><h2 className="mt-1 text-[22px] font-bold">Distribución del cobro</h2><dl className="mt-5 flex flex-col gap-4"><div className="flex justify-between border-b border-g700 pb-3"><dt>Paga el Alumno</dt><dd className="text-[20px] font-bold">$275.00</dd></div><div className="flex justify-between border-b border-g700 pb-3"><dt>Recibe el Tutor</dt><dd className="text-[20px] font-bold">$212.50</dd></div><div className="flex justify-between"><dt>Recibe la plataforma</dt><dd className="text-[20px] font-bold">$62.50</dd></div></dl><p className="mt-5 rounded-btn bg-g700 p-3 text-[12px] text-g200">Valores con comisión al Tutor de 15% y cargo al Alumno de 10%. Todos los importes están en MXN.</p></aside>
      </div> : <section className="mt-4 overflow-hidden rounded-card border border-g200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-g200 p-5"><History size={20} aria-hidden /><h2 className="text-[18px] font-bold">Historial de tarifas</h2></div><table className="w-full text-left"><thead className="bg-g100 text-[12px] text-g600"><tr><th className="p-3">Fecha efectiva</th><th className="p-3">Cambio</th><th className="p-3">Admin</th><th className="p-3">Estado</th></tr></thead><tbody className="divide-y divide-g200"><tr><td className="p-4">1 nov 2026 · 00:00 UTC-6</td><td className="p-4">Comisión Estándar: 12.5% → 15%</td><td className="p-4">Ana Méndez</td><td className="p-4"><span className="font-semibold text-ok">Aplicado</span></td></tr><tr><td className="p-4">15 oct 2026 · 00:00 UTC-6</td><td className="p-4">Retención: 24 h → 48 h</td><td className="p-4">Rubén Díaz</td><td className="p-4"><span className="font-semibold text-ok">Aplicado</span></td></tr></tbody></table></section>}
      {modal && <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-6"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-card bg-white p-6 shadow-xl"><h2 className="text-[20px] font-bold">Confirmar nuevas tarifas</h2><p className="mt-2 rounded-btn border border-warn bg-warn-bg p-4 font-semibold text-warn">Aplicará a clases reservadas desde las 00:00 (UTC-6).</p><p className="mt-3 text-g600">Las reservas existentes conservarán las condiciones vigentes al momento de reservar.</p><div className="mt-5 flex justify-end gap-2"><Button variant="text" onClick={() => setModal(false)}>Cancelar</Button><Button onClick={() => setModal(false)}>Confirmar cambios</Button></div></div></div>}
    </div>
  )
}

function GenericAdminSection({ section }: { section: AdminSection }) {
  const sections: Partial<Record<AdminSection, [string, string, typeof Gavel]>> = {
    moderation: ['Moderación', 'Reportes de conducta, contenido y contacto externo.', Gavel],
    payments: ['Pagos y disputas', 'Pagos retenidos, reembolsos y casos como DSP-0892.', CreditCard],
    commissions: ['Comisiones y planes', 'Reglas de 15% Estándar y 5% Tutor Destacado.', CircleDollarSign],
    metrics: ['Métricas', 'Reservas, conversión, retención e ingresos en MXN.', BarChart3],
    settings: ['Ajustes', 'Seguridad, permisos, notificaciones y políticas.', Settings],
  }
  const content = sections[section]
  if (!content) return null
  const [title, detail, Icon] = content
  return (
    <div><h1 className="text-[28px] font-bold">{title}</h1><p className="text-g600">{detail}</p><section className="mt-5 grid grid-cols-3 gap-4">{['Pendientes', 'En revisión', 'Resueltos'].map((label, index) => <article key={label} className="rounded-card border border-g200 bg-white p-5 shadow-sm"><Icon size={22} aria-hidden /><p className="mt-4 text-[13px] font-semibold text-g600">{label}</p><p className="mt-1 text-[26px] font-bold">{[7, 12, 84][index]}</p><button className="mt-3 min-h-11 font-semibold underline underline-offset-4">Ver registros</button></article>)}</section></div>
  )
}

export function AdminApp({
  sessions,
  draftEmail,
  draftPassword,
  onBackFromLogin,
  onSwitchRoleFromLogin,
  onLogoutToLogin,
}: {
  sessions: ClassSession[]
  draftEmail?: string
  draftPassword?: string
  onBackFromLogin?: () => void
  onSwitchRoleFromLogin?: (role: 'alumno' | 'tutor', draft: { email: string; password: string }) => void
  onLogoutToLogin?: () => void
}) {
  const session = useAuthSession()
  const authenticated = session?.role === 'admin'
  const [section, setSection] = useState<AdminSection>('home')
  const [globalQuery, setGlobalQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const handleAdminLogout = async () => {
    setUserMenuOpen(false)
    setSection('home')
    try {
      await logout()
      onLogoutToLogin?.()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo cerrar la sesión.')
    }
  }

  if (!authenticated) {
    return (
      <AdminLogin
        initialEmail={draftEmail}
        initialPassword={draftPassword}
        onBack={onBackFromLogin}
        onSwitchRole={onSwitchRoleFromLogin}
      />
    )
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-white">
      <aside className={cx('flex shrink-0 flex-col bg-ink text-white transition-all', sidebarOpen ? 'w-64' : 'w-20')}>
        <div className="flex h-16 items-center gap-3 border-b border-g700 px-4"><span className="grid size-10 shrink-0 place-items-center rounded-btn bg-white text-ink"><ShieldCheck size={21} aria-hidden /></span>{sidebarOpen && <div><p className="font-bold">TutorClick</p><p className="text-[12px] text-g300">Panel Admin</p></div>}</div>
        <nav aria-label="Secciones de Admin" className="flex flex-1 flex-col gap-1 p-3">
          {SIDEBAR_ITEMS.map(([key, label, Icon]) => (
            <button key={key} type="button" onClick={() => setSection(key)} aria-current={section === key ? 'page' : undefined} className={cx('flex min-h-12 items-center gap-3 rounded-btn px-3 text-left font-semibold', section === key ? 'bg-white text-ink' : 'text-g200 hover:bg-g700')}>
              <Icon size={20} className="shrink-0" aria-hidden />{sidebarOpen && label}
            </button>
          ))}
        </nav>
        <button type="button" onClick={handleAdminLogout} className="m-3 flex min-h-12 items-center gap-3 rounded-btn px-3 font-semibold text-g200 hover:bg-g700"><Lock size={20} aria-hidden />{sidebarOpen && 'Cerrar sesión'}</button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-g200 bg-white px-5">
          <button type="button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Alternar sidebar" className="grid size-11 place-items-center rounded-full hover:bg-g100"><Menu size={22} aria-hidden /></button>
          <div className="relative max-w-xl flex-1"><Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-g500" aria-hidden /><input value={globalQuery} onChange={(e) => setGlobalQuery(e.target.value)} placeholder="Buscar usuarios, reservas, pagos o disputas" aria-label="Búsqueda global" className="min-h-11 w-full rounded-btn border border-g500 bg-g50 pl-10 pr-4 outline-none focus:border-ink" /></div>
          <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-g100 px-3 text-[12px] font-semibold"><Clock size={14} aria-hidden /> Mérida (UTC-6)</span>
          <button type="button" className="relative grid size-11 place-items-center rounded-full hover:bg-g100" aria-label="Notificaciones"><Bell size={21} aria-hidden /><span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-err text-[11px] font-bold text-white">7</span></button>
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              onClick={() => setUserMenuOpen((open) => !open)}
              className="flex min-h-11 items-center gap-2.5 rounded-btn border border-g200 bg-white px-3 py-1.5 text-left hover:border-ink hover:bg-g50"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-bold text-white" aria-hidden>AM</span>
              <span>
                <span className="block text-[14px] font-semibold leading-tight text-ink">Ana Méndez</span>
                <span className="block text-[12px] leading-tight text-g600">Admin de operaciones</span>
              </span>
              <ChevronDown size={16} className="shrink-0 text-g600" aria-hidden />
            </button>
            {userMenuOpen && (
              <div
                role="menu"
                aria-label="Menú de usuario"
                className="absolute right-0 top-full z-40 mt-2 w-56 rounded-card border border-g200 bg-white p-1.5 shadow-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleAdminLogout}
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-btn px-3 text-left text-[14px] font-semibold text-err hover:bg-err-bg"
                >
                  <Lock size={17} aria-hidden />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto bg-g50 p-6">
          {globalQuery && <div role="status" className="mb-4 flex items-center justify-between rounded-btn border border-info bg-info-bg p-3 text-info"><span className="flex items-center gap-2 font-semibold"><Search size={17} aria-hidden /> Búsqueda global: “{globalQuery}”</span><button type="button" onClick={() => setGlobalQuery('')} className="grid size-9 place-items-center" aria-label="Limpiar búsqueda"><X size={17} /></button></div>}
          {section === 'home' && <AdminHome onNavigate={setSection} />}
          {section === 'users' && <UsersSection sessions={sessions} />}
          {section === 'verification' && <VerificationSection />}
          {section === 'moderation' && <ModerationSection />}
          {section === 'payments' && <PaymentsSection />}
          {section === 'commissions' && <CommissionsSection />}
          {!['home', 'users', 'verification', 'moderation', 'payments', 'commissions'].includes(section) && <GenericAdminSection section={section} />}
        </main>
      </div>
    </div>
  )
}
