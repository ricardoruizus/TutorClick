import { useState } from 'react'
import { Login, Recover } from '../alumno/auth'
import { ConversationScreen, MessagesListScreen } from '../../components/ui/messages'
import { ClassDetailScreen, UnifiedCalendarScreen, type DetailSheetKind } from '../../components/ui/unified-calendar'
import {
  TutorFinanceScreen,
  TutorHomeScreen,
  TutorMoreScreen,
  TutorOnboarding,
  tutorMainNav,
} from './tutor-experience'
import type { AvailabilityBlock, ClassMode, ClassSession, ConversationThread } from '../../types'
import { logout, register } from '../../services/auth'
import { cancelFutureSeriesSessions } from '../../services/reservas'

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
  startAtOnboarding,
  onboardingComplete: _onboardingComplete,
  onOnboardingComplete,
  onTutorLogout,
  onLogoutToLogin,
  onToggleBlock,
  onUpdateBlock,
  onApplyRecurringRule,
  onUpdateSession,
  onMarkThreadRead,
  onSendMessage,
  onEnsureThread,
}: {
  sessions: ClassSession[]
  tutorBlocks: AvailabilityBlock[]
  threads: ConversationThread[]
  startAtOnboarding?: boolean
  onboardingComplete: boolean
  onOnboardingComplete: () => void
  onTutorLogout: () => void
  onLogoutToLogin?: () => void
  onToggleBlock: (blockId: string) => void
  onUpdateBlock: (blockId: string, patch: Partial<AvailabilityBlock>) => void
  onApplyRecurringRule: (rule: { days: number[]; start: string; end: string; mode: ClassMode }) => void
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
}) {
  const [history, setHistory] = useState<TutorRoute[]>([
    startAtOnboarding ? 'onboarding' : 'home',
  ])
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [navStep, setNavStep] = useState(0)
  const [activeSessionId, setActiveSessionId] = useState('RES-1001')
  const [detailSheet, setDetailSheet] = useState<DetailSheetKind | null>(null)
  const [activeThreadId, setActiveThreadId] = useState('CONV-01')
  const current = history[history.length - 1]
  const tutorSessions = sessions.filter((session) => session.tutorId === 'USR-0002')
  const tutorThreads = threads.filter((t) => t.tutorId === 'USR-0002')
  const blocks = tutorBlocks.filter((block) => block.tutorId === 'USR-0002')
  const selectedSession = tutorSessions.find((session) => session.id === activeSessionId) ?? tutorSessions[0]
  const selectedThread = tutorThreads.find((t) => t.id === activeThreadId) ?? tutorThreads[0]

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
    <div className="relative h-dvh w-full overflow-hidden bg-white min-[500px]:h-[844px] min-[500px]:w-[390px] min-[500px]:max-w-full min-[500px]:rounded-[28px] min-[500px]:border-4 min-[500px]:border-ink min-[500px]:shadow-xl">
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
            onCreateAccount={({ fullName, email, password }) =>
              register('tutor', email, password, fullName)
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
            onToggleBlock={onToggleBlock}
            onUpdateBlock={onUpdateBlock}
            onApplyRecurringRule={onApplyRecurringRule}
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
              const tId = onEnsureThread({
                studentId: selectedSession.studentId,
                studentName: selectedSession.studentName,
                tutorId: selectedSession.tutorId,
                tutorName: selectedSession.tutorName,
                tutorPhoto: selectedSession.tutorPhoto,
                subject: selectedSession.subject,
                sessionId: selectedSession.id,
              })
              setActiveThreadId(tId)
              onMarkThreadRead(tId)
              push('conversation')
            }}
            onUpdateSession={(patch) => onUpdateSession(selectedSession.id, patch)}
            onCancelFutureSessions={(seriesId, fromIndex) => cancelFutureSeriesSessions(sessions, seriesId, fromIndex, onUpdateSession)}
          />
        )}
        {current === 'home' && (
          <TutorHomeScreen
            sessions={tutorSessions}
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
            onOpenThread={(id) => {
              setActiveThreadId(id)
              onMarkThreadRead(id)
              push('conversation')
            }}
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
            onMessageStudent={(session) => {
              const threadId = onEnsureThread({
                studentId: session.studentId,
                studentName: session.studentName,
                tutorId: session.tutorId,
                tutorName: session.tutorName,
                tutorPhoto: session.tutorPhoto,
                subject: session.subject,
                sessionId: session.id,
              })
              setActiveThreadId(threadId)
              onMarkThreadRead(threadId)
              push('conversation')
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
    </div>
  )
}
