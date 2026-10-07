import Image from "next/image";

export function InstituteMark() {
  return (
    <div className="mx-auto flex min-h-16 w-fit items-center rounded-md border border-slate-200 bg-white px-4 py-3">
      <Image
        src="/7cc4845ce8a62d935d2dd0db23209c3ca8d5463f-587x282.avif"
        alt="Instituto Raimon Gaja"
        width={156}
        height={75}
        priority
        className="h-auto w-32 sm:w-36"
      />
    </div>
  );
}
