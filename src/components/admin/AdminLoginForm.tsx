import { loginAction } from "@/app/admin/actions";
import { InstituteMark } from "@/components/institute-mark";
import { SubmitButton } from "@/components/admin/SubmitButton";

export function AdminLoginForm({ error }: { error: string | null }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <form action={loginAction} className="grid w-full max-w-md gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid justify-items-center gap-3 text-center">
          <InstituteMark />
          <p className="text-lg font-semibold uppercase text-[#1684bd]">Acceso interno</p>
          <h1 className="text-3xl font-semibold text-slate-950">Periodos de becas</h1>
          <p className="text-sm leading-6 text-slate-600">Introduce la clave de administracion.</p>
        </div>
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Clave
          <input
            required
            type="password"
            name="password"
            autoComplete="current-password"
            minLength={12}
            className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-[#4ab5f0] focus:ring-4 focus:ring-[#4ab5f0]/20"
          />
        </label>
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p> : null}
        <SubmitButton pendingLabel="Entrando...">Entrar</SubmitButton>
      </form>
    </main>
  );
}
