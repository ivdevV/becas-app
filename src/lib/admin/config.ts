const MIN_PASSWORD_LENGTH = 12;
const MIN_SESSION_SECRET_LENGTH = 32;

export function getAdminConfig() {
  const password = process.env.SCHOLARSHIP_ADMIN_PASSWORD?.trim() ?? "";
  const sessionSecret = process.env.SCHOLARSHIP_ADMIN_SESSION_SECRET?.trim() ?? "";

  if (password.length < MIN_PASSWORD_LENGTH || sessionSecret.length < MIN_SESSION_SECRET_LENGTH) {
    return null;
  }

  return { password, sessionSecret };
}
