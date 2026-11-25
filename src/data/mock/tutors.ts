import { MapPin, Shuffle, Video } from 'lucide-react'
import type { ProfileViewData, SearchTutorSummary, TutorData } from '../../types'

const photo320 = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=320&h=320&fit=crop&crop=faces&q=80`

const photo240 = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=240&h=240&fit=crop&crop=faces&q=80`

export const CATALOG_SUBJECTS = ['Matemáticas', 'Física', 'Química', 'Programación', 'Inglés']
export const CATALOG_LEVELS = ['Secundaria', 'Preparatoria', 'Universidad']
export const MERIDA_ZONES = ['Zona norte', 'Zona centro', 'Zona poniente', 'Zona oriente', 'Toda Mérida']
export const WEEK_DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

export const MEETING_PLACES = [
  'Biblioteca central, zona norte',
  'Gran Plaza, área de cafeterías',
  'Parque de las Américas',
]

export const DAY_LABELS: Record<number, string> = {
  23: 'Lunes 23 de noviembre de 2026',
  24: 'Martes 24 de noviembre de 2026',
  25: 'Miércoles 25 de noviembre de 2026',
  26: 'Jueves 26 de noviembre de 2026',
  27: 'Viernes 27 de noviembre de 2026',
}

export const DAY_SHORT_LABELS: Record<number, string> = {
  23: 'Lunes 23 de noviembre',
  24: 'Martes 24 de noviembre',
  25: 'Miércoles 25 de noviembre',
  26: 'Jueves 26 de noviembre',
  27: 'Viernes 27 de noviembre',
}

export function formatMoney(amount: number) {
  return `$${amount.toFixed(2)} MXN`
}

function formatPoint(h: number, m: number) {
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  const mm = m.toString().padStart(2, '0')
  return { text: `${h12}:${mm}`, period }
}

export function formatTimeChip(time24: string) {
  const [hh, mm] = time24.split(':').map(Number)
  const p = formatPoint(hh, mm)
  return `${p.text} ${p.period}`
}

export function formatTimeRange(time24: string) {
  const [hh, mm] = time24.split(':').map(Number)
  const start = formatPoint(hh, mm)
  const end = formatPoint((hh + 1) % 24, mm)
  if (start.period === end.period) {
    return `${start.text} a ${end.text} ${end.period}`
  }
  return `${start.text} ${start.period} a ${end.text} ${end.period}`
}

export const TUTOR_CATALOG: TutorData[] = [
  {
    id: 'USR-0002',
    name: 'Carlos Chan',
    first: 'Carlos',
    photo: photo320('1583123810408-23e7b5d1af9f'),
    subjects: ['Matemáticas', 'Física'],
    subjectLevels: [
      ['Matemáticas', ['Preparatoria', 'Universidad']],
      ['Física', ['Preparatoria', 'Universidad']],
    ],
    rate: 250,
    rating: 4.8,
    reviewsCount: 32,
    dist: [27, 4, 1, 0, 0],
    verified: true,
    modes: ['Presencial', 'En línea'],
    zone: 'Mérida, zona norte',
    km: 2.3,
    pin: [34, 38],
    about:
      'Ingeniero civil con 6 años de experiencia dando clases de Matemáticas y Física a Alumnos de preparatoria y universidad. Explico paso a paso, con ejemplos prácticos, y adapto el ritmo a cada Alumno.',
    degrees: [
      { t: 'Ingeniería Civil', s: 'Universidad Autónoma de Yucatán · 2018', verified: true },
      { t: 'Certificación en enseñanza de Física', s: 'Instituto de Capacitación de Yucatán · 2021', verified: true },
    ],
    schedule: {
      23: ['16:00', '17:30', '19:00'],
      24: ['10:00', '12:00', '17:00'],
      25: ['16:00', '17:00', '18:30'],
      26: ['09:00', '11:00', '17:00'],
      27: ['10:30', '16:30', '19:00'],
    },
    quickSlots: [
      { label: 'Mié 25 nov · 5:00 PM', day: 25, time: '17:00' },
      { label: 'Jue 26 nov · 9:00 AM', day: 26, time: '09:00' },
      { label: 'Vie 27 nov · 10:30 AM', day: 27, time: '10:30' },
    ],
    reviews: [
      {
        name: 'Sofía Mena',
        stars: 5,
        when: 'Hace 2 días',
        subject: 'Cálculo diferencial',
        text: 'Me explicó derivadas con mucha paciencia y pasé mi examen parcial. Llega puntual y trae ejercicios preparados.',
      },
      {
        name: 'Mateo Fernández',
        stars: 5,
        when: 'Hace 1 semana',
        subject: 'Física',
        text: 'Por fin entendí cinemática. Las clases en línea son claras y ordenadas.',
      },
      {
        name: 'Camila Soto',
        stars: 4,
        when: 'Hace 2 semanas',
        subject: 'Álgebra lineal',
        text: 'Muy buen Tutor. Solo me gustaría tener más horarios entre semana.',
      },
    ],
  },
  {
    id: 'USR-0003',
    name: 'Luis Pérez',
    first: 'Luis',
    photo: photo320('1757744705465-ea08b0ddc38a'),
    subjects: ['Química'],
    subjectLevels: [['Química', ['Preparatoria', 'Universidad']]],
    rate: 200,
    rating: 4.6,
    reviewsCount: 18,
    dist: [12, 5, 1, 0, 0],
    verified: true,
    modes: ['Presencial'],
    zone: 'Mérida, zona poniente',
    km: 4.1,
    pin: [68, 26],
    about:
      'Químico con experiencia en laboratorio y en clases de apoyo para carreras de ingeniería y salud. Me enfoco en entender los conceptos antes de memorizar.',
    degrees: [
      { t: 'Licenciatura en Química Industrial', s: 'Universidad Autónoma de Yucatán · 2017', verified: true },
    ],
    schedule: {
      24: ['10:00', '16:00'],
      25: ['11:00', '16:00'],
      26: ['11:00', '17:00'],
      27: ['10:00', '16:30'],
    },
    quickSlots: [
      { label: 'Mié 25 nov · 4:00 PM', day: 25, time: '16:00' },
      { label: 'Jue 26 nov · 5:00 PM', day: 26, time: '17:00' },
      { label: 'Vie 27 nov · 10:00 AM', day: 27, time: '10:00' },
    ],
    reviews: [
      {
        name: 'Mateo Fernández',
        stars: 5,
        when: 'Hace 3 días',
        subject: 'Química orgánica',
        text: 'Explica reacciones de forma muy visual. Recomendado.',
      },
      {
        name: 'Camila Soto',
        stars: 4,
        when: 'Hace 1 semana',
        subject: 'Química general',
        text: 'Buenas explicaciones y material claro.',
      },
      {
        name: 'Sofía Mena',
        stars: 5,
        when: 'Hace 3 semanas',
        subject: 'Estequiometría',
        text: 'Me ayudó a prepararme para mi examen final.',
      },
    ],
  },
  {
    id: 'USR-0004',
    name: 'Valeria Ortiz',
    first: 'Valeria',
    photo: photo320('1630939687530-241d630735df'),
    subjects: ['Programación'],
    subjectLevels: [['Programación', ['Preparatoria', 'Universidad']]],
    rate: 300,
    rating: 4.9,
    reviewsCount: 41,
    dist: [36, 4, 1, 0, 0],
    verified: true,
    modes: ['Presencial', 'En línea'],
    zone: 'Mérida, zona norte',
    km: 6.8,
    pin: [56, 66],
    about:
      'Ingeniera de software enfocada en algoritmos, estructuras de datos y desarrollo web. Trabajo con ejercicios en vivo adaptados a tus proyectos universitarios.',
    degrees: [
      { t: 'Ingeniería de Software', s: 'Universidad Autónoma de Yucatán · 2019', verified: true },
    ],
    schedule: {
      23: ['11:00', '16:00'],
      25: ['10:00', '18:00'],
      26: ['12:00', '17:00'],
      27: ['12:00', '16:00'],
    },
    quickSlots: [
      { label: 'Mié 25 nov · 10:00 AM', day: 25, time: '10:00' },
      { label: 'Jue 26 nov · 5:00 PM', day: 26, time: '17:00' },
      { label: 'Vie 27 nov · 4:00 PM', day: 27, time: '16:00' },
    ],
    reviews: [
      {
        name: 'Sofía Mena',
        stars: 5,
        when: 'Hace 4 días',
        subject: 'Estructuras de datos',
        text: 'Resolvió todas mis dudas de árboles y recursividad con ejemplos claros.',
      },
      {
        name: 'Mateo Fernández',
        stars: 5,
        when: 'Hace 1 semana',
        subject: 'Python',
        text: 'Excelente ritmo de trabajo y ejercicios prácticos.',
      },
      {
        name: 'Camila Soto',
        stars: 5,
        when: 'Hace 2 semanas',
        subject: 'Bases de datos',
        text: 'Muy paciente y puntual en todas las sesiones.',
      },
    ],
  },
  {
    id: 'USR-0005',
    name: 'Jorge Mora',
    first: 'Jorge',
    photo: photo320('1625241152315-4a698f74ceb7'),
    subjects: ['Inglés'],
    subjectLevels: [['Inglés', ['Preparatoria', 'Universidad', 'Adultos']]],
    rate: 220,
    rating: 4.5,
    reviewsCount: 9,
    dist: [6, 2, 1, 0, 0],
    verified: false,
    modes: ['En línea'],
    zone: 'Mérida, zona centro',
    km: null,
    about:
      'Hablo inglés desde la infancia y preparo a Alumnos para exámenes de certificación y conversación académica. Las clases son prácticas y 100% en línea.',
    degrees: [
      { t: 'Licenciatura en Lenguas Modernas', s: 'Universidad Modelo · 2020', verified: false },
    ],
    schedule: {
      24: ['10:00', '18:00'],
      25: ['11:00', '17:00'],
      26: ['16:00', '18:00'],
      27: ['11:00', '16:00'],
    },
    quickSlots: [
      { label: 'Mié 25 nov · 11:00 AM', day: 25, time: '11:00' },
      { label: 'Jue 26 nov · 4:00 PM', day: 26, time: '16:00' },
      { label: 'Vie 27 nov · 11:00 AM', day: 27, time: '11:00' },
    ],
    reviews: [
      {
        name: 'Camila Soto',
        stars: 5,
        when: 'Hace 5 días',
        subject: 'Conversación en inglés',
        text: 'Me ayudó a ganar confianza para mi entrevista académica.',
      },
      {
        name: 'Mateo Fernández',
        stars: 4,
        when: 'Hace 2 semanas',
        subject: 'Preparación TOEFL',
        text: 'Dinámico y con buenas estrategias de comprensión lectora.',
      },
    ],
  },
]

export const PUBLISHED_TUTORS: TutorData[] = []

export const SEARCH_TUTORS: SearchTutorSummary[] = []

export const CARLOS: ProfileViewData = {
  id: 'USR-0002', name: 'Carlos Chan', first: 'Carlos', photo: photo320('1583123810408-23e7b5d1af9f'), verified: true, rating: 4.8, reviewCount: 32,
  dist: [27, 4, 1, 0, 0], rate: 250, modes: 'Presencial y en línea', modeIcon: Shuffle, zone: 'Mérida, zona norte',
  about: 'Ingeniero civil con 6 años de experiencia dando clases de Matemáticas y Física a alumnos de preparatoria y universidad. Explico paso a paso, con ejemplos de la vida diaria, y adapto el ritmo a cada Alumno.',
  subjects: [['Matemáticas', ['Preparatoria', 'Universidad']], ['Física', ['Preparatoria', 'Universidad']]],
  degrees: [
    { t: 'Ingeniería Civil', s: 'Universidad Autónoma de Yucatán · 2018', verified: true },
    { t: 'Certificación en enseñanza de Física', s: 'Instituto de Capacitación de Yucatán · 2021', verified: true },
  ],
  slots: ['Lun 23 nov · 16:00', 'Mar 24 nov · 17:00', 'Mié 25 nov · 16:00'],
  reviews: [
    { name: 'Sofía Mena', stars: 5, when: 'Hace 2 días', subject: 'Cálculo diferencial', text: 'Me explicó derivadas con mucha paciencia y pasé mi examen parcial. Llega puntual y trae ejercicios preparados.' },
    { name: 'Mateo Fernández', stars: 5, when: 'Hace 1 semana', subject: 'Física', text: 'Por fin entendí cinemática. Las clases en línea son claras y ordenadas.' },
    { name: 'Camila Soto', stars: 4, when: 'Hace 2 semanas', subject: 'Álgebra lineal', text: 'Muy buen Tutor. Solo me gustaría tener más horarios entre semana.' },
  ],
}

export const JORGE: ProfileViewData = {
  id: 'USR-0005', name: 'Jorge Mora', first: 'Jorge', photo: photo320('1625241152315-4a698f74ceb7'), verified: false, rating: 0, reviewCount: 0,
  dist: [0, 0, 0, 0, 0], rate: 220, modes: 'En línea', modeIcon: Video, zone: 'Mérida, zona centro',
  about: 'Hablo inglés desde la infancia y preparo a Alumnos para exámenes TOEFL y conversación profesional. Las clases son prácticas y 100% en línea.',
  subjects: [['Inglés', ['Preparatoria', 'Universidad', 'Adultos']]],
  degrees: [{ t: 'Licenciatura en Lenguas Modernas', s: 'Universidad Modelo · 2020', verified: false }],
  slots: ['Mar 24 nov · 10:00', 'Mié 25 nov · 11:00', 'Jue 26 nov · 18:00'], reviews: [],
}

export const LUIS: ProfileViewData = {
  id: 'USR-0003', name: 'Luis Pérez', first: 'Luis', photo: photo320('1757744705465-ea08b0ddc38a'), verified: true, rating: 4.6, reviewCount: 18,
  dist: [12, 5, 1, 0, 0], rate: 200, modes: 'Presencial', modeIcon: MapPin, zone: 'Mérida, zona poniente',
  about: 'Químico con experiencia en laboratorio y en clases de apoyo para carreras de ingeniería y salud. Me enfoco en entender los conceptos antes de memorizar.',
  subjects: [['Química', ['Preparatoria', 'Universidad']]],
  degrees: [{ t: 'Licenciatura en Química Industrial', s: 'Universidad Autónoma de Yucatán · 2017', verified: true }],
  slots: [],
  reviews: [
    { name: 'Mateo Fernández', stars: 5, when: 'Hace 3 días', subject: 'Química orgánica', text: 'Explica reacciones de forma muy visual. Recomendado.' },
    { name: 'Camila Soto', stars: 4, when: 'Hace 1 semana', subject: 'Química general', text: 'Buenas explicaciones y material claro.' },
    { name: 'Sofía Mena', stars: 5, when: 'Hace 3 semanas', subject: 'Estequiometría', text: 'Me ayudó a prepararme para mi examen final.' },
  ],
}
