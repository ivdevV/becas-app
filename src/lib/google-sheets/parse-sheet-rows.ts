export type ScholarshipApplicationRecord = {
  submittedAt: string;
  applicationId: string;
  name: string;
  email: string;
  scholarshipName: string;
  scholarshipCategory: string;
  maxDiscount: string;
  documents: string[];
  odooPartnerIds: string[];
  odooStudentIds: string[];
  odooDocumentIds: string[];
};

function cell(row: Array<string | number | boolean | null | undefined>, index: number) {
  return String(row[index] ?? "").trim();
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitIds(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isEmptyRow(row: Array<string | number | boolean | null | undefined>) {
  return row.every((value) => String(value ?? "").trim() === "");
}

function isApplicationRow(row: Array<string | number | boolean | null | undefined>) {
  if (isEmptyRow(row)) {
    return false;
  }

  const submittedAt = cell(row, 0);
  const applicationId = cell(row, 1);

  return /^(SOL|DEV)-/i.test(applicationId) || /^\d{4}-\d{2}-\d{2}/.test(submittedAt);
}

export function parseScholarshipApplicationRows(
  rows: Array<Array<string | number | boolean | null | undefined>>,
): ScholarshipApplicationRecord[] {
  return rows.filter(isApplicationRow).map((row) => ({
    submittedAt: cell(row, 0),
    applicationId: cell(row, 1),
    name: cell(row, 2),
    email: cell(row, 3),
    scholarshipName: cell(row, 4),
    scholarshipCategory: cell(row, 5),
    maxDiscount: cell(row, 6),
    documents: splitLines(cell(row, 7)),
    odooPartnerIds: splitIds(cell(row, 8)),
    odooStudentIds: splitIds(cell(row, 9)),
    odooDocumentIds: splitIds(cell(row, 10)),
  }));
}
