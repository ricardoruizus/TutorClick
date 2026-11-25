import { useEffect, useState } from 'react'
import { Login, Recover } from '../alumno/auth'
import { ConversationScreen, MessagesListScreen } from '../../components/ui/messages'
import { AppShell } from '../../components/ui/app-shell'
import type { SendMessagePayload } from '../../services/mensajes'
import { ClassDetailScreen, UnifiedCalendarScreen, type DetailSheetKind } from '../../components/ui/unified-calendar'
import {
  TutorFinanceScreen,
  TutorHomeScreen,
  TutorMoreScreen,
  TutorOnboarding,
  tutorMainNav,
} from './tutor-experience'
import type {
  AvailabilityBlock,
  ClassBookingRecord,
  ClassMode,
  ClassNotificationRecord,
  ClassSession,
  ConversationThread,
  TutorWeeklyAvailability,
} from '../../types'
import { logout, register } from '../../services/auth'
import { cancelFutureSeriesSessions } from '../../services/reservas'
import {
  deleteTutorWeeklyAvailability,
  cancelClassBooking,
  completeClassBooking,
  listClassRescheduleSlots,
  listMyClassBookings,
  listMyClassNotifications,
  listTutorWeeklyAvailability,
  markClassNotificationRead,
  proposeClassReschedule,
  respondToClassReschedule,
  respondToClassBooking,
  saveTutorWeeklyAvailability,
} from '../../services/agenda'

export type TutorRoute =
  | 'login'
  | 'recover'
  | 'onboarding'
  | 'calendar'
  | 'class-detail'
  | 'home'
  | 'messages'
  | 'conversation'
  | 'finances'
  | 'more'

export function TutorApp({
  sessions,
  tutorBlocks,
  threads,
  threadsError,
  threadsLoading,
  realtimeLive = false,
  bookingsTick = 0,
  onRefreshThreads,
  accountId,
  accountName,
  startAtOnboarding,
  onboardingComplete: _onboardingComplete,
  onOnboardingComplete,
  onTutorLogout,
  onLogoutToLogin,
  onToggleBlock,
  onUpdateBlock,
  onUpdateSession,
  onMarkThreadRead,
  onSendMessage,
  onEnsureThread,
}: {
  sessions: ClassSession[]
  tutorBlocks: AvailabilityBlock[]
  threads: ConversationThread[]
  threadsError?: string | null
  threadsLoading?: boolean
  realtimeLive?: boolean
  /** Aumenta cada vez que Realtime avisa de un cambio en reservas o notificaciones. */
  bookingsTick?: number
  onRefreshThreads: () => Promise<void>
  accountId: string
  accountName: string
  startAtOnboarding?: boolean
  onboardingComplete: boolean
  onOnboardingComplete: () => void
  onTutorLogout: () => void
  onLogoutToLogin?: () => void
  onToggleBlock: (blockId: string) => void
  onUpdateBlock: (blockId: string, patch: Partial<AvailabilityBlock>) => void
  onUpdateSession: (id: string, patch: Partial<ClassSession>) => void
  onMarkThreadRead: (threadId: string) => Promise<void>
  onSendMessage: (threadId: string, payload: SendMessagePayload) => Promise<void>
  onEnsureThread: (meta: {
    studentId: string
    studentName: string
    tutorId: string
    tutorName: string
    tutorPhoto: string
    subject: string
    sessionId: string
  }) => Promise<string>
}) {
  const [history, setHistory] = useState<TutorRoute[]>([
    startAtOnboarding ? 'onboarding' : 'home',
  ])
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [navStep, setNavStep] = useState(0)
  const [activeSessionId, setActiveSessionId] = useState('')
  const [detailSheet, setDetailSheet] = useState<DetailSheetKind | null>(null)
  const [activeThreadId, setActiveThreadId] = useState('')
  const [weeklyAvailability, setWeeklyAvailability] = useState<TutorWeeklyAvailability[]>([])
  const [bookings, setBookings] = useState<ClassBookingRecord[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [availabilityLoading, setAvailabilityLoading] = useState(true)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [bookingsError, setBookingsError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<ClassNotificationRecord[]>([])
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const [threadActionError, setThreadActionError] = useState<string | null>(null)
  const current = history[history.length - 1]
  const tutorSessions = sessions.filter((session) => session.tutorId === accountId)
  const tutorThreads = threads.filter((t) => t.tutorId === accountId)
  const blocks = tutorBlocks.filter((block) => block.tutorId === accountId)
  const selectedSession = tutorSessions.find((session) => session.id === activeSessionId) ?? tutorSessions[0]
  const selectedThread = tutorThreads.find((t) => t.id === activeThreadId) ?? tutorThreads[0]

  useEffect(() => {
    if (current !== 'messages') return
    void onRefreshThreads()
      .then(() => setThreadActionError(null))
      .catch((error: unknown) => {
        setThreadActionError(error instanceof Error ? error.message : 'No se pudieron actualizar los mensajes.')
      })
  }, [current])

  useEffect(() => {
    let active = true
    setAvailabilityLoading(true)
    setAvailabilityError(null)
    void listTutorWeeklyAvailability(accountId)
      .then((slots) => {
        if (active) setWeeklyAvailability(slots)
      })
      .catch((error: unknown) => {
        if (active) {
          setAvailabilityError(
            error instanceof Error ? error.message : 'No se pudo cargar la disponibilidad semanal.',
          )
        }
      })
      .finally(() => {
        if (active) setAvailabilityLoading(false)
      })
    return () => {
      active = false
    }
  }, [accountId])

  useEffect(() => {
    let active = true
    setBookingsLoading(true)
    void listMyClassBookings()
      .then((items) => {
        if (!active) return
        setBookings(items.filter((item) => item.tutorUserId === accountId))
        setBookingsError(null)
      })
      .catch((error: unknown) => {
        if (active) {
          setBookingsError(error instanceof Error ? error.message : 'No se pudieron cargar las solicitudes.')
        }
      })
      .finally(() => {
        if (active) setBookingsLoading(false)
      })
    return () => {
      active = false
    }
  }, [accountId, bookingsTick])

  useEffect(() => {
    if (current !== 'calendar') return
    let active = true
    void listMyClassNotifications()
      .then((items) => {
        if (!active) return
        setNotifications(items)
        setNotificationsError(null)
      })
      .catch((error: unknown) => {
        if (active) {
          setNotificationsError(error instanceof Error ? error.message : 'No se pudieron cargar las notificaciones.')
        }
      })
    return () => {
      active = false
    }
  }, [accountId, current, bookingsTick])

  async function reloadAvailability() {
    const slots = await listTutorWeeklyAvailability(accountId)
    setWeeklyAvailability(slots)
    setAvailabilityError(null)
  }

  async function applyAvailabilityRule(rule: {
    days: number[]
    start: string
    end: string
    mode: ClassMode
  }) {
    setAvailabilityLoading(true)
    setAvailabilityError(null)
    try {
      await saveTutorWeeklyAvailability({
        weekdays: rule.days,
        startTime: rule.start,
        endTime: rule.end,
        mode: rule.mode,
      })
      await reloadAvailability()
    } finally {
      setAvailabilityLoading(false)
    }
  }

  async function removeAvailabilitySlot(slotId: string) {
    await deleteTutorWeeklyAvailability(slotId)
    await reloadAvailability()
  }

  async function handleBookingResponse(
    bookingId: string,
    response: Extract<ClassBookingRecord['status'], 'confirmed' | 'rejected'>,
  ) {
    await respondToClassBooking(bookingId, response)
    await refreshClassLifecycleData()
  }

  async function refreshClassLifecycleData() {
    const [bookingsResult, notificationsResult] = await Promise.allSettled([
      listMyClassBookings(),
      listMyClassNotifications(),
    ])
    if (bookingsResult.status === 'fulfilled') {
      setBookings(bookingsResult.value.filter((item) => item.tutorUserId === accountId))
      setBookingsError(null)
    } else {
      setBookingsError(bookingsResult.reason instanceof Error
        ? `La acción se completó, pero no se pudo actualizar la lista: ${bookingsResult.reason.message}`
        : 'La acción se completó, pero no se pudo actualizar la lista.')
    }
    if (notificationsResult.status === 'fulfilled') {
      setNotifications(notificationsResult.value)
      setNotificationsError(null)
    } else {
      setNotificationsError(notificationsResult.reason instanceof Error
        ? notificationsResult.reason.message
        : 'No se pudieron actualizar las notificaciones.')
    }
  }

  async function handleClassLifecycleAction(action: () => Promise<void>) {
    await action()
    await refreshClassLifecycleData()
  }

  async function handleMarkNotificationRead(notificationId: string) {
    await markClassNotificationRead(notificationId)
    setNotifications((currentItems) => currentItems.map((notification) =>
      notification.id === notificationId
        ? { ...notification, readAt: new Date().toISOString() }
        : notification,
    ))
  }

  function openConversation(threadId: string) {
    setActiveThreadId(threadId)
    push('conversation')
    setThreadActionError(null)
    void onMarkThreadRead(threadId).catch((error: unknown) => {
      setThreadActionError(error instanceof Error ? error.message : 'No se pudo marcar la conversación como leída.')
    })
  }

  async function ensureAndOpenConversation(meta: {
    studentId: string
    studentName: string
    tutorId: string
    tutorName: string
    tutorPhoto: string
    subject: string
    sessionId: string
  }) {
    setThreadActionError(null)
    try {
      const threadId = await onEnsureThread(meta)
      setActiveThreadId(threadId)
      push('conversation')
      try {
        await onMarkThreadRead(threadId)
      } catch (error) {
        setThreadActionError(error instanceof Error ? error.message : 'No se pudo marcar la conversación como leída.')
      }
    } catch (error) {
      setThreadActionError(error instanceof Error ? error.message : 'No se pudo abrir la conversación.')
    }
  }

  function push(next: TutorRoute) {
    if (next === current) return
    setDirection('forward')
    setNavStep((value) => value + 1)
    setHistory((prev) => [...prev, next])
  }
  function goBack() {
    if (history.length <= 1) return
    setDirection('back')
    setNavStep((value) => value + 1)
    setHistory((prev) => prev.slice(0, -1))
  }
  function handleTabSelect(index: number) {
    push(index === 0 ? 'home' : index === 1 ? 'calendar' : index === 2 ? 'messages' : index === 3 ? 'finances' : 'more')
  }

  return (
    <AppShell label="Aplicación del Tutor">
      <div key={`${current}-${navStep}`} className={`h-full w-full ${direction === 'forward' ? 'anim-forward' : 'anim-back'}`}>
        {current === 'login' && (
          <Login
            embedded
            initialRole="tutor"
            onSuccess={() => {
              setDirection('forward')
              setNavStep((value) => value + 1)
              setHistory(['home'])
            }}
            onForgot={() => push('recover')}
            onRegister={() => {
              push('onboarding')
            }}
          />
        )}
        {current === 'recover' && (
          <Recover
            embedded
            onBack={goBack}
            onLogin={() => {
              setDirection('back')
              setNavStep((value) => value + 1)
              setHistory(['login'])
            }}
          />
        )}
        {current === 'onboarding' && (
          <TutorOnboarding
            onCreateAccount={({ fullName, email, password, ...profile }) =>
              register('tutor', email, password, fullName, profile)
            }
            onComplete={() => {
              onOnboardingComplete()
              setDirection('forward')
              setNavStep((value) => value + 1)
              setHistory(['home'])
            }}
          />
        )}
        {current === 'calendar' && (
          <UnifiedCalendarScreen
            role="tutor"
            sessions={tutorSessions}
            tutorBlocks={blocks}
            weeklyAvailability={weeklyAvailability}
            bookings={bookings}
            bookingsError={bookingsError}
            notifications={notifications}
            notificationsError={notificationsError}
            onMarkNotificationRead={handleMarkNotificationRead}
            availabilityLoading={availabilityLoading}
            availabilityError={availabilityError}
            onToggleBlock={onToggleBlock}
            onUpdateBlock={onUpdateBlock}
            onApplyRecurringRule={applyAvailabilityRule}
            onDeleteAvailability={removeAvailabilitySlot}
            onRespondToBooking={handleBookingResponse}
            onCancelBooking={(bookingId, reason) => handleClassLifecycleAction(
              () => cancelClassBooking(bookingId, reason),
            )}
            onListRescheduleSlots={listClassRescheduleSlots}
            onProposeReschedule={(input) => handleClassLifecycleAction(
              () => proposeClassReschedule(input),
            )}
            onRespondToReschedule={(bookingId, response) => handleClassLifecycleAction(
              () => respondToClassReschedule(bookingId, response),
            )}
            onCompleteBooking={(bookingId) => handleClassLifecycleAction(
              () => completeClassBooking(bookingId),
            )}
            onOpenSession={(id, sh) => {
              setActiveSessionId(id)
              setDetailSheet(sh ?? null)
              onUpdateSession(id, { isNewForTutor: false })
              push('class-detail')
            }}
            onBack={history.length > 1 ? goBack : undefined}
            onTabSelect={handleTabSelect}
            navItems={tutorMainNav}
            activeNavIndex={1}
          />
        )}
        {current === 'class-detail' && selectedSession && (
          <ClassDetailScreen
            session={selectedSession}
            role="tutor"
            initialSheet={detailSheet}
            onBack={goBack}
            onWriteMessage={() => {
              void ensureAndOpenConversation({
                studentId: selectedSession.studentId,
                studentName: selectedSession.studentName,
                tutorId: selectedSession.tutorId,
                tutorName: selectedSession.tutorName,
                tutorPhoto: selectedSession.tutorPhoto,
                subject: selectedSession.subject,
                sessionId: selectedSession.id,
              })
            }}
            onUpdateSession={(patch) => onUpdateSession(selectedSession.id, patch)}
            onCancelFutureSessions={(seriesId, fromIndex) => cancelFutureSeriesSessions(sessions, seriesId, fromIndex, onUpdateSession)}
          />
        )}
        {current === 'home' && (
          <TutorHomeScreen
            sessions={tutorSessions}
            bookings={bookings}
            bookingsLoading={bookingsLoading}
            bookingsError={bookingsError}
            fullName={accountName}
            onOpenSession={(id) => {
              setActiveSessionId(id)
              setDetailSheet(null)
              onUpdateSession(id, { isNewForTutor: false })
              push('class-detail')
            }}
            onStartSession={(id) => {
              onUpdateSession(id, {
                status: 'En curso',
                startsSoon: false,
                checkedInAt: '3:50 PM (UTC-6)',
                isNewForTutor: false,
              })
              setActiveSessionId(id)
              setDetailSheet(null)
              push('class-detail')
            }}
            onTabSelect={handleTabSelect}
          />
        )}
        {current === 'messages' && (
          <MessagesListScreen
            role="tutor"
            threads={tutorThreads}
            sessions={tutorSessions}
            error={threadsError ?? threadActionError}
            isLoading={threadsLoading}
            live={realtimeLive}
            onOpenThread={openConversation}
            onGoCalendar={() => handleTabSelect(1)}
            onBack={history.length > 1 ? goBack : undefined}
            onTabSelect={handleTabSelect}
            navItems={tutorMainNav}
            activeNavIndex={2}
          />
        )}
        {current === 'conversation' && selectedThread && (
          <ConversationScreen
            role="tutor"
            thread={selectedThread}
            linkedSession={tutorSessions.find((s) => s.id === selectedThread.sessionId)}
            error={threadsError ?? threadActionError}
            onBack={goBack}
            onViewClass={(sessionId) => {
              const exists = tutorSessions.find((s) => s.id === sessionId)
              if (exists) {
                setActiveSessionId(exists.id)
                setDetailSheet(null)
                push('class-detail')
              } else {
                push('calendar')
              }
            }}
            onSendMessage={(payload) => onSendMessage(selectedThread.id, payload)}
          />
        )}
        {current === 'finances' && (
          <TutorFinanceScreen sessions={tutorSessions} onTabSelect={handleTabSelect} />
        )}
        {current === 'more' && (
          <TutorMoreScreen
            sessions={tutorSessions}
            userId={accountId}
            fullName={accountName}
            onMessageStudent={(session) => {
              void ensureAndOpenConversation({
                studentId: session.studentId,
                studentName: session.studentName,
                tutorId: session.tutorId,
                tutorName: session.tutorName,
                tutorPhoto: session.tutorPhoto,
                subject: session.subject,
                sessionId: session.id,
              })
            }}
            onLogout={() => {
              void logout()
                .then(() => {
                  onTutorLogout()
                  if (onLogoutToLogin) {
                    onLogoutToLogin()
                  } else {
                    setDirection('back')
                    setNavStep((value) => value + 1)
                    setHistory(['login'])
                  }
                })
                .catch((error: unknown) => {
                  window.alert(error instanceof Error ? error.message : 'No se pudo cerrar la sesión.')
                })
            }}
            onTabSelect={handleTabSelect}
          />
        )}
      </div>
    </AppShell>
  )
}
