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

La autenticación ya es real; los datos de búsqueda, reservas, pagos, mensajes, disponibilidad y el resto del perfil aún provienen del prototipo y no se guardan en la base. La recuperación de contraseña también sigue pendiente de integración.

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
| Buscar Tutores (lista, mapa y filtros) | `/` | `search` |
| Perfil público del Tutor | `/` | `profile` |
| Reservar clase (única, serie o paquete) | `/` | `booking` |
| Confirmación y pago protegido | `/` | `checkout` |
| Clase confirmada | `/` | `confirmed` |
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
| Inicio (KPIs, gráfica 30 días y pendientes) | `/admin` | `home` |
| Usuarios (tabla, detalle, suspensión y reactivación) | `/admin` | `users` |
| Verificación de credenciales | `/admin` | `verification` |
| Moderación (perfiles y reseñas) | `/admin` | `moderation` |
| Pagos y disputas (DSP-0892) | `/admin` | `payments` |
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
| Pagos | Cálculo local de cargos/comisiones, autorización inmediata con tarjeta, retención simulada de 48 h, retiros y resolución en memoria de disputas. | Integración con pasarela de pagos en MXN (tokenización PCI, escrow/retención programada de 48 h, dispersión SPEI a cuentas CLABE y webhooks de reembolsos/disputas). | `src/services/pagos.ts` |
| Mensajes | Hilos iniciales en memoria, envío local de mensajes, nombres de adjuntos sin subida real y detector regex de teléfonos/enlaces externos. | Transporte en tiempo real (WebSockets/SSE), persistencia de conversaciones, moderación en servidor y escaneo/almacenamiento de archivos adjuntos. | `src/services/mensajes.ts` |
| Mapa | Catálogo estático con coordenadas porcentuales (`pin`) sobre un plano SVG ilustrativo de Mérida en `listMapTutors`. | SDK de mapas interactivos (Mapbox o Google Maps), geocodificación por zona/radio en kilómetros y consulta geoespacial desde API. | `src/services/reservas.ts` |
| Almacenamiento de documentos | Validación local de tipo/tamaño (`uploadVerificationDocument`, PDF/JPG/PNG hasta 10 MB) conservando únicamente el nombre del archivo. | Subida con URLs prefirmadas a almacenamiento privado cifrado, visor seguro temporal para Admin y registro de auditoría de expedientes. | `src/services/auth.ts` |
| Calendario externo | Confirmación local en `exportSessionToExternalCalendar` (`ics-simulado`) y disponibilidad del Tutor mantenida en memoria. | Generación firmada de archivos `.ics`, sincronización OAuth bidireccional con Google Calendar / Apple Calendar y bloqueo transaccional de horarios. | `src/services/calendario.ts` |
