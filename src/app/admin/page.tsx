import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { PeriodDashboard } from "@/components/admin/PeriodDashboard";
import { InstituteMark } from "@/components/institute-mark";
import { getAdminConfig } from "@/lib/admin/config";
import { hasValidAdminSession } from "@/lib/admin/session";
import { getPublicPeriodState, listPeriods } from "@/lib/scholarship-periods/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Periodos de becas",
  robots: { index: false, follow: false },
};

const errorMessages: Record<string, string> = {
  clave: "La clave no es correcta.",
  limite: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  sesion: "La sesion ha caducado. Entra de nuevo.",
  origen: "No se pudo comprobar el origen de la solicitud.",
  config: "El panel no esta disponible.",
  nombre: "Indica un nombre de hasta 120 caracteres.",
  fechas: "La apertura tiene que ser anterior al cierre, en hora de Madrid.",
  control: "El control manual no es valido.",
  "no-encontrada": "Esa convocatoria ya no existe.",
  guardar: "No se pudo guardar la convocatoria.",
};

const noticeMessages: Record<string, string> = {
  creada: "Convocatoria creada.",
  guardada: "Cambios guardados.",
  vigente: "Convocatoria marcada como vigente.",
  eliminada: "Convocatoria eliminada.",
};

type AdminPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const error = lookupMessage(errorMessages, params.error);
  const notice = lookupMessage(noticeMessages, params.notice);

  if (!getAdminConfig()) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <section className="grid w-full max-w-xl justify-items-center gap-4 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <InstituteMark />
          <p className="text-lg font-semibold uppercase text-[#1684bd]">Acceso interno</p>
          <h1 className="text-3xl font-semibold text-slate-950">Panel no disponible</h1>
          <p className="text-sm leading-6 text-slate-600">
            Define SCHOLARSHIP_ADMIN_PASSWORD, con al menos 12 caracteres, y SCHOLARSHIP_ADMIN_SESSION_SECRET, con al menos 32, en el entorno de Coolify.
          </p>
        </section>
      </main>
    );
  }

  if (!(await hasValidAdminSession())) {
    return <AdminLoginForm error={error} />;
  }

  let periods: ReturnType<typeof listPeriods> = [];
  let loadError = error;

  try {
    periods = listPeriods();
  } catch (cause) {
    console.error("Scholarship period admin failed", cause);
    loadError = "No se pudieron leer las convocatorias.";
  }

  const publicState = getPublicPeriodState();

  return (
    <PeriodDashboard
      periods={periods}
      publicOpen={publicState.status === "open"}
      notice={notice}
      error={loadError}
    />
  );
}

function lookupMessage(messages: Record<string, string>, code: string | undefined) {
  if (!code) {
    return null;
  }

  return messages[code] ?? null;
}
