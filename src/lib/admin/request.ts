import { headers } from "next/headers";
import { originsMatch } from "./origin.ts";

export async function isSameOriginRequest() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  return originsMatch(origin, host);
}

export async function getClientIp() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const realIp = headerStore.get("x-real-ip")?.trim() ?? "";
  const ip = forwarded || realIp || "unknown";
  return ip.slice(0, 64);
}
