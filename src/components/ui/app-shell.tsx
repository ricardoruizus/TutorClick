import type { ReactNode } from 'react'

const cx = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ')

/**
 * Marco principal de la app.
 *
 * En celular (<768px) ocupa toda la pantalla, como antes.
 * En tablet y computadora ocupa todo el ancho disponible hasta un máximo
 * centrado, sin el marco de teléfono de 390px, sin borde grueso ni esquinas
 * redondeadas. La altura sigue siendo la de la ventana para que las listas
 * con scroll y la navegación inferior sigan funcionando igual.
 */
export function AppShell({
  children,
  label,
  className,
}: {
  children: ReactNode
  label?: string
  className?: string
}) {
  return (
    <div
      aria-label={label}
      className={cx(
        'relative flex h-dvh w-full flex-col overflow-hidden bg-white',
        'md:mx-auto md:max-w-7xl md:border-x md:border-g200',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Indicador discreto de que los mensajes se actualizan solos. */
export function LiveBadge({ live }: { live: boolean }) {
  if (!live) return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-bg px-2.5 py-1 text-[12px] font-bold text-ok">
      <span className="size-2 rounded-full bg-ok" aria-hidden />
      En vivo
    </span>
  )
}
