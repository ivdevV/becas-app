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
ODOO_SCHOLARSHIP_WEBHOOK_TOKEN="becas_2026_un_token_largo_y_secreto"
MAIL_HOST=email-smtp.eu-west-1.amazonaws.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=AKIAXXXXXXXXXXXXXXXX
MAIL_PASSWORD="tu-password-smtp-de-aws-ses"
MAIL_FROM="Becas IRG <no-reply@institutoraimongaja.com>"
SCHOLARSHIP_NOTIFICATION_TO=becas.irg@institutoraimongaja.com
GOOGLE_SHEETS_SPREADSHEET_ID=tu-google-sheet-id
GOOGLE_SHEETS_SHEET_NAME="Hoja 1"
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@tu-proyecto.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

El token debe coincidir con el parametro de sistema de Odoo `irg_student_scholarship_webhook.token`.
Si el token contiene `$`, escribelo como `\$` dentro de las comillas para que Next.js no lo interprete como otra variable de entorno.

Si `MAIL_HOST` esta configurado, cada solicitud recibida correctamente envia una notificacion a `SCHOLARSHIP_NOTIFICATION_TO` con los datos del solicitante, la beca seleccionada y el listado de documentos subidos. Para AWS SES, usa las credenciales SMTP generadas en SES, verifica el dominio o remitente de `MAIL_FROM`, y cambia `email-smtp.eu-west-1.amazonaws.com` por el endpoint de la region que corresponda si no usas Irlanda. Si no hay SMTP configurado, el formulario sigue funcionando y deja constancia en el log del servidor.

En AWS SES, `MAIL_USER` debe ser el valor **SMTP Username** y `MAIL_PASSWORD` debe ser **SMTP Password**. No uses `AWS_ACCESS_KEY_ID` ni `AWS_SECRET_ACCESS_KEY`; SES SMTP los rechaza con `535 Authentication Credentials Invalid`.

Si `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` y `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` estan configurados, cada solicitud aceptada por Odoo en `ODOO_MODE=prod` se registra en una fila de Google Sheets. Comparte la hoja con el email de la service account como editor. La pestaña usada por defecto es `Hoja 1`.

En produccion, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` debe contener la clave PEM de la service account. La app acepta la clave con saltos de linea reales, con `\n` escapados, con comillas envolventes o codificada en base64.

La escritura en Google Sheets no bloquea la solicitud: si Odoo acepta la documentacion pero Google Sheets falla, el usuario ve la solicitud como recibida y el error queda registrado en los logs del servidor.

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
	"scholarship_type_key": "merito-academico",
	"scholarship_type_name": "Beca Merito Academico",
	"document_content_base64": "JVBERi0xLjQK...",
	"note": "Enviado desde la aplicacion externa"
}
```

Odoo resuelve el email contra `op.student.partner_id.email` y despues contra `res.partner.email`, asigna `res.partner.irg_scholarship_type_id` si recibe `scholarship_type_key` o `scholarship_type_name`, y guarda los documentos en `irg.scholarship.document`.
