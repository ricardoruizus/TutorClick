import { useEffect, useState } from 'react'
import { DesignSystem, ScreenGallery } from '../components/ui/system-showcase'
import { Welcome, Login, RoleChoice, StudentForm, Recover } from '../screens/alumno/auth'
import { StudentApp } from '../screens/alumno/student-app'
import { TutorApp } from '../screens/tutor/tutor-app'
import { TutorOnboarding } from '../screens/tutor/tutor-experience'
import { AdminApp } from '../screens/admin/admin-app'
import {
  initializeAuth,
  register,
  resolvePortalUrl,
  useAuthInitialization,
  useAuthSession,
  type PortalPath,
} from '../services/auth'
import {
  applyRecurringAvailabilityRule,
  toggleAvailabilityBlock,
  updateAvailabilityBlock,
} from '../services/calendario'
import { appendConversationMessage, markConversationRead } from '../services/mensajes'
import type {
  AvailabilityBlock,
  ClassMode,
  ClassSession,
  ConversationThread,
  UserRole,
} from '../types'

/* -------------------- Registro único de rutas y pantallas -------------------- */

export const ROUTES = {
  root: '/',
  tutorPortal: '/tutor',
  adminPortal: '/admin',
  gallery: '/galeria',
  designSystem: '/sistema-de-diseno',
} as const

export interface ScreenRouteDescriptor {
  role: 'Acceso' | 'Alumno' | 'Tutor' | 'Admin' | 'Documentación'
  screen: string
  route: string
  internalId: string
}

export const ROLE_SCREEN_ROUTES: readonly ScreenRouteDescriptor[] = [
  { role: 'Acceso', screen: 'Bienvenida', route: '/', internalId: 'welcome' },
  { role: 'Acceso', screen: 'Iniciar sesión (Alumno | Tutor)', route: '/', internalId: 'login' },
  { role: 'Acceso', screen: 'Recuperar contraseña', route: '/', internalId: 'recover' },
  { role: 'Acceso', screen: 'Crear cuenta: selector Alumno | Tutor', route: '/', internalId: 'register-role' },
  { role: 'Acceso', screen: 'Enlace directo a Iniciar sesión (Tutor)', route: '/tutor', internalId: 'login:tutor' },
  { role: 'Acceso', screen: 'Acceso administrativo (2FA)', route: '/admin', internalId: 'admin-login' },
  { role: 'Alumno', screen: 'Registro de Alumno', route: '/', internalId: 'register-student' },
  { role: 'Alumno', screen: 'Buscar Tutores (lista, mapa y filtros)', route: '/', internalId: 'search' },
  { role: 'Alumno', screen: 'Perfil público del Tutor', route: '/', internalId: 'profile' },
  { role: 'Alumno', screen: 'Reservar clase (única, serie o paquete)', route: '/', internalId: 'booking' },
  { role: 'Alumno', screen: 'Confirmación y pago protegido', route: '/', internalId: 'checkout' },
  { role: 'Alumno', screen: 'Clase confirmada', route: '/', internalId: 'confirmed' },
  { role: 'Alumno', screen: 'Calendario e historial del Alumno', route: '/', internalId: 'calendar' },
  { role: 'Alumno', screen: 'Detalle de clase (reprogramar, cancelar, calificar, reportar)', route: '/', internalId: 'class-detail' },
  { role: 'Alumno', screen: 'Mensajes y conversación', route: '/', internalId: 'messages / conversation' },
  { role: 'Alumno', screen: 'Perfil, favoritos, tarjetas y ajustes', route: '/', internalId: 'account' },
  { role: 'Tutor', screen: 'Onboarding de Tutor (5 pasos y revisión)', route: '/tutor', internalId: 'register-tutor / onboarding' },
  { role: 'Tutor', screen: 'Inicio del Tutor', route: '/tutor', internalId: 'home' },
  { role: 'Tutor', screen: 'Calendario y disponibilidad del Tutor', route: '/tutor', internalId: 'calendar' },
  { role: 'Tutor', screen: 'Detalle de clase del Tutor', route: '/tutor', internalId: 'class-detail' },
  { role: 'Tutor', screen: 'Mensajes y conversación del Tutor', route: '/tutor', internalId: 'messages / conversation' },
  { role: 'Tutor', screen: 'Finanzas y retiros', route: '/tutor', internalId: 'finances' },
  { role: 'Tutor', screen: 'Más (perfil, credenciales, alumnos, suscripción, ayuda)', route: '/tutor', internalId: 'more' },
  { role: 'Admin', screen: 'Inicio (KPIs, gráfica 30 días y pendientes)', route: '/admin', internalId: 'home' },
  { role: 'Admin', screen: 'Usuarios (tabla, detalle, suspensión y reactivación)', route: '/admin', internalId: 'users' },
  { role: 'Admin', screen: 'Verificación de credenciales', route: '/admin', internalId: 'verification' },
  { role: 'Admin', screen: 'Moderación (perfiles y reseñas)', route: '/admin', internalId: 'moderation' },
  { role: 'Admin', screen: 'Pagos y disputas (DSP-0892)', route: '/admin', internalId: 'payments' },
  { role: 'Admin', screen: 'Comisiones, planes e historial de tarifas', route: '/admin', internalId: 'commissions' },
  { role: 'Admin', screen: 'Métricas y Ajustes', route: '/admin', internalId: 'metrics / settings' },
  { role: 'Documentación', screen: 'Galería de pantallas', route: '/galeria', internalId: 'gallery' },
  { role: 'Documentación', screen: 'Sistema de diseño', route: '/sistema-de-diseno', internalId: 'ds' },
]

export type AppRoute = 'alumno' | 'tutor' | 'admin' | 'gallery' | 'ds'

type EntryView =
  | { screen: 'welcome' }
  | {
      screen: 'login'
      role: 'alumno' | 'tutor'
      draftEmail?: string
      draftPassword?: string
      nonce: number
    }
  | { screen: 'recover'; role: 'alumno' | 'tutor' }
  | { screen: 'register-role'; role: 'alumno' | 'tutor'; nonce: number }
  | { screen: 'register-student' }
  | { screen: 'register-tutor' }
  | {
      screen: 'admin-login'
      draftEmail?: string
      draftPassword?: string
      nonce: number
    }

export function parseLocation(): AppRoute {
  const pathname = window.location.pathname.replace(/\/+$/, '')
  const hash = window.location.hash.replace(/\/+$/, '')
  if (pathname.endsWith(ROUTES.gallery) || hash === `#${ROUTES.gallery}`) return 'gallery'
  if (pathname.endsWith(ROUTES.designSystem) || hash === `#${ROUTES.designSystem}`) return 'ds'
  if (pathname.endsWith(ROUTES.tutorPortal) || hash === `#${ROUTES.tutorPortal}`) return 'tutor'
  if (pathname.endsWith(ROUTES.adminPortal) || hash === `#${ROUTES.adminPortal}`) return 'admin'
  return 'alumno'
}

function initialEntryFromRoute(route: AppRoute): EntryView {
  if (route === 'tutor') return { screen: 'login', role: 'tutor', nonce: 0 }
  if (route === 'admin') return { screen: 'admin-login', nonce: 0 }
  return { screen: 'welcome' }
}

export function AppRouter() {
  const [route, setRoute] = useState<AppRoute>(() => parseLocation())
  const session = useAuthSession()
  const authInitialization = useAuthInitialization()
  const [entryView, setEntryView] = useState<EntryView>(() => initialEntryFromRoute(parseLocation()))
  const [tutorOnboardingComplete, setTutorOnboardingComplete] = useState(false)
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [tutorBlocks, setTutorBlocks] = useState<AvailabilityBlock[]>([])
  const [threads, setThreads] = useState<ConversationThread[]>([])

  useEffect(() => {
    initializeAuth()
  }, [])

  useEffect(() => {
    const onLocationChange = () => {
      const next = parseLocation()
      setRoute(next)
      setEntryView(initialEntryFromRoute(next))
    }
    window.addEventListener('hashchange', onLocationChange)
    window.addEventListener('popstate', onLocationChange)
    return () => {
      window.removeEventListener('hashchange', onLocationChange)
      window.removeEventListener('popstate', onLocationChange)
    }
  }, [])

  function syncPath(portalPath: PortalPath) {
    const target = resolvePortalUrl(portalPath)
    if (window.location.pathname !== target) {
      window.history.pushState(null, '', target)
    }
    setRoute(portalPath === '/tutor' ? 'tutor' : portalPath === '/admin' ? 'admin' : 'alumno')
  }

  function openLoginScreen(
    role: 'alumno' | 'tutor' = 'alumno',
    draft?: { email: string; password: string },
    portalPath: PortalPath = '/',
  ) {
    syncPath(portalPath)
    setEntryView({
      screen: 'login',
      role,
      draftEmail: draft?.email,
      draftPassword: draft?.password,
      nonce: Date.now(),
    })
  }

  function openAdminAccess(draft?: { email: string; password: string }) {
    syncPath('/admin')
    setEntryView({
      screen: 'admin-login',
      draftEmail: draft?.email,
      draftPassword: draft?.password,
      nonce: Date.now(),
    })
  }

  function handleAddSession(nextSession: ClassSession) {
    setSessions((prev) => [nextSession, ...prev])
  }

  function handleUpdateSession(id: string, patch: Partial<ClassSession>) {
    setSessions((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function handleToggleBlock(blockId: string) {
    setTutorBlocks((prev) => toggleAvailabilityBlock(prev, blockId))
  }

  function handleUpdateBlock(blockId: string, patch: Partial<AvailabilityBlock>) {
    setTutorBlocks((prev) => updateAvailabilityBlock(prev, blockId, patch))
  }

  function handleApplyRecurringRule(rule: {
    days: number[]
    start: string
    end: string
    mode: ClassMode
  }) {
    setTutorBlocks((prev) => applyRecurringAvailabilityRule(prev, rule, session?.id ?? ''))
  }

  function handleMarkThreadRead(threadId: string, role: UserRole) {
    setThreads((prev) => markConversationRead(prev, threadId, role))
  }

  function handleSendMessage(
    threadId: string,
    role: UserRole,
    payload: { text: string; attachmentName?: string },
  ) {
    setThreads((prev) => appendConversationMessage(prev, threadId, role, payload))
  }

  function handleEnsureThread(meta: {
    studentId: string
    studentName: string
    tutorId: string
    tutorName: string
    tutorPhoto: string
    subject: string
    sessionId: string
  }): string {
    const existing = threads.find(
      (t) => t.studentId === meta.studentId && t.tutorId === meta.tutorId,
    )
    if (existing) {
      if (meta.sessionId && existing.sessionId !== meta.sessionId) {
        setThreads((prev) =>
          prev.map((t) => (t.id === existing.id ? { ...t, sessionId: meta.sessionId } : t)),
        )
      }
      return existing.id
    }
    const newId = `CONV-${Date.now()}`
    const created: ConversationThread = {
      id: newId,
      studentId: meta.studentId,
      studentName: meta.studentName,
      tutorId: meta.tutorId,
      tutorName: meta.tutorName,
      tutorPhoto: meta.tutorPhoto,
      subject: meta.subject,
      sessionId: meta.sessionId,
      unreadForStudent: 0,
      unreadForTutor: 0,
      messages: [],
    }
    setThreads((prev) => [created, ...prev])
    return newId
  }

  if (!authInitialization.initialized) {
    return <main className="grid min-h-dvh place-items-center text-g600" aria-live="polite">Conectando con TutorClick…</main>
  }

  if (authInitialization.error && !session) {
    return (
      <main className="grid min-h-dvh place-items-center bg-g50 p-6">
        <section className="max-w-lg rounded-card border border-err bg-white p-6 text-center">
          <h1 className="text-xl font-bold">No se pudo iniciar TutorClick</h1>
          <p role="alert" className="mt-3 text-err">{authInitialization.error}</p>
          <button type="button" className="mt-5 min-h-11 rounded-btn bg-ink px-4 font-semibold text-white" onClick={() => window.location.reload()}>
            Volver a intentar
          </button>
        </section>
      </main>
    )
  }

  if (route === 'gallery') return <ScreenGallery />

  if (route === 'ds') return <DesignSystem />

  if (session?.role === 'admin') {
    return (
      <main aria-label="Panel de escritorio del Admin" className="min-h-dvh w-full bg-white">
        <AdminApp
          sessions={sessions}
          onLogoutToLogin={() => openLoginScreen('alumno')}
        />
      </main>
    )
  }

  if (!session && entryView.screen === 'admin-login') {
    return (
      <main aria-label="Acceso administrativo" className="min-h-dvh w-full bg-white">
        <AdminApp
          key={entryView.nonce}
          sessions={sessions}
          draftEmail={entryView.draftEmail}
          draftPassword={entryView.draftPassword}
          onBackFromLogin={() => openLoginScreen('alumno')}
          onSwitchRoleFromLogin={(targetRole, draft) =>
            openLoginScreen(targetRole, draft, targetRole === 'tutor' ? '/tutor' : '/')
          }
          onLogoutToLogin={() => openLoginScreen('alumno')}
        />
      </main>
    )
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-white min-[500px]:bg-g100 min-[500px]:px-4 min-[500px]:py-6">
      <main
        aria-label={session?.role === 'tutor' ? 'Aplicación móvil del Tutor' : 'Aplicación móvil del Alumno'}
        className="h-dvh w-full min-[500px]:h-auto min-[500px]:w-auto"
      >
        {session?.role === 'alumno' ? (
          <StudentApp
            key={session.id}
            sessions={sessions}
            tutorBlocks={tutorBlocks}
            threads={threads}
            accountId={session.id}
            accountName={session.fullName}
            accountEmail={session.email}
            initialStudentId={session.id}
            initialRoute="search"
            onAddSession={handleAddSession}
            onUpdateSession={handleUpdateSession}
            onMarkThreadRead={(id) => handleMarkThreadRead(id, 'alumno')}
            onSendMessage={(id, payload) => handleSendMessage(id, 'alumno', payload)}
            onEnsureThread={handleEnsureThread}
            onLogoutToLogin={() => openLoginScreen('alumno')}
          />
        ) : session?.role === 'tutor' ? (
          <TutorApp
            sessions={sessions}
            tutorBlocks={tutorBlocks}
            threads={threads}
            accountId={session.id}
            accountName={session.fullName}
            onboardingComplete={tutorOnboardingComplete}
            onOnboardingComplete={() => setTutorOnboardingComplete(true)}
            onTutorLogout={() => setTutorOnboardingComplete(false)}
            onLogoutToLogin={() => openLoginScreen('alumno')}
            onToggleBlock={handleToggleBlock}
            onUpdateBlock={handleUpdateBlock}
            onApplyRecurringRule={handleApplyRecurringRule}
            onUpdateSession={handleUpdateSession}
            onMarkThreadRead={(id) => handleMarkThreadRead(id, 'tutor')}
            onSendMessage={(id, payload) => handleSendMessage(id, 'tutor', payload)}
            onEnsureThread={handleEnsureThread}
          />
        ) : (
          <div className="relative h-dvh w-full overflow-hidden bg-white min-[500px]:h-[844px] min-[500px]:w-[390px] min-[500px]:max-w-full min-[500px]:rounded-[28px] min-[500px]:border-4 min-[500px]:border-ink min-[500px]:shadow-xl">
            {entryView.screen === 'welcome' && (
              <Welcome
                embedded
                onLogin={() => openLoginScreen('alumno')}
                onRegister={() =>
                  setEntryView({ screen: 'register-role', role: 'alumno', nonce: Date.now() })
                }
              />
            )}
            {entryView.screen === 'login' && (
              <Login
                key={`${entryView.role}-${entryView.nonce}`}
                embedded
                initialRole={entryView.role}
                initialEmail={entryView.draftEmail}
                initialPassword={entryView.draftPassword}
                onBack={() => {
                  syncPath('/')
                  setEntryView({ screen: 'welcome' })
                }}
                onSuccess={() => {
                  syncPath('/')
                }}
                onAdminAccess={(draft) => openAdminAccess(draft)}
                onForgot={(currentRole) =>
                  setEntryView({ screen: 'recover', role: currentRole })
                }
                onRegister={(currentRole) =>
                  setEntryView({
                    screen: 'register-role',
                    role: currentRole,
                    nonce: Date.now(),
                  })
                }
              />
            )}
            {entryView.screen === 'recover' && (
              <Recover
                embedded
                onBack={() => openLoginScreen(entryView.role)}
                onLogin={() => openLoginScreen(entryView.role)}
              />
            )}
            {entryView.screen === 'register-role' && (
              <RoleChoice
                key={entryView.nonce}
                embedded
                initialRole={entryView.role}
                onBack={() => {
                  syncPath('/')
                  setEntryView({ screen: 'welcome' })
                }}
                onContinueStudent={() => setEntryView({ screen: 'register-student' })}
                onContinueTutor={() => setEntryView({ screen: 'register-tutor' })}
                onLogin={() => openLoginScreen(entryView.role)}
              />
            )}
            {entryView.screen === 'register-student' && (
              <StudentForm
                embedded
                onBack={() =>
                  setEntryView({ screen: 'register-role', role: 'alumno', nonce: Date.now() })
                }
                onSuccess={async ({ fullName, email, password, career, preferredMode }) => {
                  const result = await register('alumno', email, password, fullName, {
                    career,
                    preferredMode,
                  })
                  if (result.ok && !result.emailConfirmationRequired) {
                    syncPath('/')
                  }
                  return result
                }}
              />
            )}
            {entryView.screen === 'register-tutor' && (
              <TutorOnboarding
                onBack={() =>
                  setEntryView({ screen: 'register-role', role: 'tutor', nonce: Date.now() })
                }
                onCreateAccount={({ fullName, email, password, ...profile }) =>
                  register('tutor', email, password, fullName, profile)
                }
                onComplete={() => {
                  setTutorOnboardingComplete(true)
                  syncPath('/')
                }}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
