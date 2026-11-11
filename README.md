# CONTENT OS · MVP 0.1

Sistema editorial para capturar fuentes, desarrollar historias e ideas, crear piezas y variantes, aprobar y programar. SØD es el proyecto principal; Órbita y Kadmontech se mantienen separados.

## Ejecutar

Requiere Node.js 22 o superior. No requiere instalar paquetes.

```sh
node --test tests/*.test.mjs
node scripts/build.mjs
node scripts/serve.mjs
```

Abrir http://127.0.0.1:4173. Para Vercel: build `node scripts/build.mjs`, salida `dist`, framework Other.

## Persistencia y acceso

Esta entrega utiliza **IndexedDB en el navegador**. Entrar al espacio local no es autenticación de servidor. La app no sube contenido a servicios externos. Cada origen y navegador mantiene su propio espacio; una URL nueva o un navegador distinto no comparte los datos. El contenido puede perderse si se borran los datos del sitio. Exportar JSON desde Ajustes conserva texto y metadatos; los archivos adjuntos se conservan sólo en el navegador de origen y deben respaldarse por separado.

No hay publicación automática, OAuth de redes, métricas de redes ni generación IA. Los formularios de transformación conservan el material fuente y permiten edición humana. El flujo funciona sin credenciales externas.

## Reglas de dominio

- Story Debt: historias READY sin pieza derivada, enlazada mediante idea o pieza madre.
- Capture Rate V0: capturas de los últimos siete días / experiencias estimadas manualmente para ese período. Sin denominador se muestra sin datos.
- Cada variante se aprueba de forma independiente. Cambiar texto, formato, medio o plataforma revoca su aprobación y programación.
- Programar requiere aprobación y fecha futura; calendario usa la zona America/Argentina/Buenos_Aires.
- No se insertan experiencias ficticias como contenido del usuario. El escenario SØD EVENT STORY se ejecuta en pruebas aisladas.

## Arquitectura

JavaScript ES modules sin dependencias, CSS y HTML estático. `domain.js` implementa validación, transacciones y persistencia; `app.js` implementa navegación y formularios; `styles.css` define la interfaz responsive. Esta decisión permite una app funcional ante el bloqueo de instalación y creación de infraestructura. Next.js/TypeScript y Supabase siguen como ruta de evolución, no se presentan como integraciones activas.

`supabase/schema.sql`, `supabase/seed.sql` y `src/lib/supabase.ts` son preparación para una futura instalación independiente con RLS. No se aplicaron a ninguna base existente. Ver `supabase/README.md`.

## Validación

Pruebas Node del flujo completo, persistencia, rechazo de programación sin aprobar, revocación al editar, referencias y recuperación de errores. Build verifica sintaxis de todos los módulos publicados antes de copiar los cuatro archivos a `dist`.
