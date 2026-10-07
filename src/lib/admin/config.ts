const MIN_PASSWORD_LENGTH = 12;
const MIN_SESSION_SECRET_LENGTH = 32;

const PASSWORD_KEY = "SCHOLARSHIP_ADMIN_PASSWORD";
const SESSION_SECRET_KEY = "SCHOLARSHIP_ADMIN_SESSION_SECRET";

export type AdminConfigIssue = {
  variable: string;
  message: string;
};

export function getAdminConfig() {
  const status = readAdminConfigStatus();
  return status.ok ? { password: status.password, sessionSecret: status.sessionSecret } : null;
}

export function readAdminConfigStatus():
  | { ok: true; password: string; sessionSecret: string }
  | { ok: false; issues: AdminConfigIssue[] } {
  const password = readServerEnv(PASSWORD_KEY);
  const sessionSecret = readServerEnv(SESSION_SECRET_KEY);
  const issues = [
    describeEnv(PASSWORD_KEY, password, MIN_PASSWORD_LENGTH, "La clave"),
    describeEnv(SESSION_SECRET_KEY, sessionSecret, MIN_SESSION_SECRET_LENGTH, "El secreto de sesion"),
  ].filter((issue): issue is AdminConfigIssue => issue !== null);

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, password, sessionSecret };
}

function readServerEnv(name: string) {
  const env = process.env;
  const value = env[name];
  if (typeof value !== "string") {
    return "";
  }

  return stripWrappingQuotes(value.trim());
}

function describeEnv(variable: string, value: string, minimum: number, label: string): AdminConfigIssue | null {
  if (!value) {
    return {
      variable,
      message: `${label} no llega al proceso. Revisa que en Coolify este marcada como disponible en runtime y reinicia la aplicacion.`,
    };
  }

  if (value.length < minimum) {
    return {
      variable,
      message: `${label} llega, pero se queda por debajo de ${minimum} caracteres. Si el valor contiene $, Coolify lo recorta: escribe cada $ como $$.`,
    };
  }

  return null;
}

function stripWrappingQuotes(value: string) {
  if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
    return value.slice(1, -1);
  }

  return value;
}
