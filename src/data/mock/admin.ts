import type {
  AdminPaymentRow,
  AdminUserRecord,
  ReportedProfileRecord,
  ReportedReviewRecord,
  VerificationRecord,
} from '../../types'

export const INITIAL_USERS: AdminUserRecord[] = []
export const INITIAL_VERIFICATIONS: VerificationRecord[] = []
export const INITIAL_REPORTED_PROFILES: ReportedProfileRecord[] = []
export const INITIAL_REPORTED_REVIEWS: ReportedReviewRecord[] = []
export const INITIAL_ADMIN_PAYMENTS: AdminPaymentRow[] = []

export const DESIGN_SYSTEM_COLORS: [string, string][] = [
  ['Negro #111111', '#111111'],
  ['Gris 700', '#3f3f46'],
  ['Gris 600', '#52525b'],
  ['Gris 500', '#6b6b73'],
  ['Gris 300', '#d4d4d8'],
  ['Gris 200', '#e4e4e7'],
  ['Gris 100', '#f4f4f5'],
  ['Blanco', '#ffffff'],
]

export const DESIGN_SYSTEM_SEMANTICS: [string, string, string, string][] = [
  ['Éxito', '#166534', '#dcfce7', 'Confirmada'],
  ['Pendiente', '#92400e', '#fef3c7', 'Pendiente'],
  ['Error', '#b91c1c', '#fee2e2', 'Cancelada'],
  ['Información', '#1d4ed8', '#dbeafe', 'Retenido'],
]
