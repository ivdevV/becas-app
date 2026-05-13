import { createPrivateKey, createSign } from "crypto";
import type { Scholarship } from "@/lib/scholarships";
import type { OdooWebhookResponse } from "@/lib/odoo/scholarship-webhook";

type UploadedDocument = {
  documentName: string;
  filename: string;
  size: number;
  result?: OdooWebhookResponse;
};

type ScholarshipSheetInput = {
  applicationId: string;
  name: string;
  email: string;
  scholarship: Scholarship;
  documents: UploadedDocument[];
};

type GoogleAccessToken = {
  access_token: string;
  expires_in: number;
};

type SheetsConfig = {
  spreadsheetId: string;
  sheetName: string;
  clientEmail: string;
  privateKey: string;
};

type GoogleServiceAccountKey = {
  client_email?: string;
  private_key?: string;
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function getSheetsConfig(): SheetsConfig | null {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const serviceAccountKey = parseServiceAccountKey(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON ?? process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  );
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? serviceAccountKey?.client_email;
  const privateKey = normalizePrivateKey(
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? serviceAccountKey?.private_key,
  );

  if (!spreadsheetId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    spreadsheetId,
    sheetName: process.env.GOOGLE_SHEETS_SHEET_NAME ?? "Hoja 1",
    clientEmail,
    privateKey,
  };
}

function stripWrappingQuotes(value: string) {
  let output = value;

  if (output.startsWith('"') || output.startsWith("'")) {
    output = output.slice(1);
  }

  if (output.endsWith('"') || output.endsWith("'")) {
    output = output.slice(0, -1);
  }

  return output;
}

function parseServiceAccountKey(value?: string): GoogleServiceAccountKey | null {
  if (!value) {
    return null;
  }

  const normalizedValue = stripWrappingQuotes(value.trim()).trim();
  const candidates = [normalizedValue];

  try {
    candidates.push(Buffer.from(normalizedValue, "base64").toString("utf8").trim());
  } catch {
    // Keep only the original value if it is not valid base64.
  }

  for (const candidate of candidates) {
    if (!candidate.startsWith("{")) {
      continue;
    }

    try {
      const parsed = JSON.parse(candidate) as GoogleServiceAccountKey;

      if (parsed.private_key || parsed.client_email) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function normalizePrivateKey(value?: string) {
  if (!value) {
    return undefined;
  }

  const serviceAccountKey = parseServiceAccountKey(value);
  let key = stripWrappingQuotes((serviceAccountKey?.private_key ?? value).trim())
    .replace(/\\n/g, "\n")
    .trim();

  if (!key.includes("BEGIN PRIVATE KEY")) {
    try {
      const decoded = Buffer.from(key, "base64").toString("utf8").trim();

      if (decoded.includes("BEGIN PRIVATE KEY")) {
        key = stripWrappingQuotes(decoded).replace(/\\n/g, "\n").trim();
      }
    } catch {
      return key;
    }
  }

  return key;
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createJwt(config: SheetsConfig) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: config.clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claimSet))}`;
  const signer = createSign("RSA-SHA256");

  signer.update(unsignedToken);
  signer.end();

  try {
    return `${unsignedToken}.${base64Url(signer.sign(createPrivateKey(config.privateKey)))}`;
  } catch (error) {
    throw new Error(
      `Google Sheets private key is not a valid service account PEM key. ${getPrivateKeyDiagnostic(config.privateKey)} Original error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function getPrivateKeyDiagnostic(privateKey: string) {
  return [
    `hasBegin=${privateKey.includes("-----BEGIN PRIVATE KEY-----")}`,
    `hasEnd=${privateKey.includes("-----END PRIVATE KEY-----")}`,
    `lineCount=${privateKey.split("\n").length}`,
    `length=${privateKey.length}`,
  ].join(" ");
}

async function getAccessToken(config: SheetsConfig) {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: createJwt(config),
    }),
  });

  if (!response.ok) {
    throw new Error(`Google OAuth returned HTTP ${response.status}: ${await response.text()}`);
  }

  const payload = (await response.json()) as GoogleAccessToken;
  cachedAccessToken = {
    token: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };

  return payload.access_token;
}

function formatDocumentSummary(document: UploadedDocument) {
  return `${document.documentName}: ${document.filename}`;
}

function getOdooIds(documents: UploadedDocument[]) {
  const successResults = documents
    .map((document) => document.result)
    .filter((result): result is Extract<OdooWebhookResponse, { ok: true }> => result?.ok === true);

  return {
    partnerIds: [...new Set(successResults.map((result) => result.partner_id))].join(", "),
    studentIds: [...new Set(successResults.map((result) => result.student_id))].join(", "),
    documentIds: successResults.map((result) => result.document_id).join(", "),
  };
}

export async function appendScholarshipApplicationToSheet(input: ScholarshipSheetInput) {
  const config = getSheetsConfig();

  if (!config) {
    console.info("Google Sheets append skipped: Google Sheets environment variables are not configured.");
    return;
  }

  const token = await getAccessToken(config);
  const odooIds = getOdooIds(input.documents);
  const range = encodeURIComponent(`'${config.sheetName}'!A:K`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [
        [
          new Date().toISOString(),
          input.applicationId,
          input.name,
          input.email,
          input.scholarship.name,
          input.scholarship.category,
          input.scholarship.maxDiscount,
          input.documents.map(formatDocumentSummary).join("\n"),
          odooIds.partnerIds,
          odooIds.studentIds,
          odooIds.documentIds,
        ],
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Sheets returned HTTP ${response.status}: ${await response.text()}`);
  }
}
