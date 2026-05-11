import { NextResponse } from "next/server";
import {
  findScholarship,
  isAllowedFile,
  maxFileSizeBytes,
} from "@/lib/scholarships";
import {
  OdooWebhookConfigError,
  sendScholarshipDocumentToOdoo,
  type OdooWebhookResponse,
} from "@/lib/odoo/scholarship-webhook";

export const runtime = "nodejs";

type SubmittedDocument = {
  documentId: string;
  documentName: string;
  filename: string;
  size: number;
  result?: OdooWebhookResponse;
};

type ApplicationResponse = {
  ok: boolean;
  mode: "dev" | "prod";
  applicationId?: string;
  message: string;
  documents?: SubmittedDocument[];
};

function badRequest(message: string, status = 400) {
  return NextResponse.json<ApplicationResponse>(
    {
      ok: false,
      mode: getMode(),
      message,
    },
    { status },
  );
}

function getMode(): "dev" | "prod" {
  return process.env.ODOO_MODE === "prod" ? "prod" : "dev";
}

function getText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

async function fileToBase64(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}

function getOdooErrorStatus(error: string) {
  if (error === "partner_not_found" || error === "scholarship_type_not_found") {
    return 404;
  }

  if (error === "ambiguous_email" || error === "ambiguous_scholarship_type") {
    return 409;
  }

  return 502;
}

function getPublicSubmissionError(error: string, fallbackMessage: string) {
  if (error === "partner_not_found") {
    return "No hemos encontrado una ficha asociada a ese correo electronico. Revisa el email o contacta con admisiones.";
  }

  if (error === "ambiguous_email") {
    return "Hemos encontrado mas de una ficha asociada a ese correo electronico. Contacta con admisiones para revisar tus datos.";
  }

  if (error === "scholarship_type_not_found" || error === "ambiguous_scholarship_type") {
    return "No se pudo identificar correctamente el tipo de beca seleccionado. Contacta con admisiones para finalizar la solicitud.";
  }

  return fallbackMessage || "No se pudo enviar la solicitud. Intentalo de nuevo mas tarde.";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = getText(formData, "name");
  const email = getText(formData, "email").toLowerCase();
  const scholarshipId = getText(formData, "scholarshipId");
  const privacyAccepted = getText(formData, "privacyAccepted") === "true";
  const scholarship = findScholarship(scholarshipId);

  if (!name) {
    return badRequest("Indica tu nombre antes de enviar la solicitud.");
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return badRequest("Indica un correo electronico valido.");
  }

  if (!scholarship) {
    return badRequest("Selecciona un tipo de beca valido.");
  }

  if (!privacyAccepted) {
    return badRequest("Debes aceptar la politica de privacidad para enviar la solicitud.");
  }

  const submittedDocuments: SubmittedDocument[] = [];

  for (const document of scholarship.documents) {
    const file = formData.get(`document-${document.id}`);

    if (!(file instanceof File) || !file.name || file.size === 0) {
      return badRequest(`Falta el documento obligatorio: ${document.label}.`);
    }

    if (!isAllowedFile(file.name)) {
      return badRequest(
        `El archivo ${file.name} no tiene un formato permitido. Usa PDF, JPG, PNG, DOC o DOCX.`,
      );
    }

    if (file.size > maxFileSizeBytes) {
      return badRequest(`El archivo ${file.name} supera el limite de 10 MB.`, 413);
    }

    submittedDocuments.push({
      documentId: document.id,
      documentName: document.label,
      filename: file.name,
      size: file.size,
    });
  }

  const mode = getMode();

  if (mode === "dev") {
    return NextResponse.json<ApplicationResponse>({
      ok: true,
      mode,
      applicationId: `DEV-${Date.now()}`,
      message: "Solicitud recibida correctamente. Revisaremos la documentacion y contactaremos contigo.",
      documents: submittedDocuments,
    });
  }

  try {
    const documentResults: SubmittedDocument[] = [];

    for (const document of scholarship.documents) {
      const file = formData.get(`document-${document.id}`) as File;
      const result = await sendScholarshipDocumentToOdoo({
        email,
        filename: file.name,
        documentName: document.label,
        scholarshipTypeName: scholarship.name,
        documentContentBase64: await fileToBase64(file),
        note: `Solicitud externa de ${name}. Tipo de beca: ${scholarship.name}.`,
      });

      if (!result.ok) {
        return NextResponse.json<ApplicationResponse>(
          {
            ok: false,
            mode,
            message: getPublicSubmissionError(result.error, result.message),
            documents: [
              ...documentResults,
              {
                documentId: document.id,
                documentName: document.label,
                filename: file.name,
                size: file.size,
                result,
              },
            ],
          },
          { status: getOdooErrorStatus(result.error) },
        );
      }

      documentResults.push({
        documentId: document.id,
        documentName: document.label,
        filename: file.name,
        size: file.size,
        result,
      });
    }

    return NextResponse.json<ApplicationResponse>({
      ok: true,
      mode,
      applicationId: `SOL-${Date.now()}`,
      message: "Solicitud recibida correctamente. Revisaremos la documentacion y contactaremos contigo.",
      documents: documentResults,
    });
  } catch (error) {
    const isConfigError = error instanceof OdooWebhookConfigError;

    return NextResponse.json<ApplicationResponse>(
      {
        ok: false,
        mode,
        message: isConfigError
          ? "El servicio de solicitudes no esta disponible temporalmente. Intentalo de nuevo mas tarde."
          : "No se pudo enviar la solicitud. Intentalo de nuevo mas tarde.",
      },
      { status: isConfigError ? 500 : 502 },
    );
  }
}