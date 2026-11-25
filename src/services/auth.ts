import { useSyncExternalStore } from 'react'
import type { Session } from '@supabase/supabase-js'

import type { AuthRole, PortalPath, UserRole } from '../types'
import type { TutorClassMode } from './perfiles'
import { uploadTutorCredential } from './perfiles'
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export type { AuthRole, PortalPath }

export const DEMO_MODE = false

export interface AuthSession {
  id: string
  role: AuthRole
  email: string
  fullName: string
  authenticatedAt: number
}

export interface DemoCredentials {
  email: string
  password: string
  twoFactorCode?: string
}

export interface AuthService {
  getSession(): AuthSession | null
  getDemoCredentials(role: AuthRole): DemoCredentials | null
  loginWithPassword(expectedRole: AuthRole, email: string, password: string): Promise<LoginAttemptResult>
  verifyAdminTwoFactor(code: string): Promise<{ ok: true } | { ok: false; message: string }>
  register(
    role: UserRole,
    email: string,
    password: string,
    fullName: string,
    profile: RegistrationProfile,
  ): Promise<RegistrationResult>
  logout(): Promise<void>
}

export type RegistrationResult =
  | {
      ok: true
      emailConfirmationRequired: boolean
      credentialsPendingConfirmation?: boolean
      warning?: string
    }
  | { ok: false; message: string }

export interface StudentRegistrationProfile {
  career: string
  preferredMode: 'Presencial' | 'En línea' | 'Presencial y en línea'
}

export interface TutorRegistrationProfile {
  biography: string
  subjects: string[]
  educationLevel: string
  hourlyRateMxn: number
  classModes: TutorClassMode[]
  serviceZone: string
  travelRadiusKm: number
  availabilityWeekdays: number[]
  availabilityStartTime: string
  availabilityEndTime: string
  availabilityMode: TutorClassMode
  titleDocument: File
  licenseDocument: File
}

export type RegistrationProfile = StudentRegistrationProfile | TutorRegistrationProfile

export type LoginAttemptResult =
  | {
      ok: true
      requiresTwoFactor?: boolean
      requiresEnrollment?: boolean
      qrCode?: string
      secret?: string
    }
  | { ok: false; kind: 'invalid_credentials'; message: string }
  | {
      ok: false
      kind: 'wrong_role'
      actualRole: AuthRole
      portalPath: PortalPath
      message: string
    }

let currentSession: AuthSession | null = null
let pendingAdminFactorId: string | null = null
let authInitializationStarted = false
let authInitializationState = { initialized: false, error: null as string | null }
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function roleToPortal(role: AuthRole): PortalPath {
  if (role === 'tutor') return '/tutor'
  if (role === 'admin') return '/admin'
  return '/'
}

function isAuthRole(value: string): value is AuthRole {
  return value === 'alumno' || value === 'tutor' || value === 'admin'
}

async function loadAuthSession(userId: string, email: string): Promise<AuthSession | null> {
  const supabase = getSupabaseClient()
  const [{ data: roleData, error: roleError }, { data: profileData, error: profileError }] =
    await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId).single(),
      supabase.from('profiles').select('full_name').eq('id', userId).single(),
    ])

  if (roleError) throw new Error(`No se pudo leer el rol de la cuenta: ${roleError.message}`)
  if (profileError) throw new Error(`No se pudo leer el perfil de la cuenta: ${profileError.message}`)
  if (!isAuthRole(roleData.role)) throw new Error('La cuenta tiene un rol no reconocido.')

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (assuranceError) throw new Error(`No se pudo verificar el nivel MFA: ${assuranceError.message}`)
  if (roleData.role === 'admin' && assurance.currentLevel !== 'aal2') {
    return null
  }

  return {
    id: userId,
    role: roleData.role,
    email,
    fullName: profileData.full_name,
    authenticatedAt: Date.now(),
  }
}

let sessionRequest = 0

async function updateSessionFromAuth(authSession?: Session | null): Promise<string | null> {
  const requestId = ++sessionRequest
  try {
    const supabase = getSupabaseClient()
    let activeSession = authSession
    if (activeSession === undefined) {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      activeSession = data.session
    }

    if (requestId !== sessionRequest) return null

    if (!activeSession?.user) {
      currentSession = null
      authInitializationState = { initialized: authInitializationState.initialized, error: null }
    } else {
      const loadedSession = await loadAuthSession(
        activeSession.user.id,
        activeSession.user.email ?? '',
      )
      if (requestId !== sessionRequest) return null
      currentSession = loadedSession
      authInitializationState = { initialized: authInitializationState.initialized, error: null }
    }
    return null
  } catch (error) {
    if (requestId !== sessionRequest) return null
    currentSession = null
    const message = error instanceof Error ? error.message : 'No se pudo restaurar la sesión.'
    authInitializationState = {
      initialized: authInitializationState.initialized,
      error: message,
    }
    return message
  } finally {
    if (requestId === sessionRequest) {
      authInitializationState = { ...authInitializationState, initialized: true }
      emitChange()
    }
  }
}

export function initializeAuth() {
  if (authInitializationStarted) return
  authInitializationStarted = true
  if (!isSupabaseConfigured) {
    authInitializationState = {
      initialized: true,
      error: 'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local para iniciar.',
    }
    emitChange()
    return
  }
  const supabase = getSupabaseClient()
  supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => {
      void updateSessionFromAuth(session)
    }, 0)
  })
  void updateSessionFromAuth()
}

export function getSession(): AuthSession | null {
  return currentSession
}

export function getAuthInitializationState() {
  return authInitializationState
}

export function useAuthSession(): AuthSession | null {
  return useSyncExternalStore(subscribe, getSession, getSession)
}

export function useAuthInitialization() {
  return useSyncExternalStore(
    subscribe,
    getAuthInitializationState,
    getAuthInitializationState,
  )
}

export function getPortalPath(role: AuthRole): PortalPath {
  return roleToPortal(role)
}

export function getRoleDisplayLabel(role: AuthRole): 'Alumno' | 'Tutor' | 'Admin' {
  if (role === 'tutor') return 'Tutor'
  if (role === 'admin') return 'Admin'
  return 'Alumno'
}

export function resolvePortalUrl(portalPath: PortalPath): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
  return portalPath === '/' ? `${base || ''}/` : `${base}${portalPath}`
}

export function getDemoCredentials(role: AuthRole): DemoCredentials | null {
  void role
  return null
}

export async function loginWithPassword(
  expectedRole: AuthRole,
  rawEmail: string,
  password: string,
): Promise<LoginAttemptResult> {
  pendingAdminFactorId = null
  let shouldSignOutOnError = false
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: rawEmail.trim().toLowerCase(),
      password,
    })
    if (error) {
      return { ok: false, kind: 'invalid_credentials', message: error.message }
    }
    if (!data.user) {
      return { ok: false, kind: 'invalid_credentials', message: 'Supabase no devolvió un usuario.' }
    }
    shouldSignOutOnError = true

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single()
    if (roleError) throw new Error(`No se pudo consultar el rol: ${roleError.message}`)
    if (!isAuthRole(roleData.role)) throw new Error('La cuenta tiene un rol no reconocido.')

    if (roleData.role !== expectedRole) {
      await supabase.auth.signOut()
      shouldSignOutOnError = false
      return {
        ok: false,
        kind: 'wrong_role',
        actualRole: roleData.role,
        portalPath: roleToPortal(roleData.role),
        message: `Esta cuenta es de ${roleData.role}. Entra por el portal de ${roleData.role}`,
      }
    }

    if (roleData.role === 'admin') {
        const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
      if (factorError) throw new Error(`No se pudieron consultar los factores MFA: ${factorError.message}`)

      const factor = factors.totp.find((item) => item.status === 'verified')
      if (factor) {
        pendingAdminFactorId = factor.id
        return { ok: true, requiresTwoFactor: true }
      }

      const pendingFactor = factors.all.find(
        (item) => item.factor_type === 'totp' && item.status === 'unverified',
      )
      if (pendingFactor) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId: pendingFactor.id,
        })
        if (unenrollError) throw new Error(`No se pudo reiniciar el registro MFA: ${unenrollError.message}`)
      }

      const { data: enrollment, error: enrollmentError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'TutorClick Admin',
      })
      if (enrollmentError) throw new Error(`No se pudo iniciar el registro MFA: ${enrollmentError.message}`)
      pendingAdminFactorId = enrollment.id
      return {
        ok: true,
        requiresEnrollment: true,
        qrCode: enrollment.totp.qr_code,
        secret: enrollment.totp.secret,
      }
    }

    const sessionError = await updateSessionFromAuth(data.session)
    if (sessionError) throw new Error(sessionError)
    return { ok: true }
  } catch (error) {
    let cleanupError: string | null = null
    if (shouldSignOutOnError) {
      try {
        const { error: signOutError } = await getSupabaseClient().auth.signOut()
        if (signOutError) cleanupError = signOutError.message
      } catch (signOutError) {
        cleanupError =
          signOutError instanceof Error ? signOutError.message : 'Error desconocido al cerrar sesión.'
      }
    }
    return {
      ok: false,
      kind: 'invalid_credentials',
      message: [
        error instanceof Error ? error.message : 'No se pudo iniciar sesión.',
        cleanupError && `También falló el cierre seguro de sesión: ${cleanupError}`,
      ]
        .filter(Boolean)
        .join(' '),
    }
  }
}

export async function verifyAdminTwoFactor(
  rawCode: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!pendingAdminFactorId) {
    return { ok: false, message: 'No hay una verificación MFA pendiente. Vuelve a iniciar sesión.' }
  }
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: pendingAdminFactorId,
      code: rawCode.trim(),
    })
    if (error) return { ok: false, message: 'Código de verificación incorrecto o vencido.' }
    pendingAdminFactorId = null
    const sessionError = await updateSessionFromAuth()
    if (sessionError) return { ok: false, message: sessionError }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No se pudo verificar el código MFA.',
    }
  }
}

export async function register(
  role: UserRole,
  rawEmail: string,
  password: string,
  fullName: string,
  profile: RegistrationProfile,
): Promise<RegistrationResult> {
  try {
    let metadata: Record<string, string | number | string[] | number[]>
    if (role === 'alumno' && 'career' in profile) {
      metadata = {
        career: profile.career,
        preferred_mode: profile.preferredMode,
      }
    } else if (role === 'tutor' && 'biography' in profile) {
      metadata = {
        biography: profile.biography,
        subjects: profile.subjects,
        education_level: profile.educationLevel,
        hourly_rate_mxn: profile.hourlyRateMxn,
        class_modes: profile.classModes,
        service_zone: profile.serviceZone,
        travel_radius_km: profile.travelRadiusKm,
        availability_weekdays: profile.availabilityWeekdays,
        availability_start_time: profile.availabilityStartTime,
        availability_end_time: profile.availabilityEndTime,
        availability_mode: profile.availabilityMode,
      }
    } else {
      return { ok: false, message: 'Los datos del perfil no coinciden con el rol seleccionado.' }
    }
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email: rawEmail.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName.trim(),
          role,
          ...metadata,
        },
      },
    })
    if (error) return { ok: false, message: error.message }
    if (!data.user) return { ok: false, message: 'Supabase no devolvió el usuario creado.' }

    let warning: string | undefined
    let credentialsPendingConfirmation = false
    if (data.session) {
      const sessionError = await updateSessionFromAuth(data.session)
      if (sessionError) return { ok: false, message: sessionError }
      if (role === 'tutor') {
        if (!('titleDocument' in profile)) {
          return { ok: false, message: 'Faltan los documentos profesionales del tutor.' }
        }
        try {
          await uploadTutorCredential(data.user.id, 'title', profile.titleDocument)
          await uploadTutorCredential(data.user.id, 'license', profile.licenseDocument)
        } catch (uploadError) {
          warning =
            uploadError instanceof Error
              ? uploadError.message
              : 'No se pudieron guardar ambos documentos. Puedes reintentarlo desde Credenciales.'
        }
      }
    } else if (role === 'tutor') {
      credentialsPendingConfirmation = true
    }
    return {
      ok: true,
      emailConfirmationRequired: !data.session,
      credentialsPendingConfirmation,
      warning,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No se pudo crear la cuenta.',
    }
  }
}

export async function logout() {
  const { error } = await getSupabaseClient().auth.signOut()
  if (error) throw new Error(`No se pudo cerrar la sesión: ${error.message}`)
  currentSession = null
  emitChange()
}

export function uploadVerificationDocument(file: { name: string; type: string; size: number }) {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png']
  if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) {
    return { ok: false, error: 'Usa un archivo PDF, JPG o PNG de máximo 10 MB.' }
  }
  return { ok: true, storedName: file.name }
}

export const supabaseAuthService: AuthService = {
  getSession,
  getDemoCredentials,
  loginWithPassword,
  verifyAdminTwoFactor,
  register,
  logout,
}
