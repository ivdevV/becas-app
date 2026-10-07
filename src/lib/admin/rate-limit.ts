const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type Bucket = {
  failures: number;
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

export function isLoginAllowed(ip: string, nowMs: number) {
  const bucket = buckets.get(ip);
  if (!bucket || nowMs - bucket.windowStart > WINDOW_MS) {
    return true;
  }

  return bucket.failures < MAX_FAILURES;
}

export function recordLoginFailure(ip: string, nowMs: number) {
  const bucket = buckets.get(ip);
  if (!bucket || nowMs - bucket.windowStart > WINDOW_MS) {
    buckets.set(ip, { failures: 1, windowStart: nowMs });
    return;
  }

  bucket.failures += 1;
}

export function clearLoginFailures(ip: string) {
  buckets.delete(ip);
}
