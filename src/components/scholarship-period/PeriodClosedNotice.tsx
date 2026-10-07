import { InstituteMark } from "@/components/institute-mark";

type PeriodClosedNoticeProps = {
  headline: string;
  schedule: string | null;
};

export function PeriodClosedNotice({ headline, schedule }: PeriodClosedNoticeProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <section className="grid w-full max-w-xl justify-items-center gap-4 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <InstituteMark />
        <p className="text-lg font-semibold uppercase text-[#1684bd]">Solicitud de beca</p>
        <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">{headline}</h1>
        <p className="text-base leading-7 text-slate-600">Disculpad las molestias.</p>
        {schedule ? <p className="text-sm leading-6 text-slate-500">{schedule}</p> : null}
      </section>
    </main>
  );
}
