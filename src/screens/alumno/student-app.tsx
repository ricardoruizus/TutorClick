import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Shuffle, Video, MapPin } from 'lucide-react'
import { Login, Recover, RoleChoice, StudentForm, Welcome } from './auth'
import { BookingScreen, type BookingSelection } from './booking'
import { BottomNav, Button, TopBar, studentNav } from '../../components/ui/ds'
import { AppShell } from '../../components/ui/app-shell'
import { ConversationScreen, MessagesListScreen } from '../../components/ui/messages'
import { TutorProfile, type Profile } from './profile'
import { DEFAULTS, SearchScreen, type Filters } from './search'
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SAVED_CARDS,
  StudentAccountScreen,
  type NotificationPrefs,
  type SavedCardItem,
  type StudentProfileData,
} from './student-account'
import { ClassDetailScreen, UnifiedCalendarScreen, type DetailSheetKind } from '../../components/ui/unified-calendar'
import type {
  AvailabilityBlock,
  ClassBookingRecord,
  ClassNotificationRecord,
  ClassSession,
  ConversationThread,
  TutorData,
} from '../../types'
import { DEFAULT_STUDENT_PROFILE, formatTimeChip } from '../../data/mock'
import { logout, register } from '../../services/auth'
import type { SendMessagePayload } from '../../services/mensajes'
import { cancelFutureSeriesSessions as cancelFutureSeries } from '../../services/reservas'
import {
  listAvailableTutorSlots,
  cancelClassBooking,
  completeClassBooking,
  listClassRescheduleSlots,
  listMyClassBookings,
  listMyClassNotifications,
  markClassNotificationRead,
  proposeClassReschedule,
  requestTutorClassBooking,
  respondToClassReschedule,
  respondToClassBooking,
  type AvailableClassSlot,
} from '../../services/agenda'
import {
  getStudentProfile,
  listPublishedTutors,
  updateStudentProfile,
  uploadStudentProfilePhoto,
} from '../../services/perfiles'

export type StudentRoute =
  | 'welcome' | 'login' | 'recover' | 'register-role' | 'register-student'
  | 'search' | 'calendar' | 'class-detail' | 'messages' | 'conversation' | 'account'
  | 'profile' | 'booking' | 'request-sent'

function formatBookingDate(startsAt: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-MX', {
    ...options,
    timeZone: 'America/Merida',
  }).format(new Date(startsAt))
}

function toProfile(t: TutorData): Profile {
  const both = t.modes.length === 2
  return {
    id: t.id,
    name: t.name,
    first: t.first,
    photo: t.photo,
    verified: t.verified,
    rating: t.rating,
    reviewCount: t.reviewsCount,
    dist: t.dist,
    rate: t.rate,
    modes: both ? 'Presencial y en línea' : t.modes[0],
    modeIcon: both ? Shuffle : t.modes[0] === 'Presencial' ? MapPin : Video,
    zone: t.zone,
    about: t.about,
    subjects: t.subjectLevels,
    degrees: t.degrees,
    slots: t.quickSlots.map((slot) => slot.label),
    reviews: t.reviews,
  }
}

function ComingSoonTab({
  title,
  activeTab,
  icon: Icon,
  navItems,
  ctaLabel,
  onCta,
  onBack,
  onTabSelect,
}: {
  title: string
  activeTab: number
  icon: typeof CalendarDays
  navItems: typeof studentNav
  ctaLabel: string
  onCta: () => void
  onBack?: () => void
  onTabSelect: (idx: number) => void
}) {
  return (
    <div className="flex h-full w-full flex-col bg-white">
      <TopBar title={title} back={!!onBack} onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-g50 px-8 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-g200 text-ink"><Icon size={28} aria-hidden /></span>
        <h2 className="text-[20px] font-bold">{title}</h2>
        <p className="text-g600">Explora otras secciones disponibles en TutorClick.</p>
        <Button variant="secondary" onClick={onCta}>{ctaLabel}</Button>
      </div>
      <BottomNav items={navItems} active={activeTab} onSelect={onTabSelect} />
    </div>
  )
}

export function StudentApp({
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
  accountEmail,
  initialStudentId = accountId,
  initialRoute = 'search',
  onUpdateSession,
  onMarkThreadRead,
  onSendMessage,
  onEnsureThread,
  onSwitchToTutor,
  onLogoutToLogin,
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
  accountEmail: string
  initialStudentId?: string
  initialRoute?: StudentRoute
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
  onSwitchToTutor?: () => void
  onLogoutToLogin?: () => void
}) {
  const [history, setHistory] = useState<StudentRoute[]>([initialRoute])
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [navStep, setNavStep] = useState(0)
  const [activeStudentId, setActiveStudentId] = useState(initialStudentId)
  const [activeSessionId, setActiveSessionId] = useState('')
  const [detailSheet, setDetailSheet] = useState<DetailSheetKind | null>(null)
  const [activeThreadId, setActiveThreadId] = useState('')
  const [studentProfile, setStudentProfile] = useState<StudentProfileData>(() => ({
    ...DEFAULT_STUDENT_PROFILE,
    id: accountId,
    name: accountName,
    email: accountEmail,
    career: null,
    preferredMode: null,
    zone: null,
  }))
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null)
  const [savedCards, setSavedCards] = useState<SavedCardItem[]>(DEFAULT_SAVED_CARDS)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS)
  const [filters, setFilters] = useState<Filters>(DEFAULTS)
  const [favorites, setFavorites] = useState<string[]>([])
  const [publishedTutors, setPublishedTutors] = useState<TutorData[]>([])
  const [tutorsLoading, setTutorsLoading] = useState(true)
  const [tutorsLoadError, setTutorsLoadError] = useState<string | null>(null)
  const [tutorsRefreshKey, setTutorsRefreshKey] = useState(0)
  const [tutorId, setTutorId] = useState('')
  const [availableSlots, setAvailableSlots] = useState<AvailableClassSlot[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [requestLoading, setRequestLoading] = useState(false)
  const [classBookings, setClassBookings] = useState<ClassBookingRecord[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [bookingsError, setBookingsError] = useState<string | null>(null)
  const [classNotifications, setClassNotifications] = useState<ClassNotificationRecord[]>([])
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const [threadActionError, setThreadActionError] = useState<string | null>(null)
  const [requestedBooking, setRequestedBooking] = useState<BookingSelection | null>(null)
  const [reservationId, setReservationId] = useState('')

  const current = history[history.length - 1]
  const tutor = publishedTutors.find((item) => item.id === tutorId)

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
    setTutorsLoading(true)
    setTutorsLoadError(null)
    void listPublishedTutors()
      .then((items) => {
        if (active) setPublishedTutors(items)
      })
      .catch((error: unknown) => {
        if (active) {
          setTutorsLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los tutores publicados.')
        }
      })
      .finally(() => {
        if (active) setTutorsLoading(false)
      })
    return () => {
      active = false
    }
  }, [accountId, tutorsRefreshKey])

  useEffect(() => {
    let active = true
    setBookingsLoading(true)
    void listMyClassBookings()
      .then((items) => {
        if (!active) return
        setClassBookings(items.filter((item) => item.studentUserId === accountId))
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
        setClassNotifications(items)
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

  async function refreshClassLifecycleData() {
    const [bookingsResult, notificationsResult] = await Promise.allSettled([
      listMyClassBookings(),
      listMyClassNotifications(),
    ])
    if (bookingsResult.status === 'fulfilled') {
      setClassBookings(bookingsResult.value.filter((item) => item.studentUserId === accountId))
      setBookingsError(null)
    } else {
      setBookingsError(bookingsResult.reason instanceof Error
        ? `La acción se completó, pero no se pudo actualizar la lista: ${bookingsResult.reason.message}`
        : 'La acción se completó, pero no se pudo actualizar la lista.')
    }
    if (notificationsResult.status === 'fulfilled') {
      setClassNotifications(notificationsResult.value)
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
    setClassNotifications((currentItems) => currentItems.map((notification) =>
      notification.id === notificationId
        ? { ...notification, readAt: new Date().toISOString() }
        : notification,
    ))
  }

  useEffect(() => {
    if (current !== 'booking' || !tutor) return
    let active = true
    setAvailableSlots([])
    setAvailabilityLoading(true)
    setAvailabilityError(null)
    void listAvailableTutorSlots(tutor.id)
      .then((slots) => {
        if (active) setAvailableSlots(slots)
      })
      .catch((error: unknown) => {
        if (active) {
          setAvailabilityError(error instanceof Error ? error.message : 'No se pudieron cargar los horarios.')
        }
      })
      .finally(() => {
        if (active) setAvailabilityLoading(false)
      })
    return () => {
      active = false
    }
  }, [current, tutor, availabilityRefreshKey])

  useEffect(() => {
    let active = true
    void getStudentProfile(accountId)
      .then((profile) => {
        if (!active) return
        setStudentProfile((currentProfile) => ({
          ...currentProfile,
          id: accountId,
          name: accountName,
          email: accountEmail,
          career: profile.career,
          preferredMode: profile.preferredMode,
          zone: profile.serviceZone,
          photo: profile.photoUrl ?? DEFAULT_STUDENT_PROFILE.photo,
        }))
        setProfileLoadError(null)
      })
      .catch((error: unknown) => {
        if (active) {
          setProfileLoadError(error instanceof Error ? error.message : 'No se pudo cargar el perfil.')
        }
      })
    return () => {
      active = false
    }
  }, [accountId, accountEmail, accountName])

  async function saveStudentProfile(patch: Partial<StudentProfileData>) {
    if (!patch.career || !patch.preferredMode || !patch.zone) {
      throw new Error('Completa carrera, modalidad y zona antes de guardar.')
    }
    const fullName = patch.name?.trim() || studentProfile.name
    await updateStudentProfile(accountId, {
      fullName,
      career: patch.career,
      preferredMode: patch.preferredMode,
      serviceZone: patch.zone,
    })
    setStudentProfile((currentProfile) => ({ ...currentProfile, ...patch, name: fullName }))
    setProfileLoadError(null)
  }

  async function saveStudentPhoto(file: File): Promise<string | undefined> {
    const result = await uploadStudentProfilePhoto(accountId, file)
    setStudentProfile((currentProfile) => ({ ...currentProfile, photo: result.photoUrl }))
    return result.warning
  }
  const studentSessions = useMemo(
    () => sessions.filter((session) => session.studentId === activeStudentId),
    [sessions, activeStudentId],
  )
  const nextBooking = useMemo(
    () => classBookings
      .filter((booking) =>
        ['pending_confirmation', 'confirmed', 'reschedule_pending'].includes(booking.status) &&
        Date.parse(booking.startsAt) > Date.now(),
      )
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0],
    [classBookings],
  )
  const studentThreads = useMemo(
    () => threads.filter((t) => t.studentId === activeStudentId),
    [threads, activeStudentId],
  )
  const selectedSession = studentSessions.find((session) => session.id === activeSessionId) ?? studentSessions[0]
  const selectedThread = studentThreads.find((t) => t.id === activeThreadId) ?? studentThreads[0]
  const nextSession = studentSessions.find(
    (session) => session.status === 'Confirmada' && (session.within24h || session.startsSoon),
  )

  function push(next: StudentRoute) {
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
    push(index === 0 ? 'search' : index === 1 ? 'calendar' : index === 2 ? 'messages' : 'account')
  }

  function selectTutor(id: string, destination: StudentRoute = 'profile') {
    const nextTutor = publishedTutors.find((item) => item.id === id)
    if (!nextTutor) return
    setTutorId(nextTutor.id)
    setRequestError(null)
    setAvailabilityError(null)
    push(destination)
  }

  function openSessionDetail(id: string, sheet: DetailSheetKind | null = null) {
    setActiveSessionId(id)
    setDetailSheet(sheet)
    push('class-detail')
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

  const upcomingBanner = nextBooking
    ? {
        text: `${nextBooking.status === 'pending_confirmation' ? 'Solicitud pendiente' : 'Tu próxima clase'}: ${formatBookingDate(nextBooking.startsAt, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })} · ${formatBookingDate(nextBooking.startsAt, { hour: 'numeric', minute: '2-digit' })} con ${nextBooking.tutorName}`,
        onClick: () => push('calendar'),
      }
    : !bookingsLoading && nextSession
      ? {
          text: `Tu próxima clase: ${nextSession.day === 24 ? 'mañana' : 'hoy'} ${formatTimeChip(nextSession.time)} con ${nextSession.tutorName}`,
          onClick: () => openSessionDetail(nextSession.id),
        }
      : null

  return (
    <AppShell label="Aplicación del Alumno">
      <div key={`${current}-${navStep}`} className={`h-full w-full ${direction === 'forward' ? 'anim-forward' : 'anim-back'}`}>
        {current === 'welcome' && <Welcome embedded onLogin={() => push('login')} onRegister={() => push('register-role')} />}
        {current === 'login' && (
          <Login
            embedded
            onBack={goBack}
            onSuccess={() => {
              setActiveStudentId(accountId)
              setStudentProfile((currentProfile) => ({
                ...currentProfile,
                id: accountId,
                name: accountName,
                email: accountEmail,
              }))
              push('search')
            }}
            onForgot={() => push('recover')}
            onRegister={() => push('register-role')}
          />
        )}
        {current === 'recover' && <Recover embedded onBack={goBack} onLogin={() => push('login')} />}
        {current === 'register-role' && (
          <RoleChoice embedded onBack={goBack} onContinueStudent={() => push('register-student')} onContinueTutor={onSwitchToTutor} onLogin={() => push('login')} />
        )}
        {current === 'register-student' && (
          <StudentForm
            embedded
            onBack={goBack}
            onSuccess={async ({ fullName, email, password, career, preferredMode }) => {
              const result = await register('alumno', email, password, fullName, {
                career,
                preferredMode,
              })
              if (!result.ok || result.emailConfirmationRequired) return result
              setActiveStudentId(accountId)
              setStudentProfile((currentProfile) => ({
                ...currentProfile,
                id: accountId,
                name: fullName,
                email,
                career: career || null,
                preferredMode,
              }))
              push('search')
              return result
            }}
          />
        )}
        {current === 'search' && (
          <SearchScreen
            embedded
            tutors={publishedTutors.map((item) => ({
              id: item.id,
              name: item.name,
              subjects: item.subjects,
              rate: item.rate,
              rating: item.rating,
              reviews: item.reviewsCount,
              verified: item.verified,
              modes: item.modes,
              km: item.km,
              photo: item.photo,
              pin: item.pin,
            }))}
            isLoading={tutorsLoading}
            loadError={tutorsLoadError}
            onRetry={() => setTutorsRefreshKey((value) => value + 1)}
            favorites={favorites}
            onToggleFavorite={(id) => setFavorites((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])}
            appliedFilters={filters}
            onChangeFilters={setFilters}
            onSelectTutor={(id) => selectTutor(id)}
            onTabSelect={handleTabSelect}
            onBack={history.length > 1 ? goBack : undefined}
            upcomingBanner={upcomingBanner}
          />
        )}
        {current === 'calendar' && (
          <UnifiedCalendarScreen
            role="alumno"
            sessions={studentSessions}
            tutorBlocks={tutorBlocks}
            bookings={classBookings}
            bookingsError={bookingsError}
            notifications={classNotifications}
            notificationsError={notificationsError}
            onMarkNotificationRead={handleMarkNotificationRead}
            onRespondToBooking={(bookingId, response) => handleClassLifecycleAction(
              () => respondToClassBooking(bookingId, response),
            )}
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
            onOpenSession={(id, sh) => openSessionDetail(id, sh ?? null)}
            onBookAgain={(id) => selectTutor(id, 'booking')}
            onFindTutor={() => push('search')}
            onBack={history.length > 1 ? goBack : undefined}
            onTabSelect={handleTabSelect}
          />
        )}
        {current === 'class-detail' && selectedSession && (
          <ClassDetailScreen
            session={selectedSession}
            role="alumno"
            initialSheet={detailSheet}
            onBack={goBack}
            onWriteMessage={() => {
              void ensureAndOpenConversation({
                studentId: activeStudentId,
                studentName: studentProfile.name,
                tutorId: selectedSession.tutorId,
                tutorName: selectedSession.tutorName,
                tutorPhoto: selectedSession.tutorPhoto,
                subject: selectedSession.subject,
                sessionId: selectedSession.id,
              })
            }}
            onBookAgain={(id) => selectTutor(id, 'booking')}
            onUpdateSession={(patch) => onUpdateSession(selectedSession.id, patch)}
            onCancelFutureSessions={(seriesId, fromIndex) => cancelFutureSeries(sessions, seriesId, fromIndex, onUpdateSession)}
          />
        )}
        {current === 'messages' && (
          <MessagesListScreen
            role="alumno"
            threads={studentThreads}
            sessions={studentSessions}
            error={threadsError ?? threadActionError}
            isLoading={threadsLoading}
            live={realtimeLive}
            onOpenThread={openConversation}
            onFindTutor={() => push('search')}
            onBack={history.length > 1 ? goBack : undefined}
            onTabSelect={handleTabSelect}
          />
        )}
        {current === 'conversation' && selectedThread && (
          <ConversationScreen
            role="alumno"
            thread={selectedThread}
            linkedSession={studentSessions.find((s) => s.id === selectedThread.sessionId)}
            error={threadsError ?? threadActionError}
            onBack={goBack}
            onViewClass={(sessionId) => {
              const exists = studentSessions.find((s) => s.id === sessionId)
              if (exists) openSessionDetail(exists.id)
              else push('calendar')
            }}
            onSendMessage={(payload) => onSendMessage(selectedThread.id, payload)}
          />
        )}
        {current === 'account' && (
          <StudentAccountScreen
            profile={studentProfile}
            profileError={profileLoadError}
            onUpdateProfile={saveStudentProfile}
            onUpdatePhoto={saveStudentPhoto}
            sessions={studentSessions}
            tutors={publishedTutors}
            favorites={favorites}
            onToggleFavorite={(id) =>
              setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
            }
            cards={savedCards}
            onChangeCards={setSavedCards}
            notifPrefs={notifPrefs}
            onChangeNotifPrefs={setNotifPrefs}
            onSelectTutorProfile={(id) => selectTutor(id, 'profile')}
            onBookTutor={(id) => selectTutor(id, 'booking')}
            onOpenSession={(id) => openSessionDetail(id)}
            onFindTutor={() => push('search')}
            onLogout={() => {
              void logout()
                .then(() => {
                  if (onLogoutToLogin) {
                    onLogoutToLogin()
                  } else {
                    setDirection('back')
                    setNavStep((v) => v + 1)
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
        {current === 'profile' && tutor && (
          <TutorProfile
            embedded
            p={toProfile(tutor)}
            fav={favorites.includes(tutor.id)}
            onToggleFav={() => setFavorites((prev) => prev.includes(tutor.id) ? prev.filter((id) => id !== tutor.id) : [...prev, tutor.id])}
            onBack={goBack}
            onMessage={() => {
              const existingClass = studentSessions.find((s) => s.tutorId === tutor.id)
              void ensureAndOpenConversation({
                studentId: activeStudentId,
                studentName: studentProfile.name,
                tutorId: tutor.id,
                tutorName: tutor.name,
                tutorPhoto: tutor.photo,
                subject: tutor.subjects[0],
                sessionId: existingClass?.id ?? '',
              })
            }}
            onBook={() => push('booking')}
          />
        )}
        {current === 'booking' && tutor && (
          <BookingScreen
            embedded
            tutor={tutor}
            availability={availableSlots}
            availabilityLoading={availabilityLoading}
            availabilityError={availabilityError}
            requestError={requestError}
            requestLoading={requestLoading}
            onRetryAvailability={() => {
              setRequestError(null)
              setAvailabilityRefreshKey((value) => value + 1)
            }}
            onBack={goBack}
            onContinue={async (selection) => {
              setRequestError(null)
              setRequestLoading(true)
              try {
                const id = await requestTutorClassBooking({
                  tutorUserId: tutor.id,
                  startsAt: selection.startsAt,
                  subject: selection.subject,
                  mode: selection.mode,
                  location: selection.place,
                })
                setReservationId(id)
                setRequestedBooking(selection)
                try {
                  const updatedBookings = await listMyClassBookings()
                  setClassBookings(updatedBookings.filter((item) => item.studentUserId === accountId))
                  setBookingsError(null)
                } catch (error) {
                  setBookingsError(
                    error instanceof Error ? error.message : 'La solicitud se envió, pero no se pudo actualizar la lista.',
                  )
                }
                push('request-sent')
              } catch (error) {
                setRequestError(
                  error instanceof Error ? error.message : 'No se pudo enviar la solicitud de reserva.',
                )
                setAvailabilityError(
                  error instanceof Error && error.message.includes('solicitado')
                    ? 'Ese horario acaba de ser solicitado. Actualiza la disponibilidad y elige otro.'
                    : null,
                )
                setAvailabilityRefreshKey((value) => value + 1)
              } finally {
                setRequestLoading(false)
              }
            }}
          />
        )}
        {current === 'request-sent' && tutor && requestedBooking && (
          <div className="flex h-full flex-col bg-white">
            <TopBar title="Solicitud enviada" back onBack={goBack} />
            <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto bg-g50 px-6 py-8 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-warn-bg text-warn">
                <CheckCircle2 size={34} aria-hidden />
              </span>
              <div>
                <h1 className="text-[22px] font-bold">Solicitud enviada</h1>
                <p className="mt-2 text-[14px] text-g700">
                  Tu clase con {tutor.name} está pendiente de confirmación. No se realizó ningún cobro.
                </p>
              </div>
              <div className="w-full rounded-card border border-g200 bg-white p-4 text-left">
                <p className="font-semibold capitalize">
                  {formatBookingDate(requestedBooking.startsAt, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="mt-1 text-[14px] font-medium text-g700">{requestedBooking.subject}</p>
                <p className="mt-1 text-[14px] text-g600">
                  {formatBookingDate(requestedBooking.startsAt, { hour: 'numeric', minute: '2-digit' })}
                  {' · '}{requestedBooking.mode}
                </p>
                {requestedBooking.place && (
                  <p className="mt-1 text-[13px] text-g600">{requestedBooking.place}</p>
                )}
                <p className="mt-2 break-all text-[12px] text-g500">Solicitud {reservationId}</p>
              </div>
              <Button full onClick={() => push('calendar')}>Ver mis solicitudes</Button>
              <Button full variant="secondary" onClick={() => push('search')}>Volver a tutores</Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
