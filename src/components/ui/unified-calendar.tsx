import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  CreditCard,
  FileText,
  Flag,
  Layers,
  Link2,
  Lock,
  MapPin,
  MessageCircle,
  PlayCircle,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Video,
  X,
  XCircle,
} from 'lucide-react'
import { Avatar, BottomNav, Button, StatusChip, TopBar, studentNav, tutorNav, type ChipKey } from './ds'
import { ListState } from './list-state'
import {
  type AvailabilityBlock,
  type ClassMode,
  type ClassSession,
  type ClassStatus,
  type UserRole,
} from '../../types'
import { calcStudentTotal, calcTutorNet } from '../../services/pagos'
import { isUpcomingStatus } from '../../services/calendario'
import {
  CALENDAR_WEEK_DAYS as WEEK_DAYS,
  DAY_LABELS,
  DAY_SHORT_LABELS,
  PROPOSAL_DAYS,
  PROPOSAL_TIMES,
  formatMoney,
  formatTimeChip,
  formatTimeRange,
} from '../../data/mock'

const cx = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ')

export type CalendarViewMode = 'agenda' | 'week' | 'month'
export type TimeFilter = 'upcoming' | 'history'
export type DetailSheetKind = 'reschedule' | 'cancel' | 'rate' | 'report' | 'receipt'

function statusToChip(status: ClassStatus): ChipKey {
  return status
}

function ClassItemCard({
  session,
  role,
  showDateInline,
  isHistoryView,
  onOpen,
  onQuickAction,
  onBookAgain,
}: {
  session: ClassSession
  role: UserRole
  showDateInline?: boolean
  isHistoryView?: boolean
  onOpen: () => void
  onQuickAction?: (sheet: DetailSheetKind) => void
  onBookAgain?: (tutorId: string) => void
}) {
  const counterpart = role === 'alumno' ? session.tutorName : session.studentName
  const showNewBadge = role === 'tutor' && session.isNewForTutor && isUpcomingStatus(session.status)
  const showSoonBadge = session.status === 'Confirmada' && session.startsSoon
  const amount =
    role === 'alumno'
      ? calcStudentTotal(session.hourlyRate).total
      : calcTutorNet(session.hourlyRate).net
  const showFinishedActions = isHistoryView && session.status === 'Finalizada'

  return (
    <article className="flex w-full flex-col gap-2.5 rounded-card border border-g200 bg-white p-3.5 text-left shadow-sm transition-colors duration-200 hover:border-ink">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-col gap-2.5 text-left"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[14px] font-bold text-ink">
              {showDateInline || isHistoryView
                ? `${DAY_SHORT_LABELS[session.day]?.replace(' de noviembre', ' nov')} · `
                : ''}
              {formatTimeRange(session.time)}
            </span>
            {showNewBadge && (
              <span className="inline-flex min-h-6 items-center gap-1 rounded-full bg-ink px-2.5 text-[12px] font-bold text-white">
                <Sparkles size={12} aria-hidden />
                Nueva
              </span>
            )}
            {showSoonBadge && (
              <span className="inline-flex min-h-6 items-center gap-1 rounded-full bg-info-bg px-2.5 text-[12px] font-bold text-info">
                <Clock size={12} aria-hidden />
                En 10 min
              </span>
            )}
          </div>
          <ChevronRight size={18} className="shrink-0 text-g500" aria-hidden />
        </div>

        <div className="flex items-center gap-2.5">
          {role === 'alumno' ? (
            <img
              src={session.tutorPhoto}
              alt={`Foto de ${counterpart}`}
              className="size-11 shrink-0 rounded-full bg-g200 object-cover"
            />
          ) : (
            <Avatar name={counterpart} size={44} />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold leading-snug">{counterpart}</p>
            <p className="truncate text-[14px] text-g600">
              {session.subject} ·{' '}
              <span className="inline-flex items-center gap-1 align-baseline">
                {session.mode === 'En línea' ? <Video size={13} aria-hidden /> : <MapPin size={13} aria-hidden />}
                {session.mode}
              </span>
            </p>
          </div>
          {isHistoryView && (
            <p className="shrink-0 text-right text-[15px] font-bold tabular-nums text-ink">
              {formatMoney(amount)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-g100 pt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusChip status={statusToChip(session.status)} />
            {isHistoryView && <StatusChip status={session.paymentStatus} />}
            {session.status === 'Reprogramación propuesta' && (
              <span className="text-[12px] font-semibold text-warn">(por confirmar)</span>
            )}
          </div>
          {session.seriesTotal && (
            <span className="text-[12px] font-semibold text-g600">
              Sesión {session.seriesIndex} de {session.seriesTotal}
            </span>
          )}
        </div>
      </button>

      {showFinishedActions && (
        <div className="flex flex-wrap gap-2 border-t border-g200 pt-2.5">
          {role === 'alumno' && !session.ratingGiven && (
            <button
              type="button"
              onClick={() => onQuickAction?.('rate')}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-btn bg-ink px-3 text-[13px] font-semibold text-white hover:bg-g700"
            >
              <Star size={15} aria-hidden />
              Calificar
            </button>
          )}
          <button
            type="button"
            onClick={() => onQuickAction?.('receipt')}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-btn border-2 border-ink bg-white px-3 text-[13px] font-semibold text-ink hover:bg-g100"
          >
            <FileText size={15} aria-hidden />
            Ver recibo
          </button>
          {role === 'alumno' && onBookAgain && (
            <button
              type="button"
              onClick={() => onBookAgain(session.tutorId)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-btn border-2 border-g300 bg-white px-3 text-[13px] font-semibold text-ink hover:border-ink"
            >
              <RefreshCw size={15} aria-hidden />
              Reservar de nuevo
            </button>
          )}
        </div>
      )}
    </article>
  )
}

function SeriesGroupCard({
  sessions,
  role,
  onOpenSession,
}: {
  sessions: ClassSession[]
  role: UserRole
  onOpenSession: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  // Destacamos "3 de 4" si está en el grupo, o la primera disponible
  const featured = sessions.find((s) => s.seriesIndex === 3) ?? sessions[0]
  const counterpart = role === 'alumno' ? featured.tutorName : featured.studentName
  const headerLabel = `Serie con ${counterpart}, ${featured.seriesIndex} de ${featured.seriesTotal}`

  return (
    <section
      aria-label={headerLabel}
      className="rounded-card border-2 border-ink/15 bg-g100/80 p-3"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-white">
            <Layers size={15} aria-hidden />
          </span>
          <div>
            <h4 className="text-[14px] font-bold text-ink">{headerLabel}</h4>
            <p className="text-[12px] text-g600">
              {sessions.length} {sessions.length === 1 ? 'clase en esta vista' : 'clases agrupadas'} · {featured.subject}
            </p>
          </div>
        </div>
        {sessions.length > 1 && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="inline-flex min-h-11 items-center gap-1 rounded-btn px-2.5 text-[12px] font-semibold text-ink hover:bg-white"
          >
            {expanded ? 'Contraer' : `Ver (${sessions.length})`}
            {expanded ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {(expanded ? sessions : [featured]).map((s) => (
          <ClassItemCard
            key={s.id}
            session={s}
            role={role}
            showDateInline
            onOpen={() => onOpenSession(s.id)}
          />
        ))}
      </div>
    </section>
  )
}

function AvailabilityBlockRow({
  block,
  onToggle,
  onModeChange,
}: {
  block: AvailabilityBlock
  onToggle?: (id: string) => void
  onModeChange?: (id: string, mode: ClassMode) => void
}) {
  const isAvailable = block.state === 'disponible'
  const mode = block.mode ?? (block.time < '12:00' ? 'Presencial' : 'En línea')
  return (
    <article
      className={cx(
        'flex w-full flex-col gap-2 rounded-btn px-3.5 py-3 transition-colors duration-200',
        isAvailable
          ? 'border-2 border-g500 bg-white text-ink'
          : 'border-2 border-dashed border-g300 bg-g100 text-g600',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold">{formatTimeRange(block.time)}</p>
          <p className="flex items-center gap-1.5 text-[12px] font-medium">
            {isAvailable ? (
              <>
                <CheckCircle2 size={13} className="text-ok" aria-hidden />
                <span className="font-semibold text-ok">Disponible</span>
                <span className="text-g600">· Reservable al instante</span>
              </>
            ) : (
              <>
                <Ban size={13} className="text-g600" aria-hidden />
                <span className="font-semibold text-g700">Bloqueado</span>
                <span>· No visible para Alumnos</span>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggle?.(block.id)}
          aria-pressed={!isAvailable}
          className="min-h-11 shrink-0 rounded-btn border border-g300 bg-white px-3 text-[12px] font-semibold text-ink"
        >
          {isAvailable ? 'Bloquear' : 'Habilitar'}
        </button>
      </div>
      <div role="group" aria-label={`Modalidad para ${formatTimeChip(block.time)}`} className="grid grid-cols-2 gap-2 border-t border-g200 pt-2">
        {(['Presencial', 'En línea'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => onModeChange?.(block.id, value)}
            className={cx(
              'flex min-h-11 items-center justify-center gap-1.5 rounded-btn border text-[12px] font-semibold',
              mode === value ? 'border-ink bg-ink text-white' : 'border-g300 bg-white text-g700',
            )}
          >
            {value === 'Presencial' ? <MapPin size={14} aria-hidden /> : <Video size={14} aria-hidden />}
            {value}
          </button>
        ))}
      </div>
    </article>
  )
}

export function UnifiedCalendarScreen({
  role,
  sessions,
  tutorBlocks,
  onToggleBlock,
  onUpdateBlock,
  onApplyRecurringRule,
  onOpenSession,
  onBookAgain,
  onFindTutor,
  onBack,
  onTabSelect,
  navItems: customNavItems,
  activeNavIndex = 1,
}: {
  role: UserRole
  sessions: ClassSession[]
  tutorBlocks: AvailabilityBlock[]
  onToggleBlock?: (blockId: string) => void
  onUpdateBlock?: (blockId: string, patch: Partial<AvailabilityBlock>) => void
  onApplyRecurringRule?: (rule: { days: number[]; start: string; end: string; mode: ClassMode }) => void
  onOpenSession: (sessionId: string, initialSheet?: DetailSheetKind) => void
  onBookAgain?: (tutorId: string) => void
  onFindTutor?: () => void
  onBack?: () => void
  onTabSelect: (idx: number) => void
  navItems?: typeof studentNav
  activeNavIndex?: number
}) {
  const [view, setView] = useState<CalendarViewMode>('agenda')
  const [filter, setFilter] = useState<TimeFilter>('upcoming')
  const [selectedMonthDay, setSelectedMonthDay] = useState<number>(23)
  const [historyQuery, setHistoryQuery] = useState('')
  const [historyTutorFilter, setHistoryTutorFilter] = useState('all')
  const [historyMonthFilter, setHistoryMonthFilter] = useState('all')
  const [savedToast, setSavedToast] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)
  const [ruleDays, setRuleDays] = useState<number[]>([23, 25, 27])
  const [ruleStart, setRuleStart] = useState('16:00')
  const [ruleEnd, setRuleEnd] = useState('19:00')
  const [ruleMode, setRuleMode] = useState<ClassMode>('En línea')

  function announceSaved() {
    setSavedToast(true)
    window.setTimeout(() => setSavedToast(false), 1800)
  }

  function toggleBlock(id: string) {
    onToggleBlock?.(id)
    announceSaved()
  }

  function changeBlockMode(id: string, mode: ClassMode) {
    onUpdateBlock?.(id, { mode })
    announceSaved()
  }

  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((s) => isUpcomingStatus(s.status))
        .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)),
    [sessions],
  )

  const historySessions = useMemo(
    () =>
      sessions
        .filter((s) => !isUpcomingStatus(s.status))
        .sort((a, b) => b.day - a.day || b.time.localeCompare(a.time)),
    [sessions],
  )

  const historyPeople = useMemo(() => {
    const seen = new Map<string, string>()
    for (const s of historySessions) {
      if (role === 'alumno') seen.set(s.tutorId, s.tutorName)
      else seen.set(s.studentId, s.studentName)
    }
    return Array.from(seen.entries())
  }, [historySessions, role])

  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase()
    return historySessions.filter((s) => {
      const personId = role === 'alumno' ? s.tutorId : s.studentId
      if (historyTutorFilter !== 'all' && personId !== historyTutorFilter) return false
      const mLabel = s.monthLabel ?? 'Noviembre 2026'
      if (historyMonthFilter !== 'all' && mLabel !== historyMonthFilter) return false
      if (!q) return true
      const counterpart = role === 'alumno' ? s.tutorName : s.studentName
      return (
        counterpart.toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      )
    })
  }, [historySessions, historyQuery, historyTutorFilter, historyMonthFilter, role])

  const filtered = filter === 'upcoming' ? upcomingSessions : filteredHistory
  const hasActiveHistoryFilters =
    filter === 'history' &&
    (historyQuery.trim() !== '' || historyTutorFilter !== 'all' || historyMonthFilter !== 'all')
  const showTutorBlocks = role === 'tutor' && filter === 'upcoming'
  const newCount = role === 'tutor' ? upcomingSessions.filter((s) => s.isNewForTutor).length : 0

  // Series con 2 o más clases en la vista actual se agrupan juntas
  const seriesGroups = useMemo(() => {
    const counts: Record<string, ClassSession[]> = {}
    for (const s of filtered) {
      if (s.seriesId) {
        counts[s.seriesId] = counts[s.seriesId] ?? []
        counts[s.seriesId].push(s)
      }
    }
    return counts
  }, [filtered])

  const navItems = customNavItems ?? (role === 'alumno' ? studentNav : tutorNav)

  // Días con eventos para Agenda
  const agendaDays = useMemo(() => {
    const daySet = new Set<number>()
    for (const s of filtered) daySet.add(s.day)
    if (showTutorBlocks) {
      for (const b of tutorBlocks) daySet.add(b.day)
    }
    return Array.from(daySet).sort((a, b) => (filter === 'upcoming' ? a - b : b - a))
  }, [filtered, showTutorBlocks, tutorBlocks, filter])

  const renderedSeriesIds = new Set<string>()

  // Horas para la cuadrícula semanal
  const weekHours = useMemo(() => {
    const hrs = new Set<string>(['09:00', '10:00', '12:00', '15:00', '16:00', '17:00', '19:00'])
    for (const s of filtered) hrs.add(s.time)
    if (showTutorBlocks) {
      for (const b of tutorBlocks) hrs.add(b.time)
    }
    return Array.from(hrs).sort()
  }, [filtered, showTutorBlocks, tutorBlocks])

  // Eventos del día elegido en Mes
  const monthDaySessions = filtered.filter((s) => s.day === selectedMonthDay)
  const monthDayBlocks = showTutorBlocks ? tutorBlocks.filter((b) => b.day === selectedMonthDay) : []

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <TopBar title="Calendario" back={!!onBack} onBack={onBack} />
      {savedToast && (
        <div role="status" className="mx-4 mt-2 flex items-center gap-2 rounded-btn border-l-4 border-ok bg-ok-bg p-3 font-semibold text-ok shadow-sm">
          <CheckCircle2 size={18} aria-hidden /> Cambios guardados
        </div>
      )}

      {/* Barra de controles: Vista (Agenda / Semana / Mes) y Filtro (Próximas / Historial) */}
      <div className="flex flex-col gap-2.5 border-b border-g200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold text-g600">
            {role === 'alumno' ? 'Tus clases · Mérida (UTC-6)' : 'Clases y disponibilidad · Mérida (UTC-6)'}
          </p>
          {newCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-0.5 text-[12px] font-bold text-white">
              <Sparkles size={12} aria-hidden />
              {newCount} {newCount === 1 ? 'reserva nueva' : 'reservas nuevas'}
            </span>
          )}
        </div>

        <div role="tablist" aria-label="Vista del calendario" className="grid grid-cols-3 gap-1 rounded-btn bg-g100 p-1">
          {(
            [
              ['agenda', 'Agenda'],
              ['week', 'Semana'],
              ['month', 'Mes'],
            ] as const
          ).map(([key, label]) => {
            const active = view === key
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setView(key)}
                className={cx(
                  'min-h-11 rounded-[10px] text-[14px] font-semibold transition-colors duration-200',
                  active ? 'bg-ink text-white' : 'text-ink hover:bg-g200/70',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div role="group" aria-label="Filtrar clases por periodo" className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={filter === 'upcoming'}
            onClick={() => setFilter('upcoming')}
            className={cx(
              'flex min-h-11 items-center justify-center gap-1.5 rounded-full border-2 px-3 text-[14px] font-semibold',
              filter === 'upcoming' ? 'border-ink bg-ink text-white' : 'border-g300 bg-white text-g700',
            )}
          >
            {filter === 'upcoming' && <Check size={15} aria-hidden />}
            Próximas ({upcomingSessions.length})
          </button>
          <button
            type="button"
            aria-pressed={filter === 'history'}
            onClick={() => setFilter('history')}
            className={cx(
              'flex min-h-11 items-center justify-center gap-1.5 rounded-full border-2 px-3 text-[14px] font-semibold',
              filter === 'history' ? 'border-ink bg-ink text-white' : 'border-g300 bg-white text-g700',
            )}
          >
            {filter === 'history' && <Check size={15} aria-hidden />}
            Historial ({historySessions.length})
          </button>
        </div>

        {filter === 'history' && (
          <div className="flex flex-col gap-2 pt-0.5">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-g500"
                aria-hidden
              />
              <input
                type="search"
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                placeholder={
                  role === 'alumno'
                    ? 'Buscar por Tutor, materia o reserva'
                    : 'Buscar por Alumno, materia o reserva'
                }
                aria-label="Buscar en historial"
                className="min-h-11 w-full rounded-btn border border-g500 bg-white pl-10 pr-9 text-[14px] outline-none focus:border-ink focus:ring-4 focus:ring-ink/15"
              />
              {historyQuery && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda de historial"
                  onClick={() => setHistoryQuery('')}
                  className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-g600 hover:bg-g100"
                >
                  <X size={15} aria-hidden />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="hist-tutor-filter" className="sr-only">
                  {role === 'alumno' ? 'Filtrar por Tutor' : 'Filtrar por Alumno'}
                </label>
                <select
                  id="hist-tutor-filter"
                  value={historyTutorFilter}
                  onChange={(e) => setHistoryTutorFilter(e.target.value)}
                  className="min-h-11 w-full rounded-btn border border-g500 bg-white px-2.5 text-[13px] font-semibold text-ink outline-none focus:border-ink"
                >
                  <option value="all">
                    {role === 'alumno' ? 'Todos los Tutores' : 'Todos los Alumnos'}
                  </option>
                  {historyPeople.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="hist-month-filter" className="sr-only">
                  Filtrar por mes
                </label>
                <select
                  id="hist-month-filter"
                  value={historyMonthFilter}
                  onChange={(e) => setHistoryMonthFilter(e.target.value)}
                  className="min-h-11 w-full rounded-btn border border-g500 bg-white px-2.5 text-[13px] font-semibold text-ink outline-none focus:border-ink"
                >
                  <option value="all">Todos los meses</option>
                  <option value="Noviembre 2026">Noviembre 2026</option>
                  <option value="Octubre 2026">Octubre 2026</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cuerpo desplazable según vista */}
      <div className="flex-1 overflow-y-auto bg-g50 px-4 py-3.5">
        <ListState
          count={role === 'tutor' ? filtered.length + tutorBlocks.length + 1 : filtered.length}
          emptyTitle={filter === 'upcoming' ? 'Aún no tienes clases programadas' : 'Sin clases en tu historial'}
          emptyDescription="Reserva clases presenciales o en línea en Mérida con pago protegido."
          emptyAction="Encontrar Tutor"
          onEmptyAction={() => onFindTutor?.()}
          loadingLabel="Cargando calendario"
        >
        {role === 'tutor' && filter === 'upcoming' && (
          <section className="mb-4 rounded-card border border-g200 bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setShowRecurring((value) => !value)}
              aria-expanded={showRecurring}
              className="flex min-h-11 w-full items-center justify-between gap-2 text-left"
            >
              <span>
                <span className="block text-[16px] font-bold">Horarios recurrentes</span>
                <span className="block text-[12px] text-g600">Publica una regla semanal por días y rango</span>
              </span>
              {showRecurring ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
            </button>
            {showRecurring && (
              <div className="mt-3 flex flex-col gap-3 border-t border-g200 pt-3">
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-g700">Días</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {WEEK_DAYS.map((day) => {
                      const selected = ruleDays.includes(day.day)
                      return (
                        <button
                          key={day.day}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setRuleDays((prev) => selected ? prev.filter((value) => value !== day.day) : [...prev, day.day])}
                          className={cx('min-h-11 rounded-btn border text-[12px] font-bold', selected ? 'border-ink bg-ink text-white' : 'border-g300 bg-white')}
                        >
                          {day.short}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1 text-[12px] font-semibold text-g700">
                    Desde
                    <select value={ruleStart} onChange={(e) => setRuleStart(e.target.value)} className="min-h-11 rounded-btn border border-g500 bg-white px-2 text-[14px] text-ink">
                      {['09:00', '12:00', '16:00', '17:00'].map((time) => <option key={time} value={time}>{formatTimeChip(time)}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-[12px] font-semibold text-g700">
                    Hasta
                    <select value={ruleEnd} onChange={(e) => setRuleEnd(e.target.value)} className="min-h-11 rounded-btn border border-g500 bg-white px-2 text-[14px] text-ink">
                      {['17:00', '18:00', '19:00', '20:00'].map((time) => <option key={time} value={time}>{formatTimeChip(time)}</option>)}
                    </select>
                  </label>
                </div>
                <div role="group" aria-label="Modalidad recurrente" className="grid grid-cols-2 gap-2">
                  {(['Presencial', 'En línea'] as const).map((mode) => (
                    <button key={mode} type="button" aria-pressed={ruleMode === mode} onClick={() => setRuleMode(mode)} className={cx('flex min-h-11 items-center justify-center gap-1.5 rounded-btn border font-semibold', ruleMode === mode ? 'border-ink bg-ink text-white' : 'border-g300 bg-white')}>
                      {mode === 'Presencial' ? <MapPin size={15} aria-hidden /> : <Video size={15} aria-hidden />}{mode}
                    </button>
                  ))}
                </div>
                <p className="flex items-start gap-2 rounded-btn border border-warn bg-warn-bg p-3 text-[12px] font-semibold text-warn">
                  <CalendarClock size={16} className="mt-0.5 shrink-0" aria-hidden />
                  2 clases reservadas se conservarán
                </p>
                <Button
                  full
                  disabled={ruleDays.length === 0}
                  onClick={() => {
                    onApplyRecurringRule?.({ days: ruleDays, start: ruleStart, end: ruleEnd, mode: ruleMode })
                    setShowRecurring(false)
                    announceSaved()
                  }}
                >
                  Aplicar regla
                </Button>
              </div>
            )}
          </section>
        )}
        {/* Estado vacío del Alumno cuando no tiene clases */}
        {hasActiveHistoryFilters && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-g300 bg-white px-6 py-10 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-g100 text-ink">
              <Search size={24} aria-hidden />
            </span>
            <h3 className="text-[16px] font-bold">Sin clases con estos filtros</h3>
            <p className="text-[14px] text-g600">
              Ajusta el Tutor, el mes o el texto buscado para ver tu historial.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setHistoryQuery('')
                setHistoryTutorFilter('all')
                setHistoryMonthFilter('all')
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        ) : role === 'alumno' && filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-card border border-dashed border-g300 bg-white px-6 py-10 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-g100">
              <CalendarX size={28} aria-hidden />
            </span>
            <h3 className="text-[18px] font-bold">
              {filter === 'upcoming' ? 'Aún no tienes clases programadas' : 'Sin clases en tu historial'}
            </h3>
            <p className="max-w-64 text-g600">
              Reserva clases presenciales o en línea en Mérida con pago protegido.
            </p>
            <Button icon={Search} onClick={onFindTutor}>
              Encuentra a tu tutor
            </Button>
          </div>
        ) : view === 'agenda' ? (
          <div className="flex flex-col gap-5">
            {agendaDays.length === 0 ? (
              <div className="rounded-card border border-dashed border-g300 bg-white p-6 text-center text-g600">
                No hay registros en este periodo.
              </div>
            ) : (
              agendaDays.map((dayNum) => {
                const daySessions = filtered.filter((s) => s.day === dayNum)
                const dayBlocks = showTutorBlocks
                  ? tutorBlocks.filter((b) => b.day === dayNum).sort((a, b) => a.time.localeCompare(b.time))
                  : []

                // Evitar mostrar encabezado de día vacío si todas sus sesiones ya se agruparon arriba en una serie
                const visibleDaySessions = daySessions.filter((s) => {
                  if (s.seriesId && (seriesGroups[s.seriesId]?.length ?? 0) > 1) {
                    return !renderedSeriesIds.has(s.seriesId)
                  }
                  return true
                })

                if (visibleDaySessions.length === 0 && dayBlocks.length === 0) {
                  return null
                }

                const dayPrefix = dayNum === 23 ? 'Hoy · ' : dayNum === 24 ? 'Mañana · ' : ''

                return (
                  <section key={dayNum} aria-labelledby={`agenda-day-${dayNum}`} className="flex flex-col gap-2.5">
                    <h3 id={`agenda-day-${dayNum}`} className="text-[14px] font-bold text-g700">
                      {dayPrefix}
                      {DAY_SHORT_LABELS[dayNum] ?? `${dayNum} de noviembre`}
                    </h3>

                    {daySessions.map((s) => {
                      if (s.seriesId && (seriesGroups[s.seriesId]?.length ?? 0) > 1) {
                        if (renderedSeriesIds.has(s.seriesId)) return null
                        renderedSeriesIds.add(s.seriesId)
                        return (
                          <SeriesGroupCard
                            key={s.seriesId}
                            sessions={seriesGroups[s.seriesId]}
                            role={role}
                            onOpenSession={onOpenSession}
                          />
                        )
                      }
                      return (
                        <ClassItemCard
                          key={s.id}
                          session={s}
                          role={role}
                          isHistoryView={filter === 'history'}
                          onOpen={() => onOpenSession(s.id)}
                          onQuickAction={(sh) => onOpenSession(s.id, sh)}
                          onBookAgain={onBookAgain}
                        />
                      )
                    })}

                    {dayBlocks.map((b) => (
                      <AvailabilityBlockRow key={b.id} block={b} onToggle={toggleBlock} onModeChange={changeBlockMode} />
                    ))}
                  </section>
                )
              })
            )}
          </div>
        ) : view === 'week' ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold">23 al 27 de noviembre de 2026</h3>
              <span className="text-[12px] font-semibold text-g600">UTC-6</span>
            </div>

            <div className="overflow-hidden rounded-card border border-g200 bg-white">
              <div className="grid grid-cols-[52px_repeat(5,minmax(0,1fr))] border-b border-g200 bg-g100 text-center text-[12px] font-semibold">
                <span className="py-2 text-g600">Hora</span>
                {WEEK_DAYS.map((d) => (
                  <span key={d.day} className={cx('py-1.5', d.day === 23 && 'bg-ink text-white')}>
                    <span className="block">{d.short}</span>
                    <span className="text-[14px] font-bold">{d.num}</span>
                  </span>
                ))}
              </div>

              <div className="divide-y divide-g200">
                {weekHours.map((hr) => (
                  <div key={hr} className="grid grid-cols-[52px_repeat(5,minmax(0,1fr))] divide-x divide-g100">
                    <span className="flex items-center justify-center px-1 py-2 text-[12px] font-semibold text-g600">
                      {formatTimeChip(hr).replace(' ', '\n')}
                    </span>
                    {WEEK_DAYS.map((d) => {
                      const cellSession = filtered.find((s) => s.day === d.day && s.time === hr)
                      const cellBlock = showTutorBlocks
                        ? tutorBlocks.find((b) => b.day === d.day && b.time === hr)
                        : undefined

                      if (cellSession) {
                        const isPending = cellSession.status === 'Reprogramación propuesta'
                        const isErr = cellSession.status === 'Cancelada' || cellSession.status === 'En disputa'
                        const isLive = cellSession.status === 'En curso'
                        return (
                          <button
                            key={d.day}
                            type="button"
                            onClick={() => onOpenSession(cellSession.id)}
                            aria-label={`${cellSession.subject} con ${role === 'alumno' ? cellSession.tutorName : cellSession.studentName}, ${cellSession.status}`}
                            className={cx(
                              'flex min-h-14 flex-col items-start justify-between p-1 text-left text-[12px] font-semibold transition-opacity hover:opacity-85',
                              isPending
                                ? 'bg-warn-bg text-warn'
                                : isErr
                                  ? 'bg-err-bg text-err'
                                  : isLive
                                    ? 'bg-info-bg text-info'
                                    : 'bg-ok-bg text-ok',
                            )}
                          >
                            <span className="line-clamp-2 leading-tight">
                              {cellSession.subject.slice(0, 6)}.
                            </span>
                            <span className="flex items-center gap-0.5 text-[12px] font-bold">
                              {role === 'tutor' && cellSession.isNewForTutor && <Sparkles size={11} aria-hidden />}
                              {isPending ? 'Prop.' : isLive ? 'Curso' : isErr ? 'Cerr.' : 'Conf.'}
                            </span>
                          </button>
                        )
                      }

                      if (cellBlock) {
                        const avail = cellBlock.state === 'disponible'
                        return (
                          <button
                            key={d.day}
                            type="button"
                            onClick={() => toggleBlock(cellBlock.id)}
                            aria-label={`${DAY_SHORT_LABELS[d.day]} ${formatTimeChip(hr)}: ${avail ? 'Disponible' : 'Bloqueado'}`}
                            className={cx(
                              'flex min-h-14 flex-col items-center justify-center p-1 text-[12px] font-semibold',
                              avail
                                ? 'border border-g500 bg-white text-ink hover:bg-g100'
                                : 'border border-dashed border-g300 bg-g100 text-g500',
                            )}
                          >
                            {avail ? 'Disp.' : 'Bloq.'}
                          </button>
                        )
                      }

                      return <span key={d.day} className="min-h-14 bg-white" />
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 rounded-btn bg-white p-3 text-[12px] text-g700 border border-g200">
              <span className="inline-flex items-center gap-1 font-semibold text-ok">
                <CheckCircle2 size={14} aria-hidden /> Confirmada
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-warn">
                <CalendarClock size={14} aria-hidden /> Por confirmar
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-info">
                <PlayCircle size={14} aria-hidden /> En curso
              </span>
              {showTutorBlocks && (
                <>
                  <span className="inline-flex items-center gap-1 font-semibold text-ink">
                    <Check size={14} aria-hidden /> Disp.: Disponible
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-g600">
                    <Ban size={14} aria-hidden /> Bloq.: Bloqueado
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Vista Mes: Noviembre 2026 */
          <div className="flex flex-col gap-4">
            <section aria-label="Noviembre de 2026" className="rounded-card border border-g200 bg-white p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[16px] font-bold">Noviembre 2026</h3>
                <span className="text-[12px] font-semibold text-g600">Mérida (UTC-6)</span>
              </div>
              <div className="grid grid-cols-7 text-center text-[12px] font-semibold text-g600">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, idx) => (
                  <span key={`${d}-${idx}`} className="py-1" aria-hidden>
                    {d}
                  </span>
                ))}
              </div>
              {/* Noviembre 2026 inicia en domingo (índice 0) */}
              <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNum) => {
                  const dayCls = filtered.filter((s) => s.day === dayNum)
                  const dayBlk = showTutorBlocks ? tutorBlocks.filter((b) => b.day === dayNum) : []
                  const selected = selectedMonthDay === dayNum
                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => setSelectedMonthDay(dayNum)}
                      aria-pressed={selected}
                      aria-label={`${dayNum} de noviembre: ${dayCls.length} clases${showTutorBlocks ? `, ${dayBlk.length} bloques` : ''}`}
                      className={cx(
                        'relative mx-auto flex size-11 flex-col items-center justify-center rounded-full text-[14px] font-semibold',
                        selected ? 'bg-ink text-white' : 'text-ink hover:bg-g100',
                      )}
                    >
                      <span>{dayNum}</span>
                      {(dayCls.length > 0 || dayBlk.length > 0) && (
                        <span className="mt-0.5 flex items-center gap-0.5" aria-hidden>
                          {dayCls.length > 0 && (
                            <span className={cx('size-1.5 rounded-full', selected ? 'bg-white' : 'bg-ink')} />
                          )}
                          {dayBlk.length > 0 && (
                            <span className={cx('size-1.5 rounded-sm border', selected ? 'border-white' : 'border-g600')} />
                          )}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>

            <section aria-label="Detalle del día seleccionado" className="flex flex-col gap-2.5">
              <h4 className="text-[14px] font-bold text-g700">
                {DAY_SHORT_LABELS[selectedMonthDay] ?? `${selectedMonthDay} de noviembre`}
              </h4>
              {monthDaySessions.length === 0 && monthDayBlocks.length === 0 ? (
                <div className="rounded-card border border-dashed border-g300 bg-white p-5 text-center">
                  <p className="text-g600">Sin actividad registrada en este día.</p>
                </div>
              ) : (
                <>
                  {monthDaySessions.map((s) => (
                    <ClassItemCard
                      key={s.id}
                      session={s}
                      role={role}
                      isHistoryView={filter === 'history'}
                      onOpen={() => onOpenSession(s.id)}
                      onQuickAction={(sh) => onOpenSession(s.id, sh)}
                      onBookAgain={onBookAgain}
                    />
                  ))}
                  {monthDayBlocks.map((b) => (
                    <AvailabilityBlockRow key={b.id} block={b} onToggle={toggleBlock} onModeChange={changeBlockMode} />
                  ))}
                </>
              )}
            </section>
          </div>
        )}
        </ListState>
      </div>

      <BottomNav items={navItems} active={activeNavIndex} onSelect={onTabSelect} />
    </div>
  )
}

/* ========================================================================
   DETALLE DE CLASE (Alumno y Tutor)
   ======================================================================== */
export function ClassDetailScreen({
  session,
  role,
  initialSheet,
  onBack,
  onWriteMessage,
  onBookAgain,
  onUpdateSession,
  onCancelFutureSessions,
}: {
  session: ClassSession
  role: UserRole
  initialSheet?: DetailSheetKind | null
  onBack: () => void
  onWriteMessage: () => void
  onBookAgain?: (tutorId: string) => void
  onUpdateSession: (patch: Partial<ClassSession>) => void
  onCancelFutureSessions?: (seriesId: string, fromIndex: number) => void
}) {
  const [addedToCal, setAddedToCal] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [sheet, setSheet] = useState<DetailSheetKind | null>(initialSheet ?? null)

  useEffect(() => {
    setSheet(initialSheet ?? null)
  }, [session.id, initialSheet])

  // Estados para sheets interactivos
  const [propDay, setPropDay] = useState<number>(session.day === 24 ? 26 : 24)
  const [propTime, setPropTime] = useState<string>('18:00')
  const [stars, setStars] = useState<number>(session.ratingGiven ?? 5)
  const [comment, setComment] = useState<string>(session.reviewComment ?? '')
  const [reviewTags, setReviewTags] = useState<string[]>(session.reviewTags ?? [])
  const [proposalMessage, setProposalMessage] = useState(session.proposalMessage ?? '')
  const [cancelReason, setCancelReason] = useState('')
  const [cancelErr, setCancelErr] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('No se presentó el Tutor')
  const [reportText, setReportText] = useState<string>('')
  const [reportAttachment, setReportAttachment] = useState('')
  const [reportErr, setReportErr] = useState<string | null>(null)

  const counterpart = role === 'alumno' ? session.tutorName : session.studentName
  const counterpartRoleLabel = role === 'alumno' ? 'Tutor' : 'Alumno'
  const studentPrice = calcStudentTotal(session.hourlyRate)
  const tutorMoney = calcTutorNet(session.hourlyRate)
  const refundAmount = role === 'tutor' || !session.within24h ? studentPrice.total : studentPrice.total / 2

  const isReadOnly = session.status === 'Cancelada' || session.status === 'En disputa'
  const isReceiverOfProposal =
    session.status === 'Reprogramación propuesta' && session.proposedBy && session.proposedBy !== role
  const isProposer =
    session.status === 'Reprogramación propuesta' && session.proposedBy === role

  return (
    <div className="relative flex h-full w-full flex-col bg-white">
      <TopBar title="Detalle de clase" back onBack={onBack} />

      <div className="flex-1 overflow-y-auto bg-g50 p-4">
        <div className="flex flex-col gap-3.5">
          {toastMsg && (
            <div
              role="status"
              className="flex items-start justify-between gap-2 rounded-btn border-l-4 border-ok bg-ok-bg p-3 text-ok shadow-sm"
            >
              <span className="flex items-center gap-2 font-semibold">
                <CheckCircle2 size={18} className="shrink-0" aria-hidden />
                {toastMsg}
              </span>
              <button
                type="button"
                aria-label="Cerrar aviso"
                onClick={() => setToastMsg(null)}
                className="-m-1 grid size-9 place-items-center"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Estado e identificador */}
          <section className="rounded-card border border-g200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12px] font-semibold text-g600">{session.id}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusChip status={statusToChip(session.status)} />
                {session.status === 'Reprogramación propuesta' && (
                  <span className="text-[12px] font-semibold text-warn">(por confirmar)</span>
                )}
              </div>
            </div>

            {session.seriesTotal && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-g100 px-3 py-1 text-[12px] font-semibold text-ink">
                <Layers size={14} aria-hidden />
                Serie con {counterpart}, {session.seriesIndex} de {session.seriesTotal}
              </p>
            )}

            <div className="mt-3 flex items-center gap-3 border-t border-g200 pt-3">
              {role === 'alumno' ? (
                <img
                  src={session.tutorPhoto}
                  alt={`Foto de ${counterpart}`}
                  className="size-14 shrink-0 rounded-full bg-g200 object-cover"
                />
              ) : (
                <Avatar name={counterpart} size={56} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-g600">{counterpartRoleLabel}</p>
                <h2 className="truncate text-[18px] font-bold">{counterpart}</h2>
                <p className="text-[14px] font-medium text-g700">Materia: {session.subject}</p>
              </div>
            </div>
          </section>

          {/* Banner si hay reprogramación propuesta */}
          {session.status === 'Reprogramación propuesta' && session.proposedDay && session.proposedTime && (
            <section
              aria-label="Propuesta de nuevo horario"
              className="rounded-card border-2 border-warn bg-warn-bg p-4 text-warn"
            >
              <div className="flex items-start gap-2.5">
                <CalendarClock size={20} className="mt-0.5 shrink-0" aria-hidden />
                <div>
                  <p className="font-bold">
                    {isProposer
                      ? 'Propusiste cambiar el horario (por confirmar)'
                      : `${counterpart} propuso otro horario (por confirmar)`}
                  </p>
                  <p className="mt-1 text-[14px]">
                    Horario actual: <strong>{DAY_SHORT_LABELS[session.day]}</strong> ·{' '}
                    <strong>{formatTimeRange(session.time)}</strong>.
                  </p>
                  <p className="mt-1 text-[14px]">
                    Horario propuesto: <strong>{DAY_SHORT_LABELS[session.proposedDay]}</strong> ·{' '}
                    <strong>{formatTimeRange(session.proposedTime)}</strong> (UTC-6).
                  </p>
                  {session.proposalMessage && <p className="mt-2 text-[14px]">“{session.proposalMessage}”</p>}
                  <p className="mt-2 text-[12px] font-bold">Sin respuesta en 24 h se mantiene el horario original</p>
                </div>
              </div>
            </section>
          )}

          {/* Banner si faltan 10 min o está en curso */}
          {session.status === 'Confirmada' && session.startsSoon && (
            <div className="flex items-start gap-2.5 rounded-card border border-info bg-info-bg p-3.5 text-info">
              <Clock size={19} className="mt-0.5 shrink-0" aria-hidden />
              <p className="text-[14px] font-semibold">
                Tu clase inicia en 10 min. Cuentas con 15 min de tolerancia para iniciar.
              </p>
            </div>
          )}

          {session.checkedInAt && (
            <div className="flex items-center gap-2 rounded-card border border-ok bg-ok-bg px-3.5 py-2.5 text-[14px] font-semibold text-ok">
              <CheckCircle2 size={18} className="shrink-0" aria-hidden />
              Check-in registrado · {session.checkedInAt}
            </div>
          )}

          {/* Horario y modalidad */}
          <section className="rounded-card border border-g200 bg-white p-4">
            <h3 className="text-[16px] font-bold">Fecha, hora y modalidad</h3>
            <dl className="mt-3 flex flex-col gap-2.5 text-[14px]">
              <div className="flex items-start gap-2.5">
                <CalendarDays size={18} className="mt-0.5 shrink-0 text-g700" aria-hidden />
                <div>
                  <dt className="sr-only">Fecha</dt>
                  <dd className="font-medium">{DAY_LABELS[session.day]}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock size={18} className="mt-0.5 shrink-0 text-g700" aria-hidden />
                <div>
                  <dt className="sr-only">Hora</dt>
                  <dd className="font-medium">
                    {formatTimeRange(session.time)}{' '}
                    <span className="font-normal text-g600">(hora de Mérida, UTC-6)</span>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                {session.mode === 'En línea' ? (
                  <Video size={18} className="mt-0.5 shrink-0 text-g700" aria-hidden />
                ) : (
                  <MapPin size={18} className="mt-0.5 shrink-0 text-g700" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <dt className="sr-only">Modalidad y ubicación</dt>
                  <dd className="font-semibold">{session.mode}</dd>
                  <p className="mt-0.5 flex items-center gap-1.5 break-all text-g600">
                    {session.mode === 'En línea' && <Link2 size={14} className="shrink-0" aria-hidden />}
                    {session.locationOrLink}
                  </p>
                </div>
              </div>
            </dl>
          </section>

          {/* Monto y estado del pago adaptado por rol */}
          <section className="rounded-card border border-g200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[16px] font-bold">Pago · {session.paymentId}</h3>
              <StatusChip status={session.paymentStatus} />
            </div>

            {role === 'alumno' ? (
              <dl className="mt-3 flex flex-col gap-1.5 text-[14px]">
                <div className="flex justify-between text-g600">
                  <dt>Tarifa (1 h)</dt>
                  <dd className="tabular-nums">{formatMoney(studentPrice.rate)}</dd>
                </div>
                <div className="flex justify-between text-g600">
                  <dt>Cargo por servicio (10%)</dt>
                  <dd className="tabular-nums">{formatMoney(studentPrice.serviceFee)}</dd>
                </div>
                <div className="mt-1 flex justify-between border-t border-g200 pt-2 text-[16px] font-bold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatMoney(studentPrice.total)}</dd>
                </div>
                {session.paymentStatus === 'Reembolsado' && (
                  <div className="flex justify-between text-[13px] font-semibold text-info">
                    <dt>Reembolsado en {session.cardUsed}</dt>
                    <dd className="tabular-nums">{formatMoney(session.refundAmount ?? studentPrice.total)}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <dl className="mt-3 flex flex-col gap-1.5 text-[14px]">
                <div className="flex justify-between text-g600">
                  <dt>Tarifa de clase (1 h)</dt>
                  <dd className="tabular-nums">{formatMoney(tutorMoney.rate)}</dd>
                </div>
                <div className="flex justify-between text-g600">
                  <dt>Comisión TutorClick ({tutorMoney.pctLabel})</dt>
                  <dd className="tabular-nums">−{formatMoney(tutorMoney.commission)}</dd>
                </div>
                <div className="mt-1 flex justify-between border-t border-g200 pt-2 text-[16px] font-bold">
                  <dt>Neto a recibir</dt>
                  <dd className="tabular-nums">{formatMoney(tutorMoney.net)}</dd>
                </div>
              </dl>
            )}

            {session.paymentStatus === 'Retenido' && (
              <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-g600">
                <Lock size={14} className="shrink-0" aria-hidden />
                Fondos retenidos hasta 48 h después de finalizar la clase.
              </p>
            )}
          </section>

          {/* Reseña de la clase pasada */}
          {(session.status === 'Finalizada' || session.ratingGiven) && (
            <section aria-label="Reseña de la clase" className="rounded-card border border-g200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[16px] font-bold">
                  {role === 'alumno' ? 'Tu reseña' : `Reseña de ${session.studentName}`}
                </h3>
                {session.ratingGiven && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-g100 px-2.5 py-0.5 text-[12px] font-bold text-ink">
                    <Star size={13} className="fill-ink" aria-hidden />
                    {session.ratingGiven} de 5
                  </span>
                )}
              </div>

              {session.ratingGiven ? (
                <div className="mt-2.5 flex flex-col gap-2">
                  <div className="flex items-center gap-1" aria-label={`${session.ratingGiven} de 5 estrellas`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={17}
                        className={n <= session.ratingGiven! ? 'fill-ink text-ink' : 'text-g300'}
                        aria-hidden
                      />
                    ))}
                  </div>
                  {session.reviewTags && session.reviewTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {session.reviewTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full border border-g300 bg-g50 px-2.5 py-0.5 text-[12px] font-semibold text-ink"
                        >
                          <Check size={12} aria-hidden />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {session.reviewComment && (
                    <p className="text-[14px] text-g700">“{session.reviewComment}”</p>
                  )}
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[14px] text-g600">
                    {role === 'alumno'
                      ? 'Aún no calificas esta sesión.'
                      : 'El Alumno aún no publica su reseña.'}
                  </p>
                  {role === 'alumno' && (
                    <Button variant="secondary" icon={Star} className="min-h-11 !px-3.5" onClick={() => setSheet('rate')}>
                      Calificar
                    </Button>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Si está Cancelada o En disputa: estrictamente solo lectura */}
          {isReadOnly ? (
            <section
              aria-label="Estado de solo lectura"
              className={cx(
                'rounded-card border-2 p-4',
                session.status === 'En disputa' ? 'border-err bg-err-bg text-err' : 'border-g300 bg-white text-g700',
              )}
            >
              <div className="flex items-start gap-2.5">
                {session.status === 'En disputa' ? (
                  <AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden />
                ) : (
                  <XCircle size={20} className="mt-0.5 shrink-0 text-err" aria-hidden />
                )}
                <div>
                  <p className="font-bold">
                    {session.status === 'En disputa'
                      ? `En disputa (${session.disputeId ?? 'DSP-0892'}) · Solo lectura`
                      : 'Clase cancelada · Solo lectura'}
                  </p>
                  <p className="mt-1 text-[14px]">
                    {session.readOnlyNote ??
                      'Este registro es únicamente de consulta y no admite cambios de horario ni acciones adicionales.'}
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <>
              {/* Acciones comunes: Escribir mensaje y Agregar a mi calendario */}
              <div className="grid grid-cols-2 gap-2.5">
                <Button variant="secondary" icon={MessageCircle} className="!px-3" onClick={onWriteMessage}>
                  Escribir mensaje
                </Button>
                <Button
                  variant="secondary"
                  icon={addedToCal ? Check : CalendarPlus}
                  className="!px-3"
                  onClick={() => {
                    setAddedToCal(true)
                    setToastMsg('Agregada a tu calendario.')
                  }}
                >
                  {addedToCal ? 'En tu calendario' : 'Agregar a mi calendario'}
                </Button>
              </div>

              {/* Acciones específicas según el estado */}
              <section aria-label="Acciones de la clase" className="flex flex-col gap-2.5 pt-1">
                {session.status === 'Confirmada' && (
                  <>
                    {session.startsSoon &&
                      (role === 'alumno' ? (
                        <Button
                          full
                          icon={Video}
                          onClick={() => {
                            onUpdateSession({
                              status: 'En curso',
                              startsSoon: false,
                              studentJoined: true,
                            })
                            setToastMsg('Te uniste a la clase.')
                          }}
                        >
                          Unirse
                        </Button>
                      ) : (
                        <Button
                          full
                          icon={PlayCircle}
                          onClick={() => {
                            onUpdateSession({
                              status: 'En curso',
                              startsSoon: false,
                              isNewForTutor: false,
                              checkedInAt: '3:50 PM (UTC-6)',
                            })
                            setToastMsg('Check-in registrado. Clase en curso.')
                          }}
                        >
                          Iniciar clase
                        </Button>
                      ))}

                    <Button full variant="secondary" icon={CalendarClock} onClick={() => setSheet('reschedule')}>
                      Proponer otro horario
                    </Button>
                    <Button full variant="destructive" onClick={() => setSheet('cancel')}>
                      Cancelar
                    </Button>
                    {session.seriesId && session.seriesIndex && onCancelFutureSessions && (
                      <Button
                        full
                        variant="text"
                        icon={Layers}
                        onClick={() => {
                          onCancelFutureSessions(session.seriesId!, session.seriesIndex!)
                          setToastMsg('Se cancelaron las clases futuras de la serie.')
                        }}
                      >
                        Cancelar las clases futuras de la serie
                      </Button>
                    )}
                  </>
                )}

                {session.status === 'En curso' && (
                  <>
                    {role === 'alumno' && (
                      <Button
                        full
                        icon={Video}
                        onClick={() => setToastMsg('Conectado a la sala de clase.')}
                      >
                        Unirse
                      </Button>
                    )}
                    <Button
                      full
                      variant="secondary"
                      icon={CheckCircle2}
                      onClick={() => {
                        onUpdateSession({
                          status: 'Finalizada',
                          paymentStatus: role === 'tutor' ? 'Liberado' : session.paymentStatus,
                          readOnlyNote: role === 'tutor'
                            ? 'Sesión de prueba finalizada. El pago se liberó para validar el flujo de Finanzas.'
                            : session.readOnlyNote,
                        })
                        setToastMsg(role === 'tutor' ? 'Clase finalizada y pago liberado.' : 'Clase marcada como finalizada.')
                      }}
                    >
                      Concluir sesión de prueba
                    </Button>
                  </>
                )}

                {session.status === 'Reprogramación propuesta' && isReceiverOfProposal && (
                  <div className="flex flex-col gap-2.5">
                    <Button
                      full
                      icon={Check}
                      onClick={() => {
                        onUpdateSession({
                          status: 'Confirmada',
                          day: session.proposedDay ?? session.day,
                          time: session.proposedTime ?? session.time,
                          proposedBy: undefined,
                          proposedDay: undefined,
                          proposedTime: undefined,
                          proposalMessage: undefined,
                        })
                        setToastMsg('Nuevo horario confirmado.')
                      }}
                    >
                      Aceptar
                    </Button>
                    <Button
                      full
                      variant="destructive"
                      onClick={() => {
                        onUpdateSession({
                          status: 'Confirmada',
                          proposedBy: undefined,
                          proposedDay: undefined,
                          proposedTime: undefined,
                          proposalMessage: undefined,
                        })
                        setToastMsg('Propuesta rechazada. Se mantiene el horario original.')
                      }}
                    >
                      Rechazar
                    </Button>
                  </div>
                )}

                {session.status === 'Reprogramación propuesta' && isProposer && (
                  <Button
                    full
                    variant="secondary"
                    onClick={() => {
                      onUpdateSession({
                        status: 'Confirmada',
                        proposedBy: undefined,
                        proposedDay: undefined,
                        proposedTime: undefined,
                      })
                      setToastMsg('Retiraste la propuesta de reprogramación.')
                    }}
                  >
                    Retirar propuesta
                  </Button>
                )}

                {session.status === 'Finalizada' && (
                  <>
                    {role === 'alumno' && (
                      <Button
                        full
                        icon={Star}
                        onClick={() => setSheet('rate')}
                      >
                        {session.ratingGiven ? `Calificada (${session.ratingGiven} estrellas)` : 'Calificar'}
                      </Button>
                    )}
                    {role === 'alumno' && onBookAgain && (
                      <Button
                        full
                        variant="secondary"
                        icon={RefreshCw}
                        onClick={() => onBookAgain(session.tutorId)}
                      >
                        Reservar de nuevo
                      </Button>
                    )}
                    <Button full variant="secondary" icon={FileText} onClick={() => setSheet('receipt')}>
                      Ver recibo
                    </Button>
                    <Button full variant="text" icon={Flag} onClick={() => setSheet('report')}>
                      Reportar un problema
                    </Button>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* Bottom Sheets modales dentro del marco móvil */}
      {sheet && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/50">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[85%] overflow-y-auto rounded-t-3xl bg-white px-5 pb-6 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,.18)]"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-g300" />

            {sheet === 'reschedule' && (
              <div className="flex flex-col gap-3.5">
                <h3 className="text-[18px] font-bold">Proponer otro horario</h3>
                <p className="text-g600">
                  Elige una nueva fecha y hora en Mérida (UTC-6). {counterpart} deberá confirmar el cambio.
                </p>
                <div className="rounded-btn bg-g100 p-3 text-[14px]">
                  <p className="text-[12px] font-semibold text-g600">Horario actual</p>
                  <p className="font-bold">{DAY_SHORT_LABELS[session.day]} · {formatTimeRange(session.time)}</p>
                </div>
                <div>
                  <p className="mb-1.5 text-[12px] font-semibold text-g700">Día de noviembre de 2026</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PROPOSAL_DAYS.map((d) => {
                      const unavailable = d === 25
                      return (
                      <button
                        key={d}
                        type="button"
                        disabled={unavailable}
                        aria-pressed={propDay === d}
                        onClick={() => setPropDay(d)}
                        aria-label={`${DAY_SHORT_LABELS[d]}, ${unavailable ? 'sin disponibilidad' : 'con disponibilidad'}`}
                        className={cx(
                          'min-h-11 rounded-btn border-2 px-3 text-[14px] font-semibold',
                          unavailable
                            ? 'cursor-not-allowed border-g200 bg-g100 text-g400 line-through'
                            : propDay === d ? 'border-ink bg-ink text-white' : 'border-g300 bg-white',
                        )}
                      >
                        {DAY_SHORT_LABELS[d]?.replace(' de noviembre', ' nov')}
                      </button>
                    )})}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="proposal-message" className="text-[12px] font-semibold text-g700">
                    Mensaje opcional
                  </label>
                  <textarea
                    id="proposal-message"
                    rows={3}
                    maxLength={250}
                    value={proposalMessage}
                    onChange={(event) => setProposalMessage(event.target.value)}
                    placeholder="Explica brevemente el motivo del cambio"
                    className="rounded-btn border border-g500 p-3 text-[14px] outline-none focus:border-ink focus:ring-4 focus:ring-ink/15"
                  />
                  <p className="text-right text-[12px] text-g600">{proposalMessage.length}/250</p>
                </div>
                <p className="flex items-start gap-2 rounded-btn bg-warn-bg p-3 text-[12px] font-semibold text-warn">
                  <Clock size={15} className="mt-0.5 shrink-0" aria-hidden />
                  Sin respuesta en 24 h se mantiene el horario original
                </p>
                <div>
                  <p className="mb-1.5 text-[12px] font-semibold text-g700">Hora de inicio</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PROPOSAL_TIMES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={propTime === t}
                        onClick={() => setPropTime(t)}
                        className={cx(
                          'min-h-11 rounded-btn border-2 px-3 text-[14px] font-semibold',
                          propTime === t ? 'border-ink bg-ink text-white' : 'border-g300 bg-white',
                        )}
                      >
                        {formatTimeRange(t)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  <Button
                    full
                    onClick={() => {
                      onUpdateSession({
                        status: 'Reprogramación propuesta',
                        proposedBy: role,
                        proposedDay: propDay,
                        proposedTime: propTime,
                        proposalMessage,
                        startsSoon: false,
                      })
                      setSheet(null)
                      setToastMsg('Propuesta de reprogramación enviada.')
                    }}
                  >
                    Enviar propuesta
                  </Button>
                  <Button full variant="text" onClick={() => setSheet(null)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            )}

            {sheet === 'cancel' && (
              <div className="flex flex-col gap-3.5">
                <h3 className="text-[18px] font-bold">Cancelar clase</h3>
                <p className="text-g700">
                  {role === 'alumno'
                    ? session.within24h
                      ? `Faltan menos de 24 h: recibirás el 50%, ${formatMoney(refundAmount)}, en ${session.cardUsed}.`
                      : `Faltan más de 24 h: recibirás el reembolso total de ${formatMoney(refundAmount)} en ${session.cardUsed}.`
                    : `El Alumno recibirá el reembolso total de ${formatMoney(refundAmount)} en su tarjeta.`}
                </p>
                {role === 'tutor' && session.within24h && (
                  <p className="flex items-start gap-2 rounded-btn border border-err bg-err-bg p-3 text-[14px] font-semibold text-err">
                    <AlertTriangle size={18} className="shrink-0" aria-hidden />
                    Cancelar con menos de 24 h afecta tu reputación y posición.
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  <label htmlFor="cancel-reason" className="text-[12px] font-semibold text-g700">Motivo obligatorio</label>
                  <textarea
                    id="cancel-reason"
                    rows={3}
                    value={cancelReason}
                    onChange={(event) => {
                      setCancelReason(event.target.value)
                      setCancelErr(null)
                    }}
                    className={cx('rounded-btn border p-3 text-[14px]', cancelErr ? 'border-2 border-err' : 'border-g500')}
                    placeholder="Escribe el motivo de la cancelación"
                  />
                  {cancelErr && <p role="alert" className="text-[14px] font-semibold text-err">{cancelErr}</p>}
                </div>
                <div className="rounded-btn bg-g100 p-3 text-[14px]">
                  <p className="font-semibold">Política aplicada</p>
                  <p className="mt-1 text-g700">Alumno: más de 24 h, 100%; menos de 24 h, 50%. Tutor: 100% al Alumno.</p>
                  <p className="mt-2 font-bold">Reembolso exacto: {formatMoney(refundAmount)}</p>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    full
                    variant="destructive"
                    onClick={() => {
                      if (!cancelReason.trim()) {
                        setCancelErr('Indica el motivo para continuar.')
                        return
                      }
                      onUpdateSession({
                        status: 'Cancelada',
                        paymentStatus: 'Reembolsado',
                        startsSoon: false,
                        within24h: false,
                        cancellationReason: cancelReason.trim(),
                        refundAmount,
                        readOnlyNote: `Cancelada por el ${role === 'alumno' ? 'Alumno' : 'Tutor'}. Reembolso de ${formatMoney(refundAmount)} aplicado a ${session.cardUsed}.`,
                      })
                      setSheet(null)
                      setToastMsg('Clase cancelada y pago reembolsado.')
                    }}
                  >
                    Confirmar cancelación
                  </Button>
                  <Button full variant="text" onClick={() => setSheet(null)}>
                    Volver
                  </Button>
                </div>
              </div>
            )}

            {sheet === 'rate' && (
              <div className="flex flex-col gap-3.5">
                <h3 className="text-[18px] font-bold">Calificar a {session.tutorName}</h3>
                <p className="text-g600">Tu reseña ayuda a otros Alumnos en Mérida.</p>
                <div className="flex justify-center gap-2" role="radiogroup" aria-label="Puntuación en estrellas">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={stars === n}
                      aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                      onClick={() => setStars(n)}
                      className="grid size-12 place-items-center rounded-full hover:bg-g100"
                    >
                      <Star size={28} className={n <= stars ? 'fill-ink text-ink' : 'text-g300'} aria-hidden />
                    </button>
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-g700">Lo que destacó</p>
                  <div className="flex flex-wrap gap-2">
                    {['Puntual', 'Claro', 'Paciente'].map((tag) => {
                      const selected = reviewTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setReviewTags((prev) => selected ? prev.filter((item) => item !== tag) : [...prev, tag])}
                          className={cx('min-h-11 rounded-full border-2 px-4 font-semibold', selected ? 'border-ink bg-ink text-white' : 'border-g300')}
                        >
                          {selected && <Check size={15} className="mr-1 inline" aria-hidden />}{tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="rate-comment" className="text-[12px] font-semibold text-g700">
                    Comentario
                  </label>
                  <textarea
                    id="rate-comment"
                    rows={3}
                    maxLength={500}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="¿Qué te pareció la explicación y puntualidad?"
                    className="rounded-btn border border-g500 p-3 text-[14px] outline-none focus:border-ink focus:ring-4 focus:ring-ink/15"
                  />
                  <p className="text-right text-[12px] text-g600">{comment.length}/500</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    full
                    onClick={() => {
                      onUpdateSession({ ratingGiven: stars, reviewTags, reviewComment: comment })
                      setSheet(null)
                      setToastMsg('Gracias por enviar tu reseña.')
                    }}
                  >
                    Publicar reseña
                  </Button>
                  <Button full variant="text" onClick={() => setSheet(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {sheet === 'report' && (
              <div className="flex flex-col gap-3.5">
                <h3 className="text-[18px] font-bold">Reportar un problema</h3>
                <p className="text-g600">
                  Disponible desde 15 min después del inicio hasta 48 h después. Tu pago permanecerá retenido.
                </p>
                <div className="flex flex-col gap-1">
                  <label htmlFor="report-type" className="text-[12px] font-semibold text-g700">Motivo</label>
                  <select
                    id="report-type"
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    className="min-h-12 rounded-btn border border-g500 bg-white px-3"
                  >
                    {['No se presentó el Tutor', 'No se presentó el Alumno', 'Clase incompleta', 'Cobro incorrecto', 'Conducta inapropiada', 'Otro'].map((reason) => (
                      <option key={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="report-reason" className="text-[12px] font-semibold text-g700">
                    Descripción
                  </label>
                  <textarea
                    id="report-reason"
                    rows={3}
                    value={reportText}
                    onChange={(e) => {
                      setReportText(e.target.value)
                      setReportErr(null)
                    }}
                    placeholder="Ej. La sesión duró menos tiempo del acordado…"
                    className={cx(
                      'rounded-btn border p-3 text-[14px] outline-none focus:border-ink focus:ring-4 focus:ring-ink/15',
                      reportErr ? 'border-2 border-err' : 'border-g500',
                    )}
                  />
                  {reportErr && (
                    <p role="alert" className="flex items-center gap-1.5 text-[14px] font-medium text-err">
                      <AlertTriangle size={15} aria-hidden />
                      {reportErr}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="report-file" className="text-[12px] font-semibold text-g700">Adjuntar captura</label>
                  <input
                    id="report-file"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setReportAttachment(event.target.files?.[0]?.name ?? '')}
                    className="min-h-12 rounded-btn border border-g500 bg-white p-2 text-[14px] file:mr-2 file:rounded file:border-0 file:bg-g200 file:px-3 file:py-2 file:font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    full
                    variant="destructive"
                    onClick={() => {
                      if (!reportText.trim()) {
                        setReportErr('Describe brevemente el problema para continuar.')
                        return
                      }
                      onUpdateSession({
                        status: 'En disputa',
                        paymentStatus: 'En disputa',
                        disputeId: 'DSP-0892',
                        reportReason,
                        reportDescription: reportText.trim(),
                        reportAttachment,
                        readOnlyNote: `Tu pago sigue retenido mientras revisamos (DSP-0892)`,
                      })
                      setSheet(null)
                      setToastMsg('Tu pago sigue retenido mientras revisamos (DSP-0892)')
                    }}
                  >
                    Enviar reporte
                  </Button>
                  <Button full variant="text" onClick={() => setSheet(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {sheet === 'receipt' && (
              <div className="flex flex-col gap-3.5">
                <h3 className="text-[18px] font-bold">Recibo · {session.paymentId}</h3>
                <p className="text-g600">
                  Reserva {session.id} · {DAY_LABELS[session.day]}
                </p>
                <dl className="flex flex-col gap-2 rounded-card bg-g100 p-4 text-[14px]">
                  <div className="flex justify-between">
                    <dt className="text-g600">Alumno</dt>
                    <dd className="font-semibold">{session.studentName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-g600">Tutor</dt>
                    <dd className="font-semibold">{session.tutorName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-g600">Materia</dt>
                    <dd className="font-semibold">{session.subject} (1 h)</dd>
                  </div>
                  {role === 'alumno' ? (
                    <>
                      <div className="flex justify-between border-t border-g300 pt-2">
                        <dt className="text-g600">Tarifa</dt>
                        <dd className="tabular-nums">{formatMoney(studentPrice.rate)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-g600">Cargo por servicio (10%)</dt>
                        <dd className="tabular-nums">{formatMoney(studentPrice.serviceFee)}</dd>
                      </div>
                      <div className="flex justify-between border-t border-g300 pt-2 text-[16px] font-bold">
                        <dt>Total pagado</dt>
                        <dd className="tabular-nums">{formatMoney(studentPrice.total)}</dd>
                      </div>
                      <div className="flex items-center justify-between text-[12px] text-g600">
                        <dt className="flex items-center gap-1">
                          <CreditCard size={13} aria-hidden /> Método
                        </dt>
                        <dd>{session.cardUsed}</dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between border-t border-g300 pt-2">
                        <dt className="text-g600">Tarifa base</dt>
                        <dd className="tabular-nums">{formatMoney(tutorMoney.rate)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-g600">Comisión ({tutorMoney.pctLabel})</dt>
                        <dd className="tabular-nums">−{formatMoney(tutorMoney.commission)}</dd>
                      </div>
                      <div className="flex justify-between border-t border-g300 pt-2 text-[16px] font-bold">
                        <dt>Neto liberado</dt>
                        <dd className="tabular-nums">{formatMoney(tutorMoney.net)}</dd>
                      </div>
                    </>
                  )}
                </dl>
                <Button full onClick={() => setSheet(null)}>
                  Cerrar recibo
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
