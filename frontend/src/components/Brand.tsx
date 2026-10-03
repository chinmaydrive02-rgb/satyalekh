/** A survey boundary and an ink stroke: land and its written record. */
export default function Brand() {
  return (
    <span className="brand-lockup inline-flex items-center gap-2.5">
      <svg className="brand-mark shrink-0" width="36" height="36" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect width="64" height="64" rx="17" fill="#173F3A" />
        <path className="brand-boundary" d="M17 19L39 14L48 25L43 46L22 50L14 38Z" stroke="#E1C990" strokeWidth="1.5" />
        <path d="M39 23H28C23 23 22 31 28 32L36 34C42 36 40 42 35 42H24" stroke="#FFFEF7" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M43 18L26 46" stroke="#E1C990" strokeWidth="2" strokeLinecap="round" />
        <circle cx="17" cy="19" r="2.2" fill="#E1C990" />
        <circle cx="43" cy="46" r="2.2" fill="#E1C990" />
      </svg>
      <span className="flex flex-col">
        <span className="font-serif text-[20px] font-semibold text-ink leading-none tracking-[-0.04em]">Satya<span className="text-accent mx-0.5">·</span>Lekh</span>
        <span className="text-[7px] font-medium uppercase tracking-[0.2em] text-muted mt-1.5">Land. Record. Clarity.</span>
      </span>
    </span>
  );
}
