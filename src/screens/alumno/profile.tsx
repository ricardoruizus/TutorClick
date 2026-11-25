import { useState, type ReactNode } from 'react'
import {
  ChevronLeft, Heart, Star, MapPin, Video, Shuffle, BadgeCheck, MessageCircle, CalendarDays, CalendarX, Bell, Check,
  Sparkles, GraduationCap, Clock, MessageSquareOff, Info,
} from 'lucide-react'
import { Button, StatusChip, Avatar } from '../../components/ui/ds'
import { CARLOS, JORGE, LUIS } from '../../data/mock'
import type { ProfileViewData as Profile } from '../../types'

const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(' ')
const money = (n: number) => `$${n.toFixed(2)} MXN`

function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${n} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= Math.round(n) ? 'fill-ink' : 'text-g300'} aria-hidden />)}
    </span>
  )
}
const H = ({ children, id }: { children: ReactNode; id: string }) => <h2 id={id} className="mb-3 text-[18px] font-bold">{children}</h2>
const Sec = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section aria-labelledby={id} className="border-t border-g200 px-5 py-5"><H id={id}>{title}</H>{children}</section>
)

function ReviewsBlock({ p, uid }: { p: Profile; uid: string }) {
  const [filter, setFilter] = useState<number>(0)
  if (p.reviewCount === 0)
    return (
      <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-g300 px-5 py-8 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-g100"><MessageSquareOff size={26} aria-hidden /></span>
        <h3 className="text-[16px] font-bold">Aún no tiene reseñas</h3>
        <p className="text-g600">{p.first} es nuevo en TutorClick. Las reseñas aparecen después de que los Alumnos terminan su primera clase.</p>
      </div>
    )
  const shown = filter ? p.reviews.filter((r) => r.stars === filter) : p.reviews
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-5">
        <div className="text-center">
          <p className="text-[40px] font-bold leading-none">{p.rating.toFixed(1)}</p>
          <Stars n={p.rating} /><p className="text-g600">{p.reviewCount} reseñas</p>
        </div>
        <ul className="flex flex-1 flex-col gap-1.5" aria-label="Reseñas por puntuación">
          {[5, 4, 3, 2, 1].map((s, i) => (
            <li key={s} className="flex items-center gap-2 text-[14px]">
              <span className="flex w-8 items-center gap-0.5 font-semibold">{s}<Star size={12} className="fill-ink" aria-hidden /></span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-g200"><span className="block h-full rounded-full bg-ink" style={{ width: `${(p.dist[i] / p.reviewCount) * 100}%` }} /></span>
              <span className="w-6 text-right text-g700">{p.dist[i]}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Filtrar reseñas por puntuación">
        {[0, 5, 4, 3, 2, 1].map((s) => (
          <button key={s} aria-pressed={filter === s} onClick={() => setFilter(s)}
            className={cx('inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-[14px] font-semibold', filter === s ? 'border-ink bg-ink text-white' : 'border-g300')}>
            {filter === s && <Check size={16} aria-hidden />}{s === 0 ? 'Todas' : <>{s}<Star size={14} className="fill-current" aria-hidden /></>}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3" aria-live="polite">
        {shown.length === 0 && (
          <p className="flex items-start gap-2 rounded-btn bg-g100 p-3 text-g700"><Info size={18} className="mt-0.5 shrink-0" aria-hidden />No hay reseñas de {filter} {filter === 1 ? 'estrella' : 'estrellas'} entre las más recientes. Toca "Ver todas" para revisar las {p.reviewCount}.</p>
        )}
        {shown.map((r) => (
          <article key={r.name} className="rounded-card border border-g200 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={r.name} size={44} />
              <div className="flex-1"><p className="font-semibold">{r.name}</p><p className="text-g600">{r.when} · {r.subject}</p></div>
            </div>
            <div className="mt-2 flex items-center gap-2"><Stars n={r.stars} /><span className="font-semibold">{r.stars}.0</span></div>
            <p className="mt-1">{r.text}</p>
          </article>
        ))}
      </div>
      <Button variant="secondary" full>Ver todas las reseñas ({p.reviewCount})</Button>
    </div>
  )
}

export function TutorProfile({
  p,
  label = 'Perfil del tutor',
  embedded,
  fav: controlledFav,
  onToggleFav,
  onBack,
  onBook,
  onMessage,
  onPickSlot,
}: {
  p: Profile
  label?: string
  embedded?: boolean
  fav?: boolean
  onToggleFav?: () => void
  onBack?: () => void
  onBook?: (pickedSlot: string | null) => void
  onMessage?: () => void
  onPickSlot?: (slotLabel: string | null) => void
}) {
  const [localFav, setLocalFav] = useState(false)
  const fav = controlledFav ?? localFav
  const toggleFav = () => {
    if (onToggleFav) onToggleFav()
    else setLocalFav(!localFav)
  }
  const [slot, setSlot] = useState<string | null>(p.slots[0] ?? null)
  const [notify, setNotify] = useState(false)
  const noSlots = p.slots.length === 0
  const Mode = p.modeIcon
  const inner = (
    <div
      className={cx(
        'flex w-full flex-col overflow-hidden bg-white',
        embedded ? 'h-full' : 'h-[844px] w-[390px] max-w-full rounded-[28px] border-4 border-ink',
      )}
    >
      <header className="flex h-14 shrink-0 items-center border-b border-g200 px-2">
        <button type="button" onClick={onBack} aria-label="Volver" className="grid size-11 place-items-center rounded-full hover:bg-g100"><ChevronLeft size={24} /></button>
        <h1 className="flex-1 text-[16px] font-semibold">Perfil del tutor</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-5 pt-4">
          <div className="flex gap-4">
            {p.photo ? (
              <img src={p.photo} alt={`Foto de ${p.name}`} className="size-24 shrink-0 rounded-card bg-g200 object-cover" />
            ) : (
              <span className="grid size-24 shrink-0 place-items-center rounded-card bg-g200 text-[24px] font-bold text-g700" aria-hidden>
                {p.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <h2 className="text-[22px] font-bold leading-7">{p.name}</h2>
                <button type="button" onClick={toggleFav} aria-pressed={fav} aria-label={fav ? `Quitar a ${p.name} de favoritos` : `Guardar a ${p.name} en favoritos`}
                  className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-full hover:bg-g100"><Heart size={24} className={fav ? 'fill-ink' : ''} aria-hidden /></button>
              </div>
              <div className="mb-1.5">{p.verified ? <StatusChip status="Verificado" /> : <StatusChip status="En revisión" />}</div>
              {p.reviewCount > 0
                ? <p className="flex items-center gap-1 font-semibold"><Star size={16} className="fill-ink" aria-hidden />{p.rating.toFixed(1)}<span className="font-normal text-g600">({p.reviewCount} reseñas)</span></p>
                : <p className="flex items-center gap-1.5 font-semibold"><Sparkles size={16} aria-hidden />Nuevo en TutorClick</p>}
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-1 gap-2 rounded-card bg-g100 p-4">
            <div className="flex items-center justify-between"><dt className="text-g600">Tarifa</dt><dd className="text-[18px] font-bold">{money(p.rate)}<span className="text-[14px] font-normal text-g600">/h</span></dd></div>
            <div className="flex items-center justify-between"><dt className="text-g600">Modalidad</dt><dd className="flex items-center gap-1.5 font-semibold"><Mode size={16} aria-hidden />{p.modes}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-g600">Zona</dt><dd className="flex items-center gap-1.5 font-semibold"><MapPin size={16} aria-hidden />{p.zone}</dd></div>
          </dl>
        </div>

        <Sec id={`${label}-a`} title="Acerca de"><p className="text-[16px]">{p.about}</p></Sec>

        <Sec id={`${label}-m`} title="Materias y nivel">
          <ul className="flex flex-col gap-3">
            {p.subjects.map(([s, lv]) => (
              <li key={s} className="flex flex-col gap-2">
                <span className="flex items-center gap-2 font-semibold"><GraduationCap size={18} aria-hidden />{s}</span>
                <span className="flex flex-wrap gap-2">{lv.map((l) => <span key={l} className="inline-flex min-h-7 items-center rounded-full bg-g200 px-3 font-medium text-g700">{l}</span>)}</span>
              </li>
            ))}
          </ul>
        </Sec>

        <Sec id={`${label}-t`} title="Títulos">
          {p.degrees.length > 0 ? <ul className="flex flex-col gap-3">
            {p.degrees.map((d) => (
              <li key={d.t} className="rounded-card border border-g200 p-4">
                <p className="font-semibold">{d.t}</p><p className="text-g600">{d.s}</p>
                {d.verified
                  ? <p className="mt-2 flex items-center gap-1.5 font-semibold text-ok"><BadgeCheck size={18} aria-hidden />Verificado por TutorClick</p>
                  : <p className="mt-2 flex items-center gap-1.5 font-semibold text-warn"><Clock size={18} aria-hidden />En revisión por TutorClick</p>}
              </li>
            ))}
          </ul> : <p className="text-g600">No hay títulos adicionales en el perfil.</p>}
        </Sec>

        <Sec id={`${label}-h`} title="Próximos horarios">
          {noSlots ? (
            <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-g300 px-5 py-6 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-g100"><CalendarX size={26} aria-hidden /></span>
              <h3 className="text-[16px] font-bold">Sin horarios próximos</h3>
              <p className="text-g600">La disponibilidad de horarios todavía no está conectada. Por ahora no puedes reservar.</p>
              <Button variant="secondary" icon={notify ? Check : Bell} onClick={() => setNotify(!notify)} aria-pressed={notify}>{notify ? 'Aviso activado en esta sesión' : 'Avisarme cuando haya'}</Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Horarios disponibles">
                {p.slots.map((s) => {
                  const on = slot === s
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        const next = on ? null : s
                        setSlot(next)
                        onPickSlot?.(next)
                      }}
                      className={cx('inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-[14px] font-semibold', on ? 'border-ink bg-ink text-white' : 'border-g500')}
                    >
                      {on ? <Check size={16} aria-hidden /> : <CalendarDays size={16} aria-hidden />}{s}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-g600"><Clock size={16} aria-hidden />Hora de Mérida (UTC-6)</p>
              <Button variant="text" className="mt-1 -ml-3" onClick={() => onBook?.(slot)}>Ver calendario completo</Button>
            </>
          )}
        </Sec>

        <Sec id={`${label}-r`} title="Reseñas"><ReviewsBlock p={p} uid={label} /></Sec>
      </div>
      <div className="flex shrink-0 gap-3 border-t border-g200 bg-white px-4 pb-6 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,.06)]">
        <Button variant="secondary" icon={MessageCircle} className="flex-1 !px-3" onClick={onMessage}>Enviar mensaje</Button>
        <Button className="flex-1 !px-3" disabled={noSlots} onClick={() => onBook?.(slot)}>Reservar clase</Button>
      </div>
    </div>
  )

  if (embedded) return inner
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-[12px] font-semibold text-g600">{label}</figcaption>
      {inner}
    </figure>
  )
}
export type { Profile }
export { CARLOS, JORGE, LUIS }
