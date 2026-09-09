import assert from "node:assert/strict";
import test from "node:test";
import { parseScholarshipApplicationRows } from "./parse-sheet-rows.ts";

test("parseScholarshipApplicationRows maps spreadsheet values to application records", () => {
  const rows = [
    [
      "2026-03-12T10:15:00.000Z",
      "SOL-1710230000000",
      "Ana Perez",
      "ana@example.com",
      "Beca Merito Academico",
      "academica",
      "Hasta 35%",
      "Curriculum Vitae: cv.pdf\nExpediente Academico Compulsado: expediente.pdf",
      "42",
      "18",
      "101, 102",
    ],
  ];

  assert.deepEqual(parseScholarshipApplicationRows(rows), [
    {
      submittedAt: "2026-03-12T10:15:00.000Z",
      applicationId: "SOL-1710230000000",
      name: "Ana Perez",
      email: "ana@example.com",
      scholarshipName: "Beca Merito Academico",
      scholarshipCategory: "academica",
      maxDiscount: "Hasta 35%",
      documents: [
        "Curriculum Vitae: cv.pdf",
        "Expediente Academico Compulsado: expediente.pdf",
      ],
      odooPartnerIds: ["42"],
      odooStudentIds: ["18"],
      odooDocumentIds: ["101", "102"],
    },
  ]);
});

test("parseScholarshipApplicationRows skips header and empty rows", () => {
  const rows = [
    [
      "Fecha",
      "ID",
      "Nombre",
      "Email",
      "Beca",
      "Categoria",
      "Descuento",
      "Documentos",
      "Partner IDs",
      "Student IDs",
      "Document IDs",
    ],
    [],
    [
      "2026-03-12T10:15:00.000Z",
      "SOL-1710230000000",
      "Ana Perez",
      "ana@example.com",
      "Beca Merito Academico",
      "academica",
      "Hasta 35%",
      "Curriculum Vitae: cv.pdf",
      "42",
      "18",
      "101",
    ],
  ];

  const parsed = parseScholarshipApplicationRows(rows);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0]?.applicationId, "SOL-1710230000000");
});
