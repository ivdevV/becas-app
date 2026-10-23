# Changelog

## 2026-10-23

### Seguridad — Next.js 16.4.3 y nodemailer 10.0.6

- `next`, `eslint-config-next` y los `@next/*` del lockfile pasan de 16.4.1 a 16.4.3. `sharp` sigue resuelto en 0.35.5.
- `nodemailer` pasa de 8.0.7 a 10.0.6, la primera versión que cierra los avisos high (el último es GHSA-v53p-9fqp-m79j, parcheado en 10.0.6). El salto es de major. Las rupturas publicadas son la validación TLS al descargar contenido remoto, OAuth2 o un proxy, y el requisito de Node.js 20 o superior. El envío de becas no usa esas rutas y Node ya está en 22.23.4, así que `src/lib/email/scholarship-notification.ts` no cambia.

### Auditoría

- Antes: 5 high, 1 moderate, 1 low. `nodemailer` high, rango `<=10.0.9`.
- Después: 4 high, 2 moderate, 1 low. `nodemailer` baja a moderate.
- Siguen en high, fuera de este cambio: `brace-expansion`, `browserslist`, `js-yaml`, `source-map-js`.
- En nodemailer 10.0.6 quedan dos moderate: DKIM cuadrático (GHSA-39m8-27wv-hr27, parche en 10.0.10; ya afectaba a 8.0.7) y el local-part entrecomillado (GHSA-g57g-f23g-4646, rango `>=9.1.0 <10.0.9`, que 8.0.7 no tenía). No se sube a 10.0.9 ni a 10.0.10: el encargo pide la primera versión del high.

### Pruebas

- `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test` (20 pruebas) y `npm run build` pasan en Node v22.23.4.
- TestSprite no se ejecutó: el diff no toca la superficie web.

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
- En este primer paso, `npm audit` seguía avisando de `nodemailer` 8.0.7 (rango `<=10.0.9`) y de transitivas de herramientas (`brace-expansion`, `browserslist`, `js-yaml`, `source-map-js`, `@babel/core`, `baseline-browser-mapping`). El aviso high de nodemailer se trata en la entrada superior de esta misma fecha. No se aplicó `npm audit fix`.
