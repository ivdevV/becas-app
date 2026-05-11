# Becas App

Aplicacion Next.js para recoger solicitudes de beca del Instituto Raimon Gaja y enviar la documentacion al modulo de becas de Odoo 16.

## Funcionamiento

- El frontend pide nombre, email, tipo de beca y documentos requeridos.
- El endpoint interno `POST /api/scholarship-applications` valida datos y archivos.
- En `ODOO_MODE=dev`, el envio se simula para poder probar sin tocar Odoo.
- En `ODOO_MODE=prod`, la app llama al webhook de Odoo `POST /irg/scholarship/webhook/document` con `Authorization: Bearer <token>`.
- La busqueda de alumno/contacto se hace en Odoo por email. La app no replica esa logica.

## Variables de entorno

Copia `.env.example` a `.env.local` y ajusta los valores:

```env
ODOO_MODE=dev
ODOO_SCHOLARSHIP_WEBHOOK_URL=https://tu-odoo.com/irg/scholarship/webhook/document
ODOO_SCHOLARSHIP_WEBHOOK_TOKEN=becas_2026_un_token_largo_y_secreto
```

El token debe coincidir con el parametro de sistema de Odoo `irg_student_scholarship_webhook.token`.

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Verificacion

```bash
npm run lint
npm run build
```

## Integracion Odoo

La app envia un JSON por cada documento con esta forma:

```json
{
	"email": "alumno@example.com",
	"filename": "solicitud_beca.pdf",
	"document_name": "Solicitud de beca",
	"document_content_base64": "JVBERi0xLjQK...",
	"note": "Enviado desde la aplicacion externa"
}
```

Odoo resuelve el email contra `op.student.partner_id.email` y despues contra `res.partner.email`, y guarda los documentos en `irg.scholarship.document`.
