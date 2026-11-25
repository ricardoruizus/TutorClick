import type {
  AdminPaymentRow,
  AdminUserRecord,
  ReportedProfileRecord,
  ReportedReviewRecord,
  VerificationRecord,
} from '../../types'

export const INITIAL_USERS: AdminUserRecord[] = [
  { id: 'USR-0001', name: 'Sofía Mena', email: 'sofia.mena@correo.mx', role: 'Alumno', status: 'Activo', joined: '23 nov 2026', classes: 8, reports: 1 },
  { id: 'USR-0002', name: 'Carlos Chan', email: 'carlos.chan@correo.mx', role: 'Tutor', status: 'En revisión', joined: '22 nov 2026', classes: 42, reports: 0 },
  { id: 'USR-0003', name: 'Luis Pérez', email: 'luis.perez@correo.mx', role: 'Tutor', status: 'Activo', joined: '18 nov 2026', classes: 26, reports: 1 },
  { id: 'USR-0004', name: 'Valeria Ortiz', email: 'valeria.ortiz@correo.mx', role: 'Tutor', status: 'Activo', joined: '12 nov 2026', classes: 61, reports: 0 },
  { id: 'USR-0006', name: 'Mateo Fernández', email: 'mateo.fernandez@correo.mx', role: 'Alumno', status: 'Suspendido', joined: '9 nov 2026', classes: 5, reports: 2 },
  { id: 'USR-0007', name: 'Camila Soto', email: 'camila.soto@correo.mx', role: 'Alumno', status: 'Activo', joined: '3 nov 2026', classes: 11, reports: 0 },
]

export const INITIAL_VERIFICATIONS: VerificationRecord[] = [
  { id: 'VER-1024', tutor: 'Carlos Chan', subject: 'Matemáticas y Física', ageHours: 52, institution: 'Universidad Autónoma de Yucatán', license: 'Cédula 10824576', status: 'En revisión' },
  { id: 'VER-1025', tutor: 'Valeria Ortiz', subject: 'Programación', ageHours: 18, institution: 'Universidad Autónoma de Yucatán', license: 'Cédula 11482931', status: 'En revisión' },
  { id: 'VER-1026', tutor: 'Jorge Mora', subject: 'Inglés', ageHours: 37, institution: 'Universidad Modelo', license: 'Cédula 12145782', status: 'En revisión' },
]

export const INITIAL_REPORTED_PROFILES: ReportedProfileRecord[] = [
  { id: 'REP-2041', name: 'Martín Alcocer', reports: 4, issue: 'Contacto fuera de TutorClick', evidence: '“Escríbeme al 999 123 4567 para pagar menos.”', source: 'Descripción pública del perfil' },
  { id: 'REP-2038', name: 'Renata Solís', reports: 2, issue: 'Información engañosa', evidence: 'Afirma contar con una certificación que no aparece en su expediente.', source: 'Perfil y expediente de verificación' },
]

export const INITIAL_REPORTED_REVIEWS: ReportedReviewRecord[] = [
  { id: 'RES-1001', author: 'Sofía Mena', tutor: 'Carlos Chan', reports: 3, text: 'No asistió y después compartió el teléfono 999 876 5432 en el chat.', issue: 'Datos personales' },
  { id: 'RES-1048', author: 'Camila Soto', tutor: 'Valeria Ortiz', reports: 1, text: 'La explicación fue apresurada y no resolvió mis dudas.', issue: 'Crítica honesta' },
]

export const INITIAL_ADMIN_PAYMENTS: AdminPaymentRow[] = [
  { payment: 'PAG-7001', reservation: 'RES-1001', people: 'Sofía Mena · Carlos Chan', amount: '$275.00', status: 'En disputa', series: 'Serie semanal · clase 2 de 4 en disputa' },
  { payment: 'PAG-7002', reservation: 'RES-1008', people: 'Mateo Fernández · Luis Pérez', amount: '$220.00', status: 'Liberado' },
  { payment: 'PAG-7003', reservation: 'RES-1012', people: 'Camila Soto · Valeria Ortiz', amount: '$330.00', status: 'Retenido' },
  { payment: 'PAG-6998', reservation: 'RES-0994', people: 'Sofía Mena · Jorge Mora', amount: '$198.00', status: 'Reembolsado' },
]

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
