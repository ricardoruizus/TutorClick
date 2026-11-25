import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Avatar, BottomNav, Button, StatusChip, TopBar, studentNav, tutorNav } from './ds'
import { ListState } from './list-state'
import type { ClassSession, ConversationThread, UserRole } from '../../types'
import { detectExternalContact } from '../../services/mensajes'
import { DAY_SHORT_LABELS, formatTimeChip } from '../../data/mock'

const cx = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ')

export type MessageFilter = 'all' | 'unread'

export function MessagesListScreen({
  role,
  threads,
  sessions,
  onOpenThread,
  error,
  isLoading = false,
  onFindTutor,
  onGoCalendar,
  onBack,
  onTabSelect,
  navItems: customNavItems,
  activeNavIndex = 2,
}: {
  role: UserRole
  threads: ConversationThread[]
  sessions: ClassSession[]
  onOpenThread: (threadId: string) => void
  error?: string | null
  isLoading?: boolean
  onFindTutor?: () => void
  onGoCalendar?: () => void
  onBack?: () => void
  onTabSelect: (idx: number) => void
  navItems?: typeof studentNav
  activeNavIndex?: number
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MessageFilter>('all')

  const navItems = customNavItems ?? (role === 'alumno' ? studentNav : tutorNav)
  const unreadTotal = useMemo(
    () =>
      threads.reduce(
        (sum, t) => sum + (role === 'alumno' ? t.unreadForStudent : t.unreadForTutor),
        0,
      ),
    [threads, role],
  )

  const visibleThreads = useMemo(() => {
    const q = query.trim().toLowerCase()
    return threads.filter((t) => {
      const unread = role === 'alumno' ? t.unreadForStudent : t.unreadForTutor
      if (filter === 'unread' && unread === 0) return false
      if (!q) return true
      const counterpart = role === 'alumno' ? t.tutorName : t.studentName
      const lastText = t.messages[t.messages.length - 1]?.text ?? ''
      return (
        counterpart.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.sessionId.toLowerCase().includes(q) ||
        lastText.toLowerCase().includes(q)
      )
    })
  }, [threads, role, filter, query])

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <TopBar title="Mensajes" back={!!onBack} onBack={onBack} />

      <div className="flex flex-col gap-2.5 border-b border-g200 bg-white px-4 py-3">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-g500"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              role === 'alumno'
                ? 'Buscar Tutor, materia o mensaje'
                : 'Buscar Alumno, materia o mensaje'
            }
            aria-label="Buscar en mensajes"
            className="min-h-11 w-full rounded-btn border border-g500 bg-white pl-10 pr-9 text-[14px] outline-none focus:border-ink focus:ring-4 focus:ring-ink/15"
          />
          {query && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => setQuery('')}
              className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-g600 hover:bg-g100"
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>

        <div role="group" aria-label="Filtrar conversaciones" className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
            className={cx(
              'flex min-h-11 items-center justify-center gap-1.5 rounded-full border-2 px-3 text-[14px] font-semibold',
              filter === 'all' ? 'border-ink bg-ink text-white' : 'border-g300 bg-white text-g700',
            )}
          >
            {filter === 'all' && <Check size={15} aria-hidden />}
            Todos ({threads.length})
          </button>
          <button
            type="button"
            aria-pressed={filter === 'unread'}
            onClick={() => setFilter('unread')}
            className={cx(
              'flex min-h-11 items-center justify-center gap-1.5 rounded-full border-2 px-3 text-[14px] font-semibold',
              filter === 'unread' ? 'border-ink bg-ink text-white' : 'border-g300 bg-white text-g700',
            )}
          >
            {filter === 'unread' && <Check size={15} aria-hidden />}
            No leídos ({unreadTotal})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-g50 px-4 py-3.5">
        <div
          role="note"
          className="mb-3 flex items-center gap-2.5 rounded-card border border-info bg-info-bg px-3.5 py-2.5 text-[12px] font-semibold text-info"
        >
          <ShieldCheck size={17} className="shrink-0" aria-hidden />
          <span>Mantén pagos y contacto dentro de TutorClick</span>
        </div>

        <ListState
          count={isLoading || error ? Math.max(visibleThreads.length, 1) : visibleThreads.length}
          emptyTitle={threads.length === 0 ? 'Aún no tienes mensajes' : filter === 'unread' ? 'No tienes mensajes sin leer' : 'Sin conversaciones para esta búsqueda'}
          emptyDescription={threads.length === 0 ? (role === 'alumno' ? 'Cuando reserves o escribas a un Tutor, tus conversaciones aparecerán aquí.' : 'Las conversaciones con tus Alumnos sobre clases confirmadas aparecerán aquí.') : 'Prueba con otro nombre o muestra todas tus conversaciones.'}
          emptyAction={threads.length === 0 ? (role === 'alumno' ? 'Buscar Tutor' : 'Ir al calendario') : 'Mostrar todos'}
          onEmptyAction={() => {
            if (threads.length === 0) {
              if (role === 'alumno') onFindTutor?.()
              else onGoCalendar?.()
            } else {
              setFilter('all')
              setQuery('')
            }
          }}
          loadingLabel="Cargando conversaciones"
        >
        {error && (
          <p role="alert" className="mb-3 rounded-btn border border-err bg-err-bg p-3 text-[13px] font-semibold text-err">
            {error}
          </p>
        )}
        {isLoading ? (
          <p role="status" className="rounded-card border border-g200 bg-white p-4 text-[14px] text-g600">
            Cargando conversaciones guardadas…
          </p>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-g300 bg-white px-6 py-10 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-g100 text-ink">
              <MessageCircle size={28} aria-hidden />
            </span>
            <h3 className="text-[18px] font-bold">Aún no tienes mensajes</h3>
            <p className="max-w-64 text-[14px] text-g600">
              {role === 'alumno'
                ? 'Cuando reserves o escribas a un Tutor, tus conversaciones aparecerán aquí.'
                : 'Las conversaciones con tus Alumnos sobre clases confirmadas aparecerán aquí.'}
            </p>
            {role === 'alumno' && onFindTutor ? (
              <Button icon={Search} onClick={onFindTutor}>
                Buscar Tutor
              </Button>
            ) : (
              onGoCalendar && (
                <Button variant="secondary" icon={CalendarDays} onClick={onGoCalendar}>
                  Ir al calendario
                </Button>
              )
            )}
          </div>
        ) : visibleThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-g300 bg-white px-6 py-10 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-g100 text-ink">
              <Search size={24} aria-hidden />
            </span>
            <h3 className="text-[16px] font-bold">
              {filter === 'unread' ? 'No tienes mensajes sin leer' : 'Sin conversaciones para esta búsqueda'}
            </h3>
            <p className="text-[14px] text-g600">
              Prueba con otro nombre o muestra todas tus conversaciones.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setFilter('all')
                setQuery('')
              }}
            >
              Mostrar todos
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {visibleThreads.map((thread) => {
              const counterpart = role === 'alumno' ? thread.tutorName : thread.studentName
              const unread = role === 'alumno' ? thread.unreadForStudent : thread.unreadForTutor
              const lastMsg = thread.messages[thread.messages.length - 1]
              const linkedSession = sessions.find((s) => s.id === thread.sessionId)

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => onOpenThread(thread.id)}
                  className={cx(
                    'flex w-full items-start gap-3 rounded-card border bg-white p-3.5 text-left shadow-sm transition-colors duration-200 hover:border-ink',
                    unread > 0 ? 'border-ink' : 'border-g200',
                  )}
                >
                  {role === 'alumno' && thread.tutorPhoto ? (
                    <img
                      src={thread.tutorPhoto}
                      alt={`Foto de ${counterpart}`}
                      className="size-12 shrink-0 rounded-full bg-g200 object-cover"
                    />
                  ) : (
                    <Avatar name={counterpart} size={48} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[16px] font-bold">{counterpart}</p>
                      <span className="shrink-0 text-[12px] font-medium text-g600">
                        {lastMsg?.time ?? ''}
                      </span>
                    </div>
                    <p className="text-[12px] font-semibold text-g600">
                      {thread.subject} · {linkedSession ? linkedSession.id : thread.sessionId}
                    </p>
                    {lastMsg && (
                      <p
                        className={cx(
                          'mt-1 line-clamp-1 text-[14px]',
                          unread > 0 ? 'font-semibold text-ink' : 'text-g600',
                        )}
                      >
                        {lastMsg.sender === role ? 'Tú: ' : ''}
                        {lastMsg.attachmentName ? `[Adjunto: ${lastMsg.attachmentName}] ` : ''}
                        {lastMsg.text}
                      </p>
                    )}
                    {unread > 0 && (
                      <span className="mt-1.5 inline-flex min-h-6 items-center gap-1 rounded-full bg-ink px-2.5 text-[12px] font-bold text-white">
                        <MessageCircle size={12} aria-hidden />
                        {unread === 1 ? '1 no leído' : `${unread} no leídos`}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={18} className="mt-1 shrink-0 text-g500" aria-hidden />
                </button>
              )
            })}
          </div>
        )}
        </ListState>
      </div>

      <BottomNav items={navItems} active={activeNavIndex} onSelect={onTabSelect} />
    </div>
  )
}

export function ConversationScreen({
  role,
  thread,
  linkedSession,
  onBack,
  onViewClass,
  onSendMessage,
  error,
}: {
  role: UserRole
  thread: ConversationThread
  linkedSession?: ClassSession
  onBack: () => void
  onViewClass: (sessionId: string) => void
  onSendMessage: (payload: { text: string; attachmentName?: string }) => Promise<void>
  error?: string | null
}) {
  const [draft, setDraft] = useState('')
  const [attachmentName, setAttachmentName] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const counterpart = role === 'alumno' ? thread.tutorName : thread.studentName
  const counterpartRoleLabel = role === 'alumno' ? 'Tutor' : 'Alumno'
  const contactCheck = detectExternalContact(draft)
  const showContactWarning = contactCheck.hasPhone || contactCheck.hasExternalLink

  async function handleSend() {
    const clean = draft.trim()
    if ((!clean && !attachmentName) || sending) return
    setSending(true)
    setActionError(null)
    try {
      await onSendMessage({
        text: clean || 'Archivo adjunto compartido para la sesión.',
        attachmentName: attachmentName || undefined,
      })
      setDraft('')
      setAttachmentName('')
    } catch (sendError) {
      setActionError(sendError instanceof Error ? sendError.message : 'No se pudo enviar el mensaje.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Encabezado con la persona */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-g200 bg-white px-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver a mensajes"
          className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-g100"
        >
          <ChevronLeft size={24} aria-hidden />
        </button>
        {role === 'alumno' && thread.tutorPhoto ? (
          <img
            src={thread.tutorPhoto}
            alt={`Foto de ${counterpart}`}
            className="size-10 shrink-0 rounded-full bg-g200 object-cover"
          />
        ) : (
          <Avatar name={counterpart} size={40} />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[16px] font-bold leading-tight">{counterpart}</h1>
          <p className="truncate text-[12px] text-g600">
            {counterpartRoleLabel} · {thread.subject}
          </p>
        </div>
      </header>

      {/* Chip de la clase vinculada con "Ver clase" */}
      <div className="flex items-center justify-between gap-2 border-b border-g200 bg-g50 px-3.5 py-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[12px] font-bold text-ink border border-g300">
              <CalendarDays size={12} aria-hidden />
              {linkedSession ? linkedSession.id : thread.sessionId}
            </span>
            {linkedSession && <StatusChip status={linkedSession.status} />}
          </div>
          {linkedSession && (
            <p className="mt-1 truncate text-[12px] text-g700">
              {DAY_SHORT_LABELS[linkedSession.day]?.replace(' de noviembre', ' nov')} ·{' '}
              {formatTimeChip(linkedSession.time)} · {linkedSession.mode}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onViewClass(linkedSession ? linkedSession.id : thread.sessionId)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-btn border-2 border-ink bg-white px-3 text-[12px] font-semibold text-ink hover:bg-g100"
        >
          Ver clase
          <ChevronRight size={15} aria-hidden />
        </button>
      </div>

      {/* Banner permanente de protección */}
      <div
        role="note"
        className="flex items-center gap-2 border-b border-info/30 bg-info-bg px-3.5 py-2 text-[12px] font-semibold text-info"
      >
        <ShieldCheck size={16} className="shrink-0" aria-hidden />
        <span>Mantén pagos y contacto dentro de TutorClick</span>
      </div>

      {/* Burbujas de conversación */}
      <div className="flex-1 overflow-y-auto bg-g50 px-4 py-3.5">
        {(error || actionError) && (
          <p role="alert" className="mb-3 rounded-btn border border-err bg-err-bg p-3 text-[13px] font-semibold text-err">
            {actionError ?? error}
          </p>
        )}
        <div className="flex flex-col gap-3">
          {thread.messages.map((msg) => {
            const mine = msg.sender === role
            const msgWarn = detectExternalContact(msg.text)
            const flagged = msgWarn.hasPhone || msgWarn.hasExternalLink
            return (
              <div
                key={msg.id}
                className={cx('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}
              >
                <div
                  className={cx(
                    'max-w-[84%] rounded-2xl px-3.5 py-2.5 text-[14px] shadow-sm',
                    mine
                      ? 'rounded-br-sm bg-ink text-white'
                      : 'rounded-bl-sm border border-g200 bg-white text-ink',
                  )}
                >
                  {msg.attachmentName && (
                    <div
                      className={cx(
                        'mb-1.5 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold',
                        mine ? 'bg-white/15 text-white' : 'bg-g100 text-ink',
                      )}
                    >
                      <FileText size={15} className="shrink-0" aria-hidden />
                      <span className="truncate">{msg.attachmentName}</span>
                    </div>
                  )}
                  <p className="leading-snug break-words">{msg.text}</p>
                </div>

                {flagged && (
                  <p className="flex max-w-[84%] items-center gap-1 text-[12px] font-semibold text-warn">
                    <AlertTriangle size={13} className="shrink-0" aria-hidden />
                    Recuerda no compartir teléfonos ni enlaces externos.
                  </p>
                )}

                <div className="flex items-center gap-1.5 px-1 text-[12px] text-g600">
                  <span>{msg.time} (UTC-6)</span>
                  {mine && (
                    <span className="inline-flex items-center gap-1 font-semibold text-g700">
                      {msg.read ? (
                        <>
                          <CheckCheck size={14} className="text-ok" aria-hidden />
                          <span>Leído</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} aria-hidden />
                          <span>Enviado</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Advertencia si el borrador incluye teléfono o enlace externo */}
      {showContactWarning && (
        <div
          role="alert"
          className="flex items-start gap-2.5 border-t-2 border-warn bg-warn-bg px-3.5 py-2.5 text-[12px] text-warn"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <p className="font-semibold">
            Detectamos un {contactCheck.hasPhone && contactCheck.hasExternalLink ? 'teléfono y un enlace externo' : contactCheck.hasPhone ? 'número de teléfono' : 'enlace externo'}. Por tu seguridad y para conservar la protección del pago, mantén el contacto dentro de TutorClick.
          </p>
        </div>
      )}

      {/* Compositor con adjuntar y enviar */}
      <div className="shrink-0 border-t border-g200 bg-white px-3 pb-4 pt-2.5">
        {attachmentName && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-btn bg-g100 px-3 py-1.5 text-[12px] font-semibold text-ink">
            <span className="flex min-w-0 items-center gap-1.5">
              <Paperclip size={14} className="shrink-0" aria-hidden />
              <span className="truncate">{attachmentName}</span>
            </span>
            <button
              type="button"
              onClick={() => setAttachmentName('')}
              aria-label="Quitar archivo adjunto"
              className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-g200"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <label
            htmlFor={`chat-attach-${role}`}
            aria-label="Adjuntar archivo"
            className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-btn border-2 border-g300 bg-white text-ink hover:border-ink"
          >
            <Paperclip size={20} aria-hidden />
            <input
              id={`chat-attach-${role}`}
              type="file"
              className="sr-only"
              onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? '')}
            />
          </label>

          <div className="min-w-0 flex-1">
            <label htmlFor={`chat-input-${role}`} className="sr-only">
              Escribe un mensaje
            </label>
            <input
              id={`chat-input-${role}`}
              value={draft}
              maxLength={4000}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
              placeholder="Escribe un mensaje…"
              className="min-h-12 w-full rounded-btn border border-g500 bg-white px-3.5 text-[14px] outline-none focus:border-ink focus:ring-4 focus:ring-ink/15"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || (!draft.trim() && !attachmentName)}
            aria-label="Enviar mensaje"
            className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center gap-1.5 rounded-btn bg-ink px-3.5 text-[14px] font-semibold text-white hover:bg-g700 disabled:cursor-not-allowed disabled:bg-g200 disabled:text-g500"
          >
            <Send size={18} aria-hidden />
            <span>{sending ? 'Enviando…' : 'Enviar'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
