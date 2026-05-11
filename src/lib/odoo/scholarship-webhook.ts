export type OdooWebhookDocumentInput = {
  email: string;
  filename: string;
  documentName: string;
  documentContentBase64: string;
  scholarshipTypeKey: string;
  scholarshipTypeName: string;
  note: string;
};

export type OdooWebhookSuccess = {
  ok: true;
  action: "created" | "updated";
  document_id: number;
  partner_id: number;
  student_id: number;
};

export type OdooWebhookError = {
  ok: false;
  error: string;
  message: string;
};

export type OdooWebhookResponse = OdooWebhookSuccess | OdooWebhookError;

export class OdooWebhookConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OdooWebhookConfigError";
  }
}

export async function sendScholarshipDocumentToOdoo(
  input: OdooWebhookDocumentInput,
): Promise<OdooWebhookResponse> {
  const webhookUrl = process.env.ODOO_SCHOLARSHIP_WEBHOOK_URL;
  const webhookToken = process.env.ODOO_SCHOLARSHIP_WEBHOOK_TOKEN;

  if (!webhookUrl || !webhookToken) {
    throw new OdooWebhookConfigError(
      "ODOO_SCHOLARSHIP_WEBHOOK_URL and ODOO_SCHOLARSHIP_WEBHOOK_TOKEN are required in prod mode.",
    );
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${webhookToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      filename: input.filename,
      document_name: input.documentName,
      scholarship_type_key: input.scholarshipTypeKey,
      scholarship_type_name: input.scholarshipTypeName,
      document_content_base64: input.documentContentBase64,
      note: input.note,
    }),
  });

  const contentType = response.headers.get("content-type") ?? "unknown content type";
  const payload = (await response.json().catch(() => ({
    ok: false,
    error: "invalid_odoo_response",
    message: `Odoo returned HTTP ${response.status} with ${contentType}, not JSON.`,
  }))) as OdooWebhookResponse;

  if (!response.ok && payload.ok !== false) {
    return {
      ok: false,
      error: "odoo_request_failed",
      message: `Odoo returned HTTP ${response.status}`,
    };
  }

  return payload;
}