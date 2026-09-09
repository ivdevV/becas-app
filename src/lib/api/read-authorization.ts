import { timingSafeEqual } from "crypto";

type AuthorizationResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; message: string };

export function authorizeScholarshipApplicationsRead(request: Request): AuthorizationResult {
  const expected = process.env.SCHOLARSHIP_APPLICATIONS_READ_TOKEN?.trim() ?? "";

  if (!expected) {
    return {
      ok: false,
      status: 503,
      message: "El listado de solicitudes no esta configurado.",
    };
  }

  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const provided = bearer || request.headers.get("x-api-key")?.trim() || "";

  if (!provided || !secureEquals(provided, expected)) {
    return {
      ok: false,
      status: 401,
      message: "No autorizado.",
    };
  }

  return { ok: true };
}

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
