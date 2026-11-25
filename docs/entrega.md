# Entrega técnica de TutorClick

Prototipo funcional en React 19, TypeScript, Vite y Tailwind CSS v4 con soporte para los flujos de Alumno, Tutor y Admin en horario de Mérida (UTC-6) y montos en MXN.

## Cómo correr el proyecto

Requisitos: Node.js 20+ y `pnpm`.

1. Copiar variables de entorno:
   ```sh
   cp .env.example .env.local
   ```
   Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores de **Project URL** y **Publishable key** del panel de Supabase. No uses la clave `service_role` en el frontend.
2. Instalar dependencias:
   ```sh
   pnpm install
   ```
3. Iniciar el servidor de desarrollo:
   ```sh
   pnpm dev
   ```
4. Verificar tipos de TypeScript:
   ```sh
   pnpm exec tsc --noEmit
   ```
5. Generar compilación de producción y previsualizar:
   ```sh
   pnpm build
   pnpm preview
   ```

## Supabase

La migración inicial está en `supabase/migrations/20261125013000_initial_auth.sql`. Aplícala desde **SQL Editor** en Supabase antes de probar autenticación. Crea `profiles` y `user_roles`, activa RLS, permite que cada usuario lea/actualice solo su perfil y evita que un registro público se asigne el rol `admin`.
Si ya la aplicaste desde SQL Editor, no la vuelvas a aplicar con Supabase CLI sin registrar primero esa migración como aplicada; de lo contrario, los tipos, tablas y políticas ya existentes causarán conflictos.

La migración `supabase/migrations/20261125023000_persist_user_profiles.sql` añade perfiles de Alumno y Tutor, permisos RLS, actualización del perfil de Alumno y el bucket privado `tutor-credentials`. Aplícala también desde **SQL Editor**, después de la migración inicial. No la apliques hasta terminar de revisar los cambios y no vuelvas a ejecutar una migración que ya se aplicó.

La migración `supabase/migrations/20261125033000_persist_student_avatars.sql` añade el campo de foto del perfil de Alumno y el bucket privado `student-avatars` (JPG/PNG/WebP hasta 5 MB). Aplícala después de las migraciones anteriores para habilitar la carga de foto.

La migración `supabase/migrations/20261125043000_persist_tutor_avatars.sql` añade el bucket privado `tutor-avatars` con permisos de almacenamiento solo para cada Tutor. Aplícala después de la migración de fotos de Alumno.

La migración `supabase/migrations/20261125053000_admin_tutor_credential_review.sql` habilita la bandeja de revisión administrativa: agrega el registro de envío y decisión, permite lectura de expedientes solo a Admin y guarda las aprobaciones o rechazos (con motivo obligatorio). Aplícala desde **SQL Editor**, después de las migraciones anteriores.

La migración `supabase/migrations/20261125063000_publish_verified_tutors.sql` habilita la consulta del catálogo desde el portal Alumno y el acceso a fotos de tutores verificados. El RPC solo devuelve campos públicos de perfiles verificados y completos; aplícala después de la migración de revisión administrativa.

La migración `supabase/migrations/20261125073000_persist_weekly_availability_and_bookings.sql` agrega los horarios semanales recurrentes, las solicitudes individuales de reserva y sus políticas RLS. El RPC de horarios devuelve opciones para los próximos 30 días en `America/Merida`; las solicitudes se guardan como pendientes de confirmación y un índice único impide reservar dos veces la misma hora. Aplícala desde **SQL Editor**, después de `20261125063000_publish_verified_tutors.sql`.

La migración `supabase/migrations/20261125083000_complete_class_booking_lifecycle.sql` completa el ciclo de una clase: cancelación por cualquiera de las dos personas con más de 24 horas de anticipación, propuestas de reprogramación con aceptación o rechazo mutuo, registro de clase completada por el Tutor después de su hora de término y notificaciones persistidas dentro de la app. La hora original permanece reservada hasta que se acepta la propuesta; los horarios propuestos también se apartan mientras esperan respuesta. Aplícala después de `20261125073000_persist_weekly_availability_and_bookings.sql`.

La migración `supabase/migrations/20261125093000_persist_conversations.sql` agrega conversaciones y mensajes persistidos, acceso RLS solo para Alumno y Tutor participantes, envío seguro y marcado de mensajes como leídos. Aplícala después de `20261125083000_complete_class_booking_lifecycle.sql`. En esta versión el nombre del archivo adjunto se guarda como metadato; el archivo binario no se sube a Supabase Storage y la actualización de mensajes no es en tiempo real.

El cliente Supabase está en `src/services/supabase.ts`. La URL y la clave pública se leen de `.env.local`, que no debe subirse al repositorio. La clave `service_role` no debe exponerse al navegador.

El inicio y cierre de sesión, registro de alumnos/tutores y MFA TOTP para administradores usan Supabase Auth. Para desarrollo, configura en Supabase Auth la URL del sitio y la redirección `http://localhost:8443/**` (el puerto por defecto de Vite en este proyecto); reinicia Vite tras cambiar `.env.local`. Si está habilitada la confirmación de correo, el registro termina cuando la persona sigue el enlace recibido.

El rol `admin` nunca se puede asignar desde el registro público. Crea primero la cuenta administrativa desde un canal controlado y asígnale el rol desde SQL Editor, sustituyendo el correo:

```sql
update public.user_roles
set role = 'admin'
where user_id = (
  select id from auth.users where lower(email) = lower('admin@example.com')
);
```

La autenticación ya es real. Con las migraciones de perfiles y avatares, se guardan en Supabase los datos del perfil del Alumno y del perfil profesional del Tutor, junto con las fotos y los archivos de título y cédula en almacenamiento privado. La migración de revisión conecta la bandeja de credenciales del Admin con esos documentos privados y registra la decisión y el motivo de rechazo. La búsqueda de Alumnos lista únicamente perfiles profesionales completos y verificados. Con las migraciones `20261125073000` y `20261125083000`, los Tutores publican disponibilidad semanal y los Alumnos envían solicitudes individuales que el Tutor puede confirmar o rechazar; ambas personas pueden cancelar o proponer una reprogramación según las reglas descritas arriba, y el Tutor puede marcar las clases realizadas. Las notificaciones de clases se guardan en Supabase. Con la migración `20261125093000`, conversaciones y mensajes también se guardan en Supabase y solo son accesibles por sus participantes. Estas funciones no procesan pagos. Siguen pendientes la integración de pagos, la recuperación de contraseña, los adjuntos binarios y la actualización de mensajes en tiempo real.

## Datos de la aplicación

Se retiraron los usuarios, mensajes, pagos, notificaciones y movimientos de ejemplo de las pantallas de Alumno, Tutor y Admin. La búsqueda consulta los perfiles verificados desde Supabase y muestra estado vacío si todavía no hay perfiles que cumplan los requisitos de publicación. La disponibilidad y las solicitudes de reserva se guardan en Supabase; no se cobra ni se confirma una solicitud hasta que el Tutor la responda. Los ceros del panel Admin indican que todavía no hay datos integrados, no actividad real. Los perfiles de muestra que permanecen en la galería y el sistema de diseño son únicamente material visual y no se ofrecen en la búsqueda de tutores.

## Pantallas por rol y ruta

Catálogo leído directamente de `ROUTES` y `ROLE_SCREEN_ROUTES` en `src/routes/index.tsx`:

### Acceso

| Pantalla | Ruta URL | Vista interna (`internalId`) |
| --- | --- | --- |
| Bienvenida | `/` | `welcome` |
| Iniciar sesión (Alumno \| Tutor) | `/` | `login` |
| Recuperar contraseña | `/` | `recover` |
| Crear cuenta: selector Alumno \| Tutor | `/` | `register-role` |
| Enlace directo a Iniciar sesión (Tutor) | `/tutor` | `login:tutor` |
| Acceso administrativo (2FA) | `/admin` | `admin-login` |

### Alumno

| Pantalla | Ruta URL | Vista interna (`internalId`) |
| --- | --- | --- |
| Registro de Alumno | `/` | `register-student` |
| Buscar Tutores verificados (lista, filtros; disponibilidad de mapa pendiente) | `/` | `search` |
| Perfil público del Tutor | `/` | `profile` |
| Solicitar una clase individual (horarios reales, sin cobro) | `/` | `booking` |
| Solicitud pendiente de confirmación | `/` | `request-sent` |
| Calendario e historial del Alumno | `/` | `calendar` |
| Detalle de clase (reprogramar, cancelar, calificar, reportar) | `/` | `class-detail` |
| Mensajes y conversación | `/` | `messages / conversation` |
| Perfil, favoritos, tarjetas y ajustes | `/` | `account` |

### Tutor

| Pantalla | Ruta URL | Vista interna (`internalId`) |
| --- | --- | --- |
| Onboarding de Tutor (5 pasos y revisión) | `/tutor` | `register-tutor / onboarding` |
| Inicio del Tutor | `/tutor` | `home` |
| Calendario y disponibilidad del Tutor | `/tutor` | `calendar` |
| Detalle de clase del Tutor | `/tutor` | `class-detail` |
| Mensajes y conversación del Tutor | `/tutor` | `messages / conversation` |
| Finanzas y retiros | `/tutor` | `finances` |
| Más (perfil, credenciales, alumnos, suscripción, ayuda) | `/tutor` | `more` |

### Admin

| Pantalla | Ruta URL | Vista interna (`internalId`) |
| --- | --- | --- |
| Inicio (KPIs y estados vacíos mientras no haya datos conectados) | `/admin` | `home` |
| Usuarios (tabla, detalle, suspensión y reactivación) | `/admin` | `users` |
| Verificación de credenciales | `/admin` | `verification` |
| Moderación (perfiles y reseñas) | `/admin` | `moderation` |
| Pagos y disputas (estado vacío; integración pendiente) | `/admin` | `payments` |
| Comisiones, planes e historial de tarifas | `/admin` | `commissions` |
| Métricas y Ajustes | `/admin` | `metrics / settings` |

### Documentación

| Pantalla | Ruta URL | Vista interna (`internalId`) |
| --- | --- | --- |
| Galería de pantallas | `/galeria` | `gallery` |
| Sistema de diseño | `/sistema-de-diseno` | `ds` |

## Componentes simulados por reemplazar en producción

| Capacidad | Qué está simulado hoy | Qué debe reemplazarse en producción | Archivo en `src/services` |
| --- | --- | --- | --- |
| Autenticación | Registro e inicio de sesión con Supabase Auth; RLS en perfiles/roles y MFA TOTP para administradores. | Flujo de recuperación/actualización de contraseña y endurecimiento de configuración de producción. | `src/services/auth.ts` |
| Pagos | La solicitud de clase no procesa pagos. El checkout que permanece en la galería es solo una muestra visual. | Integración con pasarela de pagos en MXN (tokenización PCI, retención programada, dispersión SPEI y webhooks de reembolsos/disputas). | `src/services/pagos.ts` |
| Mensajes | Conversaciones y texto persistidos en Supabase, acceso limitado a participantes y estado de lectura. El adjunto conserva solo su nombre; no se almacena el archivo. | Actualización en tiempo real, carga privada de adjuntos, moderación y escaneo de archivos. | `src/services/mensajes.ts` |
| Catálogo público de Tutores | Perfiles profesionales completos y verificados desde Supabase; fotos privadas con URL firmada. | Reseñas, distancia, ubicación aproximada, disponibilidad y búsqueda geoespacial. | `src/services/perfiles.ts` |
| Mapa | Vista ilustrativa sin coordenadas personales; los perfiles indican su zona de servicio. | SDK de mapas interactivos (Mapbox o Google Maps), geocodificación por zona/radio en kilómetros y consulta geoespacial desde API. | `src/services/reservas.ts` |
| Disponibilidad, reservas y ciclo de clase | Horarios semanales, solicitudes, cancelaciones, propuestas de reprogramación, finalización y notificaciones persistidos en Supabase. Los horarios se publican en bloques de una hora; las cancelaciones requieren más de 24 horas de anticipación; una reprogramación requiere aceptación de la otra persona. | Excepciones por fecha, series/paquetes, recordatorios automáticos y pagos. Las reservas actuales no cobran. | `src/services/agenda.ts` |
| Almacenamiento de documentos | Los documentos de título y cédula se suben al bucket privado `tutor-credentials` (PDF/JPG/PNG hasta 10 MB); el Admin los abre con enlaces temporales firmados y guarda la decisión y el motivo de rechazo. | Historial inmutable de cambios de revisión y notificaciones automáticas al Tutor. | `src/services/perfiles.ts` |
| Calendario externo | Confirmación local en `exportSessionToExternalCalendar` (`ics-simulado`). | Generación firmada de archivos `.ics` y sincronización OAuth bidireccional con Google Calendar / Apple Calendar. | `src/services/calendario.ts` |
