import type { ClassSession, PropuestaReprogramacion, TutorData } from '../types'
import { INITIAL_SESSIONS } from '../data/mock/sessions'
import { PUBLISHED_TUTORS, SEARCH_TUTORS } from '../data/mock/tutors'

export interface ReservasService {
  listTutors(): TutorData[]
  listMapTutors(): typeof SEARCH_TUTORS
  listInitialSessions(): ClassSession[]
  cancelFutureSeries(
    sessions: ClassSession[],
    seriesId: string,
    fromIndex: number,
    onUpdateSession: (id: string, patch: Partial<ClassSession>) => void,
  ): void
  proposeReschedule(
    session: ClassSession,
    proposal: PropuestaReprogramacion,
  ): Partial<ClassSession>
}

export function cancelFutureSeriesSessions(
  sessions: ClassSession[],
  seriesId: string,
  fromIndex: number,
  onUpdateSession: (id: string, patch: Partial<ClassSession>) => void,
) {
  sessions
    .filter(
      (item) =>
        item.seriesId === seriesId &&
        (item.seriesIndex ?? 0) > fromIndex &&
        item.status !== 'Cancelada',
    )
    .forEach((item) =>
      onUpdateSession(item.id, {
        status: 'Cancelada',
        paymentStatus: 'Reembolsado',
        refundAmount: item.hourlyRate * 1.1,
        readOnlyNote: 'Clase futura de la serie cancelada. Se reembolsó únicamente esta clase.',
      }),
    )
}

export const mockReservasService: ReservasService = {
  listTutors() {
    return PUBLISHED_TUTORS
  },
  listMapTutors() {
    return SEARCH_TUTORS
  },
  listInitialSessions() {
    return INITIAL_SESSIONS
  },
  cancelFutureSeries: cancelFutureSeriesSessions,
  proposeReschedule(_session, proposal) {
    return {
      status: 'Reprogramación propuesta',
      proposedBy: proposal.proposedBy,
      proposedDay: proposal.proposedDay,
      proposedTime: proposal.proposedTime,
      proposalMessage: proposal.proposalMessage,
    }
  },
}
