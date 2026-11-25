import { getSupabaseClient } from './supabase'
import type { TutorData } from '../types'

export type StudentPreferredMode = 'Presencial' | 'En línea' | 'Presencial y en línea'
export type TutorClassMode = 'Presencial' | 'En línea'
export type TutorCredentialKind = 'title' | 'license'

export interface StudentProfileRecord {
  career: string | null
  preferredMode: StudentPreferredMode | null
  serviceZone: string | null
  photoUrl: string | null
}

export interface TutorProfileRecord {
  biography: string | null
  subjects: string[]
  educationLevel: string | null
  hourlyRateMxn: number | null
  classModes: TutorClassMode[]
  serviceZone: string | null
  travelRadiusKm: number | null
  titleDocumentPath: string | null
  licenseDocumentPath: string | null
  verificationStatus: 'pending' | 'in_review' | 'verified' | 'rejected'
  verificationRejectionReason: string | null
  photoUrl: string | null
}

export type TutorCredentialReviewStatus = TutorProfileRecord['verificationStatus']

export interface TutorCredentialReviewRecord {
  userId: string
  tutorName: string
  subjects: string[]
  educationLevel: string | null
  titleDocumentPath: string | null
  licenseDocumentPath: string | null
  verificationStatus: TutorCredentialReviewStatus
  submittedAt: string | null
  reviewedAt: string | null
  rejectionReason: string | null
}

export interface TutorProfileUpdate {
  biography: string
  subjects: string[]
  educationLevel: string
  hourlyRateMxn: number
  classModes: TutorClassMode[]
  serviceZone: string
  travelRadiusKm: number
}

interface PublishedTutorRow {
  user_id: string
  full_name: string
  avatar_path: string | null
  biography: string
  subjects: string[]
  education_level: string | null
  hourly_rate_mxn: number
  class_modes: string[]
  service_zone: string
}

const CREDENTIALS_BUCKET = 'tutor-credentials'
const STUDENT_AVATARS_BUCKET = 'student-avatars'
const TUTOR_AVATARS_BUCKET = 'tutor-avatars'
const ALLOWED_DOCUMENT_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

function throwOnError(error: { message: string } | null, operation: string): void {
  if (error) throw new Error(`${operation}: ${error.message}`)
}

export async function getStudentProfile(userId: string): Promise<StudentProfileRecord> {
  const supabase = getSupabaseClient()
  const [studentResult, userResult] = await Promise.all([
    supabase
      .from('student_profiles')
      .select('career, preferred_mode, service_zone')
      .eq('user_id', userId)
      .single(),
    supabase.from('profiles').select('avatar_path').eq('id', userId).single(),
  ])
  throwOnError(studentResult.error, 'No se pudo cargar el perfil del alumno')
  throwOnError(userResult.error, 'No se pudo cargar la foto del perfil')
  if (!studentResult.data) throw new Error('No se encontró el perfil del alumno.')
  if (!userResult.data) throw new Error('No se encontró la cuenta del alumno.')
  const photoUrl = await getProfilePhotoUrl(STUDENT_AVATARS_BUCKET, userResult.data.avatar_path)
  return {
    career: studentResult.data.career,
    preferredMode: studentResult.data.preferred_mode,
    serviceZone: studentResult.data.service_zone,
    photoUrl,
  }
}

async function getProfilePhotoUrl(bucket: string, path: string | null): Promise<string | null> {
  if (!path) return null
  const { data, error } = await getSupabaseClient()
    .storage.from(bucket)
    .createSignedUrl(path, 3600)
  throwOnError(error, 'No se pudo abrir la foto del perfil')
  if (!data) throw new Error('Supabase no devolvió el enlace de la foto.')
  return data.signedUrl
}

export async function uploadStudentProfilePhoto(
  userId: string,
  file: File,
): Promise<{ photoUrl: string; warning?: string }> {
  return uploadProfilePhoto(userId, file, STUDENT_AVATARS_BUCKET)
}

export async function uploadTutorProfilePhoto(
  userId: string,
  file: File,
): Promise<{ photoUrl: string; warning?: string }> {
  return uploadProfilePhoto(userId, file, TUTOR_AVATARS_BUCKET)
}

async function uploadProfilePhoto(
  userId: string,
  file: File,
  bucket: string,
): Promise<{ photoUrl: string; warning?: string }> {
  const extension = ALLOWED_AVATAR_TYPES[file.type]
  if (!extension || file.size > MAX_AVATAR_BYTES) {
    throw new Error('Usa una imagen JPG, PNG o WebP de máximo 5 MB.')
  }

  const supabase = getSupabaseClient()
  const { data: currentProfile, error: readError } = await supabase
    .from('profiles')
    .select('avatar_path')
    .eq('id', userId)
    .single()
  throwOnError(readError, 'No se pudo consultar la foto actual')
  if (!currentProfile) throw new Error('No se encontró la cuenta del alumno.')

  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const storage = supabase.storage.from(bucket)
  const { error: uploadError } = await storage.upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  throwOnError(uploadError, 'No se pudo subir la foto')

  const { data: signedUrlData, error: signedUrlError } = await storage.createSignedUrl(path, 3600)
  if (signedUrlError || !signedUrlData) {
    const cleanup = await storage.remove([path])
    const cleanupMessage = cleanup.error ? ` No se pudo eliminar la carga temporal: ${cleanup.error.message}` : ''
    throw new Error(
      `No se pudo preparar la foto para mostrarla: ${signedUrlError?.message ?? 'enlace no disponible'}.${cleanupMessage}`,
    )
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_path: path })
    .eq('id', userId)
    .select('id')
    .maybeSingle()
  if (updateError || !updatedProfile) {
    const cleanup = await storage.remove([path])
    const updateMessage = updateError?.message ?? 'No se encontró la cuenta del alumno.'
    const cleanupMessage = cleanup.error ? ` Tampoco se pudo eliminar la carga temporal: ${cleanup.error.message}` : ''
    throw new Error(`No se pudo guardar la foto del perfil: ${updateMessage}.${cleanupMessage}`)
  }

  if (currentProfile.avatar_path) {
    const { error: cleanupError } = await storage.remove([currentProfile.avatar_path])
    if (cleanupError) {
      return {
        photoUrl: signedUrlData.signedUrl,
        warning: `La foto se actualizó, pero no se pudo eliminar la anterior: ${cleanupError.message}`,
      }
    }
  }
  return { photoUrl: signedUrlData.signedUrl }
}

export async function updateStudentProfile(
  userId: string,
  profile: Pick<StudentProfileRecord, 'career' | 'preferredMode' | 'serviceZone'> & { fullName: string },
): Promise<void> {
  const { error } = await getSupabaseClient().rpc('update_student_account', {
    profile_name: profile.fullName,
    profile_career: profile.career,
    profile_preferred_mode: profile.preferredMode,
    profile_service_zone: profile.serviceZone,
    p_user_id: userId,
  })
  throwOnError(error, 'No se pudo guardar el perfil del alumno')
}

export async function getTutorProfile(userId: string): Promise<TutorProfileRecord> {
  const { data, error } = await getSupabaseClient()
    .from('tutor_profiles')
    .select(
      'biography, subjects, education_level, hourly_rate_mxn, class_modes, service_zone, travel_radius_km, title_document_path, license_document_path, verification_status, verification_rejection_reason',
    )
    .eq('user_id', userId)
    .single()
  throwOnError(error, 'No se pudo cargar el perfil del tutor')
  if (!data) throw new Error('No se encontró el perfil del tutor.')
  const { data: userProfile, error: userProfileError } = await getSupabaseClient()
    .from('profiles')
    .select('avatar_path')
    .eq('id', userId)
    .single()
  throwOnError(userProfileError, 'No se pudo cargar la foto del perfil del tutor')
  if (!userProfile) throw new Error('No se encontró la cuenta del tutor.')
  const photoUrl = await getProfilePhotoUrl(TUTOR_AVATARS_BUCKET, userProfile.avatar_path)
  return {
    biography: data.biography,
    subjects: data.subjects,
    educationLevel: data.education_level,
    hourlyRateMxn: data.hourly_rate_mxn,
    classModes: data.class_modes,
    serviceZone: data.service_zone,
    travelRadiusKm: data.travel_radius_km,
    titleDocumentPath: data.title_document_path,
    licenseDocumentPath: data.license_document_path,
    verificationStatus: data.verification_status,
    verificationRejectionReason: data.verification_rejection_reason,
    photoUrl,
  }
}

export async function listTutorCredentialReviews(): Promise<TutorCredentialReviewRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('tutor_profiles')
    .select(
      'user_id, subjects, education_level, title_document_path, license_document_path, verification_status, credential_submitted_at, verification_reviewed_at, verification_rejection_reason, profiles!inner(full_name)',
    )
    .or('title_document_path.not.is.null,license_document_path.not.is.null')
    .order('credential_submitted_at', { ascending: true })
  throwOnError(error, 'No se pudieron cargar los expedientes de tutores')

  const rows: {
    user_id: string
    subjects: string[]
    education_level: string | null
    title_document_path: string | null
    license_document_path: string | null
    verification_status: string
    credential_submitted_at: string | null
    verification_reviewed_at: string | null
    verification_rejection_reason: string | null
    profiles: { full_name: string } | { full_name: string }[]
  }[] = data ?? []

  return rows.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    if (!profile?.full_name) {
      throw new Error('No se encontró el nombre de un tutor en su expediente.')
    }
    if (
      row.verification_status !== 'pending' &&
      row.verification_status !== 'in_review' &&
      row.verification_status !== 'verified' &&
      row.verification_status !== 'rejected'
    ) {
      throw new Error('Supabase devolvió un estado de verificación no reconocido.')
    }

    return {
      userId: row.user_id,
      tutorName: profile.full_name,
      subjects: row.subjects,
      educationLevel: row.education_level,
      titleDocumentPath: row.title_document_path,
      licenseDocumentPath: row.license_document_path,
      verificationStatus: row.verification_status,
      submittedAt: row.credential_submitted_at,
      reviewedAt: row.verification_reviewed_at,
      rejectionReason: row.verification_rejection_reason,
    }
  })
}

export async function reviewTutorCredentials(
  tutorUserId: string,
  status: Extract<TutorCredentialReviewStatus, 'verified' | 'rejected'>,
  rejectionReason?: string,
): Promise<void> {
  const { error } = await getSupabaseClient().rpc('review_tutor_credentials', {
    p_tutor_user_id: tutorUserId,
    p_status: status,
    p_rejection_reason: rejectionReason ?? null,
  })
  throwOnError(error, 'No se pudo guardar la decisión de verificación')
}

export async function listPublishedTutors(): Promise<TutorData[]> {
  const { data, error } = await getSupabaseClient().rpc('list_published_tutors')
  throwOnError(error, 'No se pudo consultar la lista de tutores publicados')

  const rows: PublishedTutorRow[] = data ?? []
  return Promise.all(rows.map(async (row) => {
    const modes = row.class_modes.filter(
      (mode): mode is TutorClassMode => mode === 'Presencial' || mode === 'En línea',
    )
    if (!row.user_id || !row.full_name || !row.hourly_rate_mxn || modes.length === 0) {
      throw new Error('Supabase devolvió un perfil público de tutor incompleto.')
    }

    return {
      id: row.user_id,
      name: row.full_name,
      first: row.full_name.trim().split(/\s+/)[0] ?? row.full_name,
      photo: row.avatar_path
        ? await getProfilePhotoUrl(TUTOR_AVATARS_BUCKET, row.avatar_path) ?? ''
        : '',
      subjects: row.subjects,
      subjectLevels: row.subjects.map((subject) => [
        subject,
        row.education_level ? [row.education_level] : [],
      ]),
      rate: Number(row.hourly_rate_mxn),
      rating: 0,
      reviewsCount: 0,
      dist: [],
      verified: true,
      modes,
      zone: row.service_zone,
      km: null,
      about: row.biography,
      degrees: [],
      schedule: {},
      quickSlots: [],
      reviews: [],
    }
  }))
}

export async function updateTutorProfile(
  userId: string,
  profile: TutorProfileUpdate,
): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from('tutor_profiles')
    .update({
      biography: profile.biography,
      subjects: profile.subjects,
      education_level: profile.educationLevel,
      hourly_rate_mxn: profile.hourlyRateMxn,
      class_modes: profile.classModes,
      service_zone: profile.serviceZone,
      travel_radius_km: profile.travelRadiusKm,
    })
    .eq('user_id', userId)
    .select('user_id')
    .maybeSingle()
  throwOnError(error, 'No se pudo guardar el perfil del tutor')
  if (!data) throw new Error('No se encontró el perfil del tutor para actualizar.')
}

export async function uploadTutorCredential(
  userId: string,
  kind: TutorCredentialKind,
  file: File,
): Promise<string> {
  if (!ALLOWED_DOCUMENT_TYPES.has(file.type) || file.size > MAX_DOCUMENT_BYTES) {
    throw new Error('Usa un archivo PDF, JPG o PNG de máximo 10 MB.')
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${userId}/${kind}/${crypto.randomUUID()}-${safeName}`
  const supabase = getSupabaseClient()
  const { error: uploadError } = await supabase.storage
    .from(CREDENTIALS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  throwOnError(uploadError, 'No se pudo subir el documento')

  const documentColumn =
    kind === 'title' ? 'title_document_path' : 'license_document_path'
  const { data, error: updateError } = await supabase
    .from('tutor_profiles')
    .update({ [documentColumn]: path })
    .eq('user_id', userId)
    .select('user_id')
    .maybeSingle()

  if (updateError || !data) {
    const cleanup = await supabase.storage.from(CREDENTIALS_BUCKET).remove([path])
    const failure = updateError?.message ?? 'No se encontró el perfil del tutor.'
    const cleanupFailure = cleanup.error?.message
    throw new Error(
      cleanupFailure
        ? `No se pudo guardar la ruta del documento: ${failure}. También falló su eliminación: ${cleanupFailure}`
        : `No se pudo guardar la ruta del documento: ${failure}`,
    )
  }

  return path
}

export async function createTutorCredentialUrl(path: string): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .storage.from(CREDENTIALS_BUCKET)
    .createSignedUrl(path, 60)
  throwOnError(error, 'No se pudo abrir el documento privado')
  if (!data) throw new Error('Supabase no devolvió el enlace privado del documento.')
  return data.signedUrl
}
