import { useState, type ReactNode } from 'react'
import {
  GraduationCap, Eye, EyeOff, AlertTriangle, ChevronLeft, MapPin, Video, Shuffle, CheckCircle2, Check,
  BookOpen, Mail, ChevronDown, Info, Circle, CircleDot, MailCheck, ShieldCheck, Clock,
} from 'lucide-react'
import { Button } from '../../components/ui/ds'
import {
  DEMO_MODE,
  getDemoCredentials,
  getRoleDisplayLabel,
  loginWithPassword,
  resolvePortalUrl,
  type AuthRole,
  type LoginAttemptResult,
} from '../../services/auth'
import type { RegistrationResult } from '../../services/auth'

const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(' ')
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const lg = size === 'lg'
  return (
    <div className="flex items-center gap-3">
      <span className={cx('grid place-items-center rounded-2xl bg-ink text-white', lg ? 'size-16' : 'size-10')}>
        <GraduationCap size={lg ? 34 : 22} aria-hidden />
      </span>
      <span className={cx('font-bold tracking-tight', lg ? 'text-[32px]' : 'text-[20px]')}>TutorClick</span>
    </div>
  )
}

export function Screen({
  label,
  embedded,
  children,
  footer,
}: {
  label?: string
  embedded?: boolean
  children: ReactNode
  footer?: ReactNode
}) {
  const inner = (
    <div
      className={cx(
        'flex w-full flex-col overflow-hidden bg-white',
        embedded ? 'h-full' : 'h-[844px] w-[390px] max-w-full rounded-[28px] border-4 border-ink',
      )}
    >
      <div className="flex-1 overflow-y-auto px-6 pb-4 pt-6">{children}</div>
      {footer && <div className="border-t border-g200 bg-white px-6 pb-6 pt-4">{footer}</div>}
    </div>
  )
  if (embedded) return inner
  return (
    <figure className="flex flex-col gap-2">
      {label && <figcaption className="text-[12px] font-semibold text-g600">{label}</figcaption>}
      {inner}
    </figure>
  )
}

function Back({ label = 'Volver', onClick }: { label?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-ml-3 mb-4 flex min-h-11 items-center gap-1 rounded-btn px-3 font-semibold hover:bg-g100"
    >
      <ChevronLeft size={20} aria-hidden />{label}
    </button>
  )
}
const Title = ({ children, sub }: { children: ReactNode; sub?: string }) => (
  <div className="mb-6">
    <h1 className="text-[28px] font-bold leading-tight">{children}</h1>
    {sub && <p className="mt-2 text-[16px] text-g600">{sub}</p>}
  </div>
)

function FieldShell({ id, label, error, help, children }: { id: string; label: string; error?: string; help?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold text-g700">{label}</label>
      {children}
      {error ? (
        <p id={id + '-m'} role="alert" className="flex items-start gap-1.5 text-[14px] font-medium text-err"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />{error}</p>
      ) : help ? <p id={id + '-m'} className="text-[14px] text-g600">{help}</p> : null}
    </div>
  )
}
const inputCls = (err?: string) =>
  cx('min-h-12 w-full rounded-btn border bg-white px-4 text-[14px] outline-none placeholder:text-g500 focus:border-ink focus:ring-4 focus:ring-ink/15',
    err ? 'border-2 border-err' : 'border-g500')

function Field({ id, label, type = 'text', value, onChange, error, help, placeholder, autoComplete }: {
  id: string; label: string; type?: string; value: string; onChange: (v: string) => void; error?: string; help?: string; placeholder?: string; autoComplete?: string
}) {
  return (
    <FieldShell id={id} label={label} error={error} help={help}>
      <input id={id} type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={id + '-m'} className={inputCls(error)} />
    </FieldShell>
  )
}

function PasswordField({ id, label, value, onChange, error, help, children }: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string; help?: string; children?: ReactNode
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <FieldShell id={id} label={label} error={error} help={help}>
        <div className="relative">
          <input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
            aria-invalid={!!error} aria-describedby={id + '-m'} autoComplete="current-password" className={cx(inputCls(error), 'pr-24')} />
          <button type="button" onClick={() => setShow(!show)} aria-pressed={show}
            className="absolute right-1 top-1/2 flex min-h-11 -translate-y-1/2 items-center gap-1.5 rounded-btn px-3 text-[14px] font-semibold hover:bg-g100">
            {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}{show ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </FieldShell>
      {children}
    </div>
  )
}

function Strength({ value }: { value: string }) {
  const score = !value ? 0 : Math.min(4, (value.length >= 8 ? 1 : 0) + (/[A-Z]/.test(value) ? 1 : 0) + (/\d/.test(value) ? 1 : 0) + (/[^A-Za-z0-9]/.test(value) ? 1 : 0))
  const lvl = !value ? null : score <= 1 ? { t: 'Débil', c: 'text-err', b: 'bg-err', I: AlertTriangle } : score <= 3 ? { t: 'Media', c: 'text-warn', b: 'bg-warn', I: Clock } : { t: 'Fuerte', c: 'text-ok', b: 'bg-ok', I: CheckCircle2 }
  return (
    <div aria-live="polite">
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((n) => <span key={n} className={cx('h-1.5 flex-1 rounded-full', lvl && n <= score ? lvl.b : 'bg-g200')} />)}
      </div>
      <p className={cx('mt-1.5 flex items-center gap-1.5 text-[14px] font-semibold', lvl ? lvl.c : 'text-g600')}>
        {lvl ? <><lvl.I size={16} aria-hidden />Seguridad: {lvl.t}</> : 'Usa 8 caracteres o más, con mayúscula, número y símbolo.'}
      </p>
    </div>
  )
}

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.4z" />
    <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 23.5z" />
    <path fill="#FBBC05" d="M5.6 14.2a6.900 6.900 0 0 1 0-4.400v-3H1.800a11.5 11.5 0 0 0 0 10.4z" />
    <path fill="#EA4335" d="M12 5.400c1.700 0 3.200.6 4.400 1.700l3.300-3.300A11.500 11.500 0 0 0 1.8 6.8l3.800 3C6.500 7.300 9 5.400 12 5.400z" />
  </svg>
)

/* 1. Bienvenida */
export function Welcome({
  embedded,
  onLogin,
  onRegister,
}: {
  embedded?: boolean
  onLogin?: () => void
  onRegister?: () => void
} = {}) {
  return (
    <Screen
      label="1. Bienvenida"
      embedded={embedded}
      footer={
        <div className="flex flex-col gap-3">
          <Button full onClick={onLogin}>Iniciar sesión</Button>
          <Button full variant="secondary" onClick={onRegister}>Crear cuenta</Button>
        </div>
      }
    >
      <div className="flex h-full flex-col justify-center gap-8 pb-8">
        <Logo size="lg" />
        <div>
          <h1 className="text-[32px] font-bold leading-tight">Aprende con un tutor cerca de ti</h1>
          <p className="mt-3 text-[16px] text-g600">Encuentra Tutores en Mérida, presencial o en línea, y paga con seguridad.</p>
        </div>
        <ul className="flex flex-col gap-3">
          {[[BookOpen, 'Reserva instantánea en Matemáticas, Física y más'], [ShieldCheck, 'Pagas ahora; el tutor recibe el pago 48 h después de la clase'], [CheckCircle2, 'Tutores verificados con reseñas reales']].map(([I, t]) => {
            const Ic = I as typeof BookOpen
            return <li key={t as string} className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-g100"><Ic size={20} aria-hidden /></span>{t as string}</li>
          })}
        </ul>
      </div>
    </Screen>
  )
}

/* 2. Iniciar sesión */
export function AuthFeedbackAlert({
  result,
  onSwitchRole,
}: {
  result: Exclude<LoginAttemptResult, { ok: true }>
  onSwitchRole?: (targetRole: AuthRole) => void
}) {
  const roleLabel = result.kind === 'wrong_role' ? getRoleDisplayLabel(result.actualRole) : ''
  return (
    <div
      role="alert"
      className="flex flex-col gap-2.5 rounded-btn border border-err bg-err-bg p-3 text-[14px] font-semibold text-err"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
        <p>{result.kind === 'wrong_role' ? `Esta cuenta es de ${roleLabel}` : result.message}</p>
      </div>
      {result.kind === 'wrong_role' && onSwitchRole && (
        <button
          type="button"
          onClick={() => onSwitchRole(result.actualRole)}
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-btn border-2 border-err bg-white px-3.5 text-[13px] font-bold text-err transition-colors hover:bg-g50"
        >
          Cambiar a {roleLabel}
        </button>
      )}
    </div>
  )
}

export function DemoCredentialsBlock({
  role,
  mode = 'credentials',
  onFill,
  onFillCode,
}: {
  role: AuthRole
  mode?: 'credentials' | 'twoFactor'
  onFill?: (email: string, password: string) => void
  onFillCode?: (code: string) => void
}) {
  if (!DEMO_MODE) return null
  const demo = getDemoCredentials(role)
  if (!demo) return null
  if (mode === 'twoFactor' && !demo.twoFactorCode) return null

  return (
    <section
      aria-label="Datos de ejemplo"
      className="mt-4 rounded-card border border-dashed border-g300 bg-g50 p-3.5 text-[12px] text-g700"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-ink">Datos de ejemplo</p>
        <button
          type="button"
          onClick={() => {
            if (mode === 'twoFactor' && demo.twoFactorCode) {
              onFillCode?.(demo.twoFactorCode)
            } else {
              onFill?.(demo.email, demo.password)
            }
          }}
          className="min-h-11 rounded-btn border border-g300 bg-white px-3 text-[12px] font-semibold text-ink transition-colors hover:border-ink hover:bg-g100"
        >
          Usar datos de ejemplo
        </button>
      </div>
      {mode === 'twoFactor' ? (
        <dl className="mt-1.5 flex gap-1.5 text-g600">
          <dt className="font-semibold text-g700">Código 2FA:</dt>
          <dd className="font-mono tabular-nums">{demo.twoFactorCode}</dd>
        </dl>
      ) : (
        <dl className="mt-1.5 flex flex-col gap-0.5 text-g600">
          <div className="flex gap-1.5">
            <dt className="font-semibold text-g700">Correo:</dt>
            <dd className="truncate font-mono">{demo.email}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="font-semibold text-g700">Contraseña:</dt>
            <dd className="font-mono">{demo.password}</dd>
          </div>
        </dl>
      )}
    </section>
  )
}

export function Login({
  showErrors = false,
  label = 'Iniciar sesión',
  embedded,
  initialRole = 'alumno',
  initialEmail = '',
  initialPassword = '',
  onBack,
  onSuccess,
  onAdminAccess,
  onForgot,
  onRegister,
}: {
  showErrors?: boolean
  label?: string
  embedded?: boolean
  initialRole?: 'alumno' | 'tutor'
  initialEmail?: string
  initialPassword?: string
  onBack?: () => void
  onSuccess?: (role: 'alumno' | 'tutor') => void
  onAdminAccess?: (draft?: { email: string; password: string }) => void
  onForgot?: (role: 'alumno' | 'tutor') => void
  onRegister?: (role: 'alumno' | 'tutor') => void
}) {
  const [role, setRole] = useState<'alumno' | 'tutor'>(initialRole)
  const [email, setEmail] = useState(initialEmail)
  const [pass, setPass] = useState(initialPassword)
  const [sub, setSub] = useState(showErrors)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attemptError, setAttemptError] = useState<Exclude<LoginAttemptResult, { ok: true }> | null>(null)
  const eErr = showErrors && sub ? (!email ? 'Escribe tu correo.' : !emailOk(email) ? 'Escribe un correo válido, por ejemplo ejemplo@correo.com.' : undefined) : undefined
  const pErr = showErrors && sub && !pass ? 'Escribe tu contraseña.' : undefined
  const roleCopy =
    role === 'alumno'
      ? {
          title: 'Iniciar sesión como Alumno',
          sub: 'Aprende con un tutor cerca de ti',
        }
      : {
          title: 'Iniciar sesión como Tutor',
          sub: 'Gestiona tus clases, alumnos e ingresos en un solo lugar',
        }

  async function submitCredentials() {
    setSub(true)
    if (showErrors) return
    setIsSubmitting(true)
    try {
      const result = await loginWithPassword(role, email, pass)
      if (result.ok) {
        setAttemptError(null)
        onSuccess?.(role)
      } else {
        setAttemptError(result)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Screen label={label} embedded={embedded}>
      <div className="flex min-h-full flex-col justify-between">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            submitCredentials()
          }}
          className="flex flex-col"
        >
          <Back onClick={onBack} />
          <div
            role="tablist"
            aria-label="Selecciona tu rol"
            className="mb-5 grid grid-cols-2 gap-1 rounded-btn bg-g100 p-1"
          >
            {(
              [
                ['alumno', 'Alumno'],
                ['tutor', 'Tutor'],
              ] as const
            ).map(([key, roleText]) => {
              const active = role === key
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setRole(key)
                    setAttemptError(null)
                  }}
                  className={cx(
                    'min-h-11 rounded-[10px] text-[14px] font-semibold transition-colors',
                    active ? 'bg-ink text-white shadow-sm' : 'text-g700 hover:text-ink',
                  )}
                >
                  {roleText}
                </button>
              )
            })}
          </div>
          <Title sub={roleCopy.sub}>{roleCopy.title}</Title>
          <div className="flex flex-col gap-5">
            <Field
              id={`${label}-em`}
              label="Correo"
              type="email"
              value={email}
              onChange={(value) => {
                setEmail(value)
                setAttemptError(null)
              }}
              error={eErr}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
            />
            <PasswordField
              id={`${label}-pw`}
              label="Contraseña"
              value={pass}
              onChange={(value) => {
                setPass(value)
                setAttemptError(null)
              }}
              error={pErr}
            />
            <button
              type="button"
              onClick={() => onForgot?.(role)}
              className="-mt-2 flex min-h-11 items-center self-start rounded-btn px-1 font-semibold underline underline-offset-4"
            >
              ¿Olvidaste tu contraseña?
            </button>
            {attemptError && (
              <AuthFeedbackAlert
                result={attemptError}
                onSwitchRole={(targetRole) => {
                  setAttemptError(null)
                  if (targetRole === 'admin') {
                    onAdminAccess?.({ email, password: pass })
                  } else {
                    setRole(targetRole)
                  }
                }}
              />
            )}
            <Button type="submit" full loading={isSubmitting}>Iniciar sesión</Button>
            <p className="text-center text-g600">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => onRegister?.(role)}
                className="min-h-11 font-semibold text-ink underline underline-offset-4"
              >
                Crear cuenta
              </button>
            </p>
          </div>
          <DemoCredentialsBlock
            role={role}
            onFill={(demoEmail, demoPass) => {
              setEmail(demoEmail)
              setPass(demoPass)
              setAttemptError(null)
            }}
          />
        </form>
        <div className="pt-6 text-center">
          <a
            href={resolvePortalUrl('/admin')}
            onClick={(event) => {
              if (onAdminAccess) {
                event.preventDefault()
                onAdminAccess()
              }
            }}
            className="inline-flex min-h-11 items-center text-[12px] font-medium text-g600 underline underline-offset-4 hover:text-ink"
          >
            Acceso administrativo
          </a>
        </div>
      </div>
    </Screen>
  )
}

/* 3a. Elegir rol */
export function RoleChoice({
  embedded,
  initialRole = 'alumno',
  onBack,
  onContinueStudent,
  onContinueTutor,
  onLogin,
}: {
  embedded?: boolean
  initialRole?: 'alumno' | 'tutor'
  onBack?: () => void
  onContinueStudent?: () => void
  onContinueTutor?: () => void
  onLogin?: () => void
} = {}) {
  const [role, setRole] = useState<'alumno' | 'tutor'>(initialRole)
  const opts = [['alumno', 'Soy alumno', 'Quiero encontrar un Tutor y reservar clases.', BookOpen], ['tutor', 'Soy tutor', 'Quiero dar clases y recibir pagos.', GraduationCap]] as const
  return (
    <Screen
      label="3a. Crear cuenta: elegir perfil"
      embedded={embedded}
      footer={
        <Button
          full
          disabled={embedded && role === 'tutor' && !onContinueTutor}
          onClick={() => {
            if (role === 'alumno') onContinueStudent?.()
            else onContinueTutor?.()
          }}
        >
          Continuar
        </Button>
      }
    >
      <Back onClick={onBack} />
      <Title sub="Elige cómo vas a usar TutorClick.">Crear cuenta</Title>
      <div
        role="tablist"
        aria-label="Selecciona tu rol para crear cuenta"
        className="mb-4 grid grid-cols-2 gap-1 rounded-btn bg-g100 p-1"
      >
        {(
          [
            ['alumno', 'Alumno'],
            ['tutor', 'Tutor'],
          ] as const
        ).map(([key, roleText]) => {
          const active = role === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRole(key)}
              className={cx(
                'min-h-11 rounded-[10px] text-[14px] font-semibold transition-colors',
                active ? 'bg-ink text-white shadow-sm' : 'text-g700 hover:text-ink',
              )}
            >
              {roleText}
            </button>
          )
        })}
      </div>
      <div role="radiogroup" aria-label="Tipo de cuenta" className="flex flex-col gap-3">
        {opts.map(([k, t, d, I]) => {
          const on = role === k
          return (
            <button key={k} role="radio" aria-checked={on} onClick={() => setRole(k)}
              className={cx('flex min-h-24 items-center gap-4 rounded-card p-4 text-left', on ? 'border-2 border-ink bg-g100' : 'border-2 border-g300 bg-white')}>
              <span className={cx('grid size-12 shrink-0 place-items-center rounded-full', on ? 'bg-ink text-white' : 'bg-g100')}><I size={24} aria-hidden /></span>
              <span className="flex-1"><span className="block text-[18px] font-bold">{t}</span><span className="text-g600">{d}</span></span>
              {on ? <CircleDot size={24} aria-label="Seleccionado" /> : <Circle size={24} className="text-g500" aria-hidden />}
            </button>
          )
        })}
      </div>
      {embedded && role === 'tutor' && !onContinueTutor && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-btn bg-info-bg p-3 font-medium text-info">
          <Info size={18} className="shrink-0" aria-hidden />
          El flujo de Tutor estará disponible próximamente. Elige "Soy alumno" para recorrer el prototipo.
        </p>
      )}
      <p className="mt-6 text-center text-g600">¿Ya tienes cuenta? <button type="button" onClick={onLogin} className="min-h-11 font-semibold text-ink underline underline-offset-4">Iniciar sesión</button></p>
    </Screen>
  )
}

/* 3b. Formulario alumno */
const modes = [['Presencial', MapPin], ['En línea', Video], ['Híbrida', Shuffle]] as const
export function StudentForm({
  showErrors = false,
  label = 'Crear cuenta de alumno',
  embedded,
  onBack,
  onSuccess,
}: {
  showErrors?: boolean
  label?: string
  embedded?: boolean
  onBack?: () => void
  onSuccess?: (details: { fullName: string; email: string; password: string; career: string; mode: string }) => Promise<RegistrationResult | void> | RegistrationResult | void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [career, setCareer] = useState('')
  const [mode, setMode] = useState('')
  const [terms, setTerms] = useState(false)
  const [sub, setSub] = useState(showErrors)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmationRequired, setConfirmationRequired] = useState(false)
  const e = sub ? {
    name: !name.trim() ? 'Escribe tu nombre completo.' : undefined,
    email: !emailOk(email) ? 'Escribe un correo válido, por ejemplo ejemplo@correo.com.' : undefined,
    pass: pass.length < 8 ? 'Tu contraseña debe tener al menos 8 caracteres.' : undefined,
    career: !career ? 'Elige tu carrera.' : undefined,
    mode: !mode ? 'Elige una modalidad.' : undefined,
    terms: !terms ? 'Debes aceptar los términos para crear tu cuenta.' : undefined,
  } : {} as Record<string, string | undefined>
  const id = (s: string) => `${label}-${s}`
  const handleSubmit = async () => {
    setSub(true)
    if (name.trim() && emailOk(email) && pass.length >= 8 && career && mode && terms) {
      if (!onSuccess) return
      setIsSubmitting(true)
      setServerError(null)
      try {
        const result = await onSuccess({
          fullName: name,
          email,
          password: pass,
          career,
          mode,
        })
        if (result && !result.ok) {
          setServerError(result.message)
        } else if (result?.ok && result.emailConfirmationRequired) {
          setConfirmationRequired(true)
        }
      } catch (error) {
        setServerError(error instanceof Error ? error.message : 'No se pudo crear la cuenta.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }
  if (confirmationRequired) {
    return (
      <Screen label={label} embedded={embedded}>
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-ok-bg text-ok">
            <MailCheck size={40} aria-hidden />
          </span>
          <h1 className="text-[28px] font-bold">Confirma tu correo</h1>
          <p className="text-[16px] text-g600">
            Enviamos un enlace a <strong className="text-ink">{email}</strong>. Confírmalo para activar tu cuenta.
          </p>
          <Button full onClick={onBack}>Volver al inicio</Button>
        </div>
      </Screen>
    )
  }
  return (
    <Screen label={label} embedded={embedded} footer={<Button full loading={isSubmitting} onClick={handleSubmit}>Crear cuenta de alumno</Button>}>
      <Back onClick={onBack} />
      <Title sub="Paso 2 de 2 · Cuenta de alumno">Cuéntanos de ti</Title>
      <form noValidate onSubmit={(ev) => { ev.preventDefault(); void handleSubmit() }} className="flex flex-col gap-5">
        <Field id={id('n')} label="Nombre completo" value={name} onChange={setName} error={e.name} placeholder="Sofía Mena" autoComplete="name" />
        <Field id={id('e')} label="Correo" type="email" value={email} onChange={setEmail} error={e.email} placeholder="ejemplo@correo.com" autoComplete="email" />
        <PasswordField id={id('p')} label="Contraseña" value={pass} onChange={setPass} error={e.pass}><Strength value={pass} /></PasswordField>
        <FieldShell id={id('c')} label="Carrera" error={e.career}>
          <div className="relative">
            <select id={id('c')} value={career} onChange={(ev) => setCareer(ev.target.value)} aria-invalid={!!e.career} aria-describedby={id('c-m')}
              className={cx(inputCls(e.career), 'appearance-none pr-11', !career && 'text-g600')}>
              <option value="">Selecciona tu carrera</option>
              {['Ingeniería', 'Medicina', 'Arquitectura', 'Administración', 'Derecho', 'Otra'].map((c) => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" aria-hidden />
          </div>
        </FieldShell>
        <fieldset aria-describedby={id('m-m')}>
          <legend className="mb-1.5 text-[12px] font-semibold text-g700">Modalidad preferida</legend>
          <div role="radiogroup" className="grid grid-cols-3 gap-2">
            {modes.map(([m, I]) => {
              const on = mode === m
              return (
                <button key={m} type="button" role="radio" aria-checked={on} onClick={() => setMode(m)}
                  className={cx('flex min-h-16 flex-col items-center justify-center gap-1 rounded-btn text-[14px] font-semibold', on ? 'border-2 border-ink bg-ink text-white' : e.mode ? 'border-2 border-err' : 'border-2 border-g300')}>
                  {on ? <Check size={18} aria-hidden /> : <I size={18} aria-hidden />}{m}
                </button>
              )
            })}
          </div>
          {e.mode && <p id={id('m-m')} role="alert" className="mt-1.5 flex items-center gap-1.5 font-medium text-err"><AlertTriangle size={16} aria-hidden />{e.mode}</p>}
        </fieldset>
        <p className="rounded-btn border border-info bg-info-bg p-3 text-[13px] text-info">
          En esta primera integración solo se guardan tu nombre y correo de acceso. La carrera y modalidad aún no se persisten.
        </p>
        <div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input type="checkbox" checked={terms} onChange={(ev) => setTerms(ev.target.checked)} aria-invalid={!!e.terms}
              className={cx('mt-0.5 size-6 shrink-0 accent-ink', e.terms && 'outline-2 outline-err')} />
            <span>Acepto los <u className="font-semibold">términos y condiciones</u> y el <u className="font-semibold">aviso de privacidad</u> de TutorClick.</span>
          </label>
          {e.terms && <p role="alert" className="mt-1 flex items-start gap-1.5 font-medium text-err"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />{e.terms}</p>}
        </div>
        {serverError && <p role="alert" className="rounded-btn border border-err bg-err-bg p-3 font-semibold text-err">{serverError}</p>}
      </form>
    </Screen>
  )
}

/* 4. Recuperar contraseña */
export function Recover({
  sent = false,
  showErrors = false,
  label = 'Recuperar contraseña',
  embedded,
  onBack,
  onLogin,
}: {
  sent?: boolean
  showErrors?: boolean
  label?: string
  embedded?: boolean
  onBack?: () => void
  onLogin?: () => void
}) {
  const [email, setEmail] = useState(sent ? 'ejemplo@correo.com' : showErrors ? 'ejemplo@' : '')
  const [done, setDone] = useState(sent)
  const [sub, setSub] = useState(showErrors)
  const [requestError, setRequestError] = useState<string | null>(null)
  const err = sub && !emailOk(email) ? (email ? 'Escribe un correo válido, por ejemplo ejemplo@correo.com.' : 'Escribe tu correo.') : undefined
  if (done)
    return (
      <Screen label={label} embedded={embedded} footer={<div className="flex flex-col gap-2"><Button full onClick={onLogin}>Volver a iniciar sesión</Button><Button full variant="text" onClick={() => setDone(false)}>Reenviar enlace</Button></div>}>
        {embedded && <Back onClick={onBack} />}
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-ok-bg text-ok"><MailCheck size={40} aria-hidden /></span>
          <h1 className="text-[28px] font-bold">Te enviamos un enlace</h1>
          <p className="text-[16px] text-g600">Revisa <strong className="text-ink">{email}</strong> y sigue las instrucciones para crear una contraseña nueva.</p>
          <p className="flex items-start gap-2 rounded-btn bg-info-bg p-3 text-left font-medium text-info"><Info size={18} className="mt-0.5 shrink-0" aria-hidden />El enlace vence en 30 minutos. Si no lo ves, revisa tu carpeta de spam.</p>
        </div>
      </Screen>
    )
  return (
    <Screen label={label} embedded={embedded}>
      <form noValidate onSubmit={(ev) => {
        ev.preventDefault()
        setSub(true)
        if (emailOk(email)) {
          setRequestError('La recuperación de contraseña todavía no está conectada a Supabase.')
        }
      }} className="flex flex-col">
        <Back onClick={onBack} />
        <Title sub="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.">Recuperar contraseña</Title>
        <div className="flex flex-col gap-5">
          <Field id={`${label}-em`} label="Correo" type="email" value={email} onChange={setEmail} error={err} placeholder="ejemplo@correo.com" autoComplete="email" />
          {requestError && <p role="alert" className="rounded-btn border border-warn bg-warn-bg p-3 text-[14px] font-semibold text-warn">{requestError}</p>}
          <Button type="submit" full icon={Mail}>Enviar enlace</Button>
        </div>
      </form>
    </Screen>
  )
}
