import type {
  NotificationPrefs,
  SavedCardItem,
  SavedPaymentState,
  StudentProfileData,
} from '../../types'

export const DEFAULT_STUDENT_PROFILE: StudentProfileData = {
  id: '',
  name: '',
  photo: '',
  career: null,
  preferredMode: null,
  zone: null,
  email: '',
}

export const DEFAULT_SAVED_CARDS: SavedCardItem[] = []

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  bookingConfirmed: true,
  reminder24h: true,
  reminder1h: true,
  rescheduleProposed: true,
  refundIssued: true,
  pushEnabled: true,
  emailEnabled: true,
}

export const DEFAULT_PAYMENT_STATE: SavedPaymentState = {
  method: 'new',
  cardNumber: '',
  expiry: '',
  cvv: '',
  holder: '',
}
