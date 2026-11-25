import { useState, type ReactNode } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { CheckoutScreen } from '../../screens/alumno/checkout'
import { BookingScreen, UnavailableScreen } from '../../screens/alumno/booking'
import { TutorProfile, CARLOS, JORGE, LUIS } from '../../screens/alumno/profile'
import { SearchScreen, DEFAULTS } from '../../screens/alumno/search'
import { Welcome, Login, RoleChoice, StudentForm, Recover } from '../../screens/alumno/auth'
import { DESIGN_SYSTEM_COLORS as colors, DESIGN_SYSTEM_SEMANTICS as sem } from '../../data/mock'
import { resolvePortalUrl } from '../../services/auth'
import {
  Button, TextField, StatusChip, chipMap, ChipKey, TutorCard, ClassCard, TimeSlot, BottomNav, studentNav, tutorNav,
  TopBar, BottomSheet, Toast, EmptyState, SkeletonCard, Sidebar, AdminTable, Phone,
} from './ds'

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="border-t border-g200 py-12">
      <h2 className="text-[24px] font-bold">{title}</h2>
      {note && <p className="mb-6 mt-1 max-w-2xl text-g600">{note}</p>}
      <div className={note ? '' : 'mt-6'}>{children}</div>
    </section>
  )
}
const Label = ({ children }: { children: ReactNode }) => <p className="mb-2 text-[12px] font-semibold text-g600">{children}</p>

export function DesignSystem() {
  return (
    <>
      <nav aria-label="Navegación de rutas" className="sticky top-0 z-10 flex items-center justify-between border-b border-g200 bg-white px-6 py-2">
        <a href={resolvePortalUrl('/')} className="inline-flex min-h-11 items-center gap-1 font-semibold text-ink underline underline-offset-4">
          <ChevronLeft size={18} aria-hidden />
          Prototipo interactivo
        </a>
      </nav>
      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
        <header className="mb-10">
          <p className="text-[12px] font-semibold text-g600">Sistema de diseño v1 · Alumno, Tutor y Admin</p>
          <h1 className="text-[40px] font-bold leading-tight">TutorClick</h1>
          <p className="max-w-2xl text-[16px] text-g600">Un solo sistema para las tres experiencias. Base blanco y negro, Inter, y colores semánticos que siempre llevan ícono y texto.</p>
        </header>

        <Section id="fundamentos" title="Fundamentos">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <Label>Color base</Label>
              <div className="grid grid-cols-4 gap-2">
                {colors.map(([n, c]) => (
                  <div key={n}><div className="h-14 rounded-btn border border-g200" style={{ background: c }} /><p className="mt-1 text-[12px] font-medium">{n}</p></div>
                ))}
              </div>
              <Label>Semánticos (fondo, texto e ícono)</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {sem.map(([n, fg, bg, chip]) => (
                  <div key={n} className="rounded-btn p-3" style={{ background: bg, color: fg }}>
                    <p className="font-semibold">{n}</p><p className="text-[12px]">Texto {fg} sobre {bg}</p>
                    <div className="mt-2"><StatusChip status={chip as ChipKey} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <Label>Tipografía Inter</Label>
                <p className="text-[32px] font-bold leading-tight">Reservas y clases</p>
                <p className="text-[24px] font-bold">Título de sección</p>
                <p className="text-[18px] font-semibold">Subtítulo 18 / 600</p>
                <p className="text-[16px]">Cuerpo grande 16 / 400</p>
                <p className="text-[14px]">Cuerpo y botones 14 / 400 a 600 (mínimo)</p>
                <p className="text-[12px] font-semibold">Etiqueta 12 / 600</p>
              </div>
              <div>
                <Label>Radios y espaciado</Label>
                <div className="flex items-end gap-4">
                  <div className="grid h-14 w-20 place-items-center rounded-btn bg-ink text-[12px] text-white">Botón 12</div>
                  <div className="grid h-20 w-24 place-items-center rounded-card border-2 border-ink text-[12px]">Tarjeta 16</div>
                  <div className="grid h-8 w-20 place-items-center rounded-full bg-g200 text-[12px]">Chip total</div>
                </div>
                <div className="mt-4 flex items-end gap-2">
                  {[4, 8, 12, 16, 24, 32, 48].map((s) => (
                    <div key={s} className="text-center"><div className="bg-ink" style={{ width: s, height: s }} /><p className="mt-1 text-[12px]">{s}</p></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section id="botones" title="Botones" note="El primario es siempre negro relleno, 48 px de alto y radio de 12 px, en Alumno, Tutor y Admin.">
          <div className="grid gap-6 md:grid-cols-4">
            {(['primary', 'secondary', 'text', 'destructive'] as const).map((v) => {
              const name = { primary: 'Primario', secondary: 'Secundario', text: 'Texto', destructive: 'Destructivo' }[v]
              const lbl = { primary: 'Reservar clase', secondary: 'Ver detalle', text: 'Cancelar', destructive: 'Cancelar clase' }[v]
              return (
                <div key={v} className="flex flex-col items-start gap-3">
                  <Label>{name}</Label>
                  <Button variant={v}>{lbl}</Button>
                  <Button variant={v} pressed>{lbl}</Button>
                  <Button variant={v} disabled>{lbl}</Button>
                  <Button variant={v} loading>{lbl}</Button>
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-g600">Filas: default, pressed, disabled y loading. Con ícono: <Button icon={Plus} className="ml-2 align-middle">Nueva clase</Button></p>
        </Section>

        <Section id="campos" title="Campo de texto">
          <div className="grid gap-6 md:grid-cols-4">
            <TextField label="Nombre completo" help="Como aparece en tu identificación." placeholder="Sofía Mena" />
            <TextField label="Correo" help="Te enviaremos la confirmación." state="focus" value="ejemplo@correo.com" />
            <TextField label="Correo" help="Escribe un correo válido, por ejemplo ejemplo@correo.com." state="error" value="ejemplo@correo" />
            <TextField label="Zona" help="No puedes editar este dato." state="disabled" value="Mérida, zona norte" />
          </div>
        </Section>

        <Section id="chips" title="Chips de estado" note="Cada estado combina color, ícono y texto. Nunca solo color.">
          <div className="flex flex-wrap gap-3">{(Object.keys(chipMap) as ChipKey[]).map((k) => <StatusChip key={k} status={k} />)}</div>
        </Section>

        <Section id="tarjetas" title="Tarjetas y bloques horario">
          <div className="grid gap-6 md:grid-cols-2">
            <div><Label>Tarjeta de tutor</Label><TutorCard /></div>
            <div><Label>Tarjeta de clase</Label><ClassCard /></div>
          </div>
          <div className="mt-8"><Label>Bloque horario: disponible, seleccionado, reservado y bloqueado</Label>
            <div className="flex flex-wrap gap-3">
              <TimeSlot time="16:00" state="disponible" /><TimeSlot time="17:00" state="seleccionado" />
              <TimeSlot time="18:00" state="reservado" /><TimeSlot time="19:00" state="bloqueado" />
            </div>
          </div>
        </Section>

        <Section id="movil" title="Navegación y superficies móviles (390 × 844)">
          <div className="flex flex-wrap gap-8">
            <Phone label="Alumno: barra superior e inferior">
              <TopBar title="Calendario" action />
              <div className="flex flex-col gap-3 bg-g50 p-4"><ClassCard /><SkeletonCard /></div>
              <BottomNav items={studentNav} active={1} />
            </Phone>
            <Phone label="Tutor: barra superior e inferior">
              <TopBar title="Calendario" back />
              <div className="flex flex-col gap-3 bg-g50 p-4"><EmptyState /></div>
              <BottomNav items={tutorNav} active={1} />
            </Phone>
            <Phone label="Bottom sheet de confirmación y toasts">
              <div className="flex flex-col gap-3 bg-g200 p-4">
                <Toast kind="ok" text="Reserva RES-1001 confirmada." />
                <Toast kind="warn" text="Horario bloqueado por 10 minutos." />
                <Toast kind="err" text="No se pudo procesar la tarjeta." />
                <Toast kind="info" text="Pagas ahora; el tutor recibe el pago 48 h después de la clase." />
              </div>
              <div className="bg-g200 pt-6"><BottomSheet /></div>
            </Phone>
          </div>
        </Section>

        <Section id="admin" title="Admin (escritorio 1440 × 900)">
          <div className="flex flex-col gap-6 rounded-card bg-g100 p-6 lg:flex-row">
            <Sidebar />
            <div className="min-w-0 flex-1">
              <h3 className="mb-4 text-[24px] font-bold">Pagos</h3>
              <AdminTable />
            </div>
          </div>
        </Section>
      </main>
    </>
  )
}

function ProfileFlow() {
  return (
    <main className="mx-auto max-w-[1700px] px-6 pb-24 pt-12">
      <header className="mb-10">
        <p className="text-[12px] font-semibold text-g600">Alumno · responsive</p>
        <h1 className="text-[40px] font-bold leading-tight">Perfil del tutor</h1>
        <p className="max-w-2xl text-[16px] text-g600">Cada perfil se desplaza y los botones quedan fijos abajo. Prueba el favorito, los horarios y el filtro de reseñas.</p>
      </header>
      <div className="flex flex-wrap gap-8">
        <TutorProfile p={CARLOS} label="1. Perfil completo: Carlos Chan" />
        <TutorProfile p={JORGE} label="2. Tutor sin reseñas: Jorge Mora" />
        <TutorProfile p={LUIS} label="3. Tutor sin horarios próximos: Luis Pérez" />
      </div>
    </main>
  )
}

function BookingFlow() {
  return (
    <main className="mx-auto max-w-[1700px] px-6 pb-24 pt-12">
      <header className="mb-10">
        <p className="text-[12px] font-semibold text-g600">Alumno · responsive</p>
        <h1 className="text-[40px] font-bold leading-tight">Reservar clase</h1>
        <p className="max-w-2xl text-[16px] text-g600">
          Selecciona una fecha, horario y modalidad. Cambia a Presencial para elegir un lugar de encuentro.
        </p>
      </header>
      <div className="flex flex-wrap gap-8">
        <BookingScreen />
        <UnavailableScreen />
      </div>
    </main>
  )
}

function CheckoutFlow() {
  return (
    <main className="mx-auto max-w-[1700px] px-6 pb-24 pt-12">
      <header className="mb-10">
        <p className="text-[12px] font-semibold text-g600">Alumno · responsive</p>
        <h1 className="text-[40px] font-bold leading-tight">Confirmación y pago</h1>
        <p className="max-w-2xl text-[16px] text-g600">
          Pago protegido exclusivamente con tarjeta ($250.00 + $25.00 = $275.00 MXN), formulario para agregar tarjeta,
          confirmación instantánea y estados de procesamiento o rechazo.
        </p>
      </header>
      <div className="flex flex-wrap gap-8">
        <CheckoutScreen label="1. Confirmación con Visa •••• 4242" initialMode="form" showSavedCard />
        <CheckoutScreen label="2. Agregar tarjeta nueva" initialMode="new-card" initialClassMode="Presencial" />
        <CheckoutScreen label="3. Clase confirmada" initialMode="sent" />
        <CheckoutScreen label="4. Estado: procesando pago" initialMode="processing" />
        <CheckoutScreen label="5. Estado: pago rechazado con reintento" initialMode="declined" />
      </div>
    </main>
  )
}

function SearchFlow() {
  return (
    <main className="mx-auto max-w-[1700px] px-6 pb-24 pt-12">
      <header className="mb-10">
        <p className="text-[12px] font-semibold text-g600">Alumno · responsive</p>
        <h1 className="text-[40px] font-bold leading-tight">Buscar</h1>
        <p className="max-w-2xl text-[16px] text-g600">Cada pantalla es interactiva: busca por materia, alterna Lista y Mapa, guarda favoritos y aplica filtros para llegar al estado sin resultados.</p>
      </header>
      <div className="flex flex-wrap gap-8">
        <SearchScreen label="1. Resultados en lista" />
        <SearchScreen label="2. Filtros (bottom sheet)" sheet filters={{ ...DEFAULTS, subjects: ['Matemáticas', 'Física'], rating: 4.5, km: 5, verified: true }} />
        <SearchScreen label="3. Vista de mapa" initial="map" />
        <SearchScreen label="4. Cargando" initial="loading" />
        <SearchScreen label="5. Sin resultados" filters={{ ...DEFAULTS, subjects: ['Química'], rating: 4.8, verified: true }} />
        <SearchScreen label="6. Sin conexión" initial="offline" />
      </div>
    </main>
  )
}

function AuthFlow() {
  return (
    <main className="mx-auto max-w-[1700px] px-6 pb-24 pt-12">
      <header className="mb-10">
        <p className="text-[12px] font-semibold text-g600">Responsive · Alumno y Tutor</p>
        <h1 className="text-[40px] font-bold leading-tight">Acceso y registro</h1>
        <p className="max-w-2xl text-[16px] text-g600">Los campos son interactivos: escribe, muestra la contraseña y envía para ver los errores. No hay selector de rol al iniciar sesión.</p>
      </header>
      <div className="flex flex-wrap gap-8">
        <Welcome />
        <Login label="2a. Iniciar sesión" />
        <Login label="2b. Iniciar sesión: errores de campo" showErrors />
        <RoleChoice />
        <StudentForm label="3b. Crear cuenta de alumno" />
        <StudentForm label="3c. Crear cuenta de alumno: errores de campo" showErrors />
        <Recover label="4a. Recuperar contraseña" />
        <Recover label="4b. Recuperar contraseña: error de campo" showErrors />
        <Recover label="4c. Recuperar contraseña: confirmación" sent />
      </div>
    </main>
  )
}

export function ScreenGallery() {
  const [tab, setTab] = useState<'checkout' | 'booking' | 'profile' | 'search' | 'auth'>('checkout')
  return (
    <>
      <nav aria-label="Secciones de la galería" className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-g200 bg-white px-6 py-2">
        <div className="flex gap-2 overflow-x-auto">
          {([
            ['checkout', 'Confirmación y pago'],
            ['booking', 'Reservar clase'],
            ['profile', 'Perfil del tutor'],
            ['search', 'Buscar'],
            ['auth', 'Acceso y registro'],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-current={tab === k}
              onClick={() => setTab(k)}
              className={`min-h-11 shrink-0 rounded-full px-4 font-semibold ${tab === k ? 'bg-ink text-white' : 'text-g700 hover:bg-g100'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <a href={resolvePortalUrl('/')} className="inline-flex min-h-11 items-center gap-1 font-semibold text-ink underline underline-offset-4">
            <ChevronLeft size={18} aria-hidden />
            Prototipo interactivo
          </a>
        </div>
      </nav>
      {tab === 'checkout' ? (
        <CheckoutFlow />
      ) : tab === 'booking' ? (
        <BookingFlow />
      ) : tab === 'profile' ? (
        <ProfileFlow />
      ) : tab === 'search' ? (
        <SearchFlow />
      ) : (
        <AuthFlow />
      )}
    </>
  )
}
