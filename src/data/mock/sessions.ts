import type { AvailabilityBlock, ClassSession } from '../../types'

export const CALENDAR_WEEK_DAYS = [
  { day: 23, short: 'Lun', num: '23', tag: 'Hoy' },
  { day: 24, short: 'Mar', num: '24', tag: 'Mañana' },
  { day: 25, short: 'Mié', num: '25', tag: '' },
  { day: 26, short: 'Jue', num: '26', tag: '' },
  { day: 27, short: 'Vie', num: '27', tag: '' },
]

export const PROPOSAL_DAYS = [24, 25, 26, 27]
export const PROPOSAL_TIMES = ['10:00', '12:00', '16:00', '18:00']

export const INITIAL_SESSIONS: ClassSession[] = []
export const INITIAL_TUTOR_BLOCKS: AvailabilityBlock[] = []
