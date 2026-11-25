import type { ComponentType, ReactNode, ButtonHTMLAttributes } from 'react'
import {
  Loader2, CheckCircle2, Clock, XCircle, CheckCheck, Lock, Unlock, Undo2, AlertTriangle, Ban,
  BadgeCheck, Eye, ShieldX, Star, MapPin, Video, Search, CalendarDays, MessageCircle, User,
  Home, ClipboardList, Menu, ChevronLeft, Bell, Info, Lock as LockIcon, CalendarX, CalendarClock, PlayCircle, LayoutDashboard,
  Users, CreditCard, Gavel, Settings, ShieldCheck, ChevronRight, Check, X,
} from 'lucide-react'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean; className?: string }>
const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(' ')

/* ---------- Botón ---------- */
export type BtnVariant = 'primary' | 'secondary' | 'text' | 'destructive'
const btnBase =
  'inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-btn px-5 text-[14px] font-semibold transition-colors select-none disabled:cursor-not-allowed'
const btnStyles: Record<BtnVariant, { base: string; pressed: string; disabled: string }> = {
  primary: { base: 'bg-ink text-white hover:bg-g700', pressed: 'bg-[#3a3a3a] text-white', disabled: 'disabled:bg-g200 disabled:text-g500' },
  secondary: { base: 'border-2 border-ink bg-white text-ink hover:bg-g100', pressed: 'border-2 border-ink bg-g200 text-ink', disabled: 'disabled:border-g300 disabled:text-g500 disabled:bg-white' },
  text: { base: 'bg-transparent text-ink underline underline-offset-4 hover:bg-g100', pressed: 'bg-g200 text-ink underline underline-offset-4', disabled: 'disabled:text-g500 disabled:no-underline' },
  destructive: { base: 'bg-err text-white hover:bg-[#991b1b]', pressed: 'bg-[#7f1d1d] text-white', disabled: 'disabled:bg-g200 disabled:text-g500' },
}
export function Button({
  variant = 'primary', loading, pressed, full, icon: I, children, disabled, className, ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean; pressed?: boolean; full?: boolean; icon?: Icon }) {
  const s = btnStyles[variant]
  return (
    <button
      {...p}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(btnBase, pressed ? s.pressed : cx(s.base, 'active:brightness-90'), s.disabled, full && 'w-full', className)}
    >
      {loading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : I && <I size={18} aria-hidden />}
      {loading ? 'Cargando…' : children}
    </button>
  )
}

/* ---------- Campo de texto ---------- */
export type FieldState = 'default' | 'focus' | 'error' | 'disabled'
export function TextField({ label, help, state = 'default', value, placeholder }: {
  label: string; help: string; state?: FieldState; value?: string; placeholder?: string
}) {
  const id = `f-${label.replace(/\s/g, '')}-${state}`
  const border = { default: 'border-g500', focus: 'border-ink ring-4 ring-ink/15', error: 'border-err border-2', disabled: 'border-g300 bg-g100 text-g500' }[state]
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold text-g700">{label}</label>
      <input
        id={id}
        defaultValue={value}
        placeholder={placeholder}
        disabled={state === 'disabled'}
        aria-invalid={state === 'error'}
        aria-describedby={id + '-h'}
        className={cx('min-h-12 rounded-btn border bg-white px-4 text-[14px] outline-none placeholder:text-g500', border)}
      />
      <p id={id + '-h'} className={cx('flex items-center gap-1.5 text-[14px]', state === 'error' ? 'font-medium text-err' : 'text-g600')}>
        {state === 'error' && <AlertTriangle size={16} aria-hidden />}
        {help}
      </p>
    </div>
  )
}

/* ---------- Chips de estado ---------- */
type Tone = 'ok' | 'warn' | 'err' | 'info' | 'neutral'
const tone: Record<Tone, string> = {
  ok: 'bg-ok-bg text-ok', warn: 'bg-warn-bg text-warn', err: 'bg-err-bg text-err', info: 'bg-info-bg text-info', neutral: 'bg-g200 text-g700',
}
export const chipMap = {
  Confirmada: ['ok', CheckCircle2],
  'Reprogramación propuesta': ['warn', CalendarClock],
  'En curso': ['info', PlayCircle],
  Pendiente: ['warn', Clock],
  Cancelada: ['err', XCircle],
  Finalizada: ['neutral', CheckCheck],
  Retenido: ['info', Lock], Liberado: ['ok', Unlock], Reembolsado: ['info', Undo2], 'En disputa': ['err', AlertTriangle],
  Suspendido: ['err', Ban], Verificado: ['ok', BadgeCheck], 'En revisión': ['warn', Eye], Rechazado: ['err', ShieldX],
} as const satisfies Record<string, readonly [Tone, Icon]>
export type ChipKey = keyof typeof chipMap
export function StatusChip({ status }: { status: ChipKey }) {
  const [t, I] = chipMap[status]
  return (
    <span className={cx('inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold', tone[t])}>
      <I size={16} aria-hidden />{status}
    </span>
  )
}

/* ---------- Tarjetas ---------- */
export function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const ini = name.split(' ').map((w) => w[0]).join('')
  return (
    <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-full bg-ink text-[14px] font-semibold text-white" aria-hidden>{ini}</span>
  )
}
export function TutorCard() {
  return (
    <article className="flex flex-col gap-3 rounded-card border border-g200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <Avatar name="Carlos Chan" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold">Carlos Chan</h3>
          <p className="text-g600">Matemáticas y Física</p>
          <p className="mt-0.5 flex items-center gap-1 font-medium"><Star size={16} className="fill-ink" aria-hidden />4.8 <span className="font-normal text-g600">(32 reseñas)</span></p>
        </div>
        <StatusChip status="Verificado" />
      </div>
      <p className="flex items-center gap-1.5 text-g600"><MapPin size={16} aria-hidden />Mérida, zona norte · Presencial y en línea</p>
      <div className="flex items-center justify-between border-t border-g200 pt-3">
        <p><span className="text-[18px] font-bold">$250.00 MXN</span><span className="text-g600"> / h</span></p>
        <Button className="min-h-11 !px-4">Ver perfil</Button>
      </div>
    </article>
  )
}
export function ClassCard({ status = 'Confirmada' as ChipKey }) {
  return (
    <article className="flex flex-col gap-3 rounded-card border border-g200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[16px] font-semibold">Matemáticas con Carlos Chan</h3>
          <p className="text-g600">RES-1001</p>
        </div>
        <StatusChip status={status} />
      </div>
      <ul className="flex flex-col gap-1.5">
        <li className="flex items-center gap-2"><CalendarDays size={16} aria-hidden />Lunes 23 de noviembre de 2026</li>
        <li className="flex items-center gap-2"><Clock size={16} aria-hidden />4:00 a 5:00 PM (hora de Mérida, UTC-6)</li>
        <li className="flex items-center gap-2"><Video size={16} aria-hidden />En línea</li>
      </ul>
      <div className="flex items-center justify-between border-t border-g200 pt-3">
        <p className="text-[16px] font-bold">$275.00 MXN</p>
        <Button variant="secondary" className="min-h-11 !px-4">Ver detalle</Button>
      </div>
    </article>
  )
}

/* ---------- Bloque horario ---------- */
export type SlotState = 'disponible' | 'seleccionado' | 'reservado' | 'bloqueado'
export function TimeSlot({ time, state }: { time: string; state: SlotState }) {
  const cfg = {
    disponible: ['border-2 border-g500 bg-white text-ink', null, 'Disponible'],
    seleccionado: ['border-2 border-ink bg-ink text-white', Check, 'Seleccionado'],
    reservado: ['border-2 border-info bg-info-bg text-info', CalendarDays, 'Reservado'],
    bloqueado: ['border-2 border-dashed border-g300 bg-g100 text-g500', Ban, 'Bloqueado'],
  }[state] as [string, Icon | null, string]
  const I = cfg[1]
  return (
    <button disabled={state === 'reservado' || state === 'bloqueado'} aria-pressed={state === 'seleccionado'}
      className={cx('flex min-h-14 min-w-28 flex-col items-center justify-center rounded-btn px-3 text-[14px] font-semibold disabled:cursor-not-allowed', cfg[0])}>
      <span>{time}</span>
      <span className="flex items-center gap-1 text-[12px] font-medium">{I && <I size={12} aria-hidden />}{cfg[2]}</span>
    </button>
  )
}

/* ---------- Barras ---------- */
export function BottomNav({
  items,
  active,
  onSelect,
}: {
  items: [string, Icon][]
  active: number
  onSelect?: (index: number) => void
}) {
  return (
    <nav aria-label="Navegación principal" className="flex border-t border-g200 bg-white pb-2">
      {items.map(([l, I], i) => (
        <button
          key={l}
          type="button"
          onClick={() => onSelect?.(i)}
          aria-current={i === active ? 'page' : undefined}
          className={cx(
            'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[12px] transition-colors duration-200',
            i === active ? 'font-bold text-ink' : 'font-medium text-g600 hover:text-ink',
          )}
        >
          {i === active && <span className="absolute top-0 h-1 w-8 rounded-b bg-ink" />}
          <I size={22} strokeWidth={i === active ? 2.5 : 2} aria-hidden />{l}
        </button>
      ))}
    </nav>
  )
}
export const studentNav: [string, Icon][] = [['Buscar', Search], ['Calendario', CalendarDays], ['Mensajes', MessageCircle], ['Perfil', User]]
export const tutorNav: [string, Icon][] = [['Inicio', Home], ['Calendario', CalendarDays], ['Mensajes', MessageCircle], ['Más', Menu]]

export function TopBar({
  title,
  back,
  action,
  onBack,
}: {
  title: string
  back?: boolean
  action?: boolean
  onBack?: () => void
}) {
  return (
    <header className="flex h-14 items-center gap-1 border-b border-g200 bg-white px-2">
      {back ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="grid size-11 place-items-center rounded-full hover:bg-g100"
        >
          <ChevronLeft size={24} aria-hidden />
        </button>
      ) : (
        <span className="size-11" />
      )}
      <h2 className="flex-1 text-[16px] font-semibold">{title}</h2>
      <span className="grid size-11 place-items-center">{action && <Bell size={22} aria-label="Notificaciones" />}</span>
    </header>
  )
}

/* ---------- Bottom sheet ---------- */
export function BottomSheet() {
  return (
    <div className="rounded-t-3xl border border-g200 bg-white px-5 pb-6 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,.12)]" role="dialog" aria-label="Confirmar reserva">
      <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-g300" />
      <h3 className="text-[18px] font-bold">Confirmar reserva</h3>
      <p className="text-g600">Matemáticas con Carlos Chan · lunes 23 de nov, 4:00 a 5:00 PM</p>
      <dl className="my-4 flex flex-col gap-2 rounded-card bg-g100 p-4">
        <div className="flex justify-between"><dt>Tarifa (1 h)</dt><dd>$250.00 MXN</dd></div>
        <div className="flex justify-between"><dt>Cargo por servicio (10%)</dt><dd>$25.00 MXN</dd></div>
        <div className="flex justify-between border-t border-g300 pt-2 text-[16px] font-bold"><dt>Total</dt><dd>$275.00 MXN</dd></div>
      </dl>
      <p className="mb-4 flex items-start gap-2 text-g700"><LockIcon size={16} className="mt-1 shrink-0" aria-hidden />Pagas ahora; el tutor recibe el pago 48 h después de la clase.</p>
      <div className="flex flex-col gap-2">
        <Button full icon={CreditCard}>Pagar con tarjeta</Button>
        <Button full variant="text">Cancelar</Button>
      </div>
    </div>
  )
}

/* ---------- Toast ---------- */
export function Toast({ kind, text }: { kind: 'ok' | 'warn' | 'err' | 'info'; text: string }) {
  const m = { ok: [CheckCircle2, 'Éxito', 'border-ok bg-ok-bg text-ok'], warn: [Clock, 'Pendiente', 'border-warn bg-warn-bg text-warn'], err: [XCircle, 'Error', 'border-err bg-err-bg text-err'], info: [Info, 'Información', 'border-info bg-info-bg text-info'] }[kind] as [Icon, string, string]
  const I = m[0]
  return (
    <div role="status" className={cx('flex min-h-12 items-start gap-3 rounded-btn border-l-4 p-3 shadow-md', m[2])}>
      <I size={20} className="mt-0.5 shrink-0" aria-hidden />
      <p className="flex-1 font-medium"><strong>{m[1]}: </strong>{text}</p>
      <button aria-label="Cerrar" className="grid size-11 -m-2 place-items-center"><X size={18} /></button>
    </div>
  )
}

/* ---------- Estado vacío y skeleton ---------- */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-g300 px-6 py-10 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-g100"><CalendarX size={28} aria-hidden /></span>
      <h3 className="text-[18px] font-bold">Aún no tienes clases</h3>
      <p className="max-w-64 text-g600">Busca un Tutor y reserva tu primera clase en Mérida o en línea.</p>
      <Button icon={Search}>Buscar tutores</Button>
    </div>
  )
}
export function SkeletonCard() {
  return (
    <div className="flex gap-3 rounded-card border border-g200 p-4" role="status" aria-label="Cargando tutores">
      <div className="skel size-14 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skel h-4 w-2/3 rounded" /><div className="skel h-4 w-1/2 rounded" /><div className="skel h-10 w-full rounded-btn" />
      </div>
    </div>
  )
}

/* ---------- Admin ---------- */
export function Sidebar() {
  const items: [string, Icon][] = [['Panel', LayoutDashboard], ['Usuarios', Users], ['Reservas', ClipboardList], ['Pagos', CreditCard], ['Disputas', Gavel], ['Verificaciones', ShieldCheck], ['Configuración', Settings]]
  return (
    <aside className="flex w-64 flex-col gap-1 rounded-card bg-ink p-4 text-white">
      <p className="mb-4 px-3 text-[18px] font-bold">TutorClick <span className="text-[12px] font-medium text-g300">Admin</span></p>
      {items.map(([l, I], i) => (
        <a key={l} href="#" aria-current={i === 3 ? 'page' : undefined}
          className={cx('flex min-h-11 items-center gap-3 rounded-btn px-3 font-medium', i === 3 ? 'bg-white text-ink font-semibold' : 'text-g200 hover:bg-g700')}>
          <I size={20} aria-hidden />{l}
          {i === 4 && <span className="ml-auto rounded-full bg-err-bg px-2 text-[12px] font-bold text-err">3</span>}
          {i === 3 && <ChevronRight size={16} className="ml-auto" aria-hidden />}
        </a>
      ))}
    </aside>
  )
}
export function AdminTable() {
  const rows: [string, string, string, string, string, ChipKey][] = [
    ['PAG-7001', 'Sofía Mena', 'Carlos Chan', '$275.00 MXN', '$37.50 MXN', 'Retenido'],
    ['PAG-7002', 'Mateo Fernández', 'Luis Pérez', '$220.00 MXN', '$30.00 MXN', 'Liberado'],
    ['PAG-7003', 'Camila Soto', 'Valeria Ortiz', '$330.00 MXN', '$45.00 MXN', 'En disputa'],
  ]
  const th = 'px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-g600'
  return (
    <div className="overflow-hidden rounded-card border border-g200 bg-white">
      <table className="w-full text-[14px]">
        <caption className="sr-only">Pagos recientes</caption>
        <thead className="bg-g100"><tr>{['Pago', 'Alumno', 'Tutor', 'Total cobrado', 'Comisión', 'Estado'].map((h) => <th key={h} scope="col" className={th}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-g200">
          {rows.map((r) => (
            <tr key={r[0]} className="h-14 hover:bg-g50">
              <td className="px-4 font-semibold">{r[0]}</td><td className="px-4">{r[1]}</td><td className="px-4">{r[2]}</td>
              <td className="px-4 tabular-nums">{r[3]}</td><td className="px-4 tabular-nums">{r[4]}</td><td className="px-4"><StatusChip status={r[5]} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
export function Phone({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-[12px] font-semibold text-g600">{label}</figcaption>
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-card border border-g200 bg-white">{children}</div>
    </figure>
  )
}
