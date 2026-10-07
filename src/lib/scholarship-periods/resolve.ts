export type PeriodOverride = "auto" | "open" | "closed";

export type ScholarshipPeriod = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  override: PeriodOverride;
  isCurrent: boolean;
};

export type PublicPeriodState =
  | { status: "open"; period: ScholarshipPeriod }
  | {
      status: "closed";
      period: ScholarshipPeriod | null;
      reason: "none" | "scheduled" | "ended" | "forced";
    };

export function resolvePeriodAccess(period: ScholarshipPeriod | null, now: Date): PublicPeriodState {
  if (!period) {
    return { status: "closed", period: null, reason: "none" };
  }

  if (period.override === "closed") {
    return { status: "closed", period, reason: "forced" };
  }

  if (period.override === "open") {
    return { status: "open", period };
  }

  const start = new Date(period.startsAt).getTime();
  const end = new Date(period.endsAt).getTime();
  const instant = now.getTime();

  if (instant < start) {
    return { status: "closed", period, reason: "scheduled" };
  }

  if (instant >= end) {
    return { status: "closed", period, reason: "ended" };
  }

  return { status: "open", period };
}

export function isPeriodOverride(value: string): value is PeriodOverride {
  return value === "auto" || value === "open" || value === "closed";
}
