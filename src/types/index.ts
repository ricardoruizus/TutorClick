import type { MapPin } from 'lucide-react'

export type UserRole = 'alumno' | 'tutor'
export type AuthRole = UserRole | 'admin'
export type PortalPath = '/' | '/tutor' | '/admin'
export type ClassMode = 'Presencial' | 'En línea'
export type PreferredMode = 'En línea' | 'Presencial' | 'Presencial y en línea'

export type ClassStatus =
  | 'Confirmada'
  | 'Reprogramación propuesta'
  | 'En curso'
  | 'Finalizada'
  | 'Cancelada'
  | 'En disputa'

export type PaymentStatus = 'Retenido' | 'Liberado' | 'Reembolsado' | 'En disputa'

/* -------------------- Modelos de dominio principales -------------------- */

export interface Usuario {
  id: string
  name: string
  email: string
  role: 'Alumno' | 'Tutor' | 'Admin'
  status: 'Activo' | 'En revisión' | 'Suspendido'
  joined?: string
}

export interface Reseña {
  id?: string
  name: string
  stars: number
  when: string
  subject: string
  text: string
}
export type Resena = Reseña
export type ReviewItem = Reseña

export interface QuickSlot {
  label: string
  day: number
  time: string
}

export interface Tutor {
  id: string
  name: string
  first: string
  photo: string
  subjects: string[]
  subjectLevels: [string, string[]][]
  rate: number
  rating: number
  reviewsCount: number
  dist: number[]
  verified: boolean
  modes: ClassMode[]
  zone: string
  km: number | null
  pin?: [number, number]
  about: string
  degrees: { t: string; s: string; verified: boolean }[]
  schedule: Record<number, string[]>
  quickSlots: QuickSlot[]
  reviews: Reseña[]
}
export type TutorData = Tutor

export interface SearchTutorSummary {
  id: string
  name: string
  subjects: string[]
  rate: number
  rating: number
  reviews: number
  verified: boolean
  modes: ClassMode[]
  km: number | null
  photo: string
  pin?: [number, number]
}

export interface ProfileViewData {
  id: string
  name: string
  first: string
  photo: string
  verified: boolean
  rating: number
  reviewCount: number
  dist: number[]
  rate: number
  modes: string
  modeIcon: typeof MapPin
  zone: string
  about: string
  subjects: [string, string[]][]
  degrees: { t: string; s: string; verified: boolean }[]
  slots: string[]
  reviews: Reseña[]
}

export interface Alumno {
  id: string
  name: string
  photo: string
  career: string | null
  preferredMode: PreferredMode | null
  zone: string | null
  email: string
}
export type StudentProfileData = Alumno

export interface PropuestaReprogramacion {
  proposedBy: UserRole
  proposedDay: number
  proposedTime: string
  proposalMessage?: string
}

export interface Serie {
  id: string
  studentId: string
  tutorId: string
  subject: string
  kind: 'weekly' | 'package'
  totalSessions: number
  packageDiscount?: number
  expiresAt?: string
}

export interface Pago {
  id: string
  reservationId: string
  studentName: string
  tutorName: string
  amountMxn: number
  serviceFeeMxn: number
  tutorCommissionMxn: number
  tutorNetMxn: number
  status: PaymentStatus
  cardUsed: string
  seriesNote?: string
}

export interface Disputa {
  id: string
  paymentId: string
  reservationId: string
  studentName: string
  tutorName: string
  retainedAmountMxn: number
  status: PaymentStatus
  suggestedResolution: string
  resolutionNote?: string
}

export interface Mensaje {
  id: string
  sender: UserRole
  text: string
  time: string
  read: boolean
  attachmentName?: string
}
export type ChatMessage = Mensaje

export interface ConversationThread {
  id: string
  studentId: string
  studentName: string
  tutorId: string
  tutorName: string
  tutorPhoto: string
  subject: string
  sessionId: string
  unreadForStudent: number
  unreadForTutor: number
  messages: Mensaje[]
}

export interface Sesión {
  id: string
  paymentId: string
  studentId: string
  studentName: string
  tutorId: string
  tutorName: string
  tutorPhoto: string
  subject: string
  day: number
  monthLabel?: string
  time: string
  mode: ClassMode
  locationOrLink: string
  hourlyRate: number
  status: ClassStatus
  paymentStatus: PaymentStatus
  cardUsed: string
  startsSoon?: boolean
  within24h?: boolean
  isNewForTutor?: boolean
  checkedInAt?: string
  studentJoined?: boolean
  seriesId?: string
  seriesIndex?: number
  seriesTotal?: number
  bookingKind?: 'single' | 'weekly' | 'package'
  packageDiscount?: number
  packageExpiresAt?: string
  proposedBy?: UserRole
  proposedDay?: number
  proposedTime?: string
  proposalMessage?: string
  ratingGiven?: number
  reviewTags?: string[]
  reviewComment?: string
  disputeId?: string
  reportReason?: string
  reportDescription?: string
  reportAttachment?: string
  cancellationReason?: string
  refundAmount?: number
  readOnlyNote?: string
}
export type Sesion = Sesión
export type ClassSession = Sesión

export interface AvailabilityBlock {
  id: string
  tutorId: string
  day: number
  time: string
  state: 'disponible' | 'bloqueado'
  mode?: ClassMode
}

export interface SavedCardItem {
  id: string
  brand: string
  last4: string
  expiry: string
  holder: string
  isDefault: boolean
}

export interface NotificationPrefs {
  bookingConfirmed: boolean
  reminder24h: boolean
  reminder1h: boolean
  rescheduleProposed: boolean
  refundIssued: boolean
  pushEnabled: boolean
  emailEnabled: boolean
}

export interface SavedPaymentState {
  method: 'saved' | 'new'
  cardNumber: string
  expiry: string
  cvv: string
  holder: string
}

export interface AdminUserRecord {
  id: string
  name: string
  email: string
  role: 'Alumno' | 'Tutor'
  status: 'Activo' | 'En revisión' | 'Suspendido'
  joined: string
  classes: number
  reports: number
}

export interface VerificationRecord {
  id: string
  tutor: string
  subject: string
  ageHours: number
  institution: string
  license: string
  status: 'En revisión' | 'Verificado' | 'Rechazado'
}

export interface ReportedProfileRecord {
  id: string
  name: string
  reports: number
  issue: string
  evidence: string
  source: string
}

export interface ReportedReviewRecord {
  id: string
  author: string
  tutor: string
  reports: number
  text: string
  issue: string
}

export interface AdminPaymentRow {
  payment: string
  reservation: string
  people: string
  amount: string
  status: PaymentStatus
  series?: string
}
