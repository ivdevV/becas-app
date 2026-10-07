export function originsMatch(origin: string | null, host: string | null) {
  if (!origin || !host || origin === "null") {
    return false;
  }

  let originHost = "";

  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }

  const expectedHost = host.split(",")[0]?.trim() ?? "";
  return originHost.toLowerCase() === expectedHost.toLowerCase();
}
