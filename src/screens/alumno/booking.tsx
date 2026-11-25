import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock,
  MapPin,
  Star,
  Video,
} from 'lucide-react'
import { Button } from '../../components/ui/ds'
import {
  MEETING_PLACES,
  TUTOR_CATALOG,
  formatMoney,
} from '../../data/mock'
import type { ClassMode, TutorData } from '../../types'
import type { AvailableClassSlot } from '../../services/agenda'

const cx = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ')
const DEFAULT_TUTOR = TUTOR_CATALOG[0]
const MERIDA_TIME_ZONE = 'America/Merida'

export interface BookingSelection {
  startsAt: string
  mode: ClassMode
  place: string | null
}

function formatBookingDate(startsAt: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-MX', {
    ...options,
    timeZone: MERIDA_TIME_ZONE,
  }).format(new Date(startsAt))
}

function getDefaultMockSlots(tutor: TutorData): AvailableClassSlot[] {
  const mockDates: Record<number, string> = {
    23: '2026-11-23',
    24: '2026-11-24',
    25: '2026-11-25',
    26: '2026-11-26',
    27: '2026-11-27',
  }
  return Object.entries(tutor.schedule).flatMap(([dayValue, times]) => {
    const date = mockDates[Number(dayValue)]
    if (!date) return []
    return times.map((time) => ({
      startsAt: new Date(`${date}T${time}:00-06:00`).toISOString(),
      mode: tutor.modes[0] ?? 'En línea',
    }))
  })
}

function Phone({
  embedded,
  onBack,
  children,
  footer,
}: {
  embedded?: boolean
  onBack?: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const inner = (
    <div
      className={cx(
        'flex w-full flex-col overflow-hidden bg-white',
        embedded ? 'h-full' : 'h-dvh w-full md:h-auto md:min-h-[640px] md:max-w-3xl md:rounded-card md:border md:border-g200 md:shadow-sm',
      )}
    >
      <header className="flex h-14 shrink-0 items-center border-b border-g200 px-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver al perfil"
          className="grid size-11 place-items-center rounded-full hover:bg-g100"
        >
          <ChevronLeft size={24} aria-hidden />
        </button>
        <h1 className="flex-1 text-[16px] font-semibold">Solicitar una clase</h1>
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
  return <figure>{inner}</figure>
}

function TutorMini({ tutor }: { tutor: TutorData }) {
  return (
    <article className="flex items-center gap-3 rounded-card border border-g200 bg-white p-3 shadow-sm">
      {tutor.photo ? (
        <img
          src={tutor.photo}
          alt={`Foto de ${tutor.name}`}
          className="size-16 shrink-0 rounded-btn bg-g200 object-cover"
        />
      ) : (
        <span className="grid size-16 shrink-0 place-items-center rounded-btn bg-g200 font-semibold text-g700" aria-hidden>
          {tutor.first.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h2 className="truncate text-[16px] font-semibold">{tutor.name}</h2>
          {tutor.verified && <BadgeCheck size={18} className="shrink-0 text-ok" aria-label="Verificado" />}
        </div>
        <p className="truncate text-g600">{tutor.subjects.join(' y ')}</p>
        <p className="mt-1 flex items-center gap-1 font-semibold">
          <Star size={15} className="fill-ink" aria-hidden />
          {tutor.rating.toFixed(1)}{' '}
          <span className="font-normal text-g600">({tutor.reviewsCount} reseñas)</span>
        </p>
      </div>
      <p className="shrink-0 text-right font-bold">
        {formatMoney(tutor.rate)}
        <span className="block text-[12px] font-medium text-g600">por hora</span>
      </p>
    </article>
  )
}

export function BookingScreen({
  tutor = DEFAULT_TUTOR,
  embedded,
  availability,
  availabilityLoading = false,
  availabilityError,
  requestError,
  requestLoading = false,
  onRetryAvailability,
  onBack,
  onContinue,
}: {
  tutor?: TutorData
  embedded?: boolean
  availability?: AvailableClassSlot[]
  availabilityLoading?: boolean
  availabilityError?: string | null
  requestError?: string | null
  requestLoading?: boolean
  onRetryAvailability?: () => void
  onBack?: () => void
  onContinue?: (selection: BookingSelection) => void
}) {
  const slots = useMemo(
    () => [...(availability ?? getDefaultMockSlots(tutor))].sort(
      (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
    ),
    [availability, tutor],
  )
  const [selectedKey, setSelectedKey] = useState('')
  const [place, setPlace] = useState(MEETING_PLACES[0])
  const selectedSlot = slots.find((slot) => `${slot.startsAt}-${slot.mode}` === selectedKey)
  useEffect(() => {
    setSelectedKey('')
  }, [tutor.id])
  const groupedSlots = slots.reduce<Record<string, AvailableClassSlot[]>>((groups, slot) => {
    const dateKey = formatBookingDate(slot.startsAt, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    groups[dateKey] = [...(groups[dateKey] ?? []), slot]
    return groups
  }, {})

  return (
    <Phone
      embedded={embedded}
      onBack={onBack}
      footer={
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-g600">
              <CalendarDays size={15} aria-hidden />
              Solicitud sin cobro
            </p>
            <p className="text-[13px] text-g600">El Tutor debe confirmarla</p>
          </div>
          <Button
            disabled={!selectedSlot || availabilityLoading}
            loading={requestLoading}
            className="min-w-36"
            onClick={() => {
              if (!selectedSlot) return
              onContinue?.({
                startsAt: selectedSlot.startsAt,
                mode: selectedSlot.mode,
                place: selectedSlot.mode === 'Presencial' ? place : null,
              })
            }}
          >
            Solicitar horario
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-4 md:mx-auto md:w-full md:max-w-2xl">
        <TutorMini tutor={tutor} />
        {requestError && (
          <div role="alert" className="flex items-start gap-2 rounded-card border-2 border-err bg-err-bg p-3 text-[14px] font-semibold text-err">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
            {requestError}
          </div>
        )}
        {availabilityError && (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-card border-2 border-err bg-err-bg p-4 text-err">
            <p className="flex items-start gap-2 text-[14px] font-semibold">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
              {availabilityError}
            </p>
            <Button variant="secondary" onClick={onRetryAvailability}>Reintentar</Button>
          </div>
        )}
        <section aria-labelledby="schedule-title" className="flex flex-col gap-3">
          <div>
            <h2 id="schedule-title" className="text-[18px] font-bold">Horarios disponibles</h2>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-g600">
              <Clock size={15} aria-hidden />
              Hora local de Mérida (UTC-6)
            </p>
          </div>
          {availabilityLoading ? (
            <p role="status" className="rounded-card border border-g200 bg-white p-4 text-[14px] text-g600">
              Cargando disponibilidad…
            </p>
          ) : !availabilityError && slots.length === 0 ? (
            <p className="rounded-card border border-dashed border-g300 bg-white p-5 text-center text-[14px] text-g600">
              Este Tutor todavía no ha publicado horarios para los próximos 30 días.
            </p>
          ) : (
            Object.entries(groupedSlots).map(([dateKey, daySlots]) => (
              <section key={dateKey} className="rounded-card border border-g200 bg-white p-3">
                <h3 className="mb-2 text-[14px] font-bold capitalize">
                  {formatBookingDate(daySlots[0].startsAt, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {daySlots.map((slot) => {
                    const key = `${slot.startsAt}-${slot.mode}`
                    const selected = selectedKey === key
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedKey(key)}
                        className={cx(
                          'flex min-h-14 items-center justify-between gap-2 rounded-btn border-2 px-3 text-left text-[13px] font-semibold',
                          selected ? 'border-ink bg-ink text-white' : 'border-g300 bg-white text-ink',
                        )}
                      >
                        <span>
                          <span className="block">
                            {formatBookingDate(slot.startsAt, { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          <span className={cx('flex items-center gap-1 text-[11px]', selected ? 'text-white/80' : 'text-g600')}>
                            {slot.mode === 'Presencial' ? <MapPin size={12} aria-hidden /> : <Video size={12} aria-hidden />}
                            {slot.mode}
                          </span>
                        </span>
                        {selected && <Check size={16} aria-hidden />}
                      </button>
                    )
                  })}
                </div>
              </section>
            ))
          )}
        </section>
        {selectedSlot?.mode === 'Presencial' && (
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-g700">
            Lugar de encuentro
            <select
              value={place}
              onChange={(event) => setPlace(event.target.value)}
              className="min-h-12 rounded-btn border border-g500 bg-white px-3 text-[14px] text-ink"
            >
              {MEETING_PLACES.map((meetingPlace) => (
                <option key={meetingPlace} value={meetingPlace}>{meetingPlace}</option>
              ))}
            </select>
          </label>
        )}
        {selectedSlot?.mode === 'En línea' && (
          <p className="rounded-card border border-info bg-info-bg p-3 text-[13px] text-info">
            El Tutor compartirá el enlace cuando confirme la solicitud.
          </p>
        )}
        <p className="rounded-card border border-g200 bg-white p-3 text-[13px] text-g700">
          Enviar la solicitud no realiza ningún cobro. La clase queda pendiente hasta que el Tutor responda.
        </p>
      </div>
    </Phone>
  )
}

export function UnavailableScreen() {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-[12px] font-semibold text-g600">Sin horarios disponibles</figcaption>
      <div className="flex min-h-64 w-full max-w-3xl flex-col items-center justify-center gap-3 rounded-card border border-g200 bg-g50 p-6 text-center">
        <CalendarDays size={30} className="text-g600" aria-hidden />
        <h2 className="text-[18px] font-bold">No hay horarios publicados</h2>
        <p className="text-[14px] text-g600">
          Vuelve a revisar cuando el Tutor publique su disponibilidad semanal.
        </p>
      </div>
    </figure>
  )
}
