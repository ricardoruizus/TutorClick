import type { ConversationThread, Mensaje, UserRole } from '../types'
import { getSupabaseClient } from './supabase'

export interface EnsureThreadMeta {
  studentId: string
  studentName: string
  tutorId: string
  tutorName: string
  tutorPhoto: string
  subject: string
  sessionId: string
}

interface ConversationRow {
  id: string
  student_user_id: string
  tutor_user_id: string
  student_name: string
  tutor_name: string
  subject: string
  linked_session_id: string
}

interface ConversationMessageRow {
  id: string
  conversation_id: string
  sender_user_id: string
  content: string
  attachment_name: string | null
  created_at: string
  read_at: string | null
}

function throwOnError(error: { message: string } | null, operation: string): void {
  if (error) throw new Error(`${operation}: ${error.message}`)
}

function formatMessageTime(timestamp: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Merida',
  }).format(new Date(timestamp))
}

function toMessage(
  row: ConversationMessageRow,
  conversation: ConversationRow,
): Mensaje {
  const sender: UserRole | null = row.sender_user_id === conversation.student_user_id
    ? 'alumno'
    : row.sender_user_id === conversation.tutor_user_id
      ? 'tutor'
      : null
  if (!sender) throw new Error('Supabase devolvió un mensaje de una persona ajena a la conversación.')

  return {
    id: row.id,
    sender,
    text: row.content,
    time: formatMessageTime(row.created_at),
    read: row.read_at !== null,
    attachmentName: row.attachment_name ?? undefined,
  }
}

export function detectExternalContact(message: string): {
  hasPhone: boolean
  hasExternalLink: boolean
} {
  const digitsOnly = message.replace(/\D/g, '')
  const hasPhone =
    digitsOnly.length >= 8 ||
    /\b\d{3}[-\s.]?\d{3}[-\s.]?\d{2,4}\b/.test(message) ||
    /\bwhatsapp\b|\bcel\b|\btel[eé]fono\b/i.test(message)

  const urlMatches =
    message.match(
      /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9-]+\.(com|mx|net|org|io|me|us|gg)\b[^\s]*)/gi,
    ) ?? []
  const hasExternalLink = urlMatches.some(
    (match) => !match.toLowerCase().includes('tutorclick.mx'),
  )

  return { hasPhone, hasExternalLink }
}

export async function listMyConversations(): Promise<ConversationThread[]> {
  const supabase = getSupabaseClient()
  const { data: conversationData, error: conversationError } = await supabase
    .from('conversations')
    .select(
      'id, student_user_id, tutor_user_id, student_name, tutor_name, subject, linked_session_id',
    )
    .order('last_message_at', { ascending: false })
  throwOnError(conversationError, 'No se pudieron cargar las conversaciones')

  const conversations: ConversationRow[] = conversationData ?? []
  if (conversations.length === 0) return []

  const { data: messageData, error: messageError } = await supabase
    .from('conversation_messages')
    .select('id, conversation_id, sender_user_id, content, attachment_name, created_at, read_at')
    .in('conversation_id', conversations.map((conversation) => conversation.id))
    .order('created_at', { ascending: true })
  throwOnError(messageError, 'No se pudieron cargar los mensajes')

  const messages: ConversationMessageRow[] = messageData ?? []
  const messagesByConversation = new Map<string, ConversationMessageRow[]>()
  for (const message of messages) {
    const conversationMessages = messagesByConversation.get(message.conversation_id) ?? []
    conversationMessages.push(message)
    messagesByConversation.set(message.conversation_id, conversationMessages)
  }

  return conversations.map((conversation) => {
    const conversationMessages = messagesByConversation.get(conversation.id) ?? []
    return {
      id: conversation.id,
      studentId: conversation.student_user_id,
      studentName: conversation.student_name,
      tutorId: conversation.tutor_user_id,
      tutorName: conversation.tutor_name,
      tutorPhoto: '',
      subject: conversation.subject,
      sessionId: conversation.linked_session_id,
      unreadForStudent: conversationMessages.filter(
        (message) => message.sender_user_id === conversation.tutor_user_id && message.read_at === null,
      ).length,
      unreadForTutor: conversationMessages.filter(
        (message) => message.sender_user_id === conversation.student_user_id && message.read_at === null,
      ).length,
      messages: conversationMessages.map((message) => toMessage(message, conversation)),
    }
  })
}

export async function ensureConversation(meta: EnsureThreadMeta): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('create_or_get_conversation', {
    p_student_user_id: meta.studentId,
    p_tutor_user_id: meta.tutorId,
    p_subject: meta.subject,
    p_linked_session_id: meta.sessionId,
  })
  throwOnError(error, 'No se pudo crear la conversación')
  if (typeof data !== 'string' || data.length === 0) {
    throw new Error('Supabase no devolvió el identificador de la conversación.')
  }
  return data
}

export async function sendConversationMessage(
  conversationId: string,
  payload: { text: string; attachmentName?: string },
): Promise<void> {
  const { error } = await getSupabaseClient().rpc('send_conversation_message', {
    p_conversation_id: conversationId,
    p_content: payload.text,
    p_attachment_name: payload.attachmentName ?? null,
  })
  throwOnError(error, 'No se pudo enviar el mensaje')
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  })
  throwOnError(error, 'No se pudo marcar la conversación como leída')
}
