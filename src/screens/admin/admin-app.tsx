import { useEffect, useMemo, useState } from 'react'
import {
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
import type { ChipKey } from '../../components/ui/ds'
import { AuthFeedbackAlert, DemoCredentialsBlock } from '../alumno/auth'
import { ListState } from '../../components/ui/list-state'
import {
  INITIAL_ADMIN_PAYMENTS,
  INITIAL_REPORTED_PROFILES,
  INITIAL_REPORTED_REVIEWS,
  INITIAL_USERS,
  formatMoney,
} from '../../data/mock'
import type {
  AdminPaymentRow,
  AdminUserRecord as AdminUser,
  ClassSession,
  PaymentStatus,
} from '../../types'
import {
  createTutorCredentialUrl,
  listTutorCredentialReviews,
  reviewTutorCredentials,
  type TutorCredentialReviewRecord,
  type TutorCredentialReviewStatus,
} from '../../services/perfiles'
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
  const today = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'full',
    timeZone: 'America/Merida',
  }).format(new Date())
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] font-bold">Inicio</h1>
        <p className="text-g600">{today} · Mérida</p>
      </div>
      <section className="grid grid-cols-5 gap-3">
        <KpiCard label="Usuarios activos" value="0" detail="Sin datos disponibles" icon={Users} />
        <KpiCard label="Clases hoy" value="0" detail="Sin datos disponibles" icon={CalendarIcon} />
        <KpiCard label="Ingresos MXN" value="$0.00" detail="Sin operaciones registradas" icon={CircleDollarSign} />
        <KpiCard label="Comisiones" value="$0.00" detail="Sin operaciones registradas" icon={CreditCard} />
        <KpiCard label="Disputas abiertas" value="0" detail="Sin disputas registradas" icon={AlertTriangle} />
      </section>
      <div className="grid grid-cols-[1.7fr_1fr] gap-4">
        <section className="rounded-card border border-g200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div><h2 className="text-[18px] font-bold">Ingresos de los últimos 30 días</h2><p className="text-[12px] text-g600">Cobros procesados en MXN</p></div>
            <p className="text-[22px] font-bold">$0.00 MXN</p>
          </div>
          <div className="mt-5 grid h-52 place-items-center border border-dashed border-g300 text-g600">
            Aún no hay datos para mostrar.
          </div>
        </section>
        <section className="rounded-card border border-g200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-[18px] font-bold">Pendientes</h2><span className="rounded-full bg-g100 px-3 py-1 font-bold text-g700">0</span></div>
          <div className="mt-3 flex flex-col gap-2">
            {[
              ['Credenciales', '0 expedientes', 'verification'],
              ['Reportes', '0 reportes', 'moderation'],
              ['Disputas', '0 pagos retenidos', 'payments'],
            ].map(([title, detail, section]) => (
              <button key={title as string} type="button" onClick={() => onNavigate(section as AdminSection)} className="flex min-h-16 items-center justify-between rounded-btn border border-g200 bg-g50 p-3 text-left">
                <span><span className="block font-bold">{title as string}</span><span className="text-[12px] text-g600">{detail as string}</span></span>
                <ChevronRight size={18} aria-hidden />
              </button>
            ))}
          </div>
        </section>
      </div>
      <section className="rounded-card border border-g200 bg-white p-5 shadow-sm">
        <h2 className="text-[18px] font-bold">Actividad reciente</h2>
        <p className="mt-3 rounded-btn bg-g50 p-4 text-g600">Aún no hay actividad registrada.</p>
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
          emptyTitle="No hay usuarios para mostrar"
          emptyDescription="El listado de cuentas todavía no está conectado a Supabase."
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
  const [records, setRecords] = useState<TutorCredentialReviewRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [checks, setChecks] = useState({ name: false, title: false, license: false })
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [openingPath, setOpeningPath] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(null)
    void listTutorCredentialReviews()
      .then((items) => {
        if (!active) return
        setRecords(items)
        setSelectedId((current) =>
          current && items.some((item) => item.userId === current)
            ? current
            : items[0]?.userId ?? null,
        )
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los expedientes.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [refreshKey])

  const selected = records.find((item) => item.userId === selectedId) ?? null
  const allChecked =
    checks.name &&
    checks.title &&
    checks.license &&
    Boolean(selected?.titleDocumentPath && selected.licenseDocumentPath)
  const canDecide =
    selected?.verificationStatus === 'pending' || selected?.verificationStatus === 'in_review'
  const statusLabels: Record<TutorCredentialReviewStatus, ChipKey> = {
    pending: 'Pendiente',
    in_review: 'En revisión',
    verified: 'Verificado',
    rejected: 'Rechazado',
  }

  async function openDocument(path: string) {
    setOpeningPath(path)
    setActionError(null)
    let viewer: Window | null = null
    try {
      viewer = window.open('about:blank', '_blank')
      if (!viewer) throw new Error('Permite ventanas emergentes para abrir el documento.')
      viewer.opener = null
      const url = await createTutorCredentialUrl(path)
      viewer.location.href = url
    } catch (error) {
      viewer?.close()
      setActionError(error instanceof Error ? error.message : 'No se pudo abrir el documento.')
    } finally {
      setOpeningPath(null)
    }
  }

  async function saveDecision(
    status: Extract<TutorCredentialReviewStatus, 'verified' | 'rejected'>,
    rejectionReason?: string,
  ) {
    if (!selected) return
    setSaving(true)
    setActionError(null)
    try {
      await reviewTutorCredentials(selected.userId, status, rejectionReason)
      setRecords((current) =>
        current.map((item) =>
          item.userId === selected.userId
            ? {
                ...item,
                verificationStatus: status,
                reviewedAt: new Date().toISOString(),
                rejectionReason: status === 'rejected' ? rejectionReason?.trim() ?? null : null,
              }
            : item,
        ),
      )
      setRejecting(false)
      setReason('')
      setChecks({ name: false, title: false, license: false })
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo guardar la decisión.')
    } finally {
      setSaving(false)
    }
  }

  const header = (
    <div>
      <h1 className="text-[28px] font-bold">Verificación</h1>
      <p className="text-g600">Revisa los documentos privados enviados por los Tutores.</p>
    </div>
  )

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        {header}
        <p role="status" className="mt-5 rounded-card border border-g200 bg-white p-5 text-g600">
          Cargando expedientes…
        </p>
      </div>
    )
  }

  if (loadError || records.length === 0) {
    return (
      <div className="flex h-full flex-col">
        {header}
        {loadError ? (
          <div className="mt-5 rounded-card border border-err bg-err-bg p-5 text-err">
            <p role="alert" className="font-semibold">{loadError}</p>
            <Button className="mt-3" variant="secondary" onClick={() => setRefreshKey((value) => value + 1)}>
              Reintentar
            </Button>
          </div>
        ) : (
          <ListState
            count={0}
            emptyTitle="Sin expedientes pendientes"
            emptyDescription="Los documentos aparecerán aquí cuando los Tutores los envíen."
            loadingLabel="Cargando expedientes"
            className="mt-5 min-h-0 flex-1"
          >
            <div />
          </ListState>
        )}
      </div>
    )
  }

  if (!selected) return null

  const ageHours = selected.submittedAt
    ? Math.max(0, Math.floor((Date.now() - Date.parse(selected.submittedAt)) / 3_600_000))
    : null
  const subjectLabel = selected.subjects.length > 0
    ? selected.subjects.join(', ')
    : 'Sin materias registradas'

  return (
    <div className="flex h-full flex-col">
      {header}
      <div className="mt-5 grid min-h-0 flex-1 grid-cols-[340px_1fr] overflow-hidden rounded-card border border-g200 bg-white shadow-sm">
        <aside className="overflow-y-auto border-r border-g200 bg-g50 p-3">
          <p className="mb-2 px-2 text-[12px] font-semibold text-g600">
            {records.filter((item) => item.verificationStatus === 'pending' || item.verificationStatus === 'in_review').length} expedientes pendientes
          </p>
          <div className="flex flex-col gap-2">
            {records.map((item) => {
              const itemAgeHours = item.submittedAt
                ? Math.max(0, Math.floor((Date.now() - Date.parse(item.submittedAt)) / 3_600_000))
                : null
              const itemCanDecide =
                item.verificationStatus === 'pending' || item.verificationStatus === 'in_review'
              return (
                <button
                  key={item.userId}
                  onClick={() => {
                    setSelectedId(item.userId)
                    setChecks({ name: false, title: false, license: false })
                    setActionError(null)
                  }}
                  className={cx('w-full rounded-btn border p-3 text-left', selectedId === item.userId ? 'border-ink bg-white shadow-sm' : 'border-g200 bg-white')}
                >
                  <div className="flex justify-between gap-2">
                    <p className="truncate font-bold">{item.tutorName}</p>
                    <StatusChip status={statusLabels[item.verificationStatus]} />
                  </div>
                  <p className="mt-1 truncate text-[12px] text-g600">
                    {item.subjects.length > 0 ? item.subjects.join(', ') : 'Sin materias registradas'}
                  </p>
                  {itemAgeHours !== null && itemCanDecide && (
                    <p className={cx('mt-2 flex items-center gap-1 text-[12px] font-bold', itemAgeHours > 48 ? 'text-err' : 'text-g600')}>
                      <Clock size={13} aria-hidden />{itemAgeHours} h en espera{itemAgeHours > 48 && ' · Supera 48 h'}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </aside>
        <main className="grid min-h-0 grid-cols-[1fr_360px]">
          <section className="overflow-y-auto p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-bold">Expediente de {selected.tutorName}</h2>
                <p className="text-g600">{subjectLabel}</p>
              </div>
              <StatusChip status={statusLabels[selected.verificationStatus]} />
            </div>
            {ageHours !== null && (
              <p className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-g600">
                <Clock size={15} aria-hidden /> Enviado hace {ageHours} h
              </p>
            )}
            {actionError && <p role="alert" className="mt-3 rounded-btn border border-err bg-err-bg p-3 font-semibold text-err">{actionError}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {([
                ['title', 'Título profesional', selected.titleDocumentPath],
                ['license', 'Cédula profesional', selected.licenseDocumentPath],
              ] as const).map(([kind, title, path]) => (
                <article key={kind} className="rounded-card border border-g200 p-4">
                  <FileText size={24} aria-hidden />
                  <h3 className="mt-3 font-bold">{title}</h3>
                  <p className="mt-1 truncate text-[12px] text-g600">
                    {path ? path.split('/').pop() : 'Documento no recibido'}
                  </p>
                  {path && (
                    <Button
                      full
                      variant="secondary"
                      className="mt-3"
                      disabled={openingPath === path}
                      onClick={() => void openDocument(path)}
                    >
                      {openingPath === path ? 'Abriendo…' : 'Abrir documento privado'}
                    </Button>
                  )}
                </article>
              ))}
            </div>
            <section className="mt-5 rounded-card border border-g200 p-4">
              <h3 className="font-bold">Datos del Tutor</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
                <div><dt className="text-g600">Nombre</dt><dd className="font-semibold">{selected.tutorName}</dd></div>
                <div><dt className="text-g600">Nivel educativo</dt><dd className="font-semibold">{selected.educationLevel || 'Sin información'}</dd></div>
                <div><dt className="text-g600">Materias</dt><dd className="font-semibold">{subjectLabel}</dd></div>
                <div><dt className="text-g600">Estado de revisión</dt><dd><StatusChip status={statusLabels[selected.verificationStatus]} /></dd></div>
              </dl>
              {selected.rejectionReason && (
                <p className="mt-3 rounded-btn border border-err bg-err-bg p-3 text-[13px] text-err">
                  Motivo de rechazo registrado: {selected.rejectionReason}
                </p>
              )}
            </section>
          </section>
          <aside className="overflow-y-auto border-l border-g200 bg-g50 p-5">
            <h2 className="text-[18px] font-bold">Checklist</h2>
            <p className="mt-1 text-[12px] text-g600">Abre los documentos privados y confirma cada punto.</p>
            <div className="mt-4 flex flex-col gap-2">
              {([
                ['name', 'Nombre coincide', 'El nombre es idéntico en cuenta, título y cédula.'],
                ['title', 'Título revisado', 'Revisaste el documento de título profesional.'],
                ['license', 'Cédula válida', 'El número y datos profesionales son vigentes.'],
              ] as const).map(([key, title, detail]) => (
                <button key={key} type="button" role="checkbox" aria-checked={checks[key]} onClick={() => setChecks((prev) => ({ ...prev, [key]: !prev[key] }))} className={cx('flex min-h-16 items-center gap-3 rounded-btn border p-3 text-left', checks[key] ? 'border-ok bg-ok-bg' : 'border-g300 bg-white')}>
                  {checks[key] ? <CheckCircle2 size={21} className="shrink-0 text-ok" aria-hidden /> : <span className="size-5 shrink-0 rounded border-2 border-g500" />}
                  <span><span className="block font-bold">{title}</span><span className="block text-[12px] text-g600">{detail}</span></span>
                </button>
              ))}
            </div>
            {!selected.titleDocumentPath || !selected.licenseDocumentPath ? (
              <p className="mt-4 rounded-btn border border-warn bg-warn-bg p-3 text-[12px] font-semibold text-warn">
                Para aprobar, el Tutor debe enviar ambos documentos.
              </p>
            ) : null}
            <Button
              full
              icon={BadgeCheck}
              className="mt-5"
              disabled={!canDecide || !allChecked || saving}
              onClick={() => void saveDecision('verified')}
            >
              {saving ? 'Guardando…' : 'Aprobar y otorgar insignia'}
            </Button>
            <Button
              full
              variant="destructive"
              className="mt-2"
              disabled={!canDecide || saving}
              onClick={() => { setRejecting(true); setReason(''); setReasonError(false) }}
            >
              Rechazar
            </Button>
          </aside>
        </main>
      </div>
      {rejecting && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-6">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-card bg-white p-6 shadow-xl">
            <h2 className="text-[20px] font-bold">Rechazar expediente</h2>
            <p className="mt-1 text-g600">El motivo quedará guardado para el Tutor.</p>
            <label htmlFor="reject-reason" className="mt-4 block text-[12px] font-semibold text-g700">Motivo obligatorio</label>
            <textarea
              id="reject-reason"
              rows={4}
              maxLength={1000}
              value={reason}
              onChange={(event) => { setReason(event.target.value); setReasonError(false) }}
              className={cx('mt-1 w-full rounded-btn border p-3', reasonError ? 'border-2 border-err' : 'border-g500')}
              placeholder="Describe qué documento o dato debe corregirse."
            />
            {reasonError && <p className="mt-1 font-semibold text-err">Escribe un motivo antes de rechazar.</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="text" disabled={saving} onClick={() => setRejecting(false)}>Cancelar</Button>
              <Button
                variant="destructive"
                disabled={saving}
                onClick={() => {
                  if (!reason.trim()) {
                    setReasonError(true)
                    return
                  }
                  void saveDecision('rejected', reason)
                }}
              >
                {saving ? 'Guardando…' : 'Rechazar y guardar motivo'}
              </Button>
            </div>
          </div>
        </div>
      )}
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
        <button role="tab" aria-selected={tab === 'profiles'} onClick={() => setTab('profiles')} className={cx('min-h-12 border-b-2 px-5 font-semibold', tab === 'profiles' ? 'border-ink text-ink' : 'border-transparent text-g600')}>Perfiles reportados <span className="ml-1 rounded-full bg-err-bg px-2 py-1 text-[12px] text-err">{profiles.length}</span></button>
        <button role="tab" aria-selected={tab === 'reviews'} onClick={() => setTab('reviews')} className={cx('min-h-12 border-b-2 px-5 font-semibold', tab === 'reviews' ? 'border-ink text-ink' : 'border-transparent text-g600')}>Reseñas <span className="ml-1 rounded-full bg-warn-bg px-2 py-1 text-[12px] text-warn">{reviews.length}</span></button>
      </div>

      {tab === 'profiles' ? (
        profiles.length > 0 ? <div className="mt-4 grid grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <article key={profile.id} className="rounded-card border border-g200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between"><div><p className="text-[12px] font-semibold text-g600">{profile.id}</p><h2 className="text-[18px] font-bold">{profile.name}</h2></div><span className="rounded-full bg-err-bg px-3 py-1 font-bold text-err">{profile.reports} reportes</span></div>
              <div className="mt-4 rounded-btn border border-err bg-err-bg p-3"><p className="text-[12px] font-semibold text-err">Infracción detectada</p><p className="font-bold text-err">{profile.issue}</p></div>
              <div className="mt-3 rounded-btn border border-g200 bg-g50 p-3"><p className="text-[12px] font-semibold text-g600">Evidencia · {profile.source}</p><p className="mt-1 font-medium">{profile.evidence}</p></div>
              <div className="mt-4 flex flex-wrap gap-2"><Button icon={MessageSquare} onClick={() => openAction('Advertir')}>Advertir</Button><Button variant="destructive" icon={UserX} onClick={() => openAction('Suspender perfil')}>Suspender perfil</Button><Button variant="secondary" onClick={() => openAction('Descartar')}>Descartar</Button></div>
            </article>
          ))}
        </div> : <p className="mt-4 rounded-card border border-dashed border-g300 bg-white p-6 text-center text-g600">No hay perfiles reportados.</p>
      ) : (
        <div className="mt-4">
          <div className="mb-4 flex items-start gap-3 rounded-card border border-info bg-info-bg p-4 text-info"><ShieldCheck size={22} className="shrink-0" aria-hidden /><div><p className="font-bold">Regla de moderación</p><p>Las críticas honestas no se ocultan; solo reseñas con insultos, datos personales o spam.</p></div></div>
          {reviews.length > 0 ? <div className="grid grid-cols-2 gap-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-card border border-g200 bg-white p-5 shadow-sm">
                <div className="flex justify-between"><div><p className="font-bold">{review.author} sobre {review.tutor}</p><p className="text-[12px] text-g600">{review.id}</p></div><span className="font-semibold text-err">{review.reports} {review.reports === 1 ? 'reporte' : 'reportes'}</span></div>
                <blockquote className="my-4 rounded-btn bg-g100 p-4 font-medium">“{review.text}”</blockquote>
                <p className="text-[12px] font-semibold text-g600">Evaluación</p><p className={cx('font-bold', review.issue === 'Crítica honesta' ? 'text-ok' : 'text-err')}>{review.issue}</p>
                <div className="mt-4 flex gap-2"><Button icon={Check} onClick={() => openAction('Mantener')}>Mantener</Button><Button variant="destructive" onClick={() => openAction('Ocultar')}>Ocultar</Button></div>
              </article>
            ))}
          </div> : <p className="rounded-card border border-dashed border-g300 bg-white p-6 text-center text-g600">No hay reseñas reportadas.</p>}
        </div>
      )}

      {action && <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-6"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-card bg-white p-6 shadow-xl"><h2 className="text-[20px] font-bold">Confirmar: {action}</h2><p className="mt-1 text-g600">La decisión quedará registrada y se notificará a la persona correspondiente.</p><label htmlFor="moderation-reason" className="mt-4 block text-[12px] font-semibold text-g700">Motivo obligatorio</label><textarea id="moderation-reason" rows={4} value={reason} onChange={(event) => { setReason(event.target.value); setError(false) }} className={cx('mt-1 w-full rounded-btn border p-3 outline-none', error ? 'border-2 border-err' : 'border-g500')} placeholder="Describe la evidencia y la regla aplicada." />{error && <p className="mt-1 font-semibold text-err">Escribe un motivo claro para continuar.</p>}<div className="mt-5 flex justify-end gap-2"><Button variant="text" onClick={() => setAction(null)}>Cancelar</Button><Button variant={action === 'Suspender perfil' || action === 'Ocultar' ? 'destructive' : 'primary'} onClick={() => { if (reason.trim().length < 10) { setError(true); return }; setNotice(`${action} aplicado correctamente.`); setAction(null) }}>Confirmar acción</Button></div></div></div>}
    </div>
  )
}

function PaymentsSection() {
  const payments: AdminPaymentRow[] = []

  return (
    <div>
      <div><h1 className="text-[28px] font-bold">Pagos y disputas</h1><p className="text-g600">Los datos aparecerán cuando los pagos estén conectados.</p></div>
      <section className="mt-5 grid grid-cols-4 gap-3">
        <KpiCard label="Volumen hoy" value="$0.00" detail="Sin operaciones registradas" icon={CircleDollarSign} />
        <KpiCard label="Fondos retenidos" value="$0.00" detail="Sin operaciones registradas" icon={Lock} />
        <KpiCard label="Disputas abiertas" value="0" detail="Sin disputas registradas" icon={AlertTriangle} />
        <KpiCard label="Reembolsos" value="$0.00" detail="Sin reembolsos registrados" icon={RotateCcw} />
      </section>
      <div className="mt-4 grid grid-cols-[1.15fr_1fr] gap-4">
        <ListState count={payments.length} emptyTitle="Sin pagos registrados" emptyDescription="Los pagos y disputas aparecerán aquí cuando se conecte la pasarela de pago." loadingLabel="Cargando pagos y disputas">
          <div />
        </ListState>
        <aside className="grid min-h-48 place-items-center rounded-card border border-dashed border-g300 bg-white p-5 text-center text-g600">
          Selecciona un pago cuando haya operaciones registradas.
        </aside>
      </div>
    </div>
  )
}

function CommissionsSection() {
  return (
    <section>
      <h1 className="text-[28px] font-bold">Comisiones y planes</h1>
      <p className="text-g600">La configuración de tarifas y planes todavía no está conectada.</p>
      <p className="mt-5 rounded-card border border-dashed border-g300 bg-white p-6 text-center text-g600">
        No hay reglas ni cambios registrados.
      </p>
    </section>
  )
}

function GenericAdminSection({ section }: { section: AdminSection }) {
  const sections: Partial<Record<AdminSection, [string, string, typeof Gavel]>> = {
    moderation: ['Moderación', 'Reportes de conducta, contenido y contacto externo.', Gavel],
    payments: ['Pagos y disputas', 'Los datos aparecerán cuando los pagos estén conectados.', CreditCard],
    commissions: ['Comisiones y planes', 'La configuración de tarifas todavía no está conectada.', CircleDollarSign],
    metrics: ['Métricas', 'Reservas, conversión, retención e ingresos en MXN.', BarChart3],
    settings: ['Ajustes', 'Seguridad, permisos, notificaciones y políticas.', Settings],
  }
  const content = sections[section]
  if (!content) return null
  const [title, detail, Icon] = content
  return (
    <div><h1 className="text-[28px] font-bold">{title}</h1><p className="text-g600">{detail}</p><section className="mt-5 rounded-card border border-dashed border-g300 bg-white p-6 text-center text-g600">No hay información registrada.</section></div>
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
  const adminName = session?.fullName || session?.email || 'Admin'
  const adminInitials = adminName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
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
          <button type="button" className="grid size-11 place-items-center rounded-full hover:bg-g100" aria-label="Notificaciones"><Bell size={21} aria-hidden /></button>
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              onClick={() => setUserMenuOpen((open) => !open)}
              className="flex min-h-11 items-center gap-2.5 rounded-btn border border-g200 bg-white px-3 py-1.5 text-left hover:border-ink hover:bg-g50"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-bold text-white" aria-hidden>{adminInitials}</span>
              <span>
                <span className="block text-[14px] font-semibold leading-tight text-ink">{adminName}</span>
                <span className="block text-[12px] leading-tight text-g600">Administrador</span>
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
