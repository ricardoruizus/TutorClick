import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Edit3,
  GraduationCap,
  Heart,
  HelpCircle,
  Lock,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Shuffle,
  Star,
  Trash2,
  Undo2,
  Users,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react'
import { BottomNav, Button, StatusChip, TopBar, studentNav, type ChipKey } from '../../components/ui/ds'
import { ListState } from '../../components/ui/list-state'
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SAVED_CARDS,
  DEFAULT_STUDENT_PROFILE,
  formatMoney,
} from '../../data/mock'
import type {
  ClassSession,
  NotificationPrefs,
  PreferredMode,
  SavedCardItem,
  StudentProfileData,
  TutorData,
} from '../../types'

export {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SAVED_CARDS,
  DEFAULT_STUDENT_PROFILE,
  type NotificationPrefs,
  type PreferredMode,
  type SavedCardItem,
  type StudentProfileData,
}

const cx = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ')

export type AccountSubscreen =
  | 'home'
  | 'edit'
  | 'my-tutors'
  | 'favorites'
  | 'payments'
  | 'notifications'
  | 'settings'
  | 'settings-notifications'
  | 'settings-privacy'
  | 'settings-support'

type StudentNotification = {
  id: string
  key: keyof NotificationPrefs
  icon: LucideIcon
  chip: ChipKey
  title: string
  body: string
  when: string
  sessionId: string
}

function ToggleRow({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string
  detail: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-card border border-g200 bg-white p-3.5 text-left transition-colors hover:border-ink"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-[12px] text-g600">{detail}</p>
      </div>
      <span
        className={cx(
          'inline-flex min-h-8 min-w-16 shrink-0 items-center justify-center gap-1 rounded-full px-2.5 text-[12px] font-bold transition-colors',
          checked ? 'bg-ink text-white' : 'bg-g200 text-g700',
        )}
      >
        {checked ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
        {checked ? 'Activo' : 'Inactivo'}
      </span>
    </button>
  )
}

export function StudentAccountScreen({
  profile,
  profileError,
  onUpdateProfile,
  onUpdatePhoto,
  sessions,
  tutors,
  favorites,
  onToggleFavorite,
  cards,
  onChangeCards,
  notifPrefs,
  onChangeNotifPrefs,
  onSelectTutorProfile,
  onBookTutor,
  onOpenSession,
  onFindTutor,
  onLogout,
  onTabSelect,
}: {
  profile: StudentProfileData
  profileError?: string | null
  onUpdateProfile: (patch: Partial<StudentProfileData>) => Promise<void>
  onUpdatePhoto: (file: File) => Promise<string | undefined>
  sessions: ClassSession[]
  tutors: TutorData[]
  favorites: string[]
  onToggleFavorite: (tutorId: string) => void
  cards: SavedCardItem[]
  onChangeCards: (next: SavedCardItem[]) => void
  notifPrefs: NotificationPrefs
  onChangeNotifPrefs: (next: NotificationPrefs) => void
  onSelectTutorProfile: (tutorId: string) => void
  onBookTutor: (tutorId: string) => void
  onOpenSession: (sessionId: string) => void
  onFindTutor: () => void
  onLogout: () => void
  onTabSelect: (idx: number) => void
}) {
  const [subStack, setSubStack] = useState<AccountSubscreen[]>(['home'])
  const [toast, setToast] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [isSavingPhoto, setIsSavingPhoto] = useState(false)

  // Estado local de Editar perfil
  const [draftName, setDraftName] = useState(profile.name)
  const [draftCareer, setDraftCareer] = useState(profile.career ?? '')
  const [draftMode, setDraftMode] = useState<PreferredMode>(profile.preferredMode ?? 'Presencial y en línea')
  const [draftZone, setDraftZone] = useState(profile.zone ?? '')
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Estado local de Agregar tarjeta
  const [addingCard, setAddingCard] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardHolder, setCardHolder] = useState(profile.name)
  const [cardErr, setCardErr] = useState<string | null>(null)

  // Estado local de Privacidad y Soporte
  const [shareAcademicLevel, setShareAcademicLevel] = useState(true)
  const [protectContact, setProtectContact] = useState(true)
  const [supportText, setSupportText] = useState('')

  const sub = subStack[subStack.length - 1]

  function openSub(next: AccountSubscreen) {
    setToast(null)
    if (next === 'edit') {
      setDraftName(profile.name)
      setDraftCareer(profile.career ?? '')
      setDraftMode(profile.preferredMode ?? 'Presencial y en línea')
      setDraftZone(profile.zone ?? '')
      setEditError(null)
    }
    setSubStack((prev) => [...prev, next])
  }

  function goSubBack() {
    setToast(null)
    setSubStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }

  // "Mis tutores": agrupados a partir de las clases del Alumno
  const myTutors = useMemo(() => {
    const byTutor = new Map<string, { tutor: TutorData; count: number; lastSubject: string }>()
    for (const s of sessions) {
      const catalogTutor = tutors.find((t) => t.id === s.tutorId)
      if (!catalogTutor) continue
      const prev = byTutor.get(s.tutorId)
      if (prev) {
        prev.count += 1
      } else {
        byTutor.set(s.tutorId, {
          tutor: catalogTutor,
          count: 1,
          lastSubject: s.subject,
        })
      }
    }
    return Array.from(byTutor.values()).sort((a, b) => b.count - a.count)
  }, [sessions, tutors])

  const favoriteTutors = useMemo(
    () => tutors.filter((t) => favorites.includes(t.id)),
    [favorites, tutors],
  )

  const notificationItems: StudentNotification[] = []

  const visibleNotifications = notificationItems.filter((item) => notifPrefs[item.key])

  const screenTitle: Record<AccountSubscreen, string> = {
    home: 'Perfil',
    edit: 'Editar perfil',
    'my-tutors': 'Mis tutores',
    favorites: 'Favoritos',
    payments: 'Métodos de pago',
    notifications: 'Notificaciones',
    settings: 'Ajustes',
    'settings-notifications': 'Preferencias de notificaciones',
    'settings-privacy': 'Privacidad',
    'settings-support': 'Ayuda y soporte',
  }

  const ModeIcon =
    profile.preferredMode === 'Presencial y en línea'
      ? Shuffle
      : profile.preferredMode === 'Presencial'
        ? MapPin
        : Video

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <TopBar title={screenTitle[sub]} back={sub !== 'home'} onBack={sub !== 'home' ? goSubBack : undefined} />

      <div className="flex-1 overflow-y-auto bg-g50 p-4">
        <div className="flex flex-col gap-3.5">
        {(sub === 'home' || sub === 'edit') && profileError && (
          <p role="alert" className="rounded-btn border border-err bg-err-bg p-3 text-[14px] font-semibold text-err">
            {profileError}
          </p>
        )}
          {toast && (
            <div
              role="status"
              className="flex items-center justify-between gap-2 rounded-btn border-l-4 border-ok bg-ok-bg p-3 text-[14px] font-semibold text-ok shadow-sm"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} className="shrink-0" aria-hidden />
                {toast}
              </span>
              <button
                type="button"
                aria-label="Cerrar aviso"
                onClick={() => setToast(null)}
                className="grid size-9 place-items-center"
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          )}

          {/* ==================== PERFIL PRINCIPAL ==================== */}
          {sub === 'home' && (
            <>
              <section className="rounded-card border border-g200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  {profile.photo ? (
                    <img src={profile.photo} alt={`Foto de ${profile.name}`} className="size-16 shrink-0 rounded-full bg-g200 object-cover" />
                  ) : (
                    <span aria-label={`Sin foto de ${profile.name}`} className="grid size-16 shrink-0 place-items-center rounded-full bg-g200 text-[18px] font-bold text-g700">
                      {profile.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-[12px] font-semibold text-g600">Alumno · {profile.id}</span>
                    <h1 className="truncate text-[20px] font-bold">{profile.name}</h1>
                    <p className="flex items-center gap-1.5 text-[14px] text-g700">
                      <GraduationCap size={16} className="shrink-0" aria-hidden />
                      {profile.career ?? 'Sin completar'}
                    </p>
                  </div>
                </div>

                <dl className="mt-3.5 grid grid-cols-2 gap-2 border-t border-g200 pt-3 text-[12px]">
                  <div className="rounded-btn bg-g100 p-2.5">
                    <dt className="font-semibold text-g600">Modalidad preferida</dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 text-[14px] font-bold text-ink">
                      <ModeIcon size={15} className="shrink-0" aria-hidden />
                      <span className="truncate">{profile.preferredMode ?? 'Sin completar'}</span>
                    </dd>
                  </div>
                  <div className="rounded-btn bg-g100 p-2.5">
                    <dt className="font-semibold text-g600">Zona</dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 text-[14px] font-bold text-ink">
                      <MapPin size={15} className="shrink-0" aria-hidden />
                      <span className="truncate">{profile.zone ?? 'Sin completar'}</span>
                    </dd>
                  </div>
                </dl>

                <div className="mt-3.5">
                  <Button full variant="secondary" icon={Edit3} onClick={() => openSub('edit')}>
                    Editar perfil
                  </Button>
                </div>
              </section>

              <nav aria-label="Secciones de tu cuenta" className="flex flex-col gap-2">
                {(
                  [
                    {
                      key: 'my-tutors' as const,
                      icon: Users,
                      label: 'Mis tutores',
                      detail: `${myTutors.length} ${myTutors.length === 1 ? 'Tutor con clases' : 'Tutores con clases'}`,
                    },
                    {
                      key: 'favorites' as const,
                      icon: Heart,
                      label: 'Favoritos',
                      detail: `${favoriteTutors.length} ${favoriteTutors.length === 1 ? 'Tutor guardado' : 'Tutores guardados'}`,
                    },
                    {
                      key: 'payments' as const,
                      icon: CreditCard,
                      label: 'Métodos de pago',
                      detail: cards.find((c) => c.isDefault)
                        ? `${cards.find((c) => c.isDefault)!.brand} •••• ${cards.find((c) => c.isDefault)!.last4}`
                        : 'Sin tarjetas guardadas',
                    },
                    {
                      key: 'notifications' as const,
                      icon: Bell,
                      label: 'Notificaciones',
                      detail: `${visibleNotifications.length} avisos activos`,
                    },
                    {
                      key: 'settings' as const,
                      icon: Settings,
                      label: 'Ajustes',
                      detail: 'Notificaciones, privacidad, ayuda y sesión',
                    },
                  ]
                ).map((row) => {
                  const Icon = row.icon
                  return (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => openSub(row.key)}
                      className="flex min-h-16 w-full items-center gap-3 rounded-card border border-g200 bg-white p-3.5 text-left shadow-sm transition-colors hover:border-ink"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-g100 text-ink">
                        <Icon size={20} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-semibold text-ink">{row.label}</span>
                        <span className="block truncate text-[12px] text-g600">{row.detail}</span>
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-g500" aria-hidden />
                    </button>
                  )
                })}
              </nav>
              <Button full variant="destructive" icon={LogOut} onClick={onLogout}>
                Cerrar sesión
              </Button>
            </>
          )}

          {/* ==================== EDITAR PERFIL ==================== */}
          {sub === 'edit' && (
            <section className="flex flex-col gap-3.5 rounded-card border border-g200 bg-white p-4">
              <div className="flex items-center gap-3.5 border-b border-g200 pb-3.5">
                {profile.photo ? (
                  <img src={profile.photo} alt={`Foto de ${profile.name}`} className="size-16 shrink-0 rounded-full bg-g200 object-cover" />
                ) : (
                  <span aria-label={`Sin foto de ${profile.name}`} className="grid size-16 shrink-0 place-items-center rounded-full bg-g200 text-[18px] font-bold text-g700">
                    {profile.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                )}
                <label
                  htmlFor="student-photo-upload"
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-btn border-2 border-ink bg-white px-3.5 text-[14px] font-semibold text-ink hover:bg-g100"
                >
                  Cambiar foto
                  <input
                    id="student-photo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={isSavingPhoto}
                    onChange={async (e) => {
                      const input = e.currentTarget
                      const file = input.files?.[0]
                      if (!file) return
                      setIsSavingPhoto(true)
                      setPhotoError(null)
                      setToast(null)
                      try {
                        const warning = await onUpdatePhoto(file)
                        setToast('Foto actualizada correctamente.')
                        if (warning) setPhotoError(warning)
                      } catch (error) {
                        setPhotoError(error instanceof Error ? error.message : 'No se pudo actualizar la foto.')
                      } finally {
                        input.value = ''
                        setIsSavingPhoto(false)
                      }
                    }}
                  />
                </label>
                {isSavingPhoto && <p role="status" className="text-[13px] font-semibold text-g600">Actualizando foto…</p>}
                {photoError && <p role="alert" className="text-[13px] font-semibold text-err">{photoError}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="edit-student-name" className="text-[12px] font-semibold text-g700">
                  Nombre completo
                </label>
                <input
                  id="edit-student-name"
                  value={draftName}
                  onChange={(e) => {
                    setDraftName(e.target.value)
                    setEditError(null)
                  }}
                  className="min-h-12 rounded-btn border border-g500 bg-white px-3.5 text-[14px] outline-none focus:border-ink focus:ring-4 focus:ring-ink/15"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="edit-student-career" className="text-[12px] font-semibold text-g700">
                  Carrera o nivel académico
                </label>
                <input
                  id="edit-student-career"
                  value={draftCareer}
                  onChange={(e) => {
                    setDraftCareer(e.target.value)
                    setEditError(null)
                  }}
                  className="min-h-12 rounded-btn border border-g500 bg-white px-3.5 text-[14px] outline-none focus:border-ink focus:ring-4 focus:ring-ink/15"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="edit-student-zone" className="text-[12px] font-semibold text-g700">
                  Zona en Mérida
                </label>
                <input
                  id="edit-student-zone"
                  value={draftZone}
                  onChange={(e) => setDraftZone(e.target.value)}
                  className="min-h-12 rounded-btn border border-g500 bg-white px-3.5 text-[14px] outline-none focus:border-ink focus:ring-4 focus:ring-ink/15"
                />
              </div>

              <div>
                <p className="mb-1.5 text-[12px] font-semibold text-g700">Modalidad preferida</p>
                <div role="radiogroup" aria-label="Modalidad preferida" className="flex flex-col gap-2">
                  {(['En línea', 'Presencial', 'Presencial y en línea'] as const).map((m) => {
                    const active = draftMode === m
                    return (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setDraftMode(m)}
                        className={cx(
                          'flex min-h-12 items-center justify-between rounded-btn border-2 px-3.5 text-[14px] font-semibold',
                          active ? 'border-ink bg-ink text-white' : 'border-g300 bg-white text-ink',
                        )}
                      >
                        <span>{m}</span>
                        {active && <Check size={17} aria-hidden />}
                      </button>
                    )
                  })}
                  {visibleNotifications.length === 0 && (
                    <p className="rounded-card border border-dashed border-g300 bg-white p-5 text-center text-g600">
                      No tienes notificaciones todavía.
                    </p>
                  )}
                </div>
              </div>

              {editError && (
                <p role="alert" className="flex items-center gap-1.5 text-[14px] font-semibold text-err">
                  <AlertTriangle size={16} aria-hidden />
                  {editError}
                </p>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  full
                  onClick={async () => {
                    if (!draftName.trim() || !draftCareer.trim() || !draftZone.trim()) {
                      setEditError('Escribe tu nombre, carrera y zona.')
                      return
                    }
                    setIsSavingProfile(true)
                    setEditError(null)
                    try {
                      await onUpdateProfile({
                        name: draftName.trim(),
                        career: draftCareer.trim(),
                        preferredMode: draftMode,
                        zone: draftZone.trim(),
                      })
                      goSubBack()
                      setToast('Perfil actualizado.')
                    } catch (error) {
                      setEditError(error instanceof Error ? error.message : 'No se pudo guardar el perfil.')
                    } finally {
                      setIsSavingProfile(false)
                    }
                  }}
                  loading={isSavingProfile}
                >
                  Guardar cambios
                </Button>
                <Button full variant="text" onClick={goSubBack}>
                  Cancelar
                </Button>
              </div>
            </section>
          )}

          {/* ==================== MIS TUTORES ==================== */}
          {sub === 'my-tutors' && (
            <>
              {myTutors.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-g300 bg-white px-6 py-10 text-center">
                  <span className="grid size-16 place-items-center rounded-full bg-g100 text-ink">
                    <Users size={28} aria-hidden />
                  </span>
                  <h2 className="text-[18px] font-bold">Aún no tienes Tutores registrados</h2>
                  <p className="max-w-64 text-[14px] text-g600">
                    Cuando tomes o reserves clases con un Tutor, aparecerá aquí para volver a reservar rápido.
                  </p>
                  <Button icon={Search} onClick={onFindTutor}>
                    Buscar Tutor
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {myTutors.map(({ tutor, count, lastSubject }) => (
                    <article
                      key={tutor.id}
                      className="flex flex-col gap-3 rounded-card border border-g200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={tutor.photo}
                          alt={`Foto de ${tutor.name}`}
                          className="size-14 shrink-0 rounded-full bg-g200 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h2 className="truncate text-[16px] font-bold">{tutor.name}</h2>
                            {tutor.verified && (
                              <BadgeCheck size={17} className="shrink-0 text-ok" aria-label="Verificado" />
                            )}
                          </div>
                          <p className="text-[14px] text-g600">{lastSubject}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                            <span className="inline-flex items-center gap-1 rounded-full bg-g100 px-2.5 py-0.5 font-bold text-ink">
                              <CalendarDays size={12} aria-hidden />
                              {count} {count === 1 ? 'clase' : 'clases'}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-g700">
                              <Star size={13} className="fill-ink text-ink" aria-hidden />
                              {tutor.rating.toFixed(1)} · {formatMoney(tutor.rate)}/h
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-g200 pt-3">
                        <Button
                          variant="secondary"
                          className="min-h-11 !px-3"
                          onClick={() => onSelectTutorProfile(tutor.id)}
                        >
                          Ver perfil
                        </Button>
                        <Button
                          icon={RefreshCw}
                          className="min-h-11 !px-3"
                          onClick={() => onBookTutor(tutor.id)}
                        >
                          Reservar de nuevo
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ==================== FAVORITOS ==================== */}
          {sub === 'favorites' && (
            <ListState
              count={favoriteTutors.length}
              emptyTitle="Sin Tutores en favoritos"
              emptyDescription="Guarda a tus Tutores preferidos desde Buscar para encontrarlos en segundos."
              emptyAction="Explorar Tutores"
              onEmptyAction={onFindTutor}
              loadingLabel="Cargando favoritos"
            >
              {favoriteTutors.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-g300 bg-white px-6 py-10 text-center">
                  <span className="grid size-16 place-items-center rounded-full bg-g100 text-ink">
                    <Heart size={28} aria-hidden />
                  </span>
                  <h2 className="text-[18px] font-bold">Sin Tutores en favoritos</h2>
                  <p className="max-w-64 text-[14px] text-g600">
                    Guarda a tus Tutores preferidos desde Buscar para encontrarlos en segundos.
                  </p>
                  <Button icon={Search} onClick={onFindTutor}>
                    Explorar Tutores
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {favoriteTutors.map((tutor) => (
                    <article
                      key={tutor.id}
                      className="flex flex-col gap-3 rounded-card border border-g200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={tutor.photo}
                          alt={`Foto de ${tutor.name}`}
                          className="size-14 shrink-0 rounded-full bg-g200 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h2 className="truncate text-[16px] font-bold">{tutor.name}</h2>
                            {tutor.verified && (
                              <BadgeCheck size={17} className="shrink-0 text-ok" aria-label="Verificado" />
                            )}
                          </div>
                          <p className="text-[14px] text-g600">{tutor.subjects.join(' y ')}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-[14px] font-semibold">
                            <Star size={14} className="fill-ink" aria-hidden />
                            {tutor.rating.toFixed(1)} · {formatMoney(tutor.rate)}/h
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Quitar a ${tutor.name} de favoritos`}
                          onClick={() => {
                            onToggleFavorite(tutor.id)
                            setToast(`${tutor.name} se quitó de favoritos.`)
                          }}
                          className="grid size-11 shrink-0 place-items-center rounded-full border border-g200 text-ink hover:bg-g100"
                        >
                          <Heart size={20} className="fill-ink" aria-hidden />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-g200 pt-3">
                        <Button
                          variant="secondary"
                          className="min-h-11 !px-3"
                          onClick={() => onSelectTutorProfile(tutor.id)}
                        >
                          Ver perfil
                        </Button>
                        <Button className="min-h-11 !px-3" onClick={() => onBookTutor(tutor.id)}>
                          Reservar
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </ListState>
          )}

          {/* ==================== MÉTODOS DE PAGO ==================== */}
          {sub === 'payments' && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-start gap-2.5 rounded-card border border-info bg-info-bg p-3.5 text-[12px] font-semibold text-info">
                <Lock size={17} className="mt-0.5 shrink-0" aria-hidden />
                <span>Tus pagos están protegidos: el Tutor recibe el cobro 48 h después de impartir la clase.</span>
              </div>

              {cards.map((card) => (
                <article
                  key={card.id}
                  className={cx(
                    'flex flex-col gap-3 rounded-card border-2 bg-white p-4 shadow-sm',
                    card.isDefault ? 'border-ink' : 'border-g200',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-14 shrink-0 place-items-center rounded bg-ink text-[12px] font-bold tracking-wider text-white">
                      {card.brand.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-bold">
                        {card.brand} •••• {card.last4}
                      </p>
                      <p className="text-[12px] text-g600">
                        {card.holder} · Vence {card.expiry}
                      </p>
                    </div>
                    {card.isDefault && (
                      <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-ok-bg px-2.5 text-[12px] font-bold text-ok">
                        <Check size={13} aria-hidden />
                        Principal
                      </span>
                    )}
                  </div>

                  {!card.isDefault && (
                    <div className="flex items-center justify-between gap-2 border-t border-g200 pt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          onChangeCards(cards.map((c) => ({ ...c, isDefault: c.id === card.id })))
                          setToast(`${card.brand} •••• ${card.last4} es ahora tu tarjeta principal.`)
                        }}
                        className="min-h-11 rounded-btn px-3 text-[14px] font-semibold text-ink underline underline-offset-4 hover:bg-g100"
                      >
                        Usar como principal
                      </button>
                      <button
                        type="button"
                        aria-label={`Eliminar tarjeta terminación ${card.last4}`}
                        onClick={() => {
                          onChangeCards(cards.filter((c) => c.id !== card.id))
                          setToast('Tarjeta eliminada.')
                        }}
                        className="inline-flex min-h-11 items-center gap-1 rounded-btn px-3 text-[14px] font-semibold text-err hover:bg-err-bg"
                      >
                        <Trash2 size={16} aria-hidden />
                        Eliminar
                      </button>
                    </div>
                  )}
                </article>
              ))}

              {!addingCard ? (
                <Button variant="secondary" full icon={Plus} onClick={() => setAddingCard(true)}>
                  Agregar tarjeta
                </Button>
              ) : (
                <section className="flex flex-col gap-3 rounded-card border border-g200 bg-white p-4">
                  <h2 className="text-[16px] font-bold">Nueva tarjeta</h2>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="acct-card-num" className="text-[12px] font-semibold text-g700">
                      Número de tarjeta
                    </label>
                    <input
                      id="acct-card-num"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 16)
                        setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '))
                        setCardErr(null)
                      }}
                      placeholder="4532 8910 2234 8890"
                      className="min-h-12 rounded-btn border border-g500 px-3.5 text-[14px] tabular-nums outline-none focus:border-ink"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="acct-card-exp" className="text-[12px] font-semibold text-g700">
                        Vencimiento
                      </label>
                      <input
                        id="acct-card-exp"
                        inputMode="numeric"
                        value={cardExpiry}
                        onChange={(e) => {
                          const d = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setCardExpiry(d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`)
                          setCardErr(null)
                        }}
                        placeholder="MM/AA"
                        className="min-h-12 rounded-btn border border-g500 px-3.5 text-[14px] tabular-nums outline-none focus:border-ink"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="acct-card-cvv" className="text-[12px] font-semibold text-g700">
                        CVV
                      </label>
                      <input
                        id="acct-card-cvv"
                        inputMode="numeric"
                        value={cardCvv}
                        onChange={(e) => {
                          setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                          setCardErr(null)
                        }}
                        placeholder="123"
                        className="min-h-12 rounded-btn border border-g500 px-3.5 text-[14px] tabular-nums outline-none focus:border-ink"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="acct-card-holder" className="text-[12px] font-semibold text-g700">
                      Nombre en la tarjeta
                    </label>
                    <input
                      id="acct-card-holder"
                      value={cardHolder}
                      onChange={(e) => {
                        setCardHolder(e.target.value)
                        setCardErr(null)
                      }}
                      className="min-h-12 rounded-btn border border-g500 px-3.5 text-[14px] outline-none focus:border-ink"
                    />
                  </div>

                  {cardErr && (
                    <p role="alert" className="flex items-center gap-1.5 text-[14px] font-semibold text-err">
                      <AlertTriangle size={16} aria-hidden />
                      {cardErr}
                    </p>
                  )}

                  <div className="flex flex-col gap-2">
                    <Button
                      full
                      onClick={() => {
                        const digits = cardNumber.replace(/\D/g, '')
                        if (digits.length < 16 || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry) || cardCvv.length < 3 || !cardHolder.trim()) {
                          setCardErr('Revisa los 16 dígitos, vencimiento MM/AA, CVV y titular.')
                          return
                        }
                        const brand = digits.startsWith('5') ? 'Mastercard' : 'Visa'
                        onChangeCards([
                          ...cards.map((c) => ({ ...c, isDefault: false })),
                          {
                            id: `CARD-${Date.now()}`,
                            brand,
                            last4: digits.slice(-4),
                            expiry: cardExpiry,
                            holder: cardHolder.trim(),
                            isDefault: true,
                          },
                        ])
                        setAddingCard(false)
                        setCardNumber('')
                        setCardExpiry('')
                        setCardCvv('')
                        setToast('Tarjeta guardada como principal.')
                      }}
                    >
                      Guardar tarjeta
                    </Button>
                    <Button full variant="text" onClick={() => setAddingCard(false)}>
                      Cancelar
                    </Button>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ==================== NOTIFICACIONES ==================== */}
          {sub === 'notifications' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 rounded-card border border-g200 bg-white p-3.5">
                <div>
                  <p className="text-[14px] font-bold">Alertas de tus clases</p>
                  <p className="text-[12px] text-g600">Mérida (UTC-6)</p>
                </div>
                <button
                  type="button"
                  onClick={() => openSub('settings-notifications')}
                  className="inline-flex min-h-11 items-center gap-1 rounded-btn border-2 border-ink px-3 text-[12px] font-semibold text-ink hover:bg-g100"
                >
                  Configurar
                </button>
              </div>

              {visibleNotifications.map((item) => {
                const Icon = item.icon
                return (
                  <article
                    key={item.id}
                    className="flex flex-col gap-2.5 rounded-card border border-g200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-g100 text-ink">
                          <Icon size={18} aria-hidden />
                        </span>
                        <div>
                          <h2 className="text-[15px] font-bold">{item.title}</h2>
                          <p className="text-[12px] text-g600">{item.when}</p>
                        </div>
                      </div>
                      <StatusChip status={item.chip} />
                    </div>
                    <p className="text-[14px] text-g700">{item.body}</p>
                    <div>
                      <button
                        type="button"
                        onClick={() => onOpenSession(item.sessionId)}
                        className="inline-flex min-h-11 items-center gap-1 rounded-btn border border-g300 bg-g50 px-3 text-[13px] font-semibold text-ink hover:border-ink"
                      >
                        Ver clase {item.sessionId}
                        <ChevronRight size={15} aria-hidden />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* ==================== AJUSTES ==================== */}
          {sub === 'settings' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => openSub('settings-notifications')}
                  className="flex min-h-16 w-full items-center gap-3 rounded-card border border-g200 bg-white p-3.5 text-left hover:border-ink"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-g100 text-ink">
                    <Bell size={20} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold">Notificaciones</span>
                    <span className="block text-[12px] text-g600">
                      Confirmaciones, recordatorios 24 h y 1 h, reprogramaciones y reembolsos
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-g500" aria-hidden />
                </button>

                <button
                  type="button"
                  onClick={() => openSub('settings-privacy')}
                  className="flex min-h-16 w-full items-center gap-3 rounded-card border border-g200 bg-white p-3.5 text-left hover:border-ink"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-g100 text-ink">
                    <ShieldCheck size={20} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold">Privacidad</span>
                    <span className="block text-[12px] text-g600">
                      Visibilidad académica y contacto protegido dentro de TutorClick
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-g500" aria-hidden />
                </button>

                <button
                  type="button"
                  onClick={() => openSub('settings-support')}
                  className="flex min-h-16 w-full items-center gap-3 rounded-card border border-g200 bg-white p-3.5 text-left hover:border-ink"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-g100 text-ink">
                    <HelpCircle size={20} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold">Ayuda y soporte</span>
                    <span className="block text-[12px] text-g600">
                      Pago retenido 48 h, disputas y atención a Alumnos
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-g500" aria-hidden />
                </button>
              </div>

              <div className="pt-2">
                <Button full variant="destructive" icon={LogOut} onClick={onLogout}>
                  Cerrar sesión
                </Button>
              </div>
            </div>
          )}

          {/* ==================== AJUSTES · NOTIFICACIONES ==================== */}
          {sub === 'settings-notifications' && (
            <div className="flex flex-col gap-2.5">
              <p className="text-[13px] font-semibold text-g600">Tipos de aviso</p>
              <ToggleRow
                label="Reserva confirmada"
                detail="Al autorizar tu pago y confirmar el horario con el Tutor"
                checked={notifPrefs.bookingConfirmed}
                onChange={(v) => onChangeNotifPrefs({ ...notifPrefs, bookingConfirmed: v })}
              />
              <ToggleRow
                label="Recordatorio 24 h antes"
                detail="Un día antes de tu clase con lugar o enlace de acceso"
                checked={notifPrefs.reminder24h}
                onChange={(v) => onChangeNotifPrefs({ ...notifPrefs, reminder24h: v })}
              />
              <ToggleRow
                label="Recordatorio 1 h antes"
                detail="Una hora antes del inicio en horario de Mérida (UTC-6)"
                checked={notifPrefs.reminder1h}
                onChange={(v) => onChangeNotifPrefs({ ...notifPrefs, reminder1h: v })}
              />
              <ToggleRow
                label="Reprogramación propuesta"
                detail="Cuando el Tutor propone otro horario o responde tu solicitud"
                checked={notifPrefs.rescheduleProposed}
                onChange={(v) => onChangeNotifPrefs({ ...notifPrefs, rescheduleProposed: v })}
              />
              <ToggleRow
                label="Reembolso"
                detail="Confirmación del monto devuelto a tu tarjeta"
                checked={notifPrefs.refundIssued}
                onChange={(v) => onChangeNotifPrefs({ ...notifPrefs, refundIssued: v })}
              />

              <p className="mt-2 text-[13px] font-semibold text-g600">Canales</p>
              <ToggleRow
                label="Notificaciones en la app"
                detail="Avisos inmediatos en tu dispositivo"
                checked={notifPrefs.pushEnabled}
                onChange={(v) => onChangeNotifPrefs({ ...notifPrefs, pushEnabled: v })}
              />
              <ToggleRow
                label="Correo electrónico"
                detail={`Recibos y confirmaciones en ${profile.email}`}
                checked={notifPrefs.emailEnabled}
                onChange={(v) => onChangeNotifPrefs({ ...notifPrefs, emailEnabled: v })}
              />
            </div>
          )}

          {/* ==================== AJUSTES · PRIVACIDAD ==================== */}
          {sub === 'settings-privacy' && (
            <div className="flex flex-col gap-3">
              <ToggleRow
                label="Mostrar mi carrera al Tutor"
                detail="Permite que el Tutor adapte el material a tu nivel universitario"
                checked={shareAcademicLevel}
                onChange={setShareAcademicLevel}
              />
              <ToggleRow
                label="Bloquear enlaces y teléfonos externos"
                detail="Mantiene tu contacto protegido dentro del mensajero de TutorClick"
                checked={protectContact}
                onChange={setProtectContact}
              />
              <section className="rounded-card border border-g200 bg-white p-4 text-[14px] text-g700">
                <h2 className="font-bold text-ink">Tus datos están protegidos</h2>
                <p className="mt-1">
                  Tu número de tarjeta nunca se comparte con el Tutor y la dirección exacta solo se muestra en clases presenciales confirmadas en lugares públicos de Mérida.
                </p>
              </section>
            </div>
          )}

          {/* ==================== AJUSTES · AYUDA Y SOPORTE ==================== */}
          {sub === 'settings-support' && (
            <div className="flex flex-col gap-3.5">
              <section className="flex flex-col gap-2.5 rounded-card border border-g200 bg-white p-4 text-[14px]">
                <h2 className="text-[16px] font-bold">Preguntas frecuentes</h2>
                <div className="border-t border-g200 pt-2.5">
                  <p className="font-semibold">¿Cómo funciona el pago retenido?</p>
                  <p className="mt-0.5 text-g600">
                    Pagas al reservar y TutorClick libera el monto al Tutor 48 h después de concluir la clase sin reportes.
                  </p>
                </div>
                <div className="border-t border-g200 pt-2.5">
                  <p className="font-semibold">¿Qué pasa si tengo un inconveniente en mi clase?</p>
                  <p className="mt-0.5 text-g600">
                    Desde el detalle de la clase puedes abrir un reporte entre 15 min y 48 h después del inicio para congelar el pago mientras revisamos.
                  </p>
                </div>
              </section>

              <section className="flex flex-col gap-2.5 rounded-card border border-g200 bg-white p-4">
                <h2 className="text-[16px] font-bold">Escribir a soporte</h2>
                <label htmlFor="support-msg" className="text-[12px] font-semibold text-g700">
                  Cuéntanos cómo podemos ayudarte
                </label>
                <textarea
                  id="support-msg"
                  rows={3}
                  value={supportText}
                  onChange={(e) => setSupportText(e.target.value)}
                  placeholder="Ej. Tengo una duda sobre el reembolso de mi reserva…"
                  className="rounded-btn border border-g500 p-3 text-[14px] outline-none focus:border-ink"
                />
                <Button
                  full
                  disabled={!supportText.trim()}
                  onClick={() => {
                    setSupportText('')
                    setToast('Mensaje enviado a soporte. Te responderemos en menos de 24 h.')
                  }}
                >
                  Enviar consulta
                </Button>
              </section>
            </div>
          )}
        </div>
      </div>

      <BottomNav items={studentNav} active={3} onSelect={onTabSelect} />
    </div>
  )
}
