import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  MapPin, ChevronDown, ChevronLeft, ChevronRight, CalendarDays, Search, SlidersHorizontal, List, Map as MapIcon, Heart, Star, Video, Shuffle, X, Check,
  SearchX, WifiOff, RefreshCw, Locate, Route, ShieldCheck, Plus,
} from 'lucide-react'
import { Button, StatusChip, BottomNav, studentNav, Toast } from '../../components/ui/ds'
import { CATALOG_SUBJECTS as SUBJECTS, SEARCH_TUTORS as TUTORS } from '../../data/mock'
import type { ClassMode as Mode, SearchTutorSummary as Tutor } from '../../types'

const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(' ')
const money = (n: number) => `$${n.toFixed(2)} MXN`
const MODES = ['Todas', 'Presencial', 'En línea', 'Híbrida'] as const

export interface Filters { subjects: string[]; min: number; max: number; mode: (typeof MODES)[number]; rating: number; km: number; verified: boolean }
export const DEFAULTS: Filters = { subjects: [], min: 100, max: 500, mode: 'Todas', rating: 0, km: 20, verified: false }
const activeCount = (f: Filters) =>
  (f.subjects.length ? 1 : 0) + (f.min !== 100 || f.max !== 500 ? 1 : 0) + (f.mode !== 'Todas' ? 1 : 0) + (f.rating ? 1 : 0) + (f.km !== 20 ? 1 : 0) + (f.verified ? 1 : 0)

function apply(list: Tutor[], f: Filters, q: string) {
  const s = q.trim().toLowerCase()
  return list.filter((t) =>
    (!s || t.name.toLowerCase().includes(s) || t.subjects.some((x) => x.toLowerCase().includes(s))) &&
    (!f.subjects.length || t.subjects.some((x) => f.subjects.includes(x))) &&
    t.rate >= f.min && t.rate <= f.max &&
    (f.mode === 'Todas' || (f.mode === 'Híbrida' ? t.modes.length === 2 : t.modes.includes(f.mode))) &&
    t.rating >= f.rating && (t.km === null || t.km <= f.km) && (!f.verified || t.verified))
}
const plural = (n: number) => `${n} ${n === 1 ? 'Tutor' : 'Tutores'}`

/* ---------- Tarjeta de tutor (búsqueda) ---------- */
function ModeLabel({ modes }: { modes: Mode[] }) {
  const both = modes.length === 2
  const I = both ? Shuffle : modes[0] === 'Presencial' ? MapPin : Video
  return <span className="flex items-center gap-1.5"><I size={16} aria-hidden />{both ? 'Presencial y en línea' : modes[0]}</span>
}
function TutorResult({
  t,
  fav,
  onFav,
  onSelect,
}: {
  t: Tutor
  fav: boolean
  onFav: () => void
  onSelect?: () => void
}) {
  return (
    <article
      onClick={onSelect}
      className={cx(
        'rounded-card border border-g200 bg-white p-3 shadow-sm transition-colors duration-200',
        onSelect && 'cursor-pointer hover:border-ink',
      )}
    >
      <div className="flex gap-3">
        <img src={t.photo} alt={`Foto de ${t.name}`} className="size-20 shrink-0 rounded-btn bg-g200 object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3 className="truncate text-[16px] font-semibold leading-6">
                {onSelect ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect()
                    }}
                    className="text-left hover:underline"
                  >
                    {t.name}
                  </button>
                ) : (
                  t.name
                )}
              </h3>
              <p className="text-g600">{t.subjects[0]}{t.subjects.length > 1 && <span> +{t.subjects.length - 1}</span>}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onFav()
              }}
              aria-pressed={fav}
              aria-label={fav ? `Quitar a ${t.name} de favoritos` : `Guardar a ${t.name} en favoritos`}
              className="-mr-1 -mt-1 grid size-11 shrink-0 place-items-center rounded-full hover:bg-g100"
            >
              <Heart size={22} className={fav ? 'fill-ink' : ''} aria-hidden />
            </button>
          </div>
          <p className="flex items-center gap-1 font-medium"><Star size={16} className="fill-ink" aria-hidden />{t.rating.toFixed(1)}<span className="font-normal text-g600">({t.reviews} reseñas)</span></p>
        </div>
      </div>
      {t.verified && <div className="mt-2"><StatusChip status="Verificado" /></div>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-g200 pt-3">
        <p className="text-[16px] font-bold">{money(t.rate)}<span className="font-normal text-g600">/h</span></p>
        <div className="flex flex-col items-end text-g700">
          <ModeLabel modes={t.modes} />
          <span className="flex items-center gap-1.5"><Route size={16} aria-hidden />{t.km === null ? 'Sin distancia' : `${t.km.toFixed(1)} km`}</span>
        </div>
      </div>
    </article>
  )
}

/* ---------- Filtros ---------- */
const Group = ({ title, extra, children }: { title: string; extra?: string; children: ReactNode }) => (
  <fieldset className="border-b border-g200 py-4">
    <div className="mb-3 flex items-baseline justify-between"><legend className="text-[16px] font-semibold">{title}</legend>{extra && <span className="font-semibold text-g700">{extra}</span>}</div>
    {children}
  </fieldset>
)
function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cx('inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-[14px] font-semibold', on ? 'border-ink bg-ink text-white' : 'border-g300 bg-white text-ink')}>
      {on && <Check size={16} aria-hidden />}{children}
    </button>
  )
}
function FilterSheet({ draft, setDraft, count, onClose, onApply }: { draft: Filters; setDraft: (f: Filters) => void; count: number; onClose: () => void; onApply: () => void }) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setDraft({ ...draft, [k]: v })
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/50">
      <div role="dialog" aria-modal aria-label="Filtros" className="flex max-h-[88%] flex-col rounded-t-3xl bg-white">
        <div className="px-5 pt-3">
          <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-g300" />
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold">Filtros</h2>
            <button onClick={onClose} aria-label="Cerrar filtros" className="-mr-2 grid size-11 place-items-center rounded-full hover:bg-g100"><X size={22} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          <Group title="Materia">
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => <Pill key={s} on={draft.subjects.includes(s)} onClick={() => set('subjects', draft.subjects.includes(s) ? draft.subjects.filter((x) => x !== s) : [...draft.subjects, s])}>{s}</Pill>)}
            </div>
          </Group>
          <Group title="Tarifa por hora" extra={`${money(draft.min)} a ${money(draft.max)}`}>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-g700" htmlFor="tmin">Mínima</label>
              <input id="tmin" type="range" min={100} max={500} step={50} value={draft.min} onChange={(e) => set('min', Math.min(+e.target.value, draft.max))} className="h-11 w-full accent-ink" />
              <label className="text-[12px] font-semibold text-g700" htmlFor="tmax">Máxima</label>
              <input id="tmax" type="range" min={100} max={500} step={50} value={draft.max} onChange={(e) => set('max', Math.max(+e.target.value, draft.min))} className="h-11 w-full accent-ink" />
            </div>
          </Group>
          <Group title="Modalidad">
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {MODES.map((m) => (
                <button key={m} role="radio" aria-checked={draft.mode === m} onClick={() => set('mode', m)}
                  className={cx('inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-[14px] font-semibold', draft.mode === m ? 'border-ink bg-ink text-white' : 'border-g300')}>
                  {draft.mode === m && <Check size={16} aria-hidden />}{m}
                </button>
              ))}
            </div>
          </Group>
          <Group title="Calificación mínima">
            <div className="flex flex-wrap gap-2">
              {[0, 4, 4.5, 4.8].map((r) => (
                <Pill key={r} on={draft.rating === r} onClick={() => set('rating', r)}>{r === 0 ? 'Todas' : <><Star size={14} className="fill-current" aria-hidden />{r.toFixed(1)} o más</>}</Pill>
              ))}
            </div>
          </Group>
          <Group title="Distancia" extra={draft.km === 20 ? 'Sin límite' : `Hasta ${draft.km} km`}>
            <label className="sr-only" htmlFor="km">Distancia máxima en kilómetros</label>
            <input id="km" type="range" min={1} max={20} step={1} value={draft.km} onChange={(e) => set('km', +e.target.value)} className="h-11 w-full accent-ink" />
            <div className="flex justify-between text-[14px] text-g600"><span>1 km</span><span>20 km</span></div>
          </Group>
          <div className="flex min-h-14 items-center justify-between gap-3 py-3">
            <div><p className="flex items-center gap-1.5 text-[16px] font-semibold"><ShieldCheck size={18} aria-hidden />Solo verificados</p><p className="text-g600">Tutores con identidad confirmada</p></div>
            <button role="switch" aria-checked={draft.verified} onClick={() => set('verified', !draft.verified)}
              className={cx('flex min-h-11 w-[84px] shrink-0 items-center gap-1 rounded-full border-2 px-1', draft.verified ? 'border-ink bg-ink text-white' : 'border-g500 bg-white')}>
              {draft.verified ? <><span className="flex-1 pl-2 text-[14px] font-semibold">Sí</span><span className="grid size-8 place-items-center rounded-full bg-white text-ink"><Check size={16} /></span></>
                : <><span className="grid size-8 place-items-center rounded-full bg-g200"><X size={16} /></span><span className="flex-1 pr-2 text-right text-[14px] font-semibold">No</span></>}
            </button>
          </div>
        </div>
        <div className="flex gap-3 border-t border-g200 px-5 pb-6 pt-4">
          <Button variant="secondary" onClick={() => setDraft(DEFAULTS)}>Limpiar</Button>
          <Button full onClick={onApply}>Aplicar · {plural(count)}</Button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Mapa ilustrativo ---------- */
function MapView({
  list,
  fav,
  setFav,
  onSelectTutor,
}: {
  list: Tutor[]
  fav: string[]
  setFav: (id: string) => void
  onSelectTutor?: (id: string) => void
}) {
  const pinned = list.filter((t) => t.pin)
  const [sel, setSel] = useState(pinned[0]?.id)
  const cur = pinned.find((t) => t.id === sel) ?? pinned[0]
  return (
    <div className="relative flex-1 overflow-hidden bg-[#eceff1]" role="region" aria-label="Mapa de Tutores en Mérida">
      <svg className="absolute inset-0 size-full" viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect x="250" y="40" width="110" height="90" rx="14" fill="#d7e6d3" />
        <rect x="20" y="380" width="130" height="80" rx="14" fill="#d7e6d3" />
        <path d="M-10 200 L400 150 M-10 330 L400 360 M110 -10 L150 570 M280 -10 L240 570" stroke="#fff" strokeWidth="14" fill="none" />
        <path d="M-10 90 L400 70 M-10 450 L400 470 M30 -10 L60 570 M340 -10 L350 570" stroke="#fff" strokeWidth="7" fill="none" />
        <path d="M-10 270 Q200 230 400 280" stroke="#d4d4d8" strokeWidth="3" fill="none" strokeDasharray="6 6" />
      </svg>
      <p className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[14px] font-semibold shadow"><MapPin size={16} aria-hidden />{plural(pinned.length)} cerca · zona norte</p>
      <span className="absolute grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white bg-info shadow" style={{ left: '44%', top: '48%' }} role="img" aria-label="Tu ubicación" />
      {pinned.map((t) => {
        const on = t.id === cur?.id
        return (
          <button key={t.id} onClick={() => setSel(t.id)} aria-pressed={on} aria-label={`${t.name}, ${money(t.rate)} por hora`}
            style={{ left: `${t.pin![0]}%`, top: `${t.pin![1]}%` }}
            className={cx('absolute flex min-h-11 min-w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1 rounded-full border-2 px-3 text-[14px] font-bold shadow-md', on ? 'z-10 scale-110 border-ink bg-ink text-white' : 'border-ink bg-white text-ink')}>
            {on && <Check size={14} aria-hidden />}${t.rate}
          </button>
        )
      })}
      <button aria-label="Centrar en mi ubicación" className="absolute right-3 top-3 grid size-12 place-items-center rounded-full bg-white shadow"><Locate size={22} /></button>
      <div className="absolute right-3 top-[72px] flex flex-col overflow-hidden rounded-btn bg-white shadow">
        <button aria-label="Acercar" className="grid size-11 place-items-center border-b border-g200"><Plus size={20} /></button>
        <button aria-label="Alejar" className="grid size-11 place-items-center"><span className="h-0.5 w-4 bg-ink" /></button>
      </div>
      <p className="absolute bottom-[190px] left-3 rounded bg-white/80 px-1.5 text-[12px] text-g700">Mapa ilustrativo</p>
      {cur && (
        <div className="absolute inset-x-3 bottom-3">
          <TutorResult
            t={cur}
            fav={fav.includes(cur.id)}
            onFav={() => setFav(cur.id)}
            onSelect={onSelectTutor ? () => onSelectTutor(cur.id) : undefined}
          />
        </div>
      )}
    </div>
  )
}

/* ---------- Estados ---------- */
function SkeletonResult() {
  return (
    <div className="rounded-card border border-g200 bg-white p-3">
      <div className="flex gap-3">
        <div className="skel size-20 shrink-0 rounded-btn" />
        <div className="flex flex-1 flex-col gap-2"><div className="skel h-5 w-2/3 rounded" /><div className="skel h-4 w-1/2 rounded" /><div className="skel h-4 w-1/3 rounded" /></div>
      </div>
      <div className="skel mt-3 h-7 w-28 rounded-full" />
      <div className="mt-3 flex justify-between border-t border-g200 pt-3"><div className="skel h-5 w-24 rounded" /><div className="skel h-5 w-32 rounded" /></div>
    </div>
  )
}

/* ---------- Pantalla Buscar ---------- */
export type ScreenMode = 'list' | 'map' | 'loading' | 'empty' | 'offline'
export function SearchScreen({
  label = 'Buscar',
  initial = 'list',
  sheet = false,
  filters = DEFAULTS,
  query = '',
  embedded,
  favorites,
  onToggleFavorite,
  onSelectTutor,
  onTabSelect,
  onBack,
  appliedFilters,
  onChangeFilters,
  upcomingBanner,
}: {
  label?: string
  initial?: ScreenMode
  sheet?: boolean
  filters?: Filters
  query?: string
  embedded?: boolean
  favorites?: string[]
  onToggleFavorite?: (id: string) => void
  onSelectTutor?: (id: string) => void
  onTabSelect?: (index: number) => void
  onBack?: () => void
  appliedFilters?: Filters
  onChangeFilters?: (f: Filters) => void
  upcomingBanner?: { text: string; onClick?: () => void } | null
}) {
  const [mode, setMode] = useState<ScreenMode>(initial)
  const [view, setView] = useState<'list' | 'map'>(initial === 'map' ? 'map' : 'list')
  const [open, setOpen] = useState(sheet)
  const [localApplied, setLocalApplied] = useState<Filters>(filters)
  const applied = appliedFilters ?? localApplied
  const setApplied = (next: Filters) => {
    setLocalApplied(next)
    onChangeFilters?.(next)
  }
  const [draft, setDraft] = useState<Filters>(applied)
  const [q, setQ] = useState(query)
  const [localFav, setLocalFavs] = useState<string[]>([])
  const fav = favorites ?? localFav
  const toggleFav = (id: string) => {
    if (onToggleFavorite) onToggleFavorite(id)
    else setLocalFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
  }
  const [retrying, setRetrying] = useState(false)
  const [recovered, setRecovered] = useState(false)
  useEffect(() => {
    const handleOffline = () => setMode('offline')
    window.addEventListener('offline', handleOffline)
    return () => window.removeEventListener('offline', handleOffline)
  }, [])
  useEffect(() => {
    if (!retrying) return
    const id = setTimeout(() => {
      setRetrying(false)
      if (navigator.onLine) {
        setMode('list')
        setRecovered(true)
        window.setTimeout(() => setRecovered(false), 2200)
      }
    }, 1200)
    return () => clearTimeout(id)
  }, [retrying])

  const results = useMemo(() => apply(TUTORS, applied, q), [applied, q])
  const draftCount = useMemo(() => apply(TUTORS, draft, q).length, [draft, q])
  const eff: ScreenMode = mode === 'offline' || mode === 'loading' ? mode : results.length === 0 ? 'empty' : view
  const n = activeCount(applied)
  const offline = eff === 'offline'

  const content = (
    <div
      className={cx(
        'relative flex w-full flex-col overflow-hidden bg-white',
        embedded ? 'h-full' : 'h-[844px] w-[390px] max-w-full rounded-[28px] border-4 border-ink',
      )}
    >
      {offline && (
        <div role="alert" className="flex items-center gap-2 bg-warn-bg px-4 py-2 font-semibold text-warn"><WifiOff size={18} aria-hidden />Sin conexión. Mostrando datos guardados.</div>
      )}
      <header className="flex flex-col gap-3 border-b border-g200 bg-white px-4 pb-3 pt-3">
        <div className="flex items-center gap-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver"
              className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full hover:bg-g100"
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
          )}
          <button type="button" className="flex min-h-11 items-center gap-2 rounded-btn pr-2 text-[16px] font-bold hover:bg-g100" aria-label="Ciudad: Mérida, Yucatán. Cambiar ciudad">
            <MapPin size={20} aria-hidden />Mérida, Yucatán<ChevronDown size={18} aria-hidden />
          </button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-g600" aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} disabled={offline} placeholder="Materia o nombre del Tutor" aria-label="Buscar Tutor o materia"
              className="min-h-12 w-full rounded-btn border border-g500 bg-white pl-11 pr-3 text-[14px] outline-none placeholder:text-g600 focus:border-ink focus:ring-4 focus:ring-ink/15 disabled:bg-g100" />
          </div>
          <button type="button" onClick={() => { setDraft(applied); setOpen(true) }} disabled={offline} aria-label={`Filtros${n ? `, ${n} activos` : ''}`}
            className="relative grid size-12 shrink-0 place-items-center rounded-btn border-2 border-ink hover:bg-g100 disabled:border-g300 disabled:text-g500">
            <SlidersHorizontal size={22} aria-hidden />
            {n > 0 && <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-ink text-[12px] font-bold text-white ring-2 ring-white">{n}</span>}
          </button>
        </div>
        <div role="tablist" aria-label="Vista de resultados" className="grid grid-cols-2 gap-1 rounded-btn bg-g100 p-1">
          {([['list', 'Lista', List], ['map', 'Mapa', MapIcon]] as const).map(([k, l, I]) => {
            const on = view === k
            return (
              <button key={k} type="button" role="tab" aria-selected={on} disabled={offline} onClick={() => { setView(k); if (mode === 'map' || mode === 'list') setMode(k) }}
                className={cx('flex min-h-11 items-center justify-center gap-2 rounded-[10px] text-[14px] font-semibold disabled:text-g500', on ? 'bg-ink text-white' : 'text-ink')}>
                <I size={18} aria-hidden />{l}
              </button>
            )
          })}
        </div>
      </header>
      {recovered && <div className="absolute inset-x-4 top-16 z-40"><Toast kind="ok" text="Conexión restablecida. Tutores actualizados." /></div>}
      {!offline && upcomingBanner && (
        <button
          type="button"
          onClick={upcomingBanner.onClick}
          className="flex items-center gap-2.5 border-b border-info/30 bg-info-bg px-4 py-2.5 text-left text-[13px] font-semibold text-info hover:brightness-95"
        >
          <CalendarDays size={18} className="shrink-0" aria-hidden />
          <span className="flex-1">{upcomingBanner.text}</span>
          <ChevronRight size={17} className="shrink-0" aria-hidden />
        </button>
      )}

      {eff === 'list' && (
        <div className="flex-1 overflow-y-auto bg-g50 px-4 py-3">
          {upcomingBanner && (
            <button
              type="button"
              onClick={upcomingBanner.onClick}
              className="mb-3 flex min-h-12 w-full items-center gap-2.5 rounded-card border border-info bg-info-bg px-3.5 py-2.5 text-left text-[14px] font-semibold text-info transition-colors duration-200 hover:brightness-95"
            >
              <CalendarDays size={18} className="shrink-0" aria-hidden />
              <span className="flex-1">{upcomingBanner.text}</span>
              <ChevronRight size={18} className="shrink-0" aria-hidden />
            </button>
          )}
          <p className="mb-3 font-semibold" aria-live="polite">{plural(results.length)} en Mérida{n > 0 && <span className="font-normal text-g600"> · {n} {n === 1 ? 'filtro' : 'filtros'}</span>}</p>
          <div className="flex flex-col gap-3">
            {results.map((t) => (
              <TutorResult
                key={t.id}
                t={t}
                fav={fav.includes(t.id)}
                onFav={() => toggleFav(t.id)}
                onSelect={onSelectTutor ? () => onSelectTutor(t.id) : undefined}
              />
            ))}
          </div>
        </div>
      )}
      {eff === 'map' && <MapView list={results} fav={fav} setFav={toggleFav} onSelectTutor={onSelectTutor} />}
      {eff === 'loading' && (
        <div className="flex-1 overflow-hidden bg-g50 px-4 py-3" role="status" aria-label="Buscando Tutores">
          <p className="mb-3 flex items-center gap-2 font-semibold text-g700"><RefreshCw size={16} className="animate-spin" aria-hidden />Buscando Tutores en Mérida…</p>
          <div className="flex flex-col gap-3"><SkeletonResult /><SkeletonResult /><SkeletonResult /></div>
        </div>
      )}
      {eff === 'empty' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-g50 px-8 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-g200"><SearchX size={30} aria-hidden /></span>
          {TUTORS.length === 0 ? (
            <>
              <h2 className="text-[20px] font-bold">Todavía no hay tutores publicados</h2>
              <p className="text-g600">Cuando haya perfiles disponibles, aparecerán aquí.</p>
            </>
          ) : (
            <>
              <h2 className="text-[20px] font-bold">No encontramos tutores</h2>
              <p className="text-g600">Prueba ampliar tus filtros:</p>
              <ul className="flex flex-col gap-1 text-left text-g700">
                <li className="flex items-center gap-2"><Check size={16} aria-hidden />Aumenta la distancia</li>
                <li className="flex items-center gap-2"><Check size={16} aria-hidden />Baja la calificación mínima</li>
                <li className="flex items-center gap-2"><Check size={16} aria-hidden />Quita "Solo verificados" o cambia la modalidad</li>
              </ul>
              <div className="mt-2 flex w-full flex-col gap-2">
                <Button full icon={SlidersHorizontal} onClick={() => setApplied({ ...applied, km: 20, rating: 0, verified: false, mode: 'Todas', min: 100, max: 500 })}>Ampliar filtros</Button>
                <Button full variant="text" onClick={() => { setApplied(DEFAULTS); setQ(''); setMode('list') }}>Limpiar todo</Button>
              </div>
            </>
          )}
        </div>
      )}
      {eff === 'offline' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-g50 px-8 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-warn-bg text-warn"><WifiOff size={30} aria-hidden /></span>
          <h2 className="text-[20px] font-bold">Sin conexión a internet</h2>
          <p className="text-g600">Revisa tu Wi‑Fi o tus datos móviles e inténtalo de nuevo. Tus favoritos guardados siguen disponibles.</p>
          <Button loading={retrying} icon={RefreshCw} onClick={() => setRetrying(true)}>Reintentar</Button>
        </div>
      )}

      <BottomNav items={studentNav} active={0} onSelect={onTabSelect} />
      {open && <FilterSheet draft={draft} setDraft={setDraft} count={draftCount} onClose={() => setOpen(false)} onApply={() => { setApplied(draft); setOpen(false) }} />}
    </div>
  )

  if (embedded) return content
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-[12px] font-semibold text-g600">{label}</figcaption>
      {content}
    </figure>
  )
}
