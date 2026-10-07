"use client";

export function DeletePeriodButton() {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm("Eliminar esta convocatoria?")) {
          event.preventDefault();
        }
      }}
      className="min-h-12 rounded-md border border-red-200 bg-white px-5 text-base font-semibold text-red-700 transition hover:border-red-300 focus:outline-none focus:ring-4 focus:ring-red-200/60"
    >
      Eliminar
    </button>
  );
}
