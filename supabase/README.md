# Base de datos opcional

El MVP funciona con IndexedDB en el dispositivo. Este esquema es la preparación
para una futura conexión cloud; **no fue aplicado ni probado contra un proyecto**.
No se modificaron SØD OS ni Órbita.

Para habilitar cloud se necesita seleccionar una organización Supabase y aprobar
cualquier costo distinto de cero. La herramienta de creación exige esa selección
humana. Después:

1. Crear un proyecto independiente `content-os`.
2. Generar una migración con la CLI (`supabase migration new content_os_init`) y
   colocar `schema.sql` y luego `seed.sql` en ella. La CLI no pudo descargarse en
   este entorno por fallo DNS a `registry.npmjs.org`.
3. Aplicarla al proyecto nuevo y ejecutar asesores de seguridad/rendimiento.
4. Configurar `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en desarrollo/despliegue.
5. Crear la cuenta del dueño mediante el flujo Auth y llamar
   `bootstrap_content_os()` con su sesión. El bootstrap usa RLS, no privilegios
   de administrador, y no crea experiencias ficticias.
6. Integrar `SupabaseGateway` con las pantallas; poner variables no activa
   sincronización por sí solo. Subir archivos intencionalmente a rutas
   `<auth.uid()>/<id>-archivo`. El bucket es privado, con límite de 50 MiB.

Las entidades están normalizadas. Cada vínculo lleva `profile_id` para impedir
referencias entre perfiles. Todas las tablas tienen RLS de propietario, sin
permisos anónimos; las vistas invocan la seguridad del usuario. Cambiar el texto
de una variante invalida su aprobación y programación. La RPC de programación
requiere una variante aprobada y fecha futura, con escritura atómica de slot.

No hay tokens secretos ni clave `service_role` en el código. El adaptador sólo
admite publishable key; la sesión la administra quien lo integra. Para SSR futuro
usar el SDK oficial y cookies verificadas, sin confiar en datos del cliente.
