import type { AvailabilityBlock, ClassMode, ClassSession, ClassStatus } from '../types'
import { INITIAL_TUTOR_BLOCKS } from '../data/mock/sessions'

export interface RecurringAvailabilityRule {
  days: number[]
  start: string
  end: string
  mode: ClassMode
}

export interface CalendarioService {
  isUpcomingStatus(status: ClassStatus): boolean
  listTutorBlocks(tutorId: string): AvailabilityBlock[]
  toggleAvailabilityBlock(blocks: AvailabilityBlock[], blockId: string): AvailabilityBlock[]
  updateAvailabilityBlock(
    blocks: AvailabilityBlock[],
    blockId: string,
    patch: Partial<AvailabilityBlock>,
  ): AvailabilityBlock[]
  applyRecurringRule(
    blocks: AvailabilityBlock[],
    rule: RecurringAvailabilityRule,
    tutorId?: string,
  ): AvailabilityBlock[]
  exportSessionToExternalCalendar(session: ClassSession): { synced: true; provider: string }
}

export function isUpcomingStatus(status: ClassStatus) {
  return (
    status === 'Confirmada' ||
    status === 'Reprogramación propuesta' ||
    status === 'En curso'
  )
}

export function toggleAvailabilityBlock(blocks: AvailabilityBlock[], blockId: string) {
  return blocks.map((blk) =>
    blk.id === blockId
      ? { ...blk, state: blk.state === 'disponible' ? ('bloqueado' as const) : ('disponible' as const) }
      : blk,
  )
}

export function updateAvailabilityBlock(
  blocks: AvailabilityBlock[],
  blockId: string,
  patch: Partial<AvailabilityBlock>,
) {
  return blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block))
}

export function applyRecurringAvailabilityRule(
  blocks: AvailabilityBlock[],
  rule: RecurringAvailabilityRule,
  tutorId = 'USR-0002',
): AvailabilityBlock[] {
  const startHour = Number(rule.start.split(':')[0])
  const endHour = Number(rule.end.split(':')[0])
  const generated = rule.days.flatMap((day) =>
    Array.from({ length: Math.max(1, endHour - startHour) }, (_, index) => ({
      id: `REC-${day}-${startHour + index}`,
      tutorId,
      day,
      time: `${String(startHour + index).padStart(2, '0')}:00`,
      state: 'disponible' as const,
      mode: rule.mode,
    })),
  )
  const generatedKeys = new Set(generated.map((block) => `${block.day}-${block.time}`))
  const untouched = blocks.filter((block) => !generatedKeys.has(`${block.day}-${block.time}`))
  return [...untouched, ...generated]
}

export const mockCalendarioService: CalendarioService = {
  isUpcomingStatus,
  listTutorBlocks(tutorId) {
    return INITIAL_TUTOR_BLOCKS.filter((block) => block.tutorId === tutorId)
  },
  toggleAvailabilityBlock,
  updateAvailabilityBlock,
  applyRecurringRule: applyRecurringAvailabilityRule,
  exportSessionToExternalCalendar() {
    return { synced: true, provider: 'ics-simulado' }
  },
}
