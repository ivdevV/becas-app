import {
  createPeriodAction,
  deletePeriodAction,
  logoutAction,
  setCurrentPeriodAction,
  updatePeriodAction,
} from "@/app/admin/actions";
import { DeletePeriodButton } from "@/components/admin/DeletePeriodButton";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { InstituteMark } from "@/components/institute-mark";
import { resolvePeriodAccess, type ScholarshipPeriod } from "@/lib/scholarship-periods/resolve";
import { formatMadridDateTime, utcIsoToMadridInput } from "@/lib/time/madrid";

type PeriodDashboardProps = {
  periods: ScholarshipPeriod[];
  publicOpen: boolean;
  notice: string | null;
  error: string | null;
};

const fieldClassName =
  "h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-[#4ab5f0] focus:ring-4 focus:ring-[#4ab5f0]/20";

export function PeriodDashboard({ periods, publicOpen, notice, error }: PeriodDashboardProps) {
  const now = new Date();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid justify-items-start gap-3">
            <InstituteMark />
            <p className="text-lg font-semibold uppercase text-[#1684bd]">Acceso interno</p>
            <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">Periodos de becas</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              La pagina publica usa solo la convocatoria vigente. En automatico, el formulario aparece entre la apertura y el cierre. Forzar abierto o cerrado manda sobre el reloj.
            </p>
          </div>
          <form action={logoutAction}>
            <SubmitButton variant="secondary" pendingLabel="Saliendo...">
              Cerrar sesion
            </SubmitButton>
          </form>
        </div>
        <p className={`rounded-md border p-3 text-sm leading-6 ${publicOpen ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
          {publicOpen ? "La solicitud publica esta abierta." : "La solicitud publica esta cerrada."}
        </p>
        {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">{notice}</p> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p> : null}
      </section>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Nueva convocatoria</h2>
          <p className="text-sm leading-6 text-slate-600">Las horas se guardan en horario de Madrid.</p>
        </div>
        <PeriodFields action={createPeriodAction} submitLabel="Crear convocatoria" />
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold text-slate-950">Convocatorias</h2>
        {periods.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
            Todavia no hay convocatorias. La solicitud publica permanece cerrada.
          </p>
        ) : (
          periods.map((period) => (
            <article key={period.id} className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{period.name}</h3>
                  <p className="text-sm leading-6 text-slate-600">
                    Del {formatMadridDateTime(period.startsAt)} al {formatMadridDateTime(period.endsAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {period.isCurrent ? (
                    <span className="rounded-md bg-[#1684bd] px-3 py-1 text-sm font-semibold text-white">Vigente</span>
                  ) : null}
                  <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    {statusLabel(period, now)}
                  </span>
                </div>
              </div>
              <PeriodFields
                action={updatePeriodAction}
                submitLabel="Guardar cambios"
                period={period}
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                {period.isCurrent ? null : (
                  <form action={setCurrentPeriodAction}>
                    <input type="hidden" name="id" value={period.id} />
                    <SubmitButton variant="secondary" pendingLabel="Marcando...">
                      Marcar vigente
                    </SubmitButton>
                  </form>
                )}
                <form action={deletePeriodAction}>
                  <input type="hidden" name="id" value={period.id} />
                  <DeletePeriodButton />
                </form>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

function PeriodFields({
  action,
  submitLabel,
  period,
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  period?: ScholarshipPeriod;
}) {
  return (
    <form action={action} className="grid gap-4">
      {period ? <input type="hidden" name="id" value={period.id} /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-800 lg:col-span-2">
          Nombre
          <input
            required
            name="name"
            maxLength={120}
            defaultValue={period?.name ?? ""}
            placeholder="Convocatoria octubre 2026"
            className={fieldClassName}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Apertura
          <input
            required
            type="datetime-local"
            name="startsAt"
            defaultValue={period ? utcIsoToMadridInput(period.startsAt) : ""}
            className={fieldClassName}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Cierre
          <input
            required
            type="datetime-local"
            name="endsAt"
            defaultValue={period ? utcIsoToMadridInput(period.endsAt) : ""}
            className={fieldClassName}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-800 lg:col-span-2">
          Control manual
          <select
            name="override"
            defaultValue={period?.override ?? "auto"}
            className={fieldClassName}
          >
            <option value="auto">Automatico, segun las fechas</option>
            <option value="open">Forzar abierto</option>
            <option value="closed">Forzar cerrado</option>
          </select>
        </label>
      </div>
      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

function statusLabel(period: ScholarshipPeriod, now: Date) {
  const access = resolvePeriodAccess(period, now);

  if (access.status === "open" && period.override === "open") {
    return "Forzada abierta";
  }

  if (access.status === "open") {
    return "Abierta";
  }

  if (access.reason === "scheduled") {
    return "Programada";
  }

  if (access.reason === "forced") {
    return "Forzada cerrada";
  }

  return "Cerrada";
}
