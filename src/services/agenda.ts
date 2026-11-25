import { getSupabaseClient } from './supabase'
import type {
  ClassBookingRecord,
  ClassMode,
  ClassNotificationRecord,
  TutorWeeklyAvailability,
} from '../types'

export interface WeeklyAvailabilityRule {
  weekdays: number[]
  startTime: string
  endTime: string
  mode: ClassMode
}

export interface AvailableClassSlot {
  startsAt: string
  mode: ClassMode
}

interface AvailabilityRow {
  id: string
  weekday: number
  start_time: string
  mode: string
}

interface AvailableSlotRow {
  starts_at: string
  mode: string
}

interface ClassBookingRow {
  id: string
  tutor_user_id: string
  student_user_id: string
  tutor_name: string
  student_name: string
  subject: string
  starts_at: string
  ends_at: string
  mode: string
  location: string | null
  status: string
  cancellation_reason: string | null
  cancelled_by: string | null
  reschedule_proposed_by: string | null
  proposed_starts_at: string | null
  proposed_mode: string | null
  proposed_location: string | null
}

interface ClassNotificationRow {
  id: string
  booking_id: string
  event_type: string
  title: string
  message: string
  created_at: string
  read_at: string | null
}

function throwOnError(error: { message: string } | null, operation: string): void {
  if (error) throw new Error(`${operation}: ${error.message}`)
}

function isClassMode(mode: string): mode is ClassMode {
  return mode === 'Presencial' || mode === 'En línea'
}

function toBookingStatus(status: string): ClassBookingRecord['status'] {
  if (
    status === 'pending_confirmation' ||
    status === 'confirmed' ||
    status === 'rejected' ||
    status === 'cancelled' ||
    status === 'reschedule_pending' ||
    status === 'completed'
  ) {
    return status
  }
  throw new Error('Supabase devolvió un estado de reserva no reconocido.')
}

function toClassBooking(row: ClassBookingRow): ClassBookingRecord {
  if (!isClassMode(row.mode)) {
    throw new Error('Supabase devolvió una modalidad de clase no reconocida.')
  }
  if (row.proposed_mode !== null && !isClassMode(row.proposed_mode)) {
    throw new Error('Supabase devolvió una modalidad de reprogramación no reconocida.')
  }
  return {
    id: row.id,
    tutorUserId: row.tutor_user_id,
    studentUserId: row.student_user_id,
    tutorName: row.tutor_name,
    studentName: row.student_name,
    subject: row.subject,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    mode: row.mode,
    location: row.location,
    status: toBookingStatus(row.status),
    cancellationReason: row.cancellation_reason,
    cancelledBy: row.cancelled_by,
    rescheduleProposedBy: row.reschedule_proposed_by,
    proposedStartsAt: row.proposed_starts_at,
    proposedMode: row.proposed_mode,
    proposedLocation: row.proposed_location,
  }
}

function toClassNotification(row: ClassNotificationRow): ClassNotificationRecord {
  return {
    id: row.id,
    bookingId: row.booking_id,
    eventType: row.event_type,
    title: row.title,
    message: row.message,
    createdAt: row.created_at,
    readAt: row.read_at,
  }
}

export async function listTutorWeeklyAvailability(
  tutorUserId: string,
): Promise<TutorWeeklyAvailability[]> {
  const { data, error } = await getSupabaseClient()
    .from('tutor_weekly_availability')
    .select('id, weekday, start_time, mode')
    .eq('tutor_user_id', tutorUserId)
    .order('weekday')
    .order('start_time')
  throwOnError(error, 'No se pudo cargar la disponibilidad semanal')

  const rows: AvailabilityRow[] = data ?? []
  return rows.map((row) => {
    if (!isClassMode(row.mode)) {
      throw new Error('Supabase devolvió una modalidad de disponibilidad no reconocida.')
    }
    return {
      id: row.id,
      weekday: row.weekday,
      startTime: row.start_time.slice(0, 5),
      mode: row.mode,
    }
  })
}

export async function saveTutorWeeklyAvailability(
  rule: WeeklyAvailabilityRule,
): Promise<void> {
  const { error } = await getSupabaseClient().rpc('save_tutor_weekly_availability', {
    p_weekdays: rule.weekdays,
    p_start_time: rule.startTime,
    p_end_time: rule.endTime,
    p_mode: rule.mode,
  })
  throwOnError(error, 'No se pudo guardar la disponibilidad')
}

export async function deleteTutorWeeklyAvailability(slotId: string): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from('tutor_weekly_availability')
    .delete()
    .eq('id', slotId)
    .select('id')
    .maybeSingle()
  throwOnError(error, 'No se pudo eliminar el horario')
  if (!data) throw new Error('No se encontró el horario para eliminar.')
}

export async function listAvailableTutorSlots(
  tutorUserId: string,
): Promise<AvailableClassSlot[]> {
  const { data, error } = await getSupabaseClient().rpc('list_tutor_available_slots', {
    p_tutor_user_id: tutorUserId,
    p_days: 30,
  })
  throwOnError(error, 'No se pudieron cargar los horarios disponibles')

  const rows: AvailableSlotRow[] = data ?? []
  return rows.map((row) => {
    if (!isClassMode(row.mode)) {
      throw new Error('Supabase devolvió una modalidad de reserva no reconocida.')
    }
    return { startsAt: row.starts_at, mode: row.mode }
  })
}

export async function requestTutorClassBooking(input: {
  tutorUserId: string
  startsAt: string
  subject: string
  mode: ClassMode
  location: string | null
}): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('request_class_booking', {
    p_tutor_user_id: input.tutorUserId,
    p_starts_at: input.startsAt,
    p_subject: input.subject,
    p_mode: input.mode,
    p_location: input.location,
  })
  throwOnError(error, 'No se pudo enviar la solicitud de reserva')
  if (typeof data !== 'string' || data.length === 0) {
    throw new Error('Supabase no devolvió el identificador de la solicitud.')
  }
  return data
}

export async function listMyClassBookings(): Promise<ClassBookingRecord[]> {
  const { data, error } = await getSupabaseClient().rpc('list_my_class_bookings')
  throwOnError(error, 'No se pudieron cargar las solicitudes de reserva')
  const rows: ClassBookingRow[] = data ?? []
  return rows.map(toClassBooking)
}

export async function respondToClassBooking(
  bookingId: string,
  response: Extract<ClassBookingRecord['status'], 'confirmed' | 'rejected'>,
): Promise<void> {
  const { error } = await getSupabaseClient().rpc('respond_to_class_booking', {
    p_booking_id: bookingId,
    p_status: response,
  })
  throwOnError(error, 'No se pudo actualizar la solicitud de reserva')
}

export async function cancelClassBooking(bookingId: string, reason: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc('cancel_class_booking', {
    p_booking_id: bookingId,
    p_reason: reason.trim() || null,
  })
  throwOnError(error, 'No se pudo cancelar la clase')
}

export async function listClassRescheduleSlots(
  bookingId: string,
): Promise<AvailableClassSlot[]> {
  const { data, error } = await getSupabaseClient().rpc('list_class_reschedule_slots', {
    p_booking_id: bookingId,
  })
  throwOnError(error, 'No se pudieron cargar horarios para reprogramar')
  const rows: AvailableSlotRow[] = data ?? []
  return rows.map((row) => {
    if (!isClassMode(row.mode)) {
      throw new Error('Supabase devolvió una modalidad de reprogramación no reconocida.')
    }
    return { startsAt: row.starts_at, mode: row.mode }
  })
}

export async function proposeClassReschedule(input: {
  bookingId: string
  startsAt: string
  mode: ClassMode
  location: string | null
}): Promise<void> {
  const { error } = await getSupabaseClient().rpc('propose_class_reschedule', {
    p_booking_id: input.bookingId,
    p_starts_at: input.startsAt,
    p_mode: input.mode,
    p_location: input.location,
  })
  throwOnError(error, 'No se pudo enviar la propuesta de reprogramación')
}

export async function respondToClassReschedule(
  bookingId: string,
  response: 'accept' | 'reject',
): Promise<void> {
  const { error } = await getSupabaseClient().rpc('respond_to_class_reschedule', {
    p_booking_id: bookingId,
    p_response: response,
  })
  throwOnError(error, 'No se pudo responder a la reprogramación')
}

export async function completeClassBooking(bookingId: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc('complete_class_booking', {
    p_booking_id: bookingId,
  })
  throwOnError(error, 'No se pudo marcar la clase como realizada')
}

export async function listMyClassNotifications(): Promise<ClassNotificationRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('class_notifications')
    .select('id, booking_id, event_type, title, message, created_at, read_at')
    .order('created_at', { ascending: false })
    .limit(30)
  throwOnError(error, 'No se pudieron cargar las notificaciones')
  const rows: ClassNotificationRow[] = data ?? []
  return rows.map(toClassNotification)
}

export async function markClassNotificationRead(notificationId: string): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from('class_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select('id')
    .maybeSingle()
  throwOnError(error, 'No se pudo marcar la notificación como leída')
  if (!data) throw new Error('No se encontró la notificación para actualizar.')
}
