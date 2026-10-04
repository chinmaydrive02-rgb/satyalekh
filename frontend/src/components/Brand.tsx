/** A quiet wordmark and a single letterform, shared across the product. */
export default function Brand() {
  return (
    <span className="brand-lockup inline-flex items-center gap-2.5">
      <svg className="brand-mark shrink-0" width="32" height="32" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect width="64" height="64" rx="12" fill="#172C28" />
        <path d="M42 19H28C22 19 19 22 19 27C19 31 22 33 28 33H36C42 33 45 36 45 40C45 45 42 48 36 48H21" stroke="#FFFEF7" strokeWidth="6" strokeLinecap="square" />
      </svg>
      <span className="font-sans text-[21px] font-semibold text-ink leading-none tracking-[-0.045em]">Satyalekh</span>
    </span>
  );
}
