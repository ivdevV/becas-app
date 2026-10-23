# Changelog

## 2026-10-23

### Seguridad

- `next` y `eslint-config-next` pasan de 16.2.6 a 16.4.1. Los paquetes `@next/*` del lockfile quedan en la misma versión.
- `sharp`, dependencia opcional de Next.js, queda resuelto en 0.35.5 (antes 0.34.5).
- Node.js queda fijado en 22.23.4 en `.nvmrc` y en `engines`. Antes el rango era `>=22.13.0` y no había `.nvmrc`.

Cubre el aviso de Next.js del 14/10/2026: CVE-2026-96889 (RCE en el optimizador de imágenes con SVG), GHSA-673q-mjm6-r5xr (RCE en Cache Components / `use cache`) y GHSA-p3m5-59mp-jv5r (DoS con Server Actions). Node.js 22.23.4 es la release de seguridad del 21/10/2026.

### Uso que queda en la aplicación

- Hay Server Actions en `src/app/admin/actions.ts`. El parche del DoS está en Next.js 16.4.1; la lógica del panel no cambia.
- No hay Cache Components ni `'use cache'`.
- `next.config.ts` no define `images`. `dangerouslyAllowSVG`, `remotePatterns` y `unoptimized` siguen sin configurarse. `next/image` solo usa un AVIF local.

### Pruebas

- `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test` (18 pruebas) y `npm run build` pasan en Node v22.23.4.
- No hubo roturas de API que corregir.

### Limitaciones

- No existe Dockerfile, `nixpacks.toml` ni configuración Railpack. El pin de Node no cambia el proceso que Coolify ya tenga desplegado hasta un despliegue futuro, y este cambio no despliega.
- `npm audit` sigue avisando de paquetes ajenos a este parche, entre ellos `nodemailer` (dependencia directa `^8.0.7`, rango auditado `<=10.0.9`) y transitivas de herramientas (`brace-expansion`, `browserslist`, `js-yaml`, `source-map-js`, `@babel/core`, `baseline-browser-mapping`). No se aplicó `npm audit fix`.
