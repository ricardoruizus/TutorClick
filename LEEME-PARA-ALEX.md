# TutorClick corregido — Léeme, Alex

Esta es la versión con los 3 pendientes que reportó Ricardo ya arreglados.
No trae ninguna clave: tú pones tus datos en tu propio `.env.local`, como antes.

## Qué se arregló

### 1. Los adjuntos ya suben el archivo de verdad
Antes solo se guardaba el nombre del archivo. Ahora, cuando eliges un archivo
en el chat, el archivo se sube a Supabase (carpeta privada `message-attachments`)
y después se guarda el mensaje con su nombre, su tamaño y su ruta.
- Se pueden subir PDF, Word, Excel, PowerPoint, TXT e imágenes JPG, PNG o WebP,
  de máximo 10 MB.
- Mientras se sube, ves "Subiendo…" y puedes quitar el archivo antes de enviar.
- En los mensajes recibidos aparece el botón **Descargar archivo** (o **Abrir imagen**)
  y, si es una imagen, se ve una vista previa. El enlace dura 1 hora.
- Solo las dos personas de la conversación pueden abrir esos archivos.

### 2. Los mensajes y las reservas llegan solos, sin recargar
Antes había que entrar y salir (o recargar) para ver un mensaje nuevo.
Ahora, mientras tengas la sesión iniciada, la app escucha los cambios en tiempo real:
- Cuando llega un mensaje nuevo, la lista se actualiza sola y en Mensajes aparece
  el indicador verde **En vivo**.
- Cuando cambia una reserva (confirmada, cancelada, reprogramada), el calendario
  se actualiza solo si estás viéndolo.
- Si el tiempo real falla, todo sigue funcionando como antes: al entrar a Mensajes
  o al Calendario se cargan los datos a mano.

### 3. La web ya se ve bien en computadora
Antes la app estaba encerrada en un marco de teléfono de 390 px y en la computadora
se veía una columnita angosta. Ahora:
- En el celular se ve igual que antes, con la navegación de abajo.
- En tablet y computadora la app usa todo el ancho de la pantalla (hasta un máximo
  centrado), sin el marco de teléfono.
- La búsqueda de tutores se ve en cuadrícula: 1 columna en celular, 2 en tablet
  y 3 en computadora.
- Los formularios (login, registro, reserva) no se estiran a lo ancho.

## Migraciones nuevas de Supabase (muy importante)

Aplícalas en el SQL Editor de Supabase **en este orden**, después de la
`20261125093000` que ya tenías:

1. `supabase/migrations/20261125100000_message_attachments.sql`
   (adjuntos reales + bucket privado `message-attachments`)
2. `supabase/migrations/20261125101000_realtime_messages_bookings.sql`
   (tiempo real para mensajes y reservas)

Si alguna te dice que ya existe algo, no la vuelvas a aplicar: avísame con el
mensaje de error y lo revisamos. Los pasos están también en `docs/entrega.md`.

## Cómo probarlo

1. Descomprime este zip y entra a la carpeta.
2. Instala las dependencias (solo la primera vez):
   ```sh
   corepack pnpm install
   ```
   Si `pnpm` no te funciona, usa `npm install`.
3. Copia el ejemplo de configuración y pon tus datos de Supabase:
   ```sh
   cp .env.example .env.local
   ```
   En `.env.local` escribe la URL del proyecto y la clave pública de Supabase.
   **Nunca subas `.env.local` a GitHub.**
4. Prende la app:
   ```sh
   corepack pnpm dev
   ```
5. Abre `http://localhost:8443` en el navegador.

### Prueba rápida de cada arreglo
- **Adjuntos:** entra a una conversación, adjunta un PDF o una foto, envíalo,
  y ábrelo desde la otra cuenta (o recarga): debe aparecer Descargar/Abrir.
- **Tiempo real:** abre la misma conversación en dos ventanas (alumno y tutor).
  Escribe en una: en la otra debe aparecer solo, sin recargar, y con "En vivo".
- **Responsive:** abre la app en la computadora y haz la ventana más ancha y
  más angosta: la búsqueda debe pasar de 1 a 2 y 3 columnas, y no debe verse
  la columnita de teléfono.

## Qué no se pudo probar aquí
El código compila sin errores (`tsc` y `pnpm build` pasan), pero no se pudo
probar contra el Supabase real del equipo, porque no tengo sus credenciales.
Las migraciones nuevas hay que aplicarlas en Supabase y probar los adjuntos
y el tiempo real con dos cuentas, como arriba. Si al aplicar una migración
sale un error, guárdame el mensaje exacto y lo corregimos.
