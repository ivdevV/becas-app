import nodemailer from "nodemailer";
import type { Scholarship } from "@/lib/scholarships";

type UploadedDocument = {
  documentName: string;
  filename: string;
  size: number;
};

type ScholarshipNotificationInput = {
  applicationId: string;
  name: string;
  email: string;
  scholarship: Scholarship;
  documents: UploadedDocument[];
};

const defaultRecipient = "becas.irg@institutoraimongaja.com";

function getRequiredMailConfig() {
  const host = process.env.MAIL_HOST;

  if (!host) {
    return null;
  }

  const port = Number(process.env.MAIL_PORT ?? "587");
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASSWORD;

  return {
    host,
    port,
    secure: process.env.MAIL_SECURE === "true" || port === 465,
    from: process.env.MAIL_FROM ?? "Becas IRG <becas.irg@institutoraimongaja.com>",
    to: process.env.SCHOLARSHIP_NOTIFICATION_TO ?? defaultRecipient,
    auth: user && pass ? { user, pass } : undefined,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildText(input: ScholarshipNotificationInput) {
  const documents = input.documents
    .map(
      (document) =>
        `- ${document.documentName}: ${document.filename} (${formatBytes(document.size)})`,
    )
    .join("\n");

  return [
    "Nueva solicitud de beca recibida",
    "",
    `Referencia: ${input.applicationId}`,
    `Nombre: ${input.name}`,
    `Email: ${input.email}`,
    `Beca solicitada: ${input.scholarship.name}`,
    `Categoria: ${input.scholarship.category}`,
    `Descuento orientativo: ${input.scholarship.maxDiscount}`,
    "",
    "Documentos subidos:",
    documents,
  ].join("\n");
}

function buildHtml(input: ScholarshipNotificationInput) {
  const rows = input.documents
    .map(
      (document) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(document.documentName)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(document.filename)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${formatBytes(document.size)}</td>
        </tr>`,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
      <h1 style="font-size:20px;margin:0 0 16px;">Nueva solicitud de beca</h1>
      <p style="margin:0 0 16px;">Se ha recibido una nueva solicitud desde el formulario web.</p>
      <table style="border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Referencia</td><td style="padding:4px 0;font-weight:700;">${escapeHtml(input.applicationId)}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Nombre</td><td style="padding:4px 0;">${escapeHtml(input.name)}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Email</td><td style="padding:4px 0;">${escapeHtml(input.email)}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Beca solicitada</td><td style="padding:4px 0;">${escapeHtml(input.scholarship.name)}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Descuento orientativo</td><td style="padding:4px 0;">${escapeHtml(input.scholarship.maxDiscount)}</td></tr>
      </table>
      <h2 style="font-size:16px;margin:0 0 8px;">Documentos subidos</h2>
      <table style="border-collapse:collapse;width:100%;max-width:760px;border:1px solid #e2e8f0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th align="left" style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">Documento</th>
            <th align="left" style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">Archivo</th>
            <th align="left" style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">Tamano</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export async function sendScholarshipApplicationNotification(
  input: ScholarshipNotificationInput,
) {
  const config = getRequiredMailConfig();

  if (!config) {
    console.info("Scholarship notification skipped: MAIL_HOST is not configured.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.sendMail({
    from: config.from,
    to: config.to,
    replyTo: input.email,
    subject: `Nueva solicitud de beca: ${input.name}`,
    text: buildText(input),
    html: buildHtml(input),
  });
}
