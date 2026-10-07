"use server";

import { redirect } from "next/navigation";
import { clearLoginFailures, isLoginAllowed, recordLoginFailure } from "@/lib/admin/rate-limit";
import { getClientIp, isSameOriginRequest } from "@/lib/admin/request";
import { clearAdminSession, hasValidAdminSession, startAdminSession } from "@/lib/admin/session";
import { passwordsMatch } from "@/lib/admin/session-token";
import { getAdminConfig } from "@/lib/admin/config";
import {
  createPeriod,
  deletePeriod,
  setCurrentPeriod,
  updatePeriod,
} from "@/lib/scholarship-periods/repository";

export async function loginAction(formData: FormData) {
  if (!getAdminConfig()) {
    redirect("/admin?error=config");
  }

  if (!(await isSameOriginRequest())) {
    redirect("/admin?error=origen");
  }

  const ip = await getClientIp();
  const now = Date.now();

  if (!isLoginAllowed(ip, now)) {
    redirect("/admin?error=limite");
  }

  const password = formData.get("password");
  const config = getAdminConfig();
  const provided = typeof password === "string" ? password : "";

  if (!config || !passwordsMatch(provided, config.password)) {
    recordLoginFailure(ip, now);
    redirect("/admin?error=clave");
  }

  clearLoginFailures(ip);
  await startAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  if (!(await isSameOriginRequest())) {
    redirect("/admin?error=origen");
  }

  await clearAdminSession();
  redirect("/admin");
}

export async function createPeriodAction(formData: FormData) {
  await requireAdmin();
  const result = createPeriod(readPeriodFields(formData));
  if (!result.ok) {
    redirect(`/admin?error=${result.error}`);
  }

  redirect("/admin?notice=creada");
}

export async function updatePeriodAction(formData: FormData) {
  await requireAdmin();
  const result = updatePeriod({
    id: readText(formData, "id"),
    ...readPeriodFields(formData),
  });

  if (!result.ok) {
    redirect(`/admin?error=${result.error}`);
  }

  redirect("/admin?notice=guardada");
}

export async function setCurrentPeriodAction(formData: FormData) {
  await requireAdmin();
  const result = setCurrentPeriod(readText(formData, "id"));
  if (!result.ok) {
    redirect(`/admin?error=${result.error}`);
  }

  redirect("/admin?notice=vigente");
}

export async function deletePeriodAction(formData: FormData) {
  await requireAdmin();
  const result = deletePeriod(readText(formData, "id"));
  if (!result.ok) {
    redirect(`/admin?error=${result.error}`);
  }

  redirect("/admin?notice=eliminada");
}

async function requireAdmin() {
  if (!getAdminConfig() || !(await hasValidAdminSession())) {
    redirect("/admin?error=sesion");
  }

  if (!(await isSameOriginRequest())) {
    redirect("/admin?error=origen");
  }
}

function readPeriodFields(formData: FormData) {
  return {
    name: readText(formData, "name"),
    startsAtLocal: readText(formData, "startsAt"),
    endsAtLocal: readText(formData, "endsAt"),
    override: readText(formData, "override"),
  };
}

function readText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}
