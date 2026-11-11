# Modelo de datos

El MVP guarda su espacio de trabajo en IndexedDB del navegador. Las entidades del
dominio son perfil, proyectos, pilares, cuentas sociales, fuentes, historias,
ideas, piezas madre, contenido, variantes, slots y aprendizajes. Los adjuntos
permanecen en el mismo dispositivo. No hay métricas de redes conectadas.

El esquema cloud preparado en `supabase/schema.sql` modela las mismas entidades
relacionalmente. `profiles.owner_user_id` referencia `auth.users`; todas las demás
entidades pertenecen a un `profile_id`. Las claves foráneas compuestas impiden
relacionar registros de distintos perfiles, incluso del mismo dueño. Sólo hay
un proyecto PRIMARY por perfil; los proyectos secundarios son independientes.

Una historia READY cuenta como deuda narrativa mientras no exista un contenido
derivado de sus ideas. La aprobación ocurre en la variante por plataforma.
Programar una variante exige aprobación y fecha futura. Editar su texto invalida
la aprobación y elimina el slot; volver a borrador también retira la programación.

El esquema incluye `workspace_snapshots` como puente futuro para sincronización
intencional; todavía no sincroniza ni importa el dispositivo automáticamente.
Los IDs y las fechas locales deben migrarse explícitamente al habilitar cloud.

**Validación cloud pendiente:** no hay proyecto nuevo creado, migración aplicada,
test SQL remoto ni asesores ejecutados. El SQL es una preparación revisada, no
evidencia de una base de datos en producción.
