import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Building2,
  Clock,
  CreditCard,
  FileCheck2,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  LifeBuoy,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Download,
  PlayCircle,
  ShieldCheck,
  Star,
  Upload,
  User,
  Users,
  Video,
  WalletCards,
  X,
} from 'lucide-react'
import { BottomNav, Button, StatusChip, TopBar, studentNav, type ChipKey } from '../../components/ui/ds'
import { ListState } from '../../components/ui/list-state'
import { calcTutorNet } from '../../services/pagos'
import {
  CATALOG_LEVELS as LEVELS,
  CATALOG_SUBJECTS as SUBJECTS,
  DAY_SHORT_LABELS,
  MERIDA_ZONES,
  WEEK_DAY_NAMES as WEEK_DAYS,
  formatMoney,
  formatTimeChip,
} from '../../data/mock'
import type { ClassBookingRecord, ClassSession } from '../../types'
import type { RegistrationResult, TutorRegistrationProfile } from '../../services/auth'
import {
  createTutorCredentialUrl,
  getTutorProfile,
  updateTutorProfile,
  uploadTutorCredential,
  uploadTutorProfilePhoto,
  type TutorClassMode,
  type TutorCredentialKind,
  type TutorProfileRecord,
} from '../../services/perfiles'

const cx = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ')
const ACTIVE_BOOKING_STATUSES: ClassBookingRecord['status'][] = [
  'pending_confirmation',
  'confirmed',
  'reschedule_pending',
]
const BOOKING_STATUS_LABELS: Record<ClassBookingRecord['status'], string> = {
  pending_confirmation: 'Pendiente de respuesta',
  confirmed: 'Confirmada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  reschedule_pending: 'Cambio pendiente',
  completed: 'Finalizada',
}

function meridaDateKey(value: string | Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Merida',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function formatBookingDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Merida',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export const tutorMainNav: typeof studentNav = [
  ['Inicio', Home],
  ['Calendario', CalendarDays],
  ['Mensajes', MessageCircle],
  ['Finanzas', WalletCards],
  ['Más', Menu],
]

function ProgressHeader({ step }: { step: number }) {
  return (
    <div className="border-b border-g200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-bold text-ink">Paso {step} de 5</p>
        <p className="text-[12px] font-semibold text-g600">{step * 20}% completado</p>
      </div>
      <div className="mt-2 flex gap-1.5" aria-label={`Progreso: paso ${step} de 5`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <span
            key={value}
            className={cx('h-2 flex-1 rounded-full', value <= step ? 'bg-ink' : 'bg-g200')}
          />
        ))}
      </div>
    </div>
  )
}

function FieldLabel({ children, htmlFor }: { children: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[12px] font-semibold text-g700">
      {children}
    </label>
  )
}

export function TutorOnboarding({
  onComplete,
  onCreateAccount,
  onBack,
}: {
  onComplete: () => void
  onCreateAccount?: (details: { fullName: string; email: string; password: string } & TutorRegistrationProfile) => Promise<RegistrationResult>
  onBack?: () => void
}) {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [confirmationRequired, setConfirmationRequired] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bio, setBio] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [level, setLevel] = useState('')
  const [rate, setRate] = useState('')
  const [modes, setModes] = useState<TutorClassMode[]>([])
  const [zone, setZone] = useState('')
  const [radius, setRadius] = useState('')
  const [titleFile, setTitleFile] = useState('')
  const [licenseFile, setLicenseFile] = useState('')
  const [titleDocument, setTitleDocument] = useState<File | null>(null)
  const [licenseDocument, setLicenseDocument] = useState<File | null>(null)
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [startTime, setStartTime] = useState('16:00')
  const [endTime, setEndTime] = useState('19:00')
  const [selectedAvailabilityMode, setSelectedAvailabilityMode] = useState<TutorClassMode | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null)
  const availabilityMode = modes.length === 1 ? modes[0] : selectedAvailabilityMode

  function validateStep() {
    if (step === 1 && (!name.trim() || !email.includes('@') || password.length < 8)) {
      setError('Completa tu nombre, un correo válido y una contraseña de al menos 8 caracteres.')
      return false
    }
    if (step === 2 && (!bio.trim() || selectedSubjects.length === 0 || Number(rate) < 100 || Number(rate) > 1000 || modes.length === 0 || !level || !zone || Number(radius) < 1 || Number(radius) > 30)) {
      setError('Completa la biografía, materias, nivel, tarifa entre $100 y $1,000, modalidad y zona.')
      return false
    }
    if (step === 3 && (!titleDocument || !licenseDocument)) {
      setError('Adjunta tu título y tu cédula para continuar.')
      return false
    }
    if (step === 4 && (
      availableDays.length === 0 ||
      !availabilityMode ||
      !modes.includes(availabilityMode)
    )) {
      setError(
        availableDays.length === 0
          ? 'Selecciona al menos un día con disponibilidad.'
          : 'Elige una modalidad para los horarios seleccionados.',
      )
      return false
    }
    setError(null)
    return true
  }

  function next() {
    if (!validateStep()) return
    if (step < 5) setStep((value) => value + 1)
  }

  function handleFile(
    file: File | undefined,
    setName: (name: string) => void,
    setDocument: (document: File) => void,
  ) {
    if (!file) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Usa un archivo PDF, JPG o PNG de máximo 10 MB.')
      return
    }
    setName(file.name)
    setDocument(file)
    setError(null)
  }

  async function submitProfile() {
    if (!validateStep()) return
    if (!onCreateAccount) {
      setSubmitted(true)
      return
    }
    setIsSubmitting(true)
    try {
      if (!titleDocument || !licenseDocument) {
        setError('Adjunta tu título y tu cédula antes de crear la cuenta.')
        return
      }
      if (!availabilityMode) {
        setError('Elige una modalidad para los horarios seleccionados.')
        return
      }
      const result = await onCreateAccount({
        fullName: name.trim(),
        email,
        password,
        biography: bio.trim(),
        subjects: selectedSubjects,
        educationLevel: level,
        hourlyRateMxn: Number(rate),
        classModes: modes,
        serviceZone: zone,
        travelRadiusKm: Number(radius),
        availabilityWeekdays: availableDays.map((day) => WEEK_DAYS.indexOf(day) + 1),
        availabilityStartTime: startTime,
        availabilityEndTime: endTime,
        availabilityMode,
        titleDocument,
        licenseDocument,
      })
      if (!result.ok) {
        setError(result.message)
      } else if (result.emailConfirmationRequired) {
        setConfirmationRequired(true)
        if (result.credentialsPendingConfirmation) {
          setSubmissionNotice('Confirma tu correo e inicia sesión para cargar tus documentos privados desde Más → Credenciales.')
        }
        setSubmitted(true)
      } else {
        if (result.warning) setSubmissionNotice(result.warning)
        setSubmitted(true)
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo crear la cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex h-full w-full flex-col bg-white">
        <TopBar title={confirmationRequired ? 'Confirma tu correo' : 'Cuenta creada'} />
        <div className="flex-1 overflow-y-auto bg-g50 p-4">
          <section className="flex flex-col items-center rounded-card border border-g200 bg-white px-5 py-6 text-center shadow-sm">
            <span className="grid size-16 place-items-center rounded-full bg-warn-bg text-warn">
              <Clock size={32} aria-hidden />
            </span>
            {confirmationRequired ? (
              <>
                <h1 className="mt-3 text-[22px] font-bold">Confirma tu correo</h1>
                <p className="mt-2 text-[14px] text-g600">
                  Enviamos un enlace a <strong>{email}</strong>. Confírmalo para activar tu cuenta.
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-3 text-[22px] font-bold">
                  {onCreateAccount ? 'Cuenta creada; perfil profesional pendiente' : 'Vista de demostración'}
                </h1>
                <p className="mt-2 text-[14px] text-g600">
                  {onCreateAccount
                    ? 'Tu perfil y disponibilidad se guardaron. El perfil quedará visible cuando se verifiquen tus credenciales.'
                    : 'Esta vista no creó una cuenta ni guardó datos.'}
                </p>
              </>
            )}
          </section>

          {!confirmationRequired && !onCreateAccount && (
            <div className="mt-4 rounded-card border border-warn bg-warn-bg p-3.5 text-[14px] text-warn">
              Los datos de esta vista de demostración no se guardan en la base de datos.
            </div>
          )}

          {confirmationRequired && (
            <div className="mt-4 rounded-card border border-info bg-info-bg p-3.5 text-[14px] text-info">
              <p className="flex items-start gap-2 font-semibold">
                <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden />
                Tu perfil y disponibilidad ya están guardados. Confirma el correo para entrar y completar la carga de credenciales.
              </p>
            </div>
          )}
          {submissionNotice && (
            <p role="status" className="mt-3 rounded-card border border-warn bg-warn-bg p-3.5 text-[14px] font-semibold text-warn">
              {submissionNotice}
            </p>
          )}
        </div>
        <div className="border-t border-g200 bg-white p-4">
          <Button full onClick={confirmationRequired ? onBack : onComplete}>
            {confirmationRequired ? 'Volver al inicio' : 'Ir a mi inicio'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center border-b border-g200 bg-white px-2">
        {step > 1 || onBack ? (
          <button
            type="button"
            aria-label={step > 1 ? 'Volver al paso anterior' : 'Volver'}
            onClick={() => {
              if (step > 1) {
                setStep((value) => value - 1)
                setError(null)
              } else {
                onBack?.()
              }
            }}
            className="grid size-11 place-items-center rounded-full hover:bg-g100"
          >
            <ChevronLeft size={24} aria-hidden />
          </button>
        ) : <span className="size-11" />}
        <h1 className="flex-1 text-[16px] font-semibold">Crear perfil de Tutor</h1>
        <span className="size-11" />
      </header>
      <ProgressHeader step={step} />

      <div className="flex-1 overflow-y-auto bg-g50 p-4">
        <div className="flex flex-col gap-4">
          {step === 1 && (
            <>
              <div>
                <h2 className="text-[20px] font-bold">Crea tu cuenta</h2>
                <p className="mt-1 text-[14px] text-g600">Usarás estos datos para entrar a TutorClick.</p>
              </div>
              <section className="flex flex-col gap-3 rounded-card border border-g200 bg-white p-4">
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor="tutor-name">Nombre completo</FieldLabel>
                  <input id="tutor-name" value={name} onChange={(e) => setName(e.target.value)} className="min-h-12 rounded-btn border border-g500 px-3.5 outline-none focus:border-ink" />
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor="tutor-email">Correo electrónico</FieldLabel>
                  <input id="tutor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-12 rounded-btn border border-g500 px-3.5 outline-none focus:border-ink" />
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor="tutor-pass">Contraseña</FieldLabel>
                  <input id="tutor-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-12 rounded-btn border border-g500 px-3.5 outline-none focus:border-ink" />
                  <p className="text-[12px] text-g600">Mínimo 8 caracteres.</p>
                </div>
              </section>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="text-[20px] font-bold">Perfil profesional</h2>
                <p className="mt-1 text-[14px] text-g600">Cuéntales a los Alumnos cómo serán tus clases.</p>
              </div>
              <section className="flex flex-col gap-4 rounded-card border border-g200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-16 place-items-center rounded-full bg-ink text-[18px] font-bold text-white">CC</span>
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-btn border-2 border-ink px-3.5 font-semibold">
                    <Upload size={17} aria-hidden /> Subir foto
                    <input type="file" accept="image/jpeg,image/png" className="sr-only" />
                  </label>
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor="tutor-bio">Biografía</FieldLabel>
                  <textarea id="tutor-bio" rows={4} maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} className="rounded-btn border border-g500 p-3 outline-none focus:border-ink" />
                  <p className="text-right text-[12px] text-g600">{bio.length}/500</p>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-g700">Materias de catálogo</p>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((subject) => {
                      const active = selectedSubjects.includes(subject)
                      return (
                        <button
                          key={subject}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelectedSubjects((prev) => active ? prev.filter((item) => item !== subject) : [...prev, subject])}
                          className={cx('min-h-11 rounded-full border-2 px-3 font-semibold', active ? 'border-ink bg-ink text-white' : 'border-g300 bg-white')}
                        >
                          {active && <Check size={15} className="mr-1 inline" aria-hidden />}{subject}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor="tutor-level">Nivel</FieldLabel>
                  <select id="tutor-level" value={level} onChange={(e) => setLevel(e.target.value)} className="min-h-12 rounded-btn border border-g500 bg-white px-3.5">
                    {LEVELS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor="tutor-rate">Tarifa por hora (MXN)</FieldLabel>
                  <input id="tutor-rate" type="number" min="100" step="50" value={rate} onChange={(e) => setRate(e.target.value)} className="min-h-12 rounded-btn border border-g500 px-3.5 tabular-nums" />
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-g700">Modalidad</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Presencial', 'En línea'] as TutorClassMode[]).map((mode) => {
                      const active = modes.includes(mode)
                      return (
                        <button key={mode} type="button" aria-pressed={active} onClick={() => setModes((prev) => active ? prev.filter((item) => item !== mode) : [...prev, mode])} className={cx('flex min-h-12 items-center justify-center gap-2 rounded-btn border-2 font-semibold', active ? 'border-ink bg-ink text-white' : 'border-g300 bg-white')}>
                          {mode === 'Presencial' ? <MapPin size={17} aria-hidden /> : <Video size={17} aria-hidden />}{mode}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_96px] gap-2">
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="tutor-zone">Zona de servicio</FieldLabel>
                    <select id="tutor-zone" value={zone} onChange={(e) => setZone(e.target.value)} className="min-h-12 rounded-btn border border-g500 bg-white px-3">
                      {MERIDA_ZONES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="tutor-radius">Radio (km)</FieldLabel>
                    <input id="tutor-radius" type="number" min="1" max="30" value={radius} onChange={(e) => setRadius(e.target.value)} className="min-h-12 rounded-btn border border-g500 px-3 tabular-nums" />
                  </div>
                </div>
              </section>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h2 className="text-[20px] font-bold">Título y cédula</h2>
                <p className="mt-1 text-[14px] text-g600">Validaremos tus credenciales antes de publicar tu perfil.</p>
              </div>
              <div role="note" className="flex items-start gap-2 rounded-card border border-info bg-info-bg p-3.5 text-info">
                <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden />
                <p className="text-[13px] font-semibold">Aceptamos PDF, JPG o PNG de máximo 10 MB por archivo.</p>
              </div>
              {[
                { label: 'Título profesional', filename: titleFile, setName: setTitleFile, setFile: setTitleDocument, id: 'title-upload' },
                { label: 'Cédula profesional', filename: licenseFile, setName: setLicenseFile, setFile: setLicenseDocument, id: 'license-upload' },
              ].map(({ label, filename, setName, setFile, id }) => (
                <section key={id as string} className="rounded-card border border-g200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-g100"><GraduationCap size={21} aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{label}</h3>
                      <p className="truncate text-[12px] text-g600">{filename || 'Sin archivo'}</p>
                    </div>
                    {filename && <CheckCircle2 size={20} className="shrink-0 text-ok" aria-label="Archivo adjunto" />}
                  </div>
                  <label htmlFor={id} className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-btn border-2 border-ink font-semibold">
                    <Upload size={17} aria-hidden /> {filename ? 'Reemplazar archivo' : 'Adjuntar archivo'}
                    <input id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0], setName, setFile)} />
                  </label>
                </section>
              ))}
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <h2 className="text-[20px] font-bold">Disponibilidad recurrente</h2>
                <p className="mt-1 text-[14px] text-g600">Publicaremos estos horarios cada semana.</p>
              </div>
              <div role="note" className="flex items-start gap-2.5 rounded-card border border-warn bg-warn-bg p-3.5 text-warn">
                <CalendarDays size={19} className="mt-0.5 shrink-0" aria-hidden />
                <p className="font-bold">Los alumnos reservan tus horarios al instante; mantén tu calendario al día</p>
              </div>
              <section className="rounded-card border border-g200 bg-white p-4">
                <p className="mb-2 text-[12px] font-semibold text-g700">Días disponibles</p>
                <div className="flex flex-col gap-2">
                  {WEEK_DAYS.map((day) => {
                    const active = availableDays.includes(day)
                    return (
                      <button key={day} type="button" aria-pressed={active} onClick={() => setAvailableDays((prev) => active ? prev.filter((item) => item !== day) : [...prev, day])} className={cx('flex min-h-12 items-center justify-between rounded-btn border-2 px-3.5 font-semibold', active ? 'border-ink bg-g100' : 'border-g300 bg-white')}>
                        <span>{day}</span>
                        <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px]', active ? 'bg-ink text-white' : 'bg-g200 text-g600')}>
                          {active ? <Check size={13} aria-hidden /> : <X size={13} aria-hidden />}{active ? 'Disponible' : 'No disponible'}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="avail-start">Desde</FieldLabel>
                    <select id="avail-start" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="min-h-12 rounded-btn border border-g500 bg-white px-3">
                      {['09:00', '12:00', '16:00', '17:00'].map((item) => <option key={item} value={item}>{formatTimeChip(item)}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="avail-end">Hasta</FieldLabel>
                    <select id="avail-end" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="min-h-12 rounded-btn border border-g500 bg-white px-3">
                      {['17:00', '18:00', '19:00', '20:00'].map((item) => <option key={item} value={item}>{formatTimeChip(item)}</option>)}
                    </select>
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-[12px] text-g600">
                  <Clock size={14} aria-hidden /> Hora de Mérida (UTC-6)
                </p>
                {modes.length > 1 ? (
                  <label className="mt-4 flex flex-col gap-1.5 text-[13px] font-semibold text-g700">
                    Modalidad para estos horarios
                    <select
                      value={selectedAvailabilityMode}
                      onChange={(event) => {
                        const value = event.target.value
                        setSelectedAvailabilityMode(
                          value === 'Presencial' || value === 'En línea' ? value : '',
                        )
                      }}
                      className="min-h-12 rounded-btn border border-g500 bg-white px-3 text-[14px] text-ink"
                    >
                      <option value="">Elige una modalidad</option>
                      {modes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                    </select>
                  </label>
                ) : (
                  <p className="mt-4 text-[13px] font-semibold text-g700">
                    Modalidad para estos horarios: {availabilityMode}
                  </p>
                )}
              </section>
            </>
          )}

          {step === 5 && (
            <>
              <div>
                <h2 className="text-[20px] font-bold">Revisa tu perfil</h2>
                <p className="mt-1 text-[14px] text-g600">Confirma que todo esté correcto antes de enviarlo.</p>
              </div>
              <section className="rounded-card border border-g200 bg-white p-4">
                <div className="flex items-center gap-3 border-b border-g200 pb-3">
                  <span className="grid size-14 place-items-center rounded-full bg-ink text-[16px] font-bold text-white">CC</span>
                  <div>
                    <h3 className="text-[18px] font-bold">{name}</h3>
                    <p className="text-[13px] text-g600">{email}</p>
                  </div>
                </div>
                <dl className="mt-3 flex flex-col gap-2 text-[14px]">
                  <div><dt className="text-[12px] font-semibold text-g600">Materias y nivel</dt><dd className="font-bold">{selectedSubjects.join(', ')} · {level}</dd></div>
                  <div><dt className="text-[12px] font-semibold text-g600">Tarifa</dt><dd className="font-bold">{formatMoney(Number(rate))}/h</dd></div>
                  <div><dt className="text-[12px] font-semibold text-g600">Modalidad y zona</dt><dd className="font-bold">{modes.join(' y ')} · {zone}, {radius} km</dd></div>
                  <div><dt className="text-[12px] font-semibold text-g600">Credenciales</dt><dd className="flex items-center gap-1.5 font-bold text-g700"><FileCheck2 size={16} aria-hidden /> {titleFile} · {licenseFile}</dd></div>
                  <div><dt className="text-[12px] font-semibold text-g600">Disponibilidad</dt><dd className="font-bold">{availableDays.join(', ')} · {formatTimeChip(startTime)} a {formatTimeChip(endTime)} · {availabilityMode}</dd></div>
                </dl>
              </section>
              <div className="rounded-card border border-g200 bg-white p-4 text-[13px] text-g700">
                Tu disponibilidad semanal se guardará en Supabase junto con el registro. Cada horario tendrá una sola modalidad.
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-btn border border-err bg-err-bg p-3 text-[14px] font-semibold text-err">
              <X size={17} className="mt-0.5 shrink-0" aria-hidden />{error}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-g200 bg-white p-4">
        {step < 5 ? (
          <Button full onClick={next}>Continuar</Button>
        ) : (
          <Button full icon={ShieldCheck} loading={isSubmitting} onClick={submitProfile}>
            Enviar a revisión
          </Button>
        )}
      </div>
    </div>
  )
}

export function TutorHomeScreen({
  sessions,
  bookings,
  bookingsLoading,
  bookingsError,
  fullName,
  onOpenSession,
  onStartSession,
  onTabSelect,
}: {
  sessions: ClassSession[]
  bookings: ClassBookingRecord[]
  bookingsLoading: boolean
  bookingsError: string | null
  fullName: string
  onOpenSession: (id: string) => void
  onStartSession: (id: string) => void
  onTabSelect: (idx: number) => void
}) {
  const now = new Date()
  const meridaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Merida' }))
  const todayMonth = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Merida',
  }).format(now).replace(' de ', ' ').toLowerCase()
  const activeBookings = bookings
    .filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
  const todayKey = meridaDateKey(now)
  const todayBookings = activeBookings.filter((booking) => meridaDateKey(booking.startsAt) === todayKey)
  const upcomingBookings = activeBookings.filter((booking) => Date.parse(booking.startsAt) > now.getTime())
  const today = sessions.filter((item) =>
    item.day === meridaDate.getDate() &&
    (!item.monthLabel || item.monthLabel.toLowerCase() === todayMonth) &&
    item.status !== 'Cancelada',
  )
  const todayLabel = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'full',
    timeZone: 'America/Merida',
  }).format(now)
  const newReservations = sessions.filter((item) => item.isNewForTutor)
  const available = sessions
    .filter((item) => item.paymentStatus === 'Liberado')
    .reduce((sum, item) => sum + calcTutorNet(item.hourlyRate).net, 0)
  const retained = sessions
    .filter((item) => item.paymentStatus === 'Retenido')
    .reduce((sum, item) => sum + calcTutorNet(item.hourlyRate).net, 0)

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <TopBar title="Inicio" />
      <div className="flex-1 overflow-y-auto bg-g50 p-4">
        <ListState
          count={sessions.length + activeBookings.length + Number(bookingsLoading) + Number(!!bookingsError)}
          emptyTitle="Aún no tienes clases"
          emptyDescription="Publica disponibilidad para recibir tu primera reserva."
          emptyAction="Ir al calendario"
          onEmptyAction={() => onTabSelect(1)}
          loadingLabel="Cargando inicio del Tutor"
        >
        <div className="flex flex-col gap-4">
          <section>
            <p className="text-[13px] font-semibold text-g600">{todayLabel} · Mérida (UTC-6)</p>
            <h1 className="mt-1 text-[24px] font-bold">Hola, {fullName}</h1>
            <p className="text-[14px] text-g600">Tienes {today.length} clases programadas para hoy.</p>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[18px] font-bold">Hoy</h2>
              <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-info-bg px-3 text-[12px] font-bold text-info">
                <CalendarDays size={14} aria-hidden /> {today.length + todayBookings.length} clases
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {today.map((item) => (
                <article key={item.id} className="rounded-card border border-g200 bg-white p-4 shadow-sm">
                  <button type="button" onClick={() => onOpenSession(item.id)} className="flex w-full items-start justify-between gap-2 text-left">
                    <div>
                      <p className="text-[16px] font-bold">{formatTimeChip(item.time)} · {item.subject}</p>
                      <p className="mt-0.5 text-[14px] text-g600">{item.studentName} · {item.mode}</p>
                    </div>
                    <StatusChip status={item.status} />
                  </button>
                  {(item.startsSoon || item.status === 'En curso') && (
                    <Button full icon={PlayCircle} className="mt-3" onClick={() => onStartSession(item.id)}>
                      {item.status === 'En curso' ? 'Continuar clase' : 'Iniciar clase'}
                    </Button>
                  )}
                </article>
              ))}
              {todayBookings.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => onTabSelect(1)}
                  className="flex w-full items-start justify-between gap-2 rounded-card border border-g200 bg-white p-4 text-left shadow-sm hover:border-ink"
                >
                  <span>
                    <span className="block font-bold">
                      {formatBookingDateTime(booking.startsAt)} · {booking.subject}
                    </span>
                    <span className="mt-1 block text-[14px] text-g600">
                      {booking.studentName} · {booking.mode}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-g100 px-2.5 py-1 text-[12px] font-bold">
                    {BOOKING_STATUS_LABELS[booking.status]}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {upcomingBookings.length > 0 && (
            <section className="rounded-card border border-g200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[17px] font-bold">Próximas reservas y clases</h2>
                <button type="button" onClick={() => onTabSelect(1)} className="min-h-11 font-semibold underline underline-offset-4">
                  Ver calendario
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {upcomingBookings.slice(0, 4).map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => onTabSelect(1)}
                    className="flex min-h-14 w-full items-center justify-between gap-3 rounded-btn bg-g100 px-3 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold">
                        {booking.studentName} · {booking.subject}
                      </span>
                      <span className="block text-[12px] text-g600">
                        {formatBookingDateTime(booking.startsAt)} · {booking.mode}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[12px] font-bold">
                      {BOOKING_STATUS_LABELS[booking.status]}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {bookingsError && (
            <p role="alert" className="rounded-card border border-err bg-err-bg p-3 text-[13px] font-semibold text-err">
              {bookingsError}
            </p>
          )}

          <section className="rounded-card border border-g200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold">Reservas nuevas</h2>
              <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-ink px-3 text-[12px] font-bold text-white">
                <BadgeCheck size={14} aria-hidden /> {newReservations.length} nuevas
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {newReservations.slice(0, 2).map((item) => (
                <button key={item.id} type="button" onClick={() => onOpenSession(item.id)} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-btn bg-g100 px-3 text-left">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{item.studentName} · {item.subject}</p>
                    <p className="text-[12px] text-g600">{DAY_SHORT_LABELS[item.day]} · {formatTimeChip(item.time)}</p>
                  </div>
                  <ChevronRight size={18} className="shrink-0" aria-hidden />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-card border border-g200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold">Resumen financiero</h2>
              <button type="button" onClick={() => onTabSelect(3)} className="min-h-11 font-semibold underline underline-offset-4">Ver finanzas</button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-btn bg-ok-bg p-3 text-ok">
                <p className="flex items-center gap-1 text-[12px] font-semibold"><CheckCircle2 size={14} aria-hidden /> Disponible</p>
                <p className="mt-1 text-[18px] font-bold tabular-nums">{formatMoney(available)}</p>
              </div>
              <div className="rounded-btn bg-info-bg p-3 text-info">
                <p className="flex items-center gap-1 text-[12px] font-semibold"><Clock size={14} aria-hidden /> En retención</p>
                <p className="mt-1 text-[18px] font-bold tabular-nums">{formatMoney(retained)}</p>
              </div>
            </div>
          </section>

          <section className="flex items-center gap-3 rounded-card border border-warn bg-warn-bg p-4 text-warn">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white"><ShieldCheck size={20} aria-hidden /></span>
            <div>
              <p className="font-bold">Verificación en revisión</p>
              <p className="text-[12px]">Tu perfil será verificado en 24 a 48 h.</p>
            </div>
            <StatusChip status="En revisión" />
          </section>
        </div>
        </ListState>
      </div>
      <BottomNav items={tutorMainNav} active={0} onSelect={onTabSelect} />
    </div>
  )
}

export function TutorFinanceScreen({ sessions, onTabSelect }: { sessions: ClassSession[]; onTabSelect: (idx: number) => void }) {
  const available = sessions.filter((item) => item.paymentStatus === 'Liberado')
  const retained = sessions.filter((item) => item.paymentStatus === 'Retenido')
  const availableTotal = available.reduce((sum, item) => sum + calcTutorNet(item.hourlyRate).net, 0)
  const retainedTotal = retained.reduce((sum, item) => sum + calcTutorNet(item.hourlyRate).net, 0)
  const totalBalance = availableTotal + retainedTotal
  const [withdrawSheet, setWithdrawSheet] = useState(false)
  const [withdrawConfirmed, setWithdrawConfirmed] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState(String(Math.max(200, Math.floor(availableTotal))))
  const [paymentFilter, setPaymentFilter] = useState<'all' | ClassSession['paymentStatus']>('all')
  const [monthFilter, setMonthFilter] = useState('Noviembre 2026')
  const filteredTransactions = sessions.filter((item) => {
    if (paymentFilter !== 'all' && item.paymentStatus !== paymentFilter) return false
    return monthFilter === 'Todos los meses' || (item.monthLabel ?? 'Noviembre 2026') === monthFilter
  })
  const amountNumber = Number(withdrawAmount)
  const withdrawInvalid = amountNumber < 200 || amountNumber > availableTotal

  function downloadTransactions() {
    const rows = [
      'Reserva,Alumno,Materia,Estado,Neto MXN',
      ...filteredTransactions.map((item) =>
        [item.id, item.studentName, item.subject, item.paymentStatus, calcTutorNet(item.hourlyRate).net.toFixed(2)].join(','),
      ),
    ]
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'transacciones-tutorclick-noviembre-2026.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative flex h-full flex-col bg-white">
      <TopBar title="Finanzas" />
      <div className="flex-1 overflow-y-auto bg-g50 p-4">
        <ListState
          count={sessions.length}
          emptyTitle="Aún no hay movimientos"
          emptyDescription="Tus cobros y retenciones aparecerán después de recibir reservas."
          emptyAction="Revisar calendario"
          onEmptyAction={() => onTabSelect(1)}
          loadingLabel="Cargando finanzas"
        >
        <section className="rounded-card bg-ink p-5 text-white shadow-sm">
          <p className="flex items-center gap-2 text-[13px] font-semibold"><WalletCards size={17} aria-hidden /> Saldo total</p>
          <p className="mt-2 text-[28px] font-bold tabular-nums">{formatMoney(totalBalance)}</p>
          <p className="mt-1 text-[12px] text-g200">Disponible + fondos en retención</p>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-g700 pt-3">
            <div><p className="text-[12px] text-g300">Disponible</p><p className="font-bold">{formatMoney(availableTotal)}</p></div>
            <div><p className="text-[12px] text-g300">En retención</p><p className="font-bold">{formatMoney(retainedTotal)}</p></div>
          </div>
          <Button full variant="secondary" className="mt-4" disabled>
            Retiros no disponibles
          </Button>
        </section>

        <section className="mt-3 flex flex-col items-center rounded-card border border-dashed border-g300 bg-white p-5 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-g100"><Building2 size={22} aria-hidden /></span>
          <h2 className="mt-2 font-bold">Sin cuenta bancaria</h2>
          <p className="mt-1 text-[12px] text-g600">La vinculación de cuentas para retiros aún no está conectada.</p>
        </section>

        <section className="mt-3 rounded-card border border-info bg-info-bg p-4 text-info">
          <p className="flex items-center gap-2 font-bold"><Clock size={18} aria-hidden /> Fondos en retención 48 h</p>
          <p className="mt-1 text-[13px]">Cada pago se libera 48 h después de impartir la clase si no hay reportes. Las series liberan una clase a la vez.</p>
        </section>

        <section className="mt-4">
          <h2 className="mb-2 text-[17px] font-bold">Clases y pagos</h2>
          <div className="flex flex-col gap-2">
            {sessions.slice(0, 6).map((item) => {
              const money = calcTutorNet(item.hourlyRate)
              return (
                <article key={item.id} className="rounded-card border border-g200 bg-white p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{item.subject} · {item.studentName}</p>
                      <p className="text-[12px] text-g600">{item.id} · {DAY_SHORT_LABELS[item.day]}</p>
                    </div>
                    <StatusChip status={item.paymentStatus} />
                  </div>
                  <dl className="mt-3 flex flex-col gap-1 border-t border-g200 pt-2 text-[13px]">
                    <div className="flex justify-between text-g600"><dt>Cobro</dt><dd>{formatMoney(money.rate)}</dd></div>
                    <div className="flex justify-between text-g600"><dt>Comisión TutorClick (15%)</dt><dd>−{formatMoney(money.commission)}</dd></div>
                    <div className="flex justify-between font-bold"><dt>Neto</dt><dd>{formatMoney(money.net)}</dd></div>
                  </dl>
                  {item.seriesId && (
                    <p className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-info"><CalendarDays size={13} aria-hidden /> Serie: se libera clase por clase</p>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <section className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[17px] font-bold">Transacciones</h2>
            <button type="button" disabled={filteredTransactions.length === 0} onClick={downloadTransactions} className="inline-flex min-h-11 items-center gap-1.5 rounded-btn border-2 border-ink px-3 text-[12px] font-semibold disabled:border-g300 disabled:text-g500">
              <Download size={15} aria-hidden /> Descargar
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as typeof paymentFilter)} aria-label="Filtrar por estado de pago" className="min-h-11 rounded-btn border border-g500 bg-white px-2 text-[12px] font-semibold">
              <option value="all">Todos los estados</option>
              <option value="Retenido">Retenido</option>
              <option value="Liberado">Liberado</option>
              <option value="Reembolsado">Reembolsado</option>
              <option value="En disputa">En disputa</option>
            </select>
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} aria-label="Filtrar transacciones por mes" className="min-h-11 rounded-btn border border-g500 bg-white px-2 text-[12px] font-semibold">
              <option>Todos los meses</option>
              <option>Noviembre 2026</option>
              <option>Octubre 2026</option>
            </select>
          </div>
          {filteredTransactions.length === 0 ? (
            <div className="mt-3 flex flex-col items-center rounded-card border border-dashed border-g300 bg-white p-6 text-center">
              <CircleDollarSign size={26} aria-hidden />
              <h3 className="mt-2 font-bold">Sin transacciones</h3>
              <p className="mt-1 text-[12px] text-g600">No hay movimientos para los filtros seleccionados.</p>
              <Button variant="secondary" className="mt-3" onClick={() => { setPaymentFilter('all'); setMonthFilter('Noviembre 2026') }}>Limpiar filtros</Button>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {filteredTransactions.map((item) => (
                <article key={`tx-${item.id}`} className="flex items-center justify-between gap-3 rounded-btn border border-g200 bg-white p-3">
                  <div className="min-w-0"><p className="truncate font-semibold">{item.paymentId} · {item.studentName}</p><p className="text-[12px] text-g600">{item.subject}</p></div>
                  <div className="text-right"><p className="font-bold">{formatMoney(calcTutorNet(item.hourlyRate).net)}</p><p className="text-[12px] text-g600">{item.paymentStatus}</p></div>
                </article>
              ))}
            </div>
          )}
        </section>
        </ListState>
      </div>
      <BottomNav items={tutorMainNav} active={3} onSelect={onTabSelect} />

      {withdrawSheet && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/50">
          <div role="dialog" aria-modal="true" aria-label="Retirar fondos" className="max-h-[85%] overflow-y-auto rounded-t-3xl bg-white px-5 pb-6 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,.18)]">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-g300" />
            {withdrawConfirmed ? (
              <div className="flex flex-col items-center text-center">
                <span className="grid size-16 place-items-center rounded-full bg-ok-bg text-ok"><CheckCircle2 size={32} aria-hidden /></span>
                <h2 className="mt-3 text-[20px] font-bold">Retiro confirmado</h2>
                <p className="mt-1 text-[14px] text-g600">{formatMoney(amountNumber)} llegarán a Banco Santander •••• 4821 en 1 a 2 días hábiles.</p>
                <Button full className="mt-5" onClick={() => setWithdrawSheet(false)}>Cerrar</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div><h2 className="text-[20px] font-bold">Retirar fondos</h2><p className="mt-1 text-[14px] text-g600">Disponible: {formatMoney(availableTotal)}</p></div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="withdraw-amount" className="text-[12px] font-semibold text-g700">Monto en MXN</label>
                  <input id="withdraw-amount" type="number" min="200" max={availableTotal} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className={cx('min-h-12 rounded-btn border px-3.5 text-[18px] font-bold tabular-nums', withdrawInvalid ? 'border-2 border-err' : 'border-g500')} />
                  <p className={cx('text-[12px]', withdrawInvalid ? 'font-semibold text-err' : 'text-g600')}>Mínimo $200.00 MXN. No puede superar tu saldo disponible.</p>
                </div>
                <div className="flex items-center gap-3 rounded-card bg-g100 p-3">
                  <Building2 size={20} aria-hidden /><div><p className="font-bold">Banco Santander •••• 4821</p><p className="text-[12px] text-g600">Entrega en 1 a 2 días hábiles</p></div>
                </div>
                <Button full disabled={withdrawInvalid} onClick={() => setWithdrawConfirmed(true)}>Confirmar retiro</Button>
                <Button full variant="text" onClick={() => setWithdrawSheet(false)}>Cancelar</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

type MoreSection = 'menu' | 'profile' | 'preview' | 'credentials' | 'students' | 'student-detail' | 'subscription' | 'help'

export function TutorMoreScreen({
  sessions,
  userId,
  fullName,
  onMessageStudent,
  onLogout,
  onTabSelect,
}: {
  sessions: ClassSession[]
  userId: string
  fullName: string
  onMessageStudent: (session: ClassSession) => void
  onLogout: () => void
  onTabSelect: (idx: number) => void
}) {
  const [section, setSection] = useState<MoreSection>('menu')
  const [profileBio, setProfileBio] = useState('')
  const [profileSubjects, setProfileSubjects] = useState<string[]>([])
  const [profileLevel, setProfileLevel] = useState('')
  const [profileRate, setProfileRate] = useState(0)
  const [profileModes, setProfileModes] = useState<TutorClassMode[]>([])
  const [profileZone, setProfileZone] = useState('')
  const [profileRadius, setProfileRadius] = useState(0)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<TutorProfileRecord['verificationStatus']>('pending')
  const [verificationRejectionReason, setVerificationRejectionReason] = useState<string | null>(null)
  const [credentialPaths, setCredentialPaths] = useState<Record<TutorCredentialKind, string | null>>({ title: null, license: null })
  const [credentialFiles, setCredentialFiles] = useState<Record<TutorCredentialKind, File | null>>({ title: null, license: null })
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoMessage, setPhotoMessage] = useState<string | null>(null)
  const [packageDiscounts, setPackageDiscounts] = useState({ 4: 0, 8: 0, 12: 0 })
  const [profileSaved, setProfileSaved] = useState(false)
  const [credentialError, setCredentialError] = useState<string | null>(null)
  const [credentialMessage, setCredentialMessage] = useState<string | null>(null)
  const [credentialSaving, setCredentialSaving] = useState(false)
  const [subscriptionState, setSubscriptionState] = useState<'standard' | 'active' | 'paused'>('standard')
  const [subscriptionDialog, setSubscriptionDialog] = useState<'checkout' | 'pause' | 'cancel' | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    setProfileLoading(true)
    void getTutorProfile(userId)
      .then((profile) => {
        if (!active) return
        setProfileBio(profile.biography ?? '')
        setProfileSubjects(profile.subjects)
        setProfileLevel(profile.educationLevel ?? '')
        setProfileRate(profile.hourlyRateMxn ?? 0)
        setProfileModes(profile.classModes)
        setProfileZone(profile.serviceZone ?? '')
        setProfileRadius(profile.travelRadiusKm ?? 0)
        setProfilePhoto(profile.photoUrl)
        setVerificationStatus(profile.verificationStatus)
        setVerificationRejectionReason(profile.verificationRejectionReason)
        setCredentialPaths({ title: profile.titleDocumentPath, license: profile.licenseDocumentPath })
        setProfileError(null)
      })
      .catch((error: unknown) => {
        if (active) setProfileError(error instanceof Error ? error.message : 'No se pudo cargar el perfil.')
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId])

  async function saveProfilePhoto(file: File) {
    setPhotoSaving(true)
    setPhotoError(null)
    setPhotoMessage(null)
    try {
      const result = await uploadTutorProfilePhoto(userId, file)
      setProfilePhoto(result.photoUrl)
      if (result.warning) setPhotoError(result.warning)
      else setPhotoMessage('Foto de perfil actualizada.')
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'No se pudo actualizar la foto de perfil.')
    } finally {
      setPhotoSaving(false)
    }
  }

  async function saveProfile() {
    setProfileSaving(true)
    setProfileError(null)
    try {
      if (!profileBio.trim() || !profileLevel || !profileZone || profileRate < 100 || profileRate > 1000 || profileRadius < 1 || profileRadius > 30 || profileSubjects.length === 0 || profileModes.length === 0) {
        throw new Error('Completa todos los campos del perfil con valores válidos.')
      }
      await updateTutorProfile(userId, {
        biography: profileBio.trim(),
        subjects: profileSubjects,
        educationLevel: profileLevel,
        hourlyRateMxn: profileRate,
        classModes: profileModes,
        serviceZone: profileZone,
        travelRadiusKm: profileRadius,
      })
      setProfileSaved(true)
      window.setTimeout(() => setProfileSaved(false), 1800)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'No se pudo guardar el perfil.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function saveCredentials() {
    setCredentialSaving(true)
    setCredentialError(null)
    setCredentialMessage(null)
    try {
      const selected = (Object.entries(credentialFiles) as [TutorCredentialKind, File | null][])
        .filter((entry): entry is [TutorCredentialKind, File] => entry[1] !== null)
      if (selected.length === 0) throw new Error('Selecciona al menos un documento.')
      for (const [kind, file] of selected) {
        const path = await uploadTutorCredential(userId, kind, file)
        setCredentialPaths((previous) => ({ ...previous, [kind]: path }))
        setCredentialFiles((previous) => ({ ...previous, [kind]: null }))
        setVerificationStatus('pending')
        setVerificationRejectionReason(null)
      }
      setCredentialMessage('Documento cargado de forma privada. Está pendiente de revisión.')
    } catch (error) {
      setCredentialError(error instanceof Error ? error.message : 'No se pudieron cargar los documentos.')
    } finally {
      setCredentialSaving(false)
    }
  }
  const students = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number; subject: string; lastDay: number }>()
    sessions.forEach((item) => {
      const prev = map.get(item.studentId)
      map.set(item.studentId, {
        id: item.studentId,
        name: item.studentName,
        count: (prev?.count ?? 0) + (item.status === 'Finalizada' ? 1 : 0),
        subject: item.subject,
        lastDay: Math.max(prev?.lastDay ?? 0, item.day),
      })
    })
    return Array.from(map.values())
  }, [sessions])
  const selectedStudentSessions = sessions
    .filter((item) => item.studentId === selectedStudentId)
    .sort((a, b) => b.day - a.day || b.time.localeCompare(a.time))
  const verificationLabels: Record<TutorProfileRecord['verificationStatus'], ChipKey> = {
    pending: 'Pendiente',
    in_review: 'En revisión',
    verified: 'Verificado',
    rejected: 'Rechazado',
  }
  const verificationLabel = verificationLabels[verificationStatus]

  if (section !== 'menu') {
    const title = {
      profile: 'Perfil profesional',
      preview: 'Vista para Alumnos',
      credentials: 'Credenciales',
      students: 'Mis alumnos',
      'student-detail': 'Detalle del Alumno',
      subscription: 'Suscripción',
      help: 'Ayuda',
    }[section]
    return (
      <div className="relative flex h-full flex-col bg-white">
        <TopBar title={title} back onBack={() => setSection(section === 'preview' ? 'profile' : section === 'student-detail' ? 'students' : 'menu')} />
        <div className="flex-1 overflow-y-auto bg-g50 p-4">
          {section === 'profile' && (
            <div className="flex flex-col gap-3.5">
              {profileError && <p role="alert" className="rounded-btn border border-err bg-err-bg p-3 font-semibold text-err">{profileError}</p>}
              {photoError && <p role="alert" className="rounded-btn border border-err bg-err-bg p-3 font-semibold text-err">{photoError}</p>}
              {photoMessage && <p role="status" className="rounded-btn border-l-4 border-ok bg-ok-bg p-3 font-semibold text-ok">{photoMessage}</p>}
              {profileSaved && (
                <p role="status" className="flex items-center gap-2 rounded-btn border-l-4 border-ok bg-ok-bg p-3 font-semibold text-ok">
                  <CheckCircle2 size={18} aria-hidden /> Perfil guardado
                </p>
              )}
              <section className="rounded-card border border-g200 bg-white p-4">
                <div className="flex items-center gap-3">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt={`Foto de ${fullName}`} className="size-16 shrink-0 rounded-full bg-g200 object-cover" />
                  ) : (
                    <span className="grid size-16 shrink-0 place-items-center rounded-full bg-ink text-[18px] font-bold text-white">{fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[19px] font-bold">{fullName}</h2>
                    <p className="truncate text-g600">Tutor · {userId}</p>
                  </div>
                  <StatusChip status={verificationLabel} />
                </div>
                <label className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-btn border-2 border-ink font-semibold">
                  <Upload size={17} aria-hidden /> {photoSaving ? 'Actualizando foto…' : 'Cambiar foto'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={photoSaving} onChange={(event) => {
                    const input = event.currentTarget
                    const file = input.files?.[0]
                    if (file) void saveProfilePhoto(file)
                    input.value = ''
                  }} />
                </label>
              </section>

              <section className="flex flex-col gap-3.5 rounded-card border border-g200 bg-white p-4">
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor="profile-bio">Biografía</FieldLabel>
                  <textarea id="profile-bio" rows={4} maxLength={500} value={profileBio} onChange={(e) => setProfileBio(e.target.value)} className="rounded-btn border border-g500 p-3 outline-none focus:border-ink" />
                  <p className="text-right text-[12px] text-g600">{profileBio.length}/500</p>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-g700">Materias de catálogo</p>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((subject) => {
                      const active = profileSubjects.includes(subject)
                      return (
                        <button key={subject} type="button" aria-pressed={active} onClick={() => setProfileSubjects((prev) => active ? prev.filter((item) => item !== subject) : [...prev, subject])} className={cx('min-h-11 rounded-full border-2 px-3 font-semibold', active ? 'border-ink bg-ink text-white' : 'border-g300 bg-white')}>
                          {active && <Check size={14} className="mr-1 inline" aria-hidden />}{subject}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor="profile-level">Nivel</FieldLabel>
                  <select id="profile-level" value={profileLevel} onChange={(e) => setProfileLevel(e.target.value)} className="min-h-12 rounded-btn border border-g500 bg-white px-3">
                    <option value="">Selecciona un nivel</option>
                    {LEVELS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor="profile-rate">Tarifa por hora (MXN)</FieldLabel>
                  <input id="profile-rate" type="number" min="100" max="1000" step="50" value={profileRate} onChange={(e) => setProfileRate(Number(e.target.value))} className={cx('min-h-12 rounded-btn border px-3 tabular-nums', profileRate < 100 || profileRate > 1000 ? 'border-2 border-err' : 'border-g500')} />
                  <p className={cx('text-[12px]', profileRate < 100 || profileRate > 1000 ? 'font-semibold text-err' : 'text-g600')}>
                    Mínimo $100.00 MXN y máximo $1,000.00 MXN.
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-g700">Modalidad</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Presencial', 'En línea'] as TutorClassMode[]).map((mode) => {
                      const active = profileModes.includes(mode)
                      return (
                        <button key={mode} type="button" aria-pressed={active} onClick={() => setProfileModes((prev) => active ? prev.filter((item) => item !== mode) : [...prev, mode])} className={cx('flex min-h-11 items-center justify-center gap-1.5 rounded-btn border font-semibold', active ? 'border-ink bg-ink text-white' : 'border-g300 bg-white')}>
                          {mode === 'Presencial' ? <MapPin size={15} aria-hidden /> : <Video size={15} aria-hidden />}{mode}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_88px] gap-2">
                  <label className="flex flex-col gap-1 text-[12px] font-semibold text-g700">
                    Zona
                    <select value={profileZone} onChange={(e) => setProfileZone(e.target.value)} className="min-h-12 rounded-btn border border-g500 bg-white px-2 text-[14px] text-ink">
                      <option value="">Selecciona una zona</option>
                      {MERIDA_ZONES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-[12px] font-semibold text-g700">
                    Radio (km)
                    <input type="number" min="1" max="30" value={profileRadius} onChange={(e) => setProfileRadius(Number(e.target.value))} className="min-h-12 rounded-btn border border-g500 px-2 text-[14px] text-ink" />
                  </label>
                </div>
              </section>

              <section className="rounded-card border border-g200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={19} aria-hidden />
                  <h2 className="text-[17px] font-bold">Paquetes</h2>
                </div>
                <p className="mt-1 text-[12px] text-g600">Define un descuento de máximo 20%.</p>
                <div className="mt-3 flex flex-col gap-2">
                  {([4, 8, 12] as const).map((count) => (
                    <label key={count} className="flex min-h-12 items-center justify-between gap-3 rounded-btn bg-g100 px-3 font-semibold">
                      <span>{count} clases</span>
                      <span className="flex items-center gap-1">
                        <input type="number" min="0" max="20" value={packageDiscounts[count]} onChange={(e) => setPackageDiscounts((prev) => ({ ...prev, [count]: Math.min(20, Math.max(0, Number(e.target.value))) }))} className="min-h-10 w-16 rounded-btn border border-g500 bg-white px-2 text-right tabular-nums" />
                        <span>%</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <Button full variant="secondary" onClick={() => setSection('preview')}>Ver cómo me ven los alumnos</Button>
              <Button full disabled={profileLoading || profileSaving} onClick={() => void saveProfile()}>{profileSaving ? 'Guardando…' : 'Guardar perfil'}</Button>
            </div>
          )}
          {section === 'preview' && (
            <div className="flex flex-col gap-3">
              <div role="note" className="rounded-btn border border-info bg-info-bg p-3 text-[13px] font-semibold text-info">Vista previa pública para Alumnos</div>
              <section className="rounded-card border border-g200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt={`Foto de ${fullName}`} className="size-16 shrink-0 rounded-full bg-g200 object-cover" />
                  ) : (
                    <span className="grid size-16 shrink-0 place-items-center rounded-full bg-ink text-[18px] font-bold text-white">{fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5"><h2 className="text-[19px] font-bold">{fullName}</h2>{verificationStatus === 'verified' && <BadgeCheck size={18} className="text-ok" aria-label="Verificado" />}</div>
                    <p className="text-g600">{profileSubjects.join(' y ')}</p>
                    <p className="flex items-center gap-1 font-semibold"><Star size={15} aria-hidden /> Aún no tienes reseñas</p>
                  </div>
                </div>
                <p className="mt-3 border-t border-g200 pt-3 text-[14px] text-g700">{profileBio}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                  <div className="rounded-btn bg-g100 p-2.5"><dt className="text-g600">Tarifa</dt><dd className="font-bold">{formatMoney(profileRate)}/h</dd></div>
                  <div className="rounded-btn bg-g100 p-2.5"><dt className="text-g600">Zona</dt><dd className="font-bold">{profileZone} · {profileRadius} km</dd></div>
                </dl>
                <Button full className="mt-4">Reservar clase</Button>
              </section>
            </div>
          )}
          {section === 'credentials' && (
            <div className="flex flex-col gap-3">
              <section className="rounded-card border border-info bg-info-bg p-4 text-info">
                <h2 className="flex items-center gap-2 font-bold"><ShieldCheck size={18} aria-hidden /> Verificación profesional</h2>
                <p className="mt-1 text-[13px]">Estado actual: {verificationLabel}. Admin actualizará el estado después de revisar tus documentos.</p>
              </section>
              {verificationRejectionReason && (
                <section className="rounded-card border border-err bg-err-bg p-4 text-err">
                  <h2 className="font-bold">Motivo de rechazo</h2>
                  <p className="mt-1 text-[13px]">{verificationRejectionReason}</p>
                </section>
              )}

              {[
                { kind: 'title' as const, name: 'Título profesional' },
                { kind: 'license' as const, name: 'Cédula profesional' },
              ].map((doc) => (
                <section key={doc.name} className="rounded-card border border-g200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <FileText size={22} className="mt-0.5 shrink-0" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold">{doc.name}</h2>
                      <p className="truncate text-[12px] text-g600">
                        {credentialFiles[doc.kind]?.name ?? credentialPaths[doc.kind]?.split('/').pop() ?? 'Aún no has cargado este documento'}
                      </p>
                    </div>
                    {credentialPaths[doc.kind] && <StatusChip status={verificationLabel} />}
                  </div>
                  {credentialPaths[doc.kind] && (
                    <button type="button" className="mt-2 text-[13px] font-semibold underline" onClick={() => {
                      const path = credentialPaths[doc.kind]
                      if (!path) return
                      void createTutorCredentialUrl(path)
                        .then((url) => window.open(url, '_blank', 'noopener,noreferrer'))
                        .catch((error: unknown) => setCredentialError(error instanceof Error ? error.message : 'No se pudo abrir el documento.'))
                    }}>Abrir documento privado</button>
                  )}
                  <label className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-btn border-2 border-ink bg-white font-semibold">
                    <Upload size={16} aria-hidden /> {credentialPaths[doc.kind] ? 'Reemplazar documento' : 'Cargar documento'}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      setCredentialFiles((previous) => ({ ...previous, [doc.kind]: file }))
                      setCredentialError(null)
                      setCredentialMessage(null)
                    }} />
                  </label>
                </section>
              ))}

              {credentialError && <p role="alert" className="rounded-btn border border-err bg-err-bg p-3 font-semibold text-err">{credentialError}</p>}
              {credentialMessage && <p role="status" className="rounded-btn border-l-4 border-ok bg-ok-bg p-3 font-semibold text-ok">{credentialMessage}</p>}
              <Button full disabled={credentialSaving || !credentialFiles.title && !credentialFiles.license} onClick={() => void saveCredentials()}>{credentialSaving ? 'Cargando…' : 'Guardar documentos'}</Button>
              <p className="flex items-start gap-2 rounded-btn bg-g100 p-3 text-[12px] text-g700">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
                Tus documentos son privados, se almacenan de forma segura y nunca se muestran completos a los Alumnos.
              </p>
            </div>
          )}
          {section === 'students' && (
            <ListState
              count={students.length}
              emptyTitle="Aún no tienes Alumnos"
              emptyDescription="Tus Alumnos aparecerán cuando recibas y completes reservas."
              emptyAction="Ir al calendario"
              onEmptyAction={() => onTabSelect(1)}
              loadingLabel="Cargando Alumnos"
            >
            <div className="flex flex-col gap-2.5">
              {students.map((item) => (
                <button key={item.id} type="button" onClick={() => { setSelectedStudentId(item.id); setSection('student-detail') }} className="flex min-h-16 w-full items-center gap-3 rounded-card border border-g200 bg-white p-4 text-left hover:border-ink">
                  <span className="grid size-11 place-items-center rounded-full bg-ink font-bold text-white">{item.name.split(' ').map((x) => x[0]).join('')}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold">{item.name}</h2>
                    <p className="text-[12px] text-g600">{item.subject} · {item.count} {item.count === 1 ? 'clase impartida' : 'clases impartidas'}</p>
                    <p className="text-[12px] font-semibold text-g700">Última clase: {DAY_SHORT_LABELS[item.lastDay]}</p>
                  </div>
                  <ChevronRight size={18} aria-hidden />
                </button>
              ))}
            </div>
            </ListState>
          )}
          {section === 'student-detail' && selectedStudentSessions.length > 0 && (
            <div className="flex flex-col gap-3">
              <section className="rounded-card border border-g200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-14 place-items-center rounded-full bg-ink text-[16px] font-bold text-white">
                    {selectedStudentSessions[0].studentName.split(' ').map((part) => part[0]).join('')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[18px] font-bold">{selectedStudentSessions[0].studentName}</h2>
                    <p className="text-[13px] text-g600">{selectedStudentSessions[0].studentId} · {selectedStudentSessions[0].subject}</p>
                  </div>
                </div>
                <Button full icon={MessageCircle} className="mt-4" onClick={() => onMessageStudent(selectedStudentSessions[0])}>Enviar mensaje</Button>
              </section>
              <section>
                <h2 className="mb-2 text-[17px] font-bold">Historial con este Alumno</h2>
                <div className="flex flex-col gap-2">
                  {selectedStudentSessions.map((item) => (
                    <article key={item.id} className="rounded-card border border-g200 bg-white p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div><p className="font-bold">{item.subject}</p><p className="text-[12px] text-g600">{DAY_SHORT_LABELS[item.day]} · {formatTimeChip(item.time)}</p></div>
                        <StatusChip status={item.status} />
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-g200 pt-2 text-[13px]">
                        <span className="text-g600">Neto por clase</span>
                        <span className="font-bold">{formatMoney(calcTutorNet(item.hourlyRate).net)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}
          {section === 'subscription' && (
            <div className="flex flex-col gap-3">
              {subscriptionState === 'active' || subscriptionState === 'paused' ? (
                <section className="rounded-card border-2 border-ink bg-white p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-ink px-3 text-[12px] font-bold text-white"><BadgeCheck size={14} aria-hidden /> Tutor Destacado</span>
                    <span className={cx('inline-flex min-h-7 items-center gap-1 rounded-full px-3 text-[12px] font-bold', subscriptionState === 'active' ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn')}>
                      {subscriptionState === 'active' ? <CheckCircle2 size={14} aria-hidden /> : <Clock size={14} aria-hidden />}
                      {subscriptionState === 'active' ? 'Activo' : 'Pausado'}
                    </span>
                  </div>
                  <h2 className="mt-3 text-[21px] font-bold">$299.00 MXN/mes</h2>
                  <p className="mt-1 text-[14px] text-g600">Plan mensual · Visa •••• 4242</p>
                  <div className="mt-4 rounded-btn bg-g100 p-3">
                    <p className="text-[12px] font-semibold text-g600">Próximo cobro</p>
                    <p className="font-bold">{subscriptionState === 'active' ? '23 de diciembre de 2026 · $299.00 MXN' : 'Pausado hasta que reactives el plan'}</p>
                  </div>
                  <ul className="mt-4 flex flex-col gap-2 text-[13px]">
                    {['Comisión de 5% por clase', 'Prioridad en búsquedas', 'Insignia Tutor Destacado', 'Métricas de visitas y conversión'].map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2 font-semibold"><CheckCircle2 size={16} className="text-ok" aria-hidden />{benefit}</li>
                    ))}
                  </ul>
                  {subscriptionState === 'paused' ? (
                    <Button full className="mt-4" onClick={() => setSubscriptionState('active')}>Reactivar suscripción</Button>
                  ) : (
                    <Button full variant="secondary" className="mt-4" onClick={() => setSubscriptionDialog('pause')}>Pausar</Button>
                  )}
                  <Button full variant="text" className="mt-2 text-err" onClick={() => setSubscriptionDialog('cancel')}>Cancelar suscripción</Button>
                </section>
              ) : (
                <>
                  <section className="rounded-card border border-g200 bg-white p-5">
                    <StatusChip status="Confirmada" />
                    <h2 className="mt-3 text-[20px] font-bold">Estándar</h2>
                    <p className="mt-1 text-[14px] text-g600">Publica horarios, recibe reservas y cobra con pago protegido.</p>
                    <p className="mt-4 text-[24px] font-bold">$0.00 MXN <span className="text-[13px] font-normal text-g600">al mes</span></p>
                    <p className="mt-2 text-[13px] font-semibold">Comisión de 15% por clase impartida.</p>
                    <p className="mt-3 flex items-center gap-2 text-[12px] text-ok"><CheckCircle2 size={15} aria-hidden /> Plan actual</p>
                  </section>
                  <section className="rounded-card border-2 border-ink bg-white p-5 shadow-sm">
                    <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-ink px-3 text-[12px] font-bold text-white"><BadgeCheck size={14} aria-hidden /> Recomendado</span>
                    <h2 className="mt-3 text-[20px] font-bold">Tutor Destacado</h2>
                    <p className="mt-1 text-[24px] font-bold">$299.00 MXN<span className="text-[13px] font-normal text-g600">/mes</span></p>
                    <p className="mt-1 text-[12px] text-g600">Facturación únicamente mensual.</p>
                    <ul className="mt-4 flex flex-col gap-2 text-[13px]">
                      {['Comisión reducida a 5%', 'Prioridad en resultados de búsqueda', 'Insignia visible para Alumnos', 'Métricas de rendimiento'].map((benefit) => (
                        <li key={benefit} className="flex items-center gap-2 font-semibold"><Check size={16} className="text-ok" aria-hidden />{benefit}</li>
                      ))}
                    </ul>
                    <Button full className="mt-5" onClick={() => setSubscriptionDialog('checkout')}>Suscribirme</Button>
                  </section>
                </>
              )}
            </div>
          )}
          {section === 'help' && (
            <div className="flex flex-col gap-3">
              {[
                ['¿Cómo recibo mis pagos?', 'El monto se libera 48 h después de la clase sin reportes.'],
                ['¿Cómo actualizo mi disponibilidad?', 'En Calendario puedes habilitar o bloquear horarios publicados.'],
                ['¿Qué revisa TutorClick?', 'Validamos tu identidad, título, cédula y perfil profesional.'],
              ].map(([question, answer]) => (
                <section key={question} className="rounded-card border border-g200 bg-white p-4">
                  <h2 className="font-bold">{question}</h2><p className="mt-1 text-[14px] text-g600">{answer}</p>
                </section>
              ))}
              <Button full icon={LifeBuoy}>Contactar a soporte</Button>
            </div>
          )}
        </div>
        {section === 'subscription' && subscriptionDialog && (
          <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/50">
            <div role="dialog" aria-modal="true" className="rounded-t-3xl bg-white px-5 pb-6 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,.18)]">
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-g300" />
              {subscriptionDialog === 'checkout' && (
                <div>
                  <h2 className="text-[20px] font-bold">Suscribirte a Tutor Destacado</h2>
                  <p className="mt-1 text-[14px] text-g600">$299.00 MXN al mes · renovación mensual automática.</p>
                  <div className="mt-4 flex items-center gap-3 rounded-card border-2 border-ink bg-g100 p-3">
                    <span className="grid h-9 w-12 place-items-center rounded bg-ink text-[12px] font-bold text-white">VISA</span>
                    <div className="flex-1"><p className="font-bold">Visa •••• 4242</p><p className="text-[12px] text-g600">{fullName} · Vence 09/28</p></div>
                    <CheckCircle2 size={20} className="text-ok" aria-hidden />
                  </div>
                  <Button full className="mt-4" onClick={() => { setSubscriptionState('active'); setSubscriptionDialog(null) }}>Pagar $299.00 MXN y suscribirme</Button>
                  <Button full variant="text" className="mt-2" onClick={() => setSubscriptionDialog(null)}>Cancelar</Button>
                </div>
              )}
              {subscriptionDialog === 'pause' && (
                <div>
                  <h2 className="text-[20px] font-bold">Pausar suscripción</h2>
                  <p className="mt-2 text-[14px] text-g600">No habrá cobros mientras esté pausada. Perderás temporalmente prioridad, insignia, métricas y comisión de 5%.</p>
                  <Button full className="mt-4" onClick={() => { setSubscriptionState('paused'); setSubscriptionDialog(null) }}>Confirmar pausa</Button>
                  <Button full variant="text" className="mt-2" onClick={() => setSubscriptionDialog(null)}>Conservar plan activo</Button>
                </div>
              )}
              {subscriptionDialog === 'cancel' && (
                <div>
                  <h2 className="text-[20px] font-bold">Cancelar suscripción</h2>
                  <p className="mt-2 text-[14px] text-g600">Tu plan volverá a Estándar con comisión de 15%. Esta acción elimina los beneficios de Tutor Destacado.</p>
                  <Button full variant="destructive" className="mt-4" onClick={() => { setSubscriptionState('standard'); setSubscriptionDialog(null) }}>Confirmar cancelación</Button>
                  <Button full variant="text" className="mt-2" onClick={() => setSubscriptionDialog(null)}>Volver</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const options = [
    ['profile', 'Perfil', 'Tu información profesional y materias', User],
    ['credentials', 'Credenciales', 'Consulta el estado de tus documentos', GraduationCap],
    ['students', 'Mis alumnos', `${students.length} Alumnos con clases`, Users],
    ['help', 'Ayuda', 'Pagos, calendario y soporte', HelpCircle],
  ] as const

  return (
    <div className="flex h-full flex-col bg-white">
      <TopBar title="Más" />
      <div className="flex-1 overflow-y-auto bg-g50 p-4">
        <section className="mb-3 flex items-center gap-3 rounded-card border border-g200 bg-white p-4">
          {profilePhoto ? (
            <img src={profilePhoto} alt={`Foto de ${fullName}`} className="size-14 shrink-0 rounded-full bg-g200 object-cover" />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-ink text-[16px] font-bold text-white">{fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
          )}
          <div className="flex-1"><h1 className="text-[18px] font-bold">{fullName}</h1><p className="truncate text-[12px] text-g600">Tutor · {userId}</p></div>
          <StatusChip status={verificationLabel} />
        </section>
        <div className="flex flex-col gap-2">
          {options.map(([key, label, detail, Icon]) => (
            <button key={key} type="button" onClick={() => setSection(key)} className="flex min-h-16 w-full items-center gap-3 rounded-card border border-g200 bg-white p-3.5 text-left hover:border-ink">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-g100"><Icon size={20} aria-hidden /></span>
              <span className="min-w-0 flex-1"><span className="block font-bold">{label}</span><span className="block truncate text-[12px] text-g600">{detail}</span></span>
              <ChevronRight size={18} aria-hidden />
            </button>
          ))}
        </div>
        <Button full variant="destructive" icon={LogOut} className="mt-4" onClick={onLogout}>Cerrar sesión</Button>
      </div>
      <BottomNav items={tutorMainNav} active={4} onSelect={onTabSelect} />
    </div>
  )
}
