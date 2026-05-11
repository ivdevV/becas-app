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
  details?: {
    contentType?: string;
    responsePreview?: string;
    status?: number;
    webhookHost?: string;
    webhookPath?: string;
  };
};

export type OdooWebhookResponse = OdooWebhookSuccess | OdooWebhookError;

export class OdooWebhookConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OdooWebhookConfigError";
  }
}

function getWebhookTarget(webhookUrl: string) {
  try {
    const url = new URL(webhookUrl);
    return {
      webhookHost: url.host,
      webhookPath: url.pathname,
    };
  } catch {
    return {
      webhookHost: "invalid-url",
      webhookPath: "invalid-url",
    };
  }
}

function compactResponsePreview(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function parseOdooResponse(
  text: string,
  response: Response,
  webhookUrl: string,
): OdooWebhookResponse {
  const contentType = response.headers.get("content-type") ?? "unknown content type";
  const target = getWebhookTarget(webhookUrl);

  try {
    return JSON.parse(text) as OdooWebhookResponse;
  } catch {
    return {
      ok: false,
      error: "invalid_odoo_response",
      message: `Odoo returned HTTP ${response.status} with ${contentType}, not JSON.`,
      details: {
        ...target,
        contentType,
        responsePreview: compactResponsePreview(text),
        status: response.status,
      },
    };
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

  const payload = parseOdooResponse(await response.text(), response, webhookUrl);

  if (!response.ok && payload.ok !== false) {
    const target = getWebhookTarget(webhookUrl);

    return {
      ok: false,
      error: "odoo_request_failed",
      message: `Odoo returned HTTP ${response.status}`,
      details: {
        ...target,
        status: response.status,
      },
    };
  }

  return payload;
}