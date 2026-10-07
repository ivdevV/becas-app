import { cookies } from "next/headers";
import { getAdminConfig } from "./config.ts";
import { createSessionToken, verifySessionToken } from "./session-token.ts";

export const ADMIN_SESSION_COOKIE = "becas_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export async function hasValidAdminSession() {
  const config = getAdminConfig();
  if (!config) {
    return false;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return false;
  }

  return verifySessionToken(token, config.sessionSecret, Date.now());
}

export async function startAdminSession() {
  const config = getAdminConfig();
  if (!config) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionToken(config.sessionSecret, Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return true;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
