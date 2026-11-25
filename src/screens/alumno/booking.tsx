import { useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  MapPin,
  Star,
  Video,
  Layers,
  Repeat2,
} from 'lucide-react'
import { Button } from '../../components/ui/ds'
import {
  DAY_SHORT_LABELS,
  MEETING_PLACES,
  TUTOR_CATALOG,
  formatMoney,
  formatTimeChip,
} from '../../data/mock'
import type { ClassMode, TutorData } from '../../types'

const cx = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ')
const DEFAULT_TUTOR = TUTOR_CATALOG[0]

export type BookingKind = 'single' | 'weekly' | 'package'

export interface BookingSelection {
  day: number
  time: string
  mode: ClassMode
  place: string
  kind: BookingKind
  count: number
  dates: { day: number; time: string; available: boolean }[]
  discount: number
  chooseDatesLater: boolean
}

const months = [
  { label: 'Octubre 2026', days: 31, starts: 4 },
  { label: 'Noviembre 2026', days: 30, starts: 0 },
  { label: 'Diciembre 2026', days: 31, starts: 2 },
]

function Phone({
  label,
  embedded,
  onBack,
  children,
  footer,
}: {
  label?: string
  embedded?: boolean
  onBack?: () => void
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
      <header className="flex h-14 shrink-0 items-center border-b border-g200 px-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver al perfil"
          className="grid size-11 place-items-center rounded-full hover:bg-g100"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="flex-1 text-[16px] font-semibold">Reservar clase</h1>
        <span className="size-11" />
      </header>
      <div className="flex-1 overflow-y-auto bg-g50">{children}</div>
      {footer && (
        <div className="shrink-0 border-t border-g200 bg-white px-4 pb-5 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,.08)]">
          {footer}
        </div>
      )}
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

function TutorMini({ tutor }: { tutor: TutorData }) {
  return (
    <article className="flex items-center gap-3 rounded-card border border-g200 bg-white p-3 shadow-sm">
      <img
        src={tutor.photo}
        alt={`Foto de ${tutor.name}`}
        className="size-16 shrink-0 rounded-btn bg-g200 object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h2 className="truncate text-[16px] font-semibold">{tutor.name}</h2>
          {tutor.verified && <BadgeCheck size={18} className="shrink-0 text-ok" aria-label="Verificado" />}
        </div>
        <p className="truncate text-g600">{tutor.subjects.join(' y ')}</p>
        <p className="flex items-center gap-1 font-semibold">
          <Star size={15} className="fill-ink" aria-hidden />
          {tutor.rating.toFixed(1)} <span className="font-normal text-g600">({tutor.reviewsCount} reseñas)</span>
        </p>
      </div>
      <p className="shrink-0 text-right font-bold">
        ${tutor.rate.toFixed(2)}
        <span className="block text-[12px] font-medium text-g600">MXN/h</span>
      </p>
    </article>
  )
}

function Calendar({
  month,
  selectedDay,
  availableDays,
  onMonth,
  onDay,
}: {
  month: number
  selectedDay: number | null
  availableDays: Set<number>
  onMonth: (month: number) => void
  onDay: (day: number) => void
}) {
  const current = months[month]
  const cells = [...Array(current.starts).fill(null), ...Array.from({ length: current.days }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)

  return (
    <section aria-labelledby="calendar-title" className="rounded-card border border-g200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          disabled={month === 0}
          onClick={() => onMonth(month - 1)}
          className="grid size-11 place-items-center rounded-full hover:bg-g100 disabled:text-g300"
        >
          <ChevronLeft size={22} />
        </button>
        <h2 id="calendar-title" className="text-[16px] font-bold">
          {current.label}
        </h2>
        <button
          type="button"
          aria-label="Mes siguiente"
          disabled={month === 2}
          onClick={() => onMonth(month + 1)}
          className="grid size-11 place-items-center rounded-full hover:bg-g100 disabled:text-g300"
        >
          <ChevronRight size={22} />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[12px] font-semibold text-g600">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
          <span key={`${day}-${index}`} className="py-1" aria-hidden>
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, index) => {
          const enabled = month === 1 && day !== null && availableDays.has(day)
          const selected = month === 1 && selectedDay === day
          return day === null ? (
            <span key={`blank-${index}`} />
          ) : (
            <button
              key={day}
              type="button"
              disabled={!enabled}
              onClick={() => onDay(day)}
              aria-pressed={selected}
              aria-label={
                month === 1
                  ? `${day} de noviembre, ${enabled ? 'con disponibilidad' : 'sin disponibilidad'}`
                  : `${day} de ${current.label.split(' ')[0]}, sin disponibilidad`
              }
              className={cx(
                'relative mx-auto grid size-11 place-items-center rounded-full text-[14px] font-semibold',
                enabled && !selected && 'hover:bg-g100',
                selected && 'bg-ink text-white',
                !enabled && 'cursor-not-allowed text-g300 line-through',
              )}
            >
              {day}
              {enabled && !selected && <span className="absolute bottom-1 size-1 rounded-full bg-ink" aria-hidden />}
            </button>
          )
        })}
      </div>
      <p className="mt-2 flex items-center gap-2 text-[12px] text-g600">
        <span className="size-2 rounded-full bg-ink" aria-hidden />
        Días con horarios disponibles
      </p>
    </section>
  )
}

function Choice({
  selected,
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  selected: boolean
  icon: typeof MapPin
  title: string
  detail: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cx(
        'flex min-h-20 flex-1 items-center gap-3 rounded-card border-2 p-3 text-left',
        selected ? 'border-ink bg-g100' : 'border-g300 bg-white',
      )}
    >
      <span className={cx('grid size-10 shrink-0 place-items-center rounded-full', selected ? 'bg-ink text-white' : 'bg-g100')}>
        {selected ? <Check size={20} aria-hidden /> : <Icon size={20} aria-hidden />}
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="text-[12px] text-g600">{detail}</span>
      </span>
    </button>
  )
}

export function BookingScreen({
  tutor = DEFAULT_TUTOR,
  embedded,
  minDay,
  blockedSlots,
  selectedDay: controlledDay,
  selectedTime: controlledTime,
  selectedMode: controlledMode,
  selectedPlace: controlledPlace,
  expiredMessage,
  onClearExpired,
  onBack,
  onContinue,
}: {
  tutor?: TutorData
  embedded?: boolean
  minDay?: number
  blockedSlots?: { day: number; time: string }[]
  selectedDay?: number | null
  selectedTime?: string
  selectedMode?: ClassMode
  selectedPlace?: string
  expiredMessage?: string | null
  onClearExpired?: () => void
  onBack?: () => void
  onContinue?: (selection: BookingSelection) => void
} = {}) {
  const filteredSchedule: Record<number, string[]> = {}
  for (const [dStr, slots] of Object.entries(tutor.schedule)) {
    const d = Number(dStr)
    if (minDay !== undefined && d < minDay) continue
    const freeSlots = slots.filter(
      (s) => !blockedSlots?.some((b) => b.day === d && b.time === s),
    )
    if (freeSlots.length > 0) {
      filteredSchedule[d] = freeSlots
    }
  }

  const availableDays = new Set(Object.keys(filteredSchedule).map(Number))
  const firstAvailableDay = Number(Object.keys(filteredSchedule)[0] ?? (minDay ?? 23))
  const [month, setMonth] = useState(1)
  const [day, setDay] = useState<number | null>(
    controlledDay !== undefined && controlledDay !== null && availableDays.has(controlledDay)
      ? controlledDay
      : availableDays.has(23)
        ? 23
        : firstAvailableDay,
  )
  const [time, setTime] = useState(
    controlledTime !== undefined &&
      (controlledTime === '' || filteredSchedule[day ?? firstAvailableDay]?.includes(controlledTime))
      ? controlledTime
      : filteredSchedule[day ?? firstAvailableDay]?.[0] ?? '',
  )
  const validInitialMode: ClassMode =
    controlledMode && tutor.modes.includes(controlledMode)
      ? controlledMode
      : tutor.modes.includes('En línea')
        ? 'En línea'
        : tutor.modes[0]
  const [mode, setMode] = useState<ClassMode>(validInitialMode)
  const [place, setPlace] = useState(controlledPlace ?? MEETING_PLACES[0])
  const [kind, setKind] = useState<BookingKind>('single')
  const [weeklyCount, setWeeklyCount] = useState(4)
  const [packageCount, setPackageCount] = useState(8)
  const [chooseDatesLater, setChooseDatesLater] = useState(false)
  const [omittedIndexes, setOmittedIndexes] = useState<number[]>([])
  const [resolvedIndexes, setResolvedIndexes] = useState<number[]>([])

  const count = kind === 'single' ? 1 : kind === 'weekly' ? weeklyCount : packageCount
  const discount = kind === 'package' && packageCount === 8 ? 0.05 : 0
  const dateRows = Array.from({ length: count }, (_, index) => {
    const candidateDay = 23 + ((day ?? 25) - 23 + index) % 5
    const available = index !== 2 || kind === 'single' || resolvedIndexes.includes(index)
    return { day: candidateDay, time, available: available && !omittedIndexes.includes(index) }
  })
  const payableCount = kind === 'weekly' ? dateRows.filter((row) => row.available).length : count
  const total = tutor.rate * payableCount * (1 - discount) * 1.1

  function changeMonth(next: number) {
    setMonth(next)
    if (next !== 1) {
      setDay(null)
      setTime('')
    }
  }

  function changeDay(next: number) {
    setDay(next)
    setTime('')
    onClearExpired?.()
  }

  return (
    <Phone
      label="1. Seleccionar fecha, horario y modalidad"
      embedded={embedded}
      onBack={onBack}
      footer={
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-g600">
              {count === 1 ? 'Total por 1 hora' : `${payableCount} clases · pago al inicio`}
            </p>
            <p className="text-[18px] font-bold">{formatMoney(total)}</p>
          </div>
          <Button
            disabled={!day || !time}
            className="min-w-36"
            onClick={() => {
              if (day && time) {
                onContinue?.({
                  day,
                  time,
                  mode,
                  place,
                  kind,
                  count: payableCount,
                  dates: dateRows.filter((row) => row.available),
                  discount,
                  chooseDatesLater,
                })
              }
            }}
          >
            Continuar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        {expiredMessage && (
          <div role="alert" className="flex items-start gap-3 rounded-card border-2 border-err bg-err-bg p-4 text-err">
            <AlertTriangle size={22} className="mt-0.5 shrink-0" aria-hidden />
            <p className="font-bold">{expiredMessage}</p>
          </div>
        )}
        <TutorMini tutor={tutor} />
        <section aria-labelledby="booking-type-title">
          <h2 id="booking-type-title" className="mb-3 text-[18px] font-bold">Tipo de reserva</h2>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de reserva">
            {([
              ['single', 'Clase única', CalendarDays],
              ['weekly', 'Repetir cada semana', Repeat2],
              ['package', 'Paquete de clases', Layers],
            ] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={kind === value}
                onClick={() => setKind(value)}
                className={cx(
                  'flex min-h-20 flex-col items-center justify-center gap-1 rounded-btn border-2 px-2 text-center text-[12px] font-semibold',
                  kind === value ? 'border-ink bg-ink text-white' : 'border-g300 bg-white',
                )}
              >
                <Icon size={19} aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </section>

        {kind === 'weekly' && (
          <section className="rounded-card border border-g200 bg-white p-4">
            <h2 className="text-[16px] font-bold">Repetición semanal</h2>
            <p className="mt-1 text-[14px] text-g600">Mismo día y hora. Elige entre 2 y 12 semanas.</p>
            <div className="mt-3 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Número de semanas">
              {[2, 4, 8, 12].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={weeklyCount === value}
                  onClick={() => {
                    setWeeklyCount(value)
                    setOmittedIndexes([])
                  }}
                  className={cx('min-h-11 rounded-btn border-2 font-semibold', weeklyCount === value ? 'border-ink bg-ink text-white' : 'border-g300')}
                >
                  {value}
                </button>
              ))}
            </div>
          </section>
        )}

        {kind === 'package' && (
          <section className="rounded-card border border-g200 bg-white p-4">
            <h2 className="text-[16px] font-bold">Paquete de clases</h2>
            <p className="mt-1 text-[14px] text-g600">Vigencia de 60 días. Puedes elegir las fechas ahora o después.</p>
            <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tamaño del paquete">
              {[4, 8, 12].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={packageCount === value}
                  onClick={() => setPackageCount(value)}
                  className={cx('min-h-11 rounded-btn border-2 font-semibold', packageCount === value ? 'border-ink bg-ink text-white' : 'border-g300')}
                >
                  {value} clases
                </button>
              ))}
            </div>
            {packageCount === 8 && (
              <p className="mt-2 flex items-center gap-1.5 rounded-btn bg-ok-bg p-2.5 text-[14px] font-semibold text-ok">
                <Check size={16} aria-hidden /> 5% de descuento del Tutor
              </p>
            )}
            <label className="mt-3 flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                checked={chooseDatesLater}
                onChange={(event) => setChooseDatesLater(event.target.checked)}
                className="size-6 accent-ink"
              />
              <span className="font-semibold">Elegir fechas después</span>
            </label>
          </section>
        )}
        <div>
          <h2 className="mb-2 text-[18px] font-bold">Elige una fecha</h2>
          <Calendar
            month={month}
            selectedDay={day}
            availableDays={availableDays}
            onMonth={changeMonth}
            onDay={changeDay}
          />
        </div>

        {month === 1 && day && filteredSchedule[day] && (
          <section aria-labelledby="times-title">
            <h2 id="times-title" className="text-[18px] font-bold">
              {DAY_SHORT_LABELS[day]}
            </h2>
            <p className="mb-3 flex items-center gap-1.5 text-g600">
              <Clock size={16} aria-hidden />
              Hora de Mérida (UTC-6)
            </p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Horarios disponibles">
              {filteredSchedule[day].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={time === value}
                  onClick={() => {
                    setTime(value)
                    onClearExpired?.()
                  }}
                  className={cx(
                    'flex min-h-12 items-center justify-center gap-1 rounded-btn border-2 px-2 text-[14px] font-semibold',
                    time === value ? 'border-ink bg-ink text-white' : 'border-g500 bg-white',
                  )}
                >
                  {time === value && <Check size={16} aria-hidden />}
                  {formatTimeChip(value)}
                </button>
              ))}
            </div>
          </section>
        )}

        {kind !== 'single' && !chooseDatesLater && time && (
          <section aria-labelledby="dates-list-title" className="rounded-card border border-g200 bg-white p-4">
            <h2 id="dates-list-title" className="text-[16px] font-bold">Fechas de la reserva</h2>
            <div className="mt-2 flex flex-col gap-2">
              {dateRows.map((row, index) => {
                const unavailable = index === 2 && !omittedIndexes.includes(index) && !resolvedIndexes.includes(index)
                return (
                  <div key={index} className={cx('rounded-btn border p-3', unavailable ? 'border-warn bg-warn-bg' : 'border-g200')}>
                    <p className="font-semibold">
                      {index + 1}. {DAY_SHORT_LABELS[row.day]} · {formatTimeChip(row.time)}
                    </p>
                    {unavailable && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTime(filteredSchedule[day ?? firstAvailableDay]?.find((slot: string) => slot !== time) ?? time)
                            setResolvedIndexes((prev) => [...prev, index])
                          }}
                          className="min-h-11 rounded-btn border-2 border-warn bg-white px-3 text-[12px] font-semibold text-warn"
                        >
                          Elegir otro horario
                        </button>
                        {kind === 'weekly' && (
                          <button
                            type="button"
                            onClick={() => setOmittedIndexes((prev) => [...prev, index])}
                            className="min-h-11 rounded-btn px-3 text-[12px] font-semibold underline"
                          >
                            Omitir esta semana
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {count > 1 && (
          <div role="note" className="rounded-card border border-info bg-info-bg p-3.5 text-[14px] text-info">
            <p className="font-bold">Pagas {formatMoney(total)} hoy; el tutor recibe cada clase al impartirla</p>
            <p className="mt-1">Si cancelas una clase, se reembolsa únicamente esa clase.</p>
          </div>
        )}

        <section aria-labelledby="mode-title">
          <h2 id="mode-title" className="mb-3 text-[18px] font-bold">
            Modalidad
          </h2>
          <div className="flex gap-2" role="radiogroup" aria-label="Modalidad de la clase">
            {tutor.modes.includes('Presencial') && (
              <Choice
                selected={mode === 'Presencial'}
                icon={MapPin}
                title="Presencial"
                detail="En Mérida"
                onClick={() => setMode('Presencial')}
              />
            )}
            {tutor.modes.includes('En línea') && (
              <Choice
                selected={mode === 'En línea'}
                icon={Video}
                title="En línea"
                detail="Videollamada"
                onClick={() => setMode('En línea')}
              />
            )}
          </div>
          {tutor.modes.length === 1 && (
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-g600">
              <Info size={14} className="shrink-0" aria-hidden />
              {tutor.first} ofrece clases únicamente en modalidad {tutor.modes[0].toLowerCase()}.
            </p>
          )}
        </section>

        {mode === 'Presencial' && (
          <section aria-labelledby="place-title">
            <h2 id="place-title" className="mb-2 text-[18px] font-bold">
              Lugar de encuentro
            </h2>
            <label htmlFor="meeting-place" className="mb-1.5 block text-[12px] font-semibold text-g700">
              Selecciona un lugar público
            </label>
            <div className="relative">
              <MapPin size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden />
              <select
                id="meeting-place"
                value={place}
                onChange={(event) => setPlace(event.target.value)}
                className="min-h-12 w-full appearance-none rounded-btn border border-g500 bg-white py-2 pl-11 pr-10"
              >
                {MEETING_PLACES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronRight size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90" aria-hidden />
            </div>
            <p className="mt-1.5 text-g600">La ubicación exacta se comparte al confirmar tu reserva.</p>
          </section>
        )}
      </div>
    </Phone>
  )
}

const alternatives = [
  ['Lun 23 nov', '17:30'],
  ['Mar 24 nov', '10:00'],
  ['Mié 25 nov', '16:00'],
]

function SimilarTutor({
  name,
  subject,
  price,
  rating,
  photo,
}: {
  name: string
  subject: string
  price: number
  rating: string
  photo: string
}) {
  return (
    <article className="flex items-center gap-3 rounded-card border border-g200 bg-white p-3">
      <img src={photo} alt={`Foto de ${name}`} className="size-14 rounded-btn object-cover" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{name}</p>
        <p className="truncate text-g600">{subject}</p>
        <p className="flex items-center gap-1 font-medium">
          <Star size={14} className="fill-ink" aria-hidden />
          {rating}
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold">${price.toFixed(2)}</p>
        <p className="text-[12px] text-g600">MXN/h</p>
        <button className="min-h-11 font-semibold underline underline-offset-4">Ver perfil</button>
      </div>
    </article>
  )
}

export function UnavailableScreen() {
  const [alternative, setAlternative] = useState<string | null>(null)

  return (
    <Phone
      label="2. Estado: horario ya no disponible"
      footer={
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-g600">{alternative ? 'Nuevo horario' : 'Selecciona una opción'}</p>
            <p className="truncate font-bold">{alternative ?? '$250.00 MXN/h'}</p>
          </div>
          <Button disabled={!alternative} className="min-w-36">
            Continuar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <TutorMini tutor={DEFAULT_TUTOR} />
        <div role="alert" className="rounded-card border-2 border-err bg-err-bg p-4 text-err">
          <div className="flex gap-3">
            <AlertTriangle size={24} className="shrink-0" aria-hidden />
            <div>
              <h2 className="text-[18px] font-bold">Este horario ya no está disponible</h2>
              <p className="mt-1">Otro Alumno reservó el lunes 23 de noviembre a las 16:00 mientras elegías.</p>
            </div>
          </div>
        </div>

        <section aria-labelledby="alternatives-title">
          <h2 id="alternatives-title" className="text-[18px] font-bold">
            Horarios alternativos con Carlos
          </h2>
          <p className="mb-3 text-g600">Elige otro horario disponible. Hora de Mérida (UTC-6).</p>
          <div className="flex flex-col gap-2" role="radiogroup">
            {alternatives.map(([date, hour]) => {
              const value = `${date} · ${hour}`
              const selected = value === alternative
              return (
                <button
                  key={value}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAlternative(value)}
                  className={cx(
                    'flex min-h-14 items-center gap-3 rounded-btn border-2 px-4 text-left',
                    selected ? 'border-ink bg-ink text-white' : 'border-g300 bg-white',
                  )}
                >
                  {selected ? <Check size={20} aria-hidden /> : <CalendarDays size={20} aria-hidden />}
                  <span className="flex-1 font-semibold">{date}</span>
                  <span className="font-bold">{hour}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="similar-title">
          <h2 id="similar-title" className="text-[18px] font-bold">
            Tutores similares
          </h2>
          <p className="mb-3 text-g600">También puedes reservar con otro Tutor.</p>
          <div className="flex flex-col gap-3">
            <SimilarTutor
              name="Luis Pérez"
              subject="Matemáticas"
              price={200}
              rating="4.6"
              photo="https://images.unsplash.com/photo-1757744705465-ea08b0ddc38a?w=160&h=160&fit=crop&crop=faces&q=80"
            />
            <SimilarTutor
              name="Valeria Ortiz"
              subject="Física"
              price={300}
              rating="4.9"
              photo="https://images.unsplash.com/photo-1630939687530-241d630735df?w=160&h=160&fit=crop&crop=faces&q=80"
            />
          </div>
        </section>
      </div>
    </Phone>
  )
}
