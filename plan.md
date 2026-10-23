# Plan — actualización de seguridad Next.js 16.4.1 y Node.js 22.23.4

## Clasificación

- Clasificación: **full**. Cambia dependencias de runtime, el lockfile, la versión de Node y la configuración que el despliegue puede leer (`engines`). Afecta a seguridad y cruza varios archivos. No es una edición puntual de un solo archivo.
- Tier: **standard**. Hay dependencia de seguridad y configuración de versión de despliegue. No hay migraciones, secretos nuevos, cambios de autenticación ni borrado de datos.

## Rama base

No existe una rama `dev`, `develop`, `test` ni `staging`. Las ramas remotas son `main` y `feat/google-sheets-scholarship-log`. `origin/HEAD` apunta a `origin/main`.

Se parte de la rama por defecto `main`, commit `ba8987a7c20052f4128422f64776ab2589d5e606`. El trabajo vive solo en `cursor/next-16-4-1-security-fff1`. No se hace push a `main` ni a ninguna rama que despliegue, no se fusiona y no se despliega.

## Alcance

Incluido:

- Subir `next` y `eslint-config-next` a `16.4.1` exacto.
- Dejar en el lockfile todos los paquetes `@next/*` en `16.4.1` (entran como dependencias de `next` y de `eslint-config-next`; no hay `@next/*` directos en `package.json`).
- Asegurar `sharp` >= `0.35.5` resuelto en el lockfile. `next@16.4.1` lo declara como dependencia opcional `sharp: ^0.35.5`. No se añade dependencia directa si el lockfile ya resuelve `0.35.5` o superior.
- Crear `.nvmrc` con `22.23.4`.
- Fijar `engines.node` a `22.23.4` (hoy está en `>=22.13.0`).
- Añadir un test de pines que falle antes del cambio y pase después.
- Corregir de forma mínima cualquier rotura de API que aparezca en lint, typecheck, build o tests.
- Documentar uso, configuración, pruebas, limitaciones y un `CHANGELOG.md` (el repositorio no tenía changelog).

Fuera de alcance:

- No se sube a `next@16.4.3` (`latest` en npm el 23/10/2026). El encargo fija `16.4.1`.
- No se crea Dockerfile, `nixpacks.toml` ni configuración Railpack: no existen y crearlos cambiaría el modo de despliegue de Coolify.
- No se activa `images.dangerouslyAllowSVG`.
- No se modifica la lógica de las Server Actions ni la autenticación del panel.
- No se escriben pruebas de explotación de las CVE.

## Versiones comprobadas antes de fijar

Comprobado el 23/10/2026, antes de editar dependencias:

| Pieza | Pedida | Registro | Resultado |
| --- | --- | --- | --- |
| `next` | 16.4.1 | `npm view next@16.4.1 version` | Existe. `latest` del registro ese día es 16.4.3; se respeta 16.4.1. |
| `eslint-config-next` | 16.4.1 | `npm view eslint-config-next@16.4.1 version` | Existe. |
| `@next/env`, `@next/eslint-plugin-next`, `@next/swc-linux-x64-gnu` | 16.4.1 | `npm view <pkg>@16.4.1 version` | Existen. `next@16.4.1` depende de `@next/env@16.4.1` y de los binarios `@next/swc-*@16.4.1`. |
| `sharp` | >= 0.35.5 | `npm view sharp versions` | `0.35.5` es la única versión publicada que cumple. `next@16.4.1` declara `optionalDependencies.sharp = ^0.35.5`. |
| Node.js | 22.23.4 | `https://nodejs.org/dist/index.json` y la nota de release | Existe. Índice: `v22.23.4`, fecha `2026-10-20`, `lts: Jod`, `security: true`. Nota de release: 2026-10-21, versión de seguridad. También existe `v24.22.1`; esta app se queda en la línea 22. |

El runtime local de esta sesión ya es Node `v22.23.4` y npm `10.9.9`.

Estado de partida en `main`:

- `next` y `eslint-config-next`: `16.2.6`.
- `@next/env`, `@next/eslint-plugin-next` y `@next/swc-*` en el lockfile: `16.2.6`.
- `sharp` resuelto: `0.34.5` (por debajo de la mitigación).
- `engines.node`: `>=22.13.0`.
- No hay `.nvmrc`, Dockerfile, `nixpacks.toml` ni Railpack.

## Auditoría de código (antes del cambio)

- Server Actions: sí. `src/app/admin/actions.ts` empieza con `"use server"` y exporta `loginAction`, `logoutAction`, `createPeriodAction`, `updatePeriodAction`, `setCurrentPeriodAction` y el borrado de periodos. La app es App Router, así que GHSA-p3m5-59mp-jv5r (DoS por Server Actions) aplica al código actual. La corrección es subir Next.js; no hay workaround de aplicación que este plan vaya a implementar.
- Cache Components / `'use cache'`: no hay ninguna coincidencia en `src/`. GHSA-673q-mjm6-r5xr (RCE en funciones `use cache` que devuelven varios typed arrays) no tiene un punto de uso en este repositorio. El aviso de Next.js pide actualizar igualmente.
- `images` en `next.config.ts`: no hay clave `images`. Por tanto no están definidos `dangerouslyAllowSVG`, `remotePatterns` ni `unoptimized`. El valor por defecto de `dangerouslyAllowSVG` permanece desactivado y el optimizador sigue activo para los formatos que Next acepta.
- `next/image`: dos usos, ambos con el AVIF local `/7cc4845ce8a62d935d2dd0db23209c3ca8d5463f-587x282.avif` (`src/components/institute-mark.tsx` y `src/components/scholarship-form/ScholarshipApplicationForm.tsx`). No hay SVG en esas fuentes.
- `public/` contiene SVG de plantilla (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) que el código de `src/` no referencia. No se eliminan: quedan fuera del alcance. Servirlos como estáticos no pasa por `sharp`; el riesgo de CVE-2026-96889 es el optimizador de imágenes cuando procesa SVG.

## Revisión de seguridad previa

[YES] Reason: Las versiones objetivo existen en npm y en nodejs.org. El cambio solo eleva Next.js y los paquetes `@next/*` emparejados a 16.4.1, resuelve `sharp` >= 0.35.5 y fija Node.js 22.23.4 en `.nvmrc` y `engines`. No introduce secretos, no debilita la autenticación del panel, no toca migraciones ni borra datos históricos, y no activa `dangerouslyAllowSVG`. Los controles de las Server Actions siguen en el servidor (origen, límite de intentos, contraseña y sesión). No se crea un Dockerfile ni una config de Nixpacks/Railpack, para no cambiar el modo de despliegue de Coolify.

## Criterios de aceptación

1. `package.json` declara `next` y `eslint-config-next` en `16.4.1`, y `engines.node` en `22.23.4`.
2. `.nvmrc` contiene `22.23.4`.
3. El lockfile resuelve `sharp` >= `0.35.5` y cada `@next/*` en `16.4.1`.
4. `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build` terminan con código 0. No hay script `typecheck`; el chequeo de tipos es `tsc --noEmit` según `tsconfig.json` (`noEmit: true`).
5. Si algún chequeo falla por una rotura de API, la corrección es mínima y se vuelve a ejecutar el ciclo.
6. `verification.json` refleja solo comandos ejecutados.

## Riesgos

- Coolify no tiene Dockerfile ni Nixpacks en el repo. `.nvmrc` y `engines` documentan el pin, pero el proceso que ya está desplegado no cambia hasta un despliegue futuro, y este encargo prohíbe desplegar. Si el proveedor de build de Coolify aún no ofrece Node 22.23.4, el siguiente despliegue puede fallar al resolver la versión exacta. Es preferible ese fallo visible a seguir en una versión de Node sin los parches del 21/10/2026.
- `engines` exacto `22.23.4` rechaza, a efectos de aviso de npm, cualquier otro Node. La release 22 más nueva publicada en el índice el 23/10/2026 es precisamente 22.23.4.
- Las Server Actions siguen existiendo. El DoS queda corregido solo en la medida en que el runtime desplegado use Next 16.4.1.
- No hay `'use cache'`, pero el aviso de Next pide el parche igualmente: 16.4.1 lo incluye.
- El optimizador de imágenes sigue activo (no se pone `unoptimized`). La mitigación de CVE-2026-96889 es Next 16.4.1 más `sharp` >= 0.35.5, no desactivar el optimizador. Los SVG de `public/` no se pasan a `next/image`.
- `sharp` es dependencia opcional. En Linux glibc debe instalarse de verdad; si `npm ci` la omite, el criterio de aceptación no se cumple y hay que fijarla de forma directa.

## Pruebas y TDD

TDD viable para los pines: un test de Node (`src/lib/runtime/security-pins.test.ts`) lee `package.json`, `.nvmrc` y `package-lock.json`. Se ejecuta en rojo contra el estado 16.2.6 / sharp 0.34.5 / sin `.nvmrc`, y en verde después del bump. No se escribe un exploit de las CVE; la alternativa para la compatibilidad de API es la suite ya existente más lint, `tsc --noEmit` y `build`.

E2E TestSprite: no se dispara con el alcance previsto. El diff no debe tocar vistas, plantillas, assets estáticos ni controladores HTTP. Si una rotura de API obligara a editar esa superficie, la E2E pasaría a ser obligatoria y se ejecutaría solo tras el resto de chequeos en verde, contra runtime local. Si no hace falta tocarla, `e2e_testsprite` queda `skipped` con esa justificación de alcance.

Los tests de periodos usan una sqlite temporal (`SCHOLARSHIP_DB_PATH`) y la borran en `test.after`. No se escribe en `data/becas.sqlite`.

## Publicación autorizada

El usuario autorizó el 23/10/2026 una sola PR desde `cursor/next-16-4-1-security-fff1` hacia `main`, y el push a esa rama propia. Sigue prohibido fusionar, hacer push a ramas que despliegan y desplegar. Si `verification.json` no queda en `passed`, la PR se abre como borrador y se dice en la descripción.
