# Ejecución — Next.js 16.4.1 y Node.js 22.23.4

## Decisiones antes de implementar

- TDD viable para el pin de versiones. Primero se añade `src/lib/runtime/security-pins.test.ts` y se ejecuta contra el árbol todavía en Next 16.2.6 (RED). Después se hace el cambio mínimo de versiones (GREEN). No se refactoriza la aplicación.
- TDD no aplicable a las CVE en sí: escribir un caso que dispare RCE en el optimizador SVG, RCE en `use cache` o el DoS de Server Actions sería un exploit. Alternativa, anotada antes de implementar: la red de regresión es `npm test` (suite existente), `npm run lint`, `npx tsc --noEmit` y `npm run build`.
- No se crea Dockerfile, Nixpacks ni Railpack. No existen en el repositorio.
- `sharp` se asegura por resolución del lockfile (`next@16.4.1` pide `sharp@^0.35.5`). Solo se añadirá dependencia directa u `overrides` si tras `npm install` la versión resuelta es inferior a 0.35.5 o el paquete no queda instalado.
- `engines.node` pasa de rango `>=22.13.0` a versión exacta `22.23.4`, igual que `.nvmrc`.
- Rama de trabajo: `cursor/next-16-4-1-security-fff1`, creada desde `main` (`ba8987a7c20052f4128422f64776ab2589d5e606`).

## Comprobación de registros (solo lectura)

Ejecutado el 23/10/2026, antes de editar dependencias. Runtime local: `node -v` → `v22.23.4`, `npm -v` → `10.9.9`.

- `npm view next@16.4.1 version` → `16.4.1`. Dist-tag `latest` ese día: `16.4.3` (no se usa).
- `npm view eslint-config-next@16.4.1 version` → `16.4.1`.
- `npm view next@16.4.1 optionalDependencies` incluye `sharp: ^0.35.5` y `@next/swc-*` en `16.4.1`. Dependencia directa `@next/env: 16.4.1`.
- `npm view @next/env@16.4.1`, `@next/eslint-plugin-next@16.4.1` y `@next/swc-linux-x64-gnu@16.4.1` → `16.4.1`.
- `npm view sharp versions`: la única versión `>= 0.35.5` publicada es `0.35.5`. `engines.node` de sharp 0.35.5: `>=20.9.0`.
- `curl https://nodejs.org/dist/index.json`: `v22.23.4` presente (`date: 2026-10-20`, `security: true`, `lts: Jod`). `v24.22.1` también presente. La v22 más nueva del índice es `v22.23.4`.
- Nota de release https://nodejs.org/en/blog/release/v22.23.4 : 2026-10-21, security release (CVE-2026-106069, CVE-2026-106072, CVE-2026-105482, CVE-2026-111497, CVE-2026-105481, CVE-2026-106074, CVE-2026-106073).

Estado leído del árbol:

- `package.json`: `next@16.2.6`, `eslint-config-next@16.2.6`, `engines.node >=22.13.0`.
- `package-lock.json`: `node_modules/sharp` versión `0.34.5`.
- `src/app/admin/actions.ts`: `"use server"`.
- Sin `'use cache'`. `next.config.ts` sin bloque `images`.

## Revisión de seguridad

[YES] Reason: ver `plan.md`. No bloquea la implementación.

## Bitácora

### RED (antes del bump de versiones)

Comando: `node --experimental-strip-types --test src/lib/runtime/security-pins.test.ts`

Salida: `artifacts/red-security-pins.txt`. Código de salida 1.

- Falla `next` real `16.2.6` frente a `16.4.1`.
- Falla `engines.node` real `>=22.13.0` frente a `22.23.4`.
- Falla `sharp` real `0.34.5` frente a `>= 0.35.5`.
- Pasa el caso de Dockerfile/nixpacks/railpack porque ninguno de esos archivos existe.

Aviso de Node `MODULE_TYPELESS_PACKAGE_JSON` al ejecutar el test como ESM. Los tests existentes ya usan sintaxis ESM sin `"type": "module"`. No se añade ese campo: cambiaría la resolución de módulos de la app y queda fuera del alcance.

### GREEN

- `.nvmrc` = `22.23.4`.
- `engines.node` = `22.23.4`.
- `npm install next@16.4.1 eslint-config-next@16.4.1 --save-exact` (código 0, ~9 s). No hubo rotura de API que corregir.
- Lockfile: `sharp@0.35.5` opcional; `@next/env`, `@next/eslint-plugin-next` y `@next/swc-*` en `16.4.1`.
- `require("sharp")` carga; versión leída de `node_modules/sharp/package.json`: `0.35.5`.
- Test de pines: código 0, 4/4. Evidencia `artifacts/green-security-pins.txt`.

### Chequeos del implementador (los repetirá el rol de validación)

| Comando | Código |
| --- | --- |
| `npm ci` | 0 (`artifacts/npm-ci.txt`). Tras reinstalar, sharp sigue en 0.35.5 y carga. |
| `npm run lint` | 0 |
| `npx tsc --noEmit` | 0 |
| `npm test` | 0, 18/18 |
| `npm run build` | 0. Next.js 16.4.1 (Turbopack). Rutas `/`, `/admin`, `/api/scholarship-applications`. |

No se ejecutó `npm audit fix`. `npm audit` sigue reportando 7 avisos ajenos a Next/sharp (ver riesgos en el informe): nodemailer, brace-expansion, browserslist, js-yaml, source-map-js, baseline-browser-mapping, @babel/core. Quedan fuera de este encargo. Resumen en `artifacts/npm-audit-summary.txt`.

### Review de código

Rol distinto (subagente de revisión), sin modificar archivos.

- Primera pasada: VEREDICTO APROBADO. Observación no bloqueante: el test no afirmaba `node_modules/next` ni `node_modules/eslint-config-next` dentro del lockfile.
- Se añadió esa aserción y el test de pines volvió a pasar 4/4 (`artifacts/green-security-pins.txt`).
- Segunda pasada, solo el delta del test: VEREDICTO APROBADO. Sin bloqueos abiertos.

### Validación independiente

Rol distinto. No tocó código de producción. Reejecutó `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build`. Emitió `verification.json` con `status: passed`. Evidencia en `artifacts/validation/`.

`e2e_testsprite` quedó `skipped`: el diff no toca superficie web. TestSprite no se ejecutó. La justificación de alcance es aceptable según el protocolo.

`data/becas.sqlite` no cambió (hash `0707c713b386b5da94953285719a13ae0e23c58f`). Los tests usan sqlite temporal y ya la borran en `test.after`. No hubo fixtures ni usuarios que limpiar.

### Documentación (después de la validación)

- `README.md`: Node 22.23.4, `.nvmrc`, ausencia de Dockerfile/Nixpacks/Railpack, y `tsc --noEmit` en la verificación.
- `CHANGELOG.md`: entrada 2026-10-23. El repositorio no tenía changelog previo.
- Estos archivos no cambian el comportamiento ni la superficie web. No se repitió la E2E.

## Encargo 2 — decisión antes de implementar

- `npm view next@16.4.3`, `eslint-config-next@16.4.3` y `@next/env@16.4.3` devuelven `16.4.3`. `optionalDependencies.sharp` de next 16.4.3 sigue en `^0.35.5`.
- La primera versión de nodemailer que cierra los cuatro avisos high es `10.0.6` (GHSA-v53p-9fqp-m79j). Se fija exacta. No se usa `npm audit fix` ni `10.2.1`.
- El major trae rupturas (TLS en descargas remotas/OAuth2/proxy, y Node >= 20). El código de envío no usa esas rutas y Node ya es 22.23.4. No se edita `scholarship-notification.ts` salvo que el test de `sendMail` o `tsc` demuestren una rotura. En ese caso se revierte nodemailer y se documenta.
- TDD: el test de pines se actualiza primero y se ejecuta en rojo. El test de la forma de `sendMail` se ejecuta en verde con nodemailer 8.0.7 y tiene que seguir en verde con 10.0.6.
- `npm audit` de partida guardado en `artifacts/npm-audit-before-16.4.3.txt`: 5 high, 1 moderate, 1 low. nodemailer está en high, rango `<=10.0.9`, instalado `8.0.7`.
- Revisión de seguridad: [YES] Reason: ver la sección «Encargo 2» de `plan.md`.

### RED

- `src/lib/runtime/security-pins.test.ts` contra el árbol 16.4.1 / nodemailer 8.0.7: código 1, 3 fallos y 2 pasos (Node y ausencia de Dockerfile). Evidencia `artifacts/red-16.4.3-pins.txt`.
- `src/lib/email/nodemailer-api.test.ts` en nodemailer 8.0.7: código 0. La forma `createTransport` + `sendMail` que usa la app ya funciona. Evidencia `artifacts/nodemailer-api-before.txt`.

### GREEN

- `npm install next@16.4.3 eslint-config-next@16.4.3 nodemailer@10.0.6 --save-exact` (código 0).
- No se editó `src/lib/email/scholarship-notification.ts`. El test de `sendMail` sigue en verde con 10.0.6 (`artifacts/nodemailer-api-after.txt`). `tsc --noEmit` también, con `@types/nodemailer` ^8 sin cambios.
- Lockfile: next, eslint-config-next y todos los `@next/*` en 16.4.3. sharp 0.35.5. nodemailer 10.0.6.
- Pines: 5/5 (`artifacts/green-16.4.3-pins.txt`).
- Chequeos del implementador: `npm ci` 0, lint 0, `tsc --noEmit` 0, `npm test` 20/20, `npm run build` 0 (Next.js 16.4.3).

### npm audit

- Antes (`artifacts/npm-audit-before-16.4.3.txt`): 5 high, 1 moderate, 1 low. nodemailer high, rango `<=10.0.9`.
- Después (`artifacts/npm-audit-after-16.4.3.txt`): 4 high, 2 moderate, 1 low. nodemailer baja a moderate, rango `3.0.0 - 10.0.9`.
- Siguen en high, fuera de este encargo: brace-expansion, browserslist, js-yaml, source-map-js.
- Moderates que quedan en nodemailer 10.0.6: DKIM cuadrático (GHSA-39m8-27wv-hr27, parche en 10.0.10; ya afectaba a 8.0.7) y el local-part entrecomillado (GHSA-g57g-f23g-4646, rango `>=9.1.0 <10.0.9`, no afectaba a 8.0.7; primera versión fuera de ese rango: 10.0.9). No se sube más: el encargo pide la primera versión que cierra el high, que es 10.0.6.

### Review de código

Rol distinto. VEREDICTO APROBADO. Sin bloqueos. El moderate residual de nodemailer queda anotado como no bloqueante.

### Validación independiente

Rol distinto. No tocó código de producción. Reescribió `verification.json` con `status: passed`. Evidencia en `artifacts/validation-16.4.3/`.

`npm_audit_before` quedó `skipped`: este rol no reejecutó el árbol 16.4.1 / nodemailer 8.0.7. El informe sí se ejecutó en la implementación y está en `artifacts/npm-audit-before-16.4.3.txt`. `npm_audit_after` lo ejecutó el validador: nodemailer moderate, código de salida 1 por el resto de avisos.

`e2e_testsprite` quedó `skipped`: el diff no toca superficie web. TestSprite no se ejecutó.

### Documentación

`CHANGELOG.md` gana una entrada del 2026-10-23 para 16.4.3 y nodemailer 10.0.6, encima de la entrada del primer parche. La descripción de la PR #8 se actualiza después del push.
