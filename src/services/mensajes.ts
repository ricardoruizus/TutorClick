import type { ConversationThread, UserRole } from '../types'
import { INITIAL_THREADS } from '../data/mock/messages'

export interface EnsureThreadMeta {
  studentId: string
  studentName: string
  tutorId: string
  tutorName: string
  tutorPhoto: string
  subject: string
  sessionId: string
}

export interface MensajesService {
  listInitialThreads(): ConversationThread[]
  detectExternalContact(message: string): { hasPhone: boolean; hasExternalLink: boolean }
  markThreadRead(
    threads: ConversationThread[],
    threadId: string,
    role: UserRole,
  ): ConversationThread[]
  appendMessage(
    threads: ConversationThread[],
    threadId: string,
    role: UserRole,
    payload: { text: string; attachmentName?: string },
  ): ConversationThread[]
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

export function markConversationRead(
  threads: ConversationThread[],
  threadId: string,
  role: UserRole,
): ConversationThread[] {
  return threads.map((thread) => {
    if (thread.id !== threadId) return thread
    return {
      ...thread,
      unreadForStudent: role === 'alumno' ? 0 : thread.unreadForStudent,
      unreadForTutor: role === 'tutor' ? 0 : thread.unreadForTutor,
      messages: thread.messages.map((m) => (m.sender !== role ? { ...m, read: true } : m)),
    }
  })
}

export function appendConversationMessage(
  threads: ConversationThread[],
  threadId: string,
  role: UserRole,
  payload: { text: string; attachmentName?: string },
): ConversationThread[] {
  return threads.map((thread) => {
    if (thread.id !== threadId) return thread
    const nextMsg = {
      id: `MSG-${Date.now()}`,
      sender: role,
      text: payload.text,
      time: '3:54 PM',
      read: false,
      attachmentName: payload.attachmentName,
    }
    return {
      ...thread,
      unreadForStudent: role === 'tutor' ? thread.unreadForStudent + 1 : 0,
      unreadForTutor: role === 'alumno' ? thread.unreadForTutor + 1 : 0,
      messages: [...thread.messages, nextMsg],
    }
  })
}

export const mockMensajesService: MensajesService = {
  listInitialThreads() {
    return INITIAL_THREADS
  },
  detectExternalContact,
  markThreadRead: markConversationRead,
  appendMessage: appendConversationMessage,
}
