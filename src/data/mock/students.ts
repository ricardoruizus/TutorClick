import type {
  NotificationPrefs,
  SavedCardItem,
  SavedPaymentState,
  StudentProfileData,
} from '../../types'

export const DEFAULT_STUDENT_PROFILE: StudentProfileData = {
  id: 'USR-0001',
  name: 'Sofía Mena',
  photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&h=240&fit=crop&crop=faces&q=80',
  career: 'Ingeniería',
  preferredMode: 'Presencial y en línea',
  zone: 'Mérida, zona norte',
  email: 'sofia.mena@correo.mx',
}

export const DEFAULT_SAVED_CARDS: SavedCardItem[] = [
  {
    id: 'CARD-01',
    brand: 'Visa',
    last4: '4242',
    expiry: '09/28',
    holder: 'Sofía Mena',
    isDefault: true,
  },
]

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
  method: 'saved',
  cardNumber: '',
  expiry: '',
  cvv: '',
  holder: '',
}
