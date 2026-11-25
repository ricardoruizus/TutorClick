import type { ConversationThread } from '../../types'

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=240&h=240&fit=crop&crop=faces&q=80`

export const INITIAL_THREADS: ConversationThread[] = [
  {
    id: 'CONV-01',
    studentId: 'USR-0001',
    studentName: 'Sofía Mena',
    tutorId: 'USR-0002',
    tutorName: 'Carlos Chan',
    tutorPhoto: photo('1583123810408-23e7b5d1af9f'),
    subject: 'Matemáticas',
    sessionId: 'RES-1001',
    unreadForStudent: 1,
    unreadForTutor: 0,
    messages: [
      {
        id: 'MSG-01',
        sender: 'alumno',
        text: 'Hola Carlos, para la sesión de hoy quiero repasar integrales por partes y ejercicios de examen.',
        time: '2:15 PM',
        read: true,
        attachmentName: 'guia-calculo-uady.pdf',
      },
      {
        id: 'MSG-02',
        sender: 'tutor',
        text: 'Hola Sofía, revisé tu guía. Preparé 4 ejercicios tipo parcial para resolver paso a paso a las 4:00 PM.',
        time: '2:28 PM',
        read: false,
      },
    ],
  },
  {
    id: 'CONV-02',
    studentId: 'USR-0001',
    studentName: 'Sofía Mena',
    tutorId: 'USR-0004',
    tutorName: 'Valeria Ortiz',
    tutorPhoto: photo('1630939687530-241d630735df'),
    subject: 'Programación',
    sessionId: 'RES-1005',
    unreadForStudent: 0,
    unreadForTutor: 1,
    messages: [
      {
        id: 'MSG-03',
        sender: 'tutor',
        text: 'Te comparto las notas de complejidad algorítmica que vimos en la sesión.',
        time: '3:05 PM',
        read: true,
        attachmentName: 'resumen-arboles.pdf',
      },
      {
        id: 'MSG-04',
        sender: 'alumno',
        text: 'Muchas gracias Valeria, todo quedó muy claro.',
        time: '3:12 PM',
        read: true,
      },
    ],
  },
  {
    id: 'CONV-03',
    studentId: 'USR-0006',
    studentName: 'Mateo Fernández',
    tutorId: 'USR-0002',
    tutorName: 'Carlos Chan',
    tutorPhoto: photo('1583123810408-23e7b5d1af9f'),
    subject: 'Física',
    sessionId: 'RES-1006',
    unreadForStudent: 0,
    unreadForTutor: 1,
    messages: [
      {
        id: 'MSG-05',
        sender: 'alumno',
        text: 'Hola Carlos, reservé para mañana martes 24 a las 10:00 AM. Vamos a ver cinemática rotacional.',
        time: '1:40 PM',
        read: false,
      },
    ],
  },
]
