# Arquitectura del MVP

HTML, CSS y JavaScript ES modules sin dependencias, con interfaz de trabajo en el navegador. El flujo editorial
se guarda en IndexedDB. Este modo local permite usar captura, historias, ideas,
variantes, aprobación y calendario sin una integración externa disponible.
La interfaz debe identificarlo como local: un acceso al espacio del dispositivo
no equivale a autenticación de una cuenta cloud.

Los datos y archivos están ligados al origen y navegador que los creó. Cambiar
de dispositivo, usar una URL de preview distinta o borrar los datos del sitio
no transfiere el espacio de trabajo. Exportar un respaldo conserva la información
para una futura importación. No hay publicación ni análisis automático de archivos
externos. Las muestras se identifican como prueba, sin atribuirlas a hechos reales.

`src/lib/supabase.ts` prepara un adaptador opcional para Auth, REST y Storage.
El adaptador no se conecta por sí solo al store local. Las únicas variables
públicas previstas son URL y publishable key, nunca service_role. Tokens de sesión
deben gestionarse al integrar Auth; SSR requerirá cookies y SDK oficial.

El cloud se habilitará en un proyecto independiente, preservando SØD OS y Órbita.
La creación requiere que Iván seleccione la organización Supabase, exigencia
explícita de la herramienta. No se aprobó gasto ni se crearon credenciales.

El SQL preparado usa RLS de propietario en cada tabla, vistas security_invoker y
funciones security invoker. Las funciones públicas revocan EXECUTE de PUBLIC y
otorgan sólo las RPC necesarias a authenticated. El bucket es privado y limita
acceso a rutas bajo `auth.uid()`. No se confía en user_metadata para autorización.

Siguiente paso cloud: seleccionar organización, crear proyecto nuevo, generar y
aplicar migración desde schema/seed, validar RLS con dos usuarios, configurar Auth,
ejecutar asesores y conectar el adaptador. La CLI no pudo descargarse en este
entorno por fallo DNS a registry.npmjs.org; no se inventó historial de migraciones.
