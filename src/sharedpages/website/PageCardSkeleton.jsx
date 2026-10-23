// ── PageCardSkeleton.jsx ──────────────────────────────────────────────────────
// Skeleton loader for Website page cards — uses Tailwind dark: variants.

export default function PageCardSkeleton() {
  return (
    <div className="bg-black/[0.02] dark:bg-white/[0.03] border border-green-700/10 dark:border-green-400/[0.08] rounded-xl p-4 flex flex-col gap-0">

      {/* Section colour bar */}
      <div className="flex gap-0.5 h-[3px] rounded-full overflow-hidden mb-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
        ))}
      </div>

      {/* Title row */}
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 w-[120px] rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
          <div className="h-[7px] w-[60px] rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
        </div>
        {/* Badge */}
        <div className="h-4 w-[54px] rounded-full bg-black/[0.06] dark:bg-white/[0.06] animate-pulse flex-shrink-0" />
      </div>

      {/* Description lines */}
      <div className="flex flex-col gap-[5px] mb-2.5">
        <div className="h-[7px] w-full rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
        <div className="h-[7px] w-4/5 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
        <div className="h-[7px] w-3/5 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
      </div>

      {/* Section chips */}
      <div className="flex gap-1 mb-3">
        {["w-[45px]", "w-[38px]", "w-[52px]", "w-[40px]"].map((w, i) => (
          <div key={i} className={`${w} h-4 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse`} />
        ))}
      </div>

      {/* Sparkline / visits area */}
      <div className="mb-2.5">
        <div className="flex justify-between items-center mb-1.5">
          <div className="h-3.5 w-[70px] rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
          <div className="h-6 w-[80px] rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
        </div>
        {/* Progress bar */}
        <div className="h-[2px] w-full rounded-full bg-black/[0.09] dark:bg-white/[0.10] animate-pulse mb-1" />
        <div className="h-[7px] w-[90px] rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center border-t border-black/[0.07] dark:border-white/[0.06] pt-2.5 mt-0.5">
        <div className="h-[7px] w-[80px] rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
        <div className="flex gap-1.5">
          <div className="h-[22px] w-[42px] rounded-md bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
          <div className="h-[22px] w-[42px] rounded-md bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
        </div>
      </div>

    </div>
  );
}