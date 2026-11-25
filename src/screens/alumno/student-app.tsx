import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Shuffle, Video, MapPin } from 'lucide-react'
import { Login, Recover, RoleChoice, StudentForm, Welcome } from './auth'
import { BookingScreen, type BookingSelection } from './booking'
import { CheckoutScreen, ConfirmedScreen, DEFAULT_PAYMENT_STATE, type SavedPaymentState } from './checkout'
import { BottomNav, Button, TopBar, studentNav } from '../../components/ui/ds'
import { ConversationScreen, MessagesListScreen } from '../../components/ui/messages'
import { TutorProfile, type Profile } from './profile'
import { DEFAULTS, SearchScreen, type Filters } from './search'
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SAVED_CARDS,
  DEFAULT_STUDENT_PROFILE,
  StudentAccountScreen,
  type NotificationPrefs,
  type SavedCardItem,
  type StudentProfileData,
} from './student-account'
import { ClassDetailScreen, UnifiedCalendarScreen, type DetailSheetKind } from '../../components/ui/unified-calendar'
import type { AvailabilityBlock, ClassMode, ClassSession, ConversationThread, TutorData } from '../../types'
import { MEETING_PLACES, TUTOR_CATALOG, formatTimeChip } from '../../data/mock'
import { logout, register } from '../../services/auth'
import { cancelFutureSeriesSessions as cancelFutureSeries } from '../../services/reservas'

export type StudentRoute =
  | 'welcome' | 'login' | 'recover' | 'register-role' | 'register-student'
  | 'search' | 'calendar' | 'class-detail' | 'messages' | 'conversation' | 'account'
  | 'profile' | 'booking' | 'checkout' | 'confirmed'

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
  initialStudentId = 'USR-0001',
  initialRoute = 'search',
  onAddSession,
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
  initialStudentId?: string
  initialRoute?: StudentRoute
  onAddSession: (session: ClassSession) => void
  onUpdateSession: (id: string, patch: Partial<ClassSession>) => void
  onMarkThreadRead: (threadId: string) => void
  onSendMessage: (threadId: string, payload: { text: string; attachmentName?: string }) => void
  onEnsureThread: (meta: {
    studentId: string
    studentName: string
    tutorId: string
    tutorName: string
    tutorPhoto: string
    subject: string
    sessionId: string
  }) => string
  onSwitchToTutor?: () => void
  onLogoutToLogin?: () => void
}) {
  const [history, setHistory] = useState<StudentRoute[]>([initialRoute])
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [navStep, setNavStep] = useState(0)
  const [activeStudentId, setActiveStudentId] = useState(initialStudentId)
  const [activeSessionId, setActiveSessionId] = useState('RES-1002')
  const [detailSheet, setDetailSheet] = useState<DetailSheetKind | null>(null)
  const [activeThreadId, setActiveThreadId] = useState('CONV-01')
  const [studentProfile, setStudentProfile] = useState<StudentProfileData>(() =>
    initialStudentId === 'USR-0099'
      ? { ...DEFAULT_STUDENT_PROFILE, id: 'USR-0099', name: 'Sofía Mena' }
      : DEFAULT_STUDENT_PROFILE,
  )
  const [savedCards, setSavedCards] = useState<SavedCardItem[]>(DEFAULT_SAVED_CARDS)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS)
  const [filters, setFilters] = useState<Filters>(DEFAULTS)
  const [favorites, setFavorites] = useState<string[]>(['USR-0003'])
  const [tutorId, setTutorId] = useState('USR-0002')
  const [selectedDay, setSelectedDay] = useState<number | null>(25)
  const [selectedTime, setSelectedTime] = useState('16:00')
  const [selectedMode, setSelectedMode] = useState<ClassMode>('En línea')
  const [selectedPlace, setSelectedPlace] = useState(MEETING_PLACES[0])
  const [booking, setBooking] = useState<BookingSelection | null>(null)
  const [paymentState, setPaymentState] = useState<SavedPaymentState>(DEFAULT_PAYMENT_STATE)
  const [confirmedCard, setConfirmedCard] = useState('Visa •••• 4242')
  const [holdSeconds, setHoldSeconds] = useState(600)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [expiredNotice, setExpiredNotice] = useState<string | null>(null)

  const current = history[history.length - 1]
  const tutor = TUTOR_CATALOG.find((item) => item.id === tutorId) ?? TUTOR_CATALOG[0]
  const studentSessions = useMemo(
    () => sessions.filter((session) => session.studentId === activeStudentId),
    [sessions, activeStudentId],
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
    const nextTutor = TUTOR_CATALOG.find((item) => item.id === id) ?? TUTOR_CATALOG[0]
    const firstDay = nextTutor.schedule[25] ? 25 : Number(Object.keys(nextTutor.schedule)[0] ?? 25)
    setTutorId(nextTutor.id)
    setSelectedDay(firstDay)
    setSelectedTime(nextTutor.schedule[firstDay]?.[0] ?? '16:00')
    if (!nextTutor.modes.includes(selectedMode)) setSelectedMode(nextTutor.modes[0])
    setExpiredNotice(null)
    push(destination)
  }

  useEffect(() => {
    if (current !== 'checkout' || isProcessingPayment) return
    if (holdSeconds <= 0) {
      setExpiredNotice('Alguien reservó este horario, elige otro')
      setHistory((prev) => {
        const index = prev.lastIndexOf('booking')
        return index >= 0 ? prev.slice(0, index + 1) : ['welcome', 'search', 'profile', 'booking']
      })
      return
    }
    const timer = window.setInterval(() => setHoldSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [current, holdSeconds, isProcessingPayment])

  function openSessionDetail(id: string, sheet: DetailSheetKind | null = null) {
    setActiveSessionId(id)
    setDetailSheet(sheet)
    push('class-detail')
  }

  function openConversation(threadId: string) {
    setActiveThreadId(threadId)
    onMarkThreadRead(threadId)
    push('conversation')
  }

  const upcomingBanner = nextSession ? {
    text: `Tu próxima clase: ${nextSession.day === 24 ? 'mañana' : 'hoy'} ${formatTimeChip(nextSession.time)} con ${nextSession.tutorName}`,
    onClick: () => {
      openSessionDetail(nextSession.id)
    },
  } : null

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-white min-[500px]:h-[844px] min-[500px]:w-[390px] min-[500px]:max-w-full min-[500px]:rounded-[28px] min-[500px]:border-4 min-[500px]:border-ink min-[500px]:shadow-xl">
      <div key={`${current}-${navStep}`} className={`h-full w-full ${direction === 'forward' ? 'anim-forward' : 'anim-back'}`}>
        {current === 'welcome' && <Welcome embedded onLogin={() => push('login')} onRegister={() => push('register-role')} />}
        {current === 'login' && (
          <Login
            embedded
            onBack={goBack}
            onSuccess={() => {
              setActiveStudentId('USR-0001')
              setStudentProfile(DEFAULT_STUDENT_PROFILE)
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
            onSuccess={async ({ fullName, email, password }) => {
              const result = await register('alumno', email, password, fullName)
              if (!result.ok || result.emailConfirmationRequired) return result
              setActiveStudentId('USR-0099')
              setStudentProfile({
                ...DEFAULT_STUDENT_PROFILE,
                id: 'USR-0099',
                name: 'Sofía Mena',
              })
              push('search')
              return result
            }}
          />
        )}
        {current === 'search' && (
          <SearchScreen
            embedded
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
              const tId = onEnsureThread({
                studentId: activeStudentId,
                studentName: studentProfile.name,
                tutorId: selectedSession.tutorId,
                tutorName: selectedSession.tutorName,
                tutorPhoto: selectedSession.tutorPhoto,
                subject: selectedSession.subject,
                sessionId: selectedSession.id,
              })
              openConversation(tId)
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
            onUpdateProfile={(patch) => setStudentProfile((prev) => ({ ...prev, ...patch }))}
            sessions={studentSessions}
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
        {current === 'profile' && (
          <TutorProfile
            embedded
            p={toProfile(tutor)}
            fav={favorites.includes(tutor.id)}
            onToggleFav={() => setFavorites((prev) => prev.includes(tutor.id) ? prev.filter((id) => id !== tutor.id) : [...prev, tutor.id])}
            onBack={goBack}
            onMessage={() => {
              const existingClass = studentSessions.find((s) => s.tutorId === tutor.id)
              const tId = onEnsureThread({
                studentId: activeStudentId,
                studentName: studentProfile.name,
                tutorId: tutor.id,
                tutorName: tutor.name,
                tutorPhoto: tutor.photo,
                subject: tutor.subjects[0],
                sessionId: existingClass?.id ?? 'RES-1001',
              })
              openConversation(tId)
            }}
            onBook={(label) => {
              const slot = tutor.quickSlots.find((item) => item.label === label)
              if (slot) { setSelectedDay(Math.max(25, slot.day)); setSelectedTime(slot.time) }
              push('booking')
            }}
          />
        )}
        {current === 'booking' && (
          <BookingScreen
            embedded
            minDay={25}
            blockedSlots={[
              ...tutorBlocks.filter((block) => block.tutorId === tutor.id && block.state === 'bloqueado').map((block) => ({ day: block.day, time: block.time })),
              ...sessions.filter((session) => session.tutorId === tutor.id && session.status !== 'Cancelada').map((session) => ({ day: session.day, time: session.time })),
            ]}
            tutor={tutor}
            selectedDay={selectedDay}
            selectedTime={selectedTime}
            selectedMode={selectedMode}
            selectedPlace={selectedPlace}
            expiredMessage={expiredNotice}
            onClearExpired={() => setExpiredNotice(null)}
            onBack={goBack}
            onContinue={(selection) => {
              setBooking(selection)
              setSelectedDay(selection.day)
              setSelectedTime(selection.time)
              setSelectedMode(selection.mode)
              setSelectedPlace(selection.place)
              setHoldSeconds(600)
              push('checkout')
            }}
          />
        )}
        {current === 'checkout' && (
          <CheckoutScreen
            embedded
            tutor={tutor}
            day={selectedDay ?? 25}
            time={selectedTime}
            initialClassMode={selectedMode}
            place={selectedPlace}
            paymentState={paymentState}
            onPaymentStateChange={setPaymentState}
            holdSeconds={holdSeconds}
            onProcessingChange={setIsProcessingPayment}
            classCount={booking?.count ?? 1}
            discount={booking?.discount ?? 0}
            bookingLabel={booking?.kind === 'weekly' ? `Serie semanal de ${booking.count} clases` : booking?.kind === 'package' ? `Paquete de ${booking.count} clases · vigencia de 60 días` : 'Clase única'}
            onBack={goBack}
            onConfirmed={(cardLabel) => {
              const selection = booking ?? {
                day: selectedDay ?? 25, time: selectedTime, mode: selectedMode, place: selectedPlace,
                kind: 'single' as const, count: 1, dates: [{ day: selectedDay ?? 25, time: selectedTime, available: true }],
                discount: 0, chooseDatesLater: false,
              }
              const seriesId = selection.count > 1 ? `SER-${Date.now()}` : undefined
              const base = 1100 + sessions.length
              const rows = selection.dates.length > 0 ? selection.dates : Array.from({ length: selection.count }, (_, index) => ({ day: 23 + index % 5, time: selection.time, available: true }))
              rows.forEach((row, index) => {
                const seq = base + index
                onAddSession({
                  id: `RES-${seq}`,
                  paymentId: `PAG-${6000 + seq}`,
                  studentId: activeStudentId,
                  studentName: studentProfile.name,
                  tutorId: tutor.id,
                  tutorName: tutor.name,
                  tutorPhoto: tutor.photo,
                  subject: tutor.subjects[0],
                  day: row.day,
                  monthLabel: 'Noviembre 2026',
                  time: row.time,
                  mode: selection.mode,
                  locationOrLink: selection.mode === 'En línea' ? `meet.tutorclick.mx/res-${seq}` : selection.place,
                  hourlyRate: tutor.rate * (1 - selection.discount),
                  status: 'Confirmada',
                  paymentStatus: 'Retenido',
                  cardUsed: cardLabel,
                  isNewForTutor: true,
                  bookingKind: selection.kind,
                  seriesId,
                  seriesIndex: seriesId ? index + 1 : undefined,
                  seriesTotal: seriesId ? rows.length : undefined,
                  packageDiscount: selection.discount || undefined,
                  packageExpiresAt: selection.kind === 'package' ? '22 de enero de 2027' : undefined,
                })
              })
              setActiveSessionId(`RES-${base}`)
              setConfirmedCard(cardLabel)
              push('confirmed')
            }}
          />
        )}
        {current === 'confirmed' && (
          <ConfirmedScreen
            embedded
            tutor={tutor}
            day={selectedDay ?? 25}
            time={selectedTime}
            mode={selectedMode}
            place={selectedPlace}
            cardSummary={confirmedCard}
            reservationId={activeSessionId}
            onBack={() => setHistory(['search'])}
            onViewCalendar={() => push('calendar')}
          />
        )}
      </div>
    </div>
  )
}
