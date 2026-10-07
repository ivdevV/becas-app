import { ScholarshipApplicationForm } from "@/components/scholarship-form/ScholarshipApplicationForm";
import { PeriodClosedNotice } from "@/components/scholarship-period/PeriodClosedNotice";
import { getPublicPeriodState } from "@/lib/scholarship-periods/repository";
import { formatMadridDateTime } from "@/lib/time/madrid";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function Home() {
  const state = getPublicPeriodState();

  if (state.status === "closed") {
    return (
      <PeriodClosedNotice
        headline={
          state.reason === "scheduled"
            ? "El periodo para solicitar becas aun no ha comenzado"
            : "El periodo para solicitar becas ha finalizado"
        }
        schedule={
          state.period
            ? `${state.period.name}: del ${formatMadridDateTime(state.period.startsAt)} al ${formatMadridDateTime(state.period.endsAt)} (hora de Madrid).`
            : null
        }
      />
    );
  }

  return <ScholarshipApplicationForm />;
}
