export const MADRID_TIME_ZONE = "Europe/Madrid";

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

type ZonedParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
};

export function madridLocalInputToUtcIso(value: string) {
  const utc = zonedLocalToUtc(value, MADRID_TIME_ZONE);
  return utc ? utc.toISOString() : null;
}

export function utcIsoToMadridInput(iso: string) {
  const parts = getZonedParts(new Date(iso), MADRID_TIME_ZONE);
  if (!parts) {
    return "";
  }

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function formatMadridDateTime(iso: string) {
  const date = new Date(iso);
  const datePart = new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);

  return `${datePart}, ${timePart}`;
}

export function zonedLocalToUtc(value: string, timeZone: string) {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null;
  }

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const firstOffset = getTimeZoneOffsetMs(utcGuess, timeZone);
  let utc = new Date(utcGuess.getTime() - firstOffset);
  const secondOffset = getTimeZoneOffsetMs(utc, timeZone);

  if (secondOffset !== firstOffset) {
    utc = new Date(utcGuess.getTime() - secondOffset);
  }

  const roundTrip = formatZonedLocalInput(utc, timeZone);
  if (roundTrip !== value) {
    return null;
  }

  return utc;
}

function formatZonedLocalInput(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  if (!parts) {
    return "";
  }

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function getZonedParts(date: Date, timeZone: string): ZonedParts | null {
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};

  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      parts[part.type] = part.value;
    }
  }

  let hour = parts.hour ?? "00";
  if (hour === "24") {
    hour = "00";
  }

  return {
    year: parts.year ?? "",
    month: parts.month ?? "",
    day: parts.day ?? "",
    hour,
    minute: parts.minute ?? "",
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  if (!parts) {
    return 0;
  }

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    0,
  );

  return asUtc - date.getTime();
}
