import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react'
import { Button, Toast } from './ds'

type ListStateProps = {
  children: ReactNode
  count: number
  emptyTitle: string
  emptyDescription: string
  emptyAction?: string
  onEmptyAction?: () => void
  loadingLabel?: string
  skeletonRows?: number
  className?: string
}

export function ListState({
  children,
  count,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onEmptyAction,
  loadingLabel = 'Cargando contenido',
  skeletonRows = 3,
  className,
}: ListStateProps) {
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)
  const [retrying, setRetrying] = useState(false)
  const [recovered, setRecovered] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 550)
    const handleOffline = () => setOffline(true)
    const handleOnline = () => setOffline(false)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  function retry() {
    setRetrying(true)
    window.setTimeout(() => {
      const stillOffline = !navigator.onLine
      setOffline(stillOffline)
      setRetrying(false)
      if (!stillOffline) {
        setLoading(false)
        setRecovered(true)
        window.setTimeout(() => setRecovered(false), 2200)
      }
    }, 700)
  }

  return (
    <div className={className}>
      {recovered && <div className="fixed right-5 top-20 z-50 w-80 max-w-[calc(100%-2rem)]"><Toast kind="ok" text="Conexión restablecida. Contenido actualizado." /></div>}
      {loading && !offline ? (
        <div role="status" aria-label={loadingLabel} className="flex flex-col gap-3">
          {Array.from({ length: skeletonRows }, (_, index) => (
            <div key={index} className="rounded-card border border-g200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="skel size-12 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2"><div className="skel h-4 w-2/3 rounded" /><div className="skel h-3 w-1/2 rounded" /></div>
                <div className="skel h-7 w-24 rounded-full" />
              </div>
              <div className="skel mt-4 h-11 w-full rounded-btn" />
            </div>
          ))}
          <span className="sr-only">{loadingLabel}</span>
        </div>
      ) : offline ? (
        <div role="alert" className="flex flex-col items-center rounded-card border border-err bg-white px-6 py-10 text-center">
          <span className="relative grid size-20 place-items-center rounded-full bg-err-bg text-err">
            <span className="absolute -right-1 top-1 size-5 rounded-full border-4 border-white bg-err" />
            <AlertTriangle size={34} aria-hidden />
          </span>
          <h2 className="mt-4 text-[18px] font-bold">Sin conexión</h2>
          <p className="mt-1 max-w-sm text-g600">No pudimos cargar la información. Revisa tu conexión e inténtalo de nuevo.</p>
          <Button className="mt-4" icon={RefreshCw} loading={retrying} onClick={retry}>Reintentar</Button>
        </div>
      ) : count === 0 ? (
        <div className="flex flex-col items-center rounded-card border border-dashed border-g300 bg-white px-6 py-10 text-center">
          <span className="relative grid size-20 place-items-center rounded-full bg-g100 text-ink">
            <span className="absolute -bottom-1 -right-1 size-7 rounded-full border-4 border-white bg-g300" />
            <Inbox size={34} aria-hidden />
          </span>
          <h2 className="mt-4 text-[18px] font-bold">{emptyTitle}</h2>
          <p className="mt-1 max-w-sm text-g600">{emptyDescription}</p>
          {emptyAction && onEmptyAction && (
            <Button className="mt-4" onClick={onEmptyAction}>{emptyAction}</Button>
          )}
        </div>
      ) : children}
    </div>
  )
}
