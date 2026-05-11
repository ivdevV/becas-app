"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  allowedFileExtensions,
  findScholarship,
  maxFileSizeBytes,
  scholarships,
} from "@/lib/scholarships";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string; applicationId?: string }
  | { status: "error"; message: string };

type SelectedFiles = Record<string, File | undefined>;

const categoryLabel = {
  academica: "Academica",
  profesional: "Profesional",
  internacional: "Internacional",
  socioeconomica: "Socioeconomica",
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ScholarshipApplicationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [scholarshipId, setScholarshipId] = useState(scholarships[0]?.id ?? "");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFiles>({});
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const selectedScholarship = useMemo(
    () => findScholarship(scholarshipId) ?? scholarships[0],
    [scholarshipId],
  );

  const completedDocuments = selectedScholarship.documents.filter(
    (document) => selectedFiles[document.id],
  ).length;

  function handleScholarshipChange(nextScholarshipId: string) {
    setScholarshipId(nextScholarshipId);
    setSelectedFiles({});
    setSubmitState({ status: "idle" });
  }

  function handleFileChange(documentId: string, file?: File) {
    setSelectedFiles((current) => ({ ...current, [documentId]: file }));
    setSubmitState({ status: "idle" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState({ status: "submitting" });

    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("scholarshipId", selectedScholarship.id);
    formData.set("privacyAccepted", String(privacyAccepted));

    for (const document of selectedScholarship.documents) {
      const file = selectedFiles[document.id];

      if (file) {
        formData.set(`document-${document.id}`, file);
      }
    }

    try {
      const response = await fetch("/api/scholarship-applications", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        applicationId?: string;
      };

      if (!response.ok || !payload.ok) {
        setSubmitState({
          status: "error",
          message: payload.message ?? "No se pudo enviar la solicitud.",
        });
        return;
      }

      setSubmitState({
        status: "success",
        message: payload.message ?? "Solicitud enviada correctamente.",
        applicationId: payload.applicationId,
      });
    } catch {
      setSubmitState({
        status: "error",
        message: "No se pudo conectar con el servidor. Revisa tu conexion e intentalo de nuevo.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase text-teal-700">Solicitud de beca IRG</p>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold text-slate-950 sm:text-4xl">
                Envia tu documentacion para evaluacion academica
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                El formulario prepara los datos y la documentacion para el modulo de becas de Odoo 16. En desarrollo valida el envio; en produccion usa el webhook protegido por token.
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-center justify-between gap-4">
              <span>Documentos requeridos</span>
              <strong className="text-slate-950">{completedDocuments}/{selectedScholarship.documents.length}</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-teal-700 transition-all"
                style={{ width: `${(completedDocuments / selectedScholarship.documents.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Nombre completo
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-12 rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              placeholder="Nombre y apellidos"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Correo electronico
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-12 rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              placeholder="alumno@example.com"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Tipo de beca</h2>
            <p className="text-sm leading-6 text-slate-600">Elige la ayuda que mejor encaja con tu perfil.</p>
          </div>
          <span className="text-sm text-slate-500">La evaluacion final depende del comite academico.</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {scholarships.map((scholarship) => {
            const isSelected = scholarship.id === selectedScholarship.id;

            return (
              <label
                key={scholarship.id}
                className={`flex min-h-48 cursor-pointer flex-col gap-3 rounded-lg border bg-white p-4 transition ${
                  isSelected
                    ? "border-teal-700 shadow-sm ring-4 ring-teal-100"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="scholarship"
                  checked={isSelected}
                  onChange={() => handleScholarshipChange(scholarship.id)}
                />
                <span className="text-xs font-semibold uppercase text-teal-700">{categoryLabel[scholarship.category]}</span>
                <span className="text-lg font-semibold leading-6 text-slate-950">{scholarship.name}</span>
                <span className="text-sm font-medium text-slate-700">{scholarship.maxDiscount}</span>
                <span className="text-sm leading-6 text-slate-600">{scholarship.summary}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold text-slate-950">Documentacion necesaria</h2>
          <p className="text-sm leading-6 text-slate-600">
            {selectedScholarship.profile} Formatos permitidos: {allowedFileExtensions.join(", ")}. Maximo {formatBytes(maxFileSizeBytes)} por archivo.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {selectedScholarship.documents.map((document) => {
            const file = selectedFiles[document.id];

            return (
              <label key={document.id} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <span className="font-medium text-slate-950">{document.label}</span>
                {document.helpText ? <span className="text-sm leading-6 text-slate-600">{document.helpText}</span> : null}
                <input
                  required
                  type="file"
                  accept={allowedFileExtensions.join(",")}
                  onChange={(event) => handleFileChange(document.id, event.target.files?.[0])}
                  className="min-h-12 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-teal-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:outline-none focus:ring-4 focus:ring-teal-100"
                />
                <span className="min-h-5 text-sm text-slate-600">
                  {file ? `${file.name} (${formatBytes(file.size)})` : "Pendiente de seleccionar"}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-950">Revision</h2>
          <p className="text-sm leading-6 text-slate-600">
            La documentacion se enviara al modulo de becas. Odoo hara la busqueda del alumno o contacto por correo electronico y asociara los documentos encontrados.
          </p>
          <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
            <input
              required
              type="checkbox"
              checked={privacyAccepted}
              onChange={(event) => setPrivacyAccepted(event.target.checked)}
              className="mt-1 h-5 w-5 rounded border-slate-300 text-teal-700 focus:ring-teal-100"
            />
            <span>
              Confirmo que la informacion es veraz y acepto la politica de privacidad del Instituto Raimon Gaja.
            </span>
          </label>
        </div>

        <div className="grid gap-4 rounded-md bg-slate-50 p-4">
          <div>
            <p className="text-sm text-slate-500">Beca seleccionada</p>
            <p className="font-semibold text-slate-950">{selectedScholarship.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Documentos listos</p>
            <p className="font-semibold text-slate-950">{completedDocuments} de {selectedScholarship.documents.length}</p>
          </div>
          <button
            type="submit"
            disabled={submitState.status === "submitting"}
            className="min-h-12 rounded-md bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitState.status === "submitting" ? "Enviando..." : "Enviar solicitud"}
          </button>
          {submitState.status === "success" ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
              {submitState.message} {submitState.applicationId ? `Referencia: ${submitState.applicationId}` : null}
            </p>
          ) : null}
          {submitState.status === "error" ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">{submitState.message}</p>
          ) : null}
        </div>
      </section>
    </form>
  );
}