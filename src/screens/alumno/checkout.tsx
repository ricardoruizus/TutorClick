import { useEffect, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronLeft,
  Circle,
  CircleDot,
  Clock,
  CreditCard,
  Info,
  Link2,
  Loader2,
  Lock,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Video,
  XCircle,
} from 'lucide-react'
import { Button, StatusChip } from '../../components/ui/ds'
import {
  DAY_LABELS,
  DEFAULT_PAYMENT_STATE,
  MEETING_PLACES,
  TUTOR_CATALOG,
  formatMoney,
  formatTimeRange,
} from '../../data/mock'
import type { ClassMode, SavedPaymentState, TutorData } from '../../types'

export { DEFAULT_PAYMENT_STATE, type SavedPaymentState }

const cx = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ')
const DEFAULT_TUTOR = TUTOR_CATALOG[0]

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function PhoneFrame({
  label,
  title,
  embedded,
  hideBack,
  onBack,
  children,
  footer,
}: {
  label?: string
  title: string
  embedded?: boolean
  hideBack?: boolean
  onBack?: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const inner = (
    <div
      className={cx(
        'relative flex w-full flex-col overflow-hidden bg-white',
        embedded ? 'h-full' : 'h-dvh w-full md:h-auto md:min-h-[640px] md:max-w-3xl md:rounded-card md:border md:border-g200 md:shadow-sm',
      )}
    >
      <header className="flex h-14 shrink-0 items-center border-b border-g200 bg-white px-2">
        {hideBack ? (
          <span className="size-11" />
        ) : (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="grid size-11 place-items-center rounded-full hover:bg-g100"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <h1 className="flex-1 text-[16px] font-semibold">{title}</h1>
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

export function BookingSummaryCard({
  tutor = DEFAULT_TUTOR,
  day = 23,
  time = '16:00',
  mode = 'En línea',
  place = MEETING_PLACES[0],
  cardSummary,
  reservationId = 'RES-1001',
}: {
  tutor?: TutorData
  day?: number
  time?: string
  mode?: ClassMode
  place?: string
  cardSummary?: string
  reservationId?: string
}) {
  return (
    <section aria-labelledby="resumen-title" className="rounded-card border border-g200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 id="resumen-title" className="text-[16px] font-bold">
          Resumen de tu clase
        </h2>
        <span className="text-[12px] font-semibold text-g600">{reservationId}</span>
      </div>

      <div className="mt-3 flex items-center gap-3 border-b border-g200 pb-3">
        <img
          src={tutor.photo}
          alt={`Foto de ${tutor.name}`}
          className="size-14 shrink-0 rounded-btn bg-g200 object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[16px] font-semibold">{tutor.name}</p>
            {tutor.verified && <BadgeCheck size={17} className="shrink-0 text-ok" aria-label="Verificado" />}
          </div>
          <p className="text-g600">Materia: {tutor.subjects[0]}</p>
        </div>
      </div>

      <dl className="mt-3 flex flex-col gap-2 text-[14px]">
        <div className="flex items-start gap-2.5">
          <CalendarDays size={17} className="mt-0.5 shrink-0 text-g700" aria-hidden />
          <div>
            <dt className="sr-only">Fecha</dt>
            <dd className="font-medium">{DAY_LABELS[day] ?? 'Lunes 23 de noviembre de 2026'}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Clock size={17} className="mt-0.5 shrink-0 text-g700" aria-hidden />
          <div>
            <dt className="sr-only">Horario</dt>
            <dd className="font-medium">
              {formatTimeRange(time)} <span className="font-normal text-g600">(hora de Mérida, UTC-6)</span>
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          {mode === 'En línea' ? (
            <Video size={17} className="mt-0.5 shrink-0 text-g700" aria-hidden />
          ) : (
            <MapPin size={17} className="mt-0.5 shrink-0 text-g700" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <dt className="sr-only">Modalidad y ubicación</dt>
            <dd className="font-medium">{mode}</dd>
            {mode === 'En línea' ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-g600">
                <Link2 size={14} className="shrink-0" aria-hidden />
                meet.tutorclick.mx/{reservationId.toLowerCase()}
              </p>
            ) : (
              <p className="mt-0.5 text-g600">{place}</p>
            )}
          </div>
        </div>
        {cardSummary && (
          <div className="flex items-start gap-2.5 border-t border-g200 pt-2">
            <CreditCard size={17} className="mt-0.5 shrink-0 text-g700" aria-hidden />
            <div>
              <dt className="sr-only">Tarjeta utilizada</dt>
              <dd className="font-medium">{cardSummary}</dd>
            </div>
          </div>
        )}
      </dl>
    </section>
  )
}

function PriceBreakdownCard({ rate = 250, count = 1, discount = 0 }: { rate?: number; count?: number; discount?: number }) {
  const subtotal = rate * count
  const discounted = subtotal * (1 - discount)
  const fee = Math.round(discounted * 10) / 100
  const total = discounted + fee
  return (
    <section aria-labelledby="desglose-title" className="rounded-card border border-g200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="desglose-title" className="text-[16px] font-bold">
          Desglose de pago
        </h2>
        <span className="text-[12px] font-semibold text-g600">PAG-7001</span>
      </div>
      <dl className="mt-3 flex flex-col gap-2 text-[14px]">
        <div className="flex items-center justify-between">
          <dt className="text-g700">{count === 1 ? 'Clase 1 h' : `${count} clases de 1 h`}</dt>
          <dd className="tabular-nums font-medium">{formatMoney(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-ok">
            <dt>Descuento del Tutor ({Math.round(discount * 100)}%)</dt>
            <dd className="tabular-nums font-medium">−{formatMoney(subtotal * discount)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between">
          <dt className="text-g700">Cargo por servicio (10%)</dt>
          <dd className="tabular-nums font-medium">{formatMoney(fee)}</dd>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-g200 pt-2.5 text-[16px] font-bold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatMoney(total)}</dd>
        </div>
      </dl>
    </section>
  )
}

export function EscrowBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-card border border-info bg-info-bg p-3.5 text-info"
    >
      <Lock size={20} className="mt-0.5 shrink-0" aria-hidden />
      <div>
        <p className="font-bold">Pagas ahora; el tutor recibe el pago 48 h después de la clase</p>
      </div>
    </div>
  )
}

function CancellationPolicyCard() {
  return (
    <section aria-labelledby="cancel-policy-title" className="rounded-card border border-g200 bg-white p-4">
      <h2 id="cancel-policy-title" className="flex items-center gap-2 text-[16px] font-bold">
        <ShieldCheck size={18} aria-hidden />
        Política de cancelación
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5 text-[14px] text-g700">
        <li className="flex items-start gap-2">
          <Check size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden />
          <span>Cancelación gratis hasta 24 h antes del inicio de la clase (reembolso del 100%).</span>
        </li>
        <li className="flex items-start gap-2">
          <Clock size={16} className="mt-0.5 shrink-0 text-g600" aria-hidden />
          <span>Cuentas con 15 min de tolerancia para iniciar la clase.</span>
        </li>
      </ul>
    </section>
  )
}

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export type CheckoutMode = 'form' | 'new-card' | 'processing' | 'declined' | 'sent'

export function ConfirmedScreen({
  label = 'Clase confirmada',
  embedded,
  tutor = DEFAULT_TUTOR,
  day = 23,
  time = '16:00',
  mode = 'En línea',
  place = MEETING_PLACES[0],
  cardSummary = 'Visa •••• 4242',
  reservationId = 'RES-1001',
  onBack,
  onViewCalendar,
}: {
  label?: string
  embedded?: boolean
  tutor?: TutorData
  day?: number
  time?: string
  mode?: ClassMode
  place?: string
  cardSummary?: string
  reservationId?: string
  onBack?: () => void
  onViewCalendar?: () => void
}) {
  const [calendarAdded, setCalendarAdded] = useState(false)
  const fee = Math.round(tutor.rate * 10) / 100
  const total = tutor.rate + fee

  return (
    <PhoneFrame
      label={label}
      title="Clase confirmada"
      embedded={embedded}
      onBack={onBack}
      footer={
        <div className="flex flex-col gap-2.5">
          <Button
            full
            icon={calendarAdded ? Check : CalendarPlus}
            onClick={() => setCalendarAdded((prev) => !prev)}
          >
            {calendarAdded ? 'Agregada al calendario' : 'Agregar al calendario'}
          </Button>
          <Button full variant="secondary" icon={CalendarDays} onClick={onViewCalendar}>
            Ver calendario
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col items-center rounded-card border border-g200 bg-white px-5 py-6 text-center shadow-sm">
          <span className="grid size-16 place-items-center rounded-full bg-ok-bg text-ok">
            <CheckCircle2 size={34} aria-hidden />
          </span>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <StatusChip status="Confirmada" />
            <StatusChip status="Retenido" />
          </div>
          <h2 className="mt-3 text-[22px] font-bold leading-snug">Clase confirmada</h2>
          <p className="mt-1.5 text-[14px] text-g700">
            Tu reserva <strong>{reservationId}</strong> con {tutor.name} quedó confirmada al instante por{' '}
            <strong>{formatMoney(total)}</strong>.
          </p>
        </div>

        <BookingSummaryCard
          tutor={tutor}
          day={day}
          time={time}
          mode={mode}
          place={place}
          cardSummary={cardSummary}
          reservationId={reservationId}
        />

        <EscrowBanner />
      </div>
    </PhoneFrame>
  )
}

export function CheckoutScreen({
  label,
  initialMode = 'form',
  showSavedCard = false,
  initialClassMode = 'En línea',
  embedded,
  tutor = DEFAULT_TUTOR,
  day = 23,
  time = '16:00',
  place = MEETING_PLACES[0],
  paymentState,
  onPaymentStateChange,
  holdSeconds: controlledHoldSeconds,
  onHoldExpired,
  onBack,
  onConfirmed,
  onViewCalendar,
  onProcessingChange,
  classCount = 1,
  discount = 0,
  bookingLabel,
}: {
  label?: string
  initialMode?: CheckoutMode
  showSavedCard?: boolean
  initialClassMode?: ClassMode
  embedded?: boolean
  tutor?: TutorData
  day?: number
  time?: string
  place?: string
  paymentState?: SavedPaymentState
  onPaymentStateChange?: (next: SavedPaymentState) => void
  holdSeconds?: number
  onHoldExpired?: () => void
  onBack?: () => void
  onConfirmed?: (cardLabel: string) => void
  onViewCalendar?: () => void
  onProcessingChange?: (processing: boolean) => void
  classCount?: number
  discount?: number
  bookingLabel?: string
}) {
  const [screenMode, setScreenMode] = useState<CheckoutMode>(initialMode)
  const [localPayment, setLocalPayment] = useState<SavedPaymentState>({
    method: showSavedCard && initialMode !== 'new-card' ? 'saved' : 'new',
    cardNumber: initialMode === 'new-card' ? '4532 8910 2234 ' : '',
    expiry: initialMode === 'new-card' ? '08/29' : '',
    cvv: '',
    holder: initialMode === 'new-card' ? 'Sofía Mena' : '',
  })
  const pay = paymentState ?? localPayment
  const updatePay = (patch: Partial<SavedPaymentState>) => {
    const next = { ...pay, ...patch }
    setLocalPayment(next)
    onPaymentStateChange?.(next)
  }
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(true)
  const [submitted, setSubmitted] = useState(false)
  const [localSeconds, setLocalSeconds] = useState(600)
  const secondsLeft = controlledHoldSeconds ?? localSeconds

  useEffect(() => {
    if (controlledHoldSeconds !== undefined) return
    if (screenMode === 'processing' || screenMode === 'sent') return
    if (localSeconds <= 0) {
      onHoldExpired?.()
      return
    }
    const id = setInterval(() => {
      setLocalSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [controlledHoldSeconds, screenMode, localSeconds, onHoldExpired])

  const cleanDigits = pay.cardNumber.replace(/\D/g, '')
  const cardLabel =
    pay.method === 'saved'
      ? 'Visa •••• 4242'
      : `Tarjeta •••• ${cleanDigits.slice(-4) || '0000'}${pay.holder.trim() ? ` (${pay.holder.trim()})` : ''}`

  useEffect(() => {
    onProcessingChange?.(screenMode === 'processing')
  }, [screenMode, onProcessingChange])

  useEffect(() => {
    if (screenMode !== 'processing' || (!embedded && initialMode === 'processing')) return
    const timer = setTimeout(() => {
      if (pay.method === 'new' && cleanDigits === '4000000000000002') {
        setScreenMode('declined')
      } else if (onConfirmed) {
        onConfirmed(cardLabel)
      } else {
        setScreenMode('sent')
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [screenMode, embedded, initialMode, pay.method, cleanDigits, onConfirmed, cardLabel])

  const subtotal = tutor.rate * classCount * (1 - discount)
  const fee = Math.round(subtotal * 10) / 100
  const total = subtotal + fee

  const cardErrors =
    submitted && pay.method === 'new'
      ? {
          number: cleanDigits.length < 16 ? 'Ingresa los 16 dígitos de la tarjeta.' : undefined,
          expiry: !/^(0[1-9]|1[0-2])\/\d{2}$/.test(pay.expiry) ? 'Usa formato MM/AA.' : undefined,
          cvv: pay.cvv.replace(/\D/g, '').length < 3 ? 'Ingresa 3 o 4 dígitos.' : undefined,
          holder: !pay.holder.trim() ? 'Escribe el nombre como aparece en la tarjeta.' : undefined,
        }
      : {}
  const termsError = submitted && !acceptedTerms ? 'Acepta los términos y la política de cancelación para continuar.' : undefined

  function handlePay() {
    setSubmitted(true)
    if (!acceptedTerms) return
    if (pay.method === 'new') {
      const invalid =
        cleanDigits.length < 16 ||
        !/^(0[1-9]|1[0-2])\/\d{2}$/.test(pay.expiry) ||
        pay.cvv.replace(/\D/g, '').length < 3 ||
        !pay.holder.trim()
      if (invalid) return
    }
    setScreenMode('processing')
  }

  if (screenMode === 'sent') {
    return (
      <ConfirmedScreen
        label={label}
        embedded={embedded}
        tutor={tutor}
        day={day}
        time={time}
        mode={initialClassMode}
        place={place}
        cardSummary={cardLabel}
        onBack={onBack}
        onViewCalendar={onViewCalendar}
      />
    )
  }

  if (screenMode === 'processing') {
    return (
      <PhoneFrame
        label={label}
        title="Confirmación y pago"
        embedded={embedded}
        hideBack
        footer={
          <Button full loading>
            Pagar ${total.toFixed(2)} y reservar
          </Button>
        }
      >
        <div
          role="status"
          aria-live="polite"
          className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
        >
          <span className="grid size-20 place-items-center rounded-full bg-ink text-white">
            <Loader2 size={38} className="animate-spin" aria-hidden />
          </span>
          <h2 className="text-[22px] font-bold">Procesando tu pago</h2>
          <p className="text-[14px] text-g600">
            Estamos autorizando el cargo protegido de <strong className="text-ink">{formatMoney(total)}</strong> en tu tarjeta{' '}
            {pay.method === 'saved' ? 'Visa •••• 4242' : `terminación ${cleanDigits.slice(-4) || 'nueva'}`}.
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-full bg-g200 px-4 py-2 text-[12px] font-semibold text-g700">
            <Lock size={14} aria-hidden />
            No cierres ni recargues esta pantalla
          </div>
        </div>
      </PhoneFrame>
    )
  }

  const uid = label ?? 'checkout'

  return (
    <PhoneFrame
      label={label}
      title="Confirmación y pago"
      embedded={embedded}
      onBack={onBack}
      footer={
        <div className="flex flex-col gap-2">
          {screenMode === 'declined' ? (
            <Button full icon={RefreshCw} onClick={handlePay}>
              Reintentar
            </Button>
          ) : (
            <Button full icon={Lock} onClick={handlePay}>
              Pagar ${total.toFixed(2)} y reservar
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <div
          role="timer"
          aria-live="off"
          className={cx(
            'flex items-center justify-between gap-2 rounded-card border px-3.5 py-2.5',
            secondsLeft <= 60 ? 'border-err bg-err-bg text-err' : 'border-warn bg-warn-bg text-warn',
          )}
        >
          <span className="flex items-center gap-2 font-semibold">
            <Clock size={18} className="shrink-0" aria-hidden />
            Horario bloqueado para ti
          </span>
          <span className="tabular-nums text-[16px] font-bold">{formatCountdown(secondsLeft)}</span>
        </div>

        {screenMode === 'declined' && (
          <div role="alert" className="rounded-card border-2 border-err bg-err-bg p-4 text-err">
            <div className="flex items-start gap-3">
              <XCircle size={22} className="mt-0.5 shrink-0" aria-hidden />
              <div className="flex-1">
                <h2 className="text-[16px] font-bold">Pago rechazado por el banco</h2>
                <p className="mt-1 text-[14px]">
                  Tu banco rechazó el cargo de <strong>{formatMoney(total)}</strong> en{' '}
                  {pay.method === 'saved' ? 'Visa •••• 4242' : `la tarjeta •••• ${cleanDigits.slice(-4) || '0002'}`}. No se realizó ningún cobro.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updatePay({ method: 'saved' })
                      setScreenMode('form')
                    }}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-btn border-2 border-err bg-white px-3 text-[14px] font-semibold text-err hover:bg-err-bg"
                  >
                    <CreditCard size={16} aria-hidden />
                    Usar Visa •••• 4242
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <BookingSummaryCard tutor={tutor} day={day} time={time} mode={initialClassMode} place={place} />
        {bookingLabel && (
          <div className="rounded-card border border-info bg-info-bg p-3.5 text-[14px] text-info">
            <p className="font-bold">{bookingLabel}</p>
            {classCount > 1 && <p className="mt-1">Pago total al inicio; el Tutor recibe cada clase al impartirla.</p>}
          </div>
        )}
        <PriceBreakdownCard rate={tutor.rate} count={classCount} discount={discount} />
        <EscrowBanner />

        {/* Método de pago: solo tarjeta */}
        <section aria-labelledby="metodo-title" className="rounded-card border border-g200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id="metodo-title" className="text-[16px] font-bold">
              Método de pago
            </h2>
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-g600">
              <CreditCard size={14} aria-hidden />
              Solo tarjeta
            </span>
          </div>

          <div role="radiogroup" aria-label="Selecciona una tarjeta" className="mt-3 flex flex-col gap-2.5">
            {showSavedCard && (
            <button
              type="button"
              role="radio"
              aria-checked={pay.method === 'saved'}
              onClick={() => updatePay({ method: 'saved' })}
              className={cx(
                'flex min-h-16 items-center gap-3 rounded-btn border-2 p-3 text-left',
                pay.method === 'saved' ? 'border-ink bg-g100' : 'border-g300 bg-white',
              )}
            >
              <span className="grid h-9 w-12 shrink-0 place-items-center rounded bg-ink text-[12px] font-bold tracking-wider text-white">
                VISA
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Visa •••• 4242</span>
                <span className="text-[12px] text-g600">Sofía Mena · Vence 09/28</span>
              </span>
              {pay.method === 'saved' ? (
                <CircleDot size={22} className="shrink-0 text-ink" aria-hidden />
              ) : (
                <Circle size={22} className="shrink-0 text-g500" aria-hidden />
              )}
            </button>
            )}

            <button
              type="button"
              role="radio"
              aria-checked={pay.method === 'new'}
              onClick={() => updatePay({ method: 'new' })}
              className={cx(
                'flex min-h-14 items-center gap-3 rounded-btn border-2 p-3 text-left',
                pay.method === 'new' ? 'border-ink bg-g100' : 'border-g300 bg-white',
              )}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-g200 text-ink">
                <Plus size={18} aria-hidden />
              </span>
              <span className="flex-1 font-semibold">Agregar tarjeta</span>
              {pay.method === 'new' ? (
                <CircleDot size={22} className="shrink-0 text-ink" aria-hidden />
              ) : (
                <Circle size={22} className="shrink-0 text-g500" aria-hidden />
              )}
            </button>
          </div>

          {pay.method === 'new' && (
            <div className="mt-4 flex flex-col gap-3 border-t border-g200 pt-4">
              <div className="flex flex-col gap-1">
                <label htmlFor={`${uid}-num`} className="text-[12px] font-semibold text-g700">
                  Número de tarjeta
                </label>
                <input
                  id={`${uid}-num`}
                  inputMode="numeric"
                  value={pay.cardNumber}
                  onChange={(e) => updatePay({ cardNumber: formatCardNumber(e.target.value) })}
                  placeholder="1234 5678 9012 3456"
                  aria-invalid={!!cardErrors.number}
                  className={cx(
                    'min-h-12 rounded-btn border bg-white px-3.5 text-[14px] tabular-nums outline-none focus:border-ink focus:ring-4 focus:ring-ink/15',
                    cardErrors.number ? 'border-2 border-err' : 'border-g500',
                  )}
                />
                {cardErrors.number && (
                  <p role="alert" className="flex items-center gap-1.5 text-[14px] font-medium text-err">
                    <AlertTriangle size={15} aria-hidden />
                    {cardErrors.number}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label htmlFor={`${uid}-exp`} className="text-[12px] font-semibold text-g700">
                    Vencimiento
                  </label>
                  <input
                    id={`${uid}-exp`}
                    inputMode="numeric"
                    value={pay.expiry}
                    onChange={(e) => updatePay({ expiry: formatExpiry(e.target.value) })}
                    placeholder="MM/AA"
                    aria-invalid={!!cardErrors.expiry}
                    className={cx(
                      'min-h-12 rounded-btn border bg-white px-3.5 text-[14px] tabular-nums outline-none focus:border-ink focus:ring-4 focus:ring-ink/15',
                      cardErrors.expiry ? 'border-2 border-err' : 'border-g500',
                    )}
                  />
                  {cardErrors.expiry && (
                    <p role="alert" className="flex items-center gap-1 text-[14px] font-medium text-err">
                      <AlertTriangle size={15} className="shrink-0" aria-hidden />
                      {cardErrors.expiry}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor={`${uid}-cvv`} className="text-[12px] font-semibold text-g700">
                    CVV
                  </label>
                  <input
                    id={`${uid}-cvv`}
                    inputMode="numeric"
                    value={pay.cvv}
                    onChange={(e) => updatePay({ cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="123"
                    aria-invalid={!!cardErrors.cvv}
                    className={cx(
                      'min-h-12 rounded-btn border bg-white px-3.5 text-[14px] tabular-nums outline-none focus:border-ink focus:ring-4 focus:ring-ink/15',
                      cardErrors.cvv ? 'border-2 border-err' : 'border-g500',
                    )}
                  />
                  {cardErrors.cvv && (
                    <p role="alert" className="flex items-center gap-1 text-[14px] font-medium text-err">
                      <AlertTriangle size={15} className="shrink-0" aria-hidden />
                      {cardErrors.cvv}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`${uid}-holder`} className="text-[12px] font-semibold text-g700">
                  Nombre en la tarjeta
                </label>
                <input
                  id={`${uid}-holder`}
                  value={pay.holder}
                  onChange={(e) => updatePay({ holder: e.target.value })}
                  placeholder="Sofía Mena"
                  aria-invalid={!!cardErrors.holder}
                  className={cx(
                    'min-h-12 rounded-btn border bg-white px-3.5 text-[14px] outline-none focus:border-ink focus:ring-4 focus:ring-ink/15',
                    cardErrors.holder ? 'border-2 border-err' : 'border-g500',
                  )}
                />
                {cardErrors.holder && (
                  <p role="alert" className="flex items-center gap-1.5 text-[14px] font-medium text-err">
                    <AlertTriangle size={15} aria-hidden />
                    {cardErrors.holder}
                  </p>
                )}
              </div>

              <p className="flex items-center gap-1.5 text-[12px] text-g600">
                <Info size={14} className="shrink-0" aria-hidden />
                Aceptamos tarjetas de crédito y débito Visa, Mastercard y Carnet.
              </p>
            </div>
          )}
        </section>

        <CancellationPolicyCard />

        <div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-card border border-g200 bg-white p-3.5">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              aria-invalid={!!termsError}
              className="mt-0.5 size-6 shrink-0 accent-ink"
            />
            <span className="text-[14px] text-g700">
              Acepto los <u className="font-semibold text-ink">términos del servicio</u>, el cargo protegido de{' '}
              <strong className="text-ink">{formatMoney(total)}</strong> y la política de cancelación.
            </span>
          </label>
          {termsError && (
            <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-[14px] font-medium text-err">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
              {termsError}
            </p>
          )}
        </div>
      </div>
    </PhoneFrame>
  )
}
