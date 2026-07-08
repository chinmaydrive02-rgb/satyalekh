"use client";

import React, { useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { Reveal, CountUp } from "@/components/motion";
import {
  ShieldCheck, ArrowRight, CheckCircle2, Search, Scale,
  FileWarning, Copy, UserX, EyeOff, Layers, Repeat2, Trees, Gavel,
  Ban, AlertTriangle, Landmark, Banknote, FileSignature, Repeat,
  Building2, Stamp, ChevronDown, Info, Eye, Database, MapPin,
  BadgeCheck, MessageSquare,
} from "lucide-react";

/* ── The fraud playbook we screen for ─────────────────────────────
   Each pattern carries an honest coverage tag: "flag" = surfaced in
   the report today; "verify" = we point you at the certified channel
   rather than overclaim a definitive call. ── */
type Coverage = "flag" | "verify";

const COVERAGE_META: Record<Coverage, { label: string; cls: string; icon: React.ReactNode }> = {
  flag: {
    label: "Flagged in your report",
    cls: "text-brand bg-brand-soft border-brand-border",
    icon: <ShieldCheck size={11} />,
  },
  verify: {
    label: "We tell you to verify",
    cls: "text-warning bg-warning-soft border-warning-border",
    icon: <AlertTriangle size={11} />,
  },
};

const SCAMS: {
  icon: React.ReactNode;
  scam: string;
  tell: string;
  help: string;
  coverage: Coverage;
  link: { href: string; label: string };
}[] = [
  {
    icon: <Copy size={20} />,
    scam: "Forged or duplicate 7/12",
    tell: "A record that doesn't reconcile with the mutation ledger — owner, area or entry numbers that don't line up with the official RoR pulled straight from source.",
    help: "We fetch the record from the government portal or DigiLocker ourselves, so you compare the seller's copy against the live official one — not a photocopy they handed you.",
    coverage: "flag",
    link: { href: "/", label: "Run a title check" },
  },
  {
    icon: <UserX size={20} />,
    scam: "Impersonation & fake POA chains",
    tell: "A power-of-attorney holder selling on behalf of an owner who isn't on the current record, or a name that never appears in the chain of title.",
    help: "The chain-of-title timeline shows every mutation and who actually held the land. A seller who isn't in that chain is a question you raise before the token.",
    coverage: "flag",
    link: { href: "/", label: "See the chain of title" },
  },
  {
    icon: <EyeOff size={20} />,
    scam: "Benami / hidden beneficial holdings",
    tell: "The recorded owner is a front — the person negotiating and pocketing the money is someone else entirely, with no paper link to the parcel.",
    help: "Records show the registered owner, not the hidden one — so we surface the mismatch between who's on paper and who's in the room. Confirm true ownership through certified copies and a lawyer.",
    coverage: "verify",
    link: { href: "/directory", label: "Find a lawyer" },
  },
  {
    icon: <Repeat2 size={20} />,
    scam: "Double-selling & rapid mutations",
    tell: "The same parcel sold to two buyers, or a burst of successive mutation entries in a short window — a classic sign a plot is being churned.",
    help: "The mutation chain is drawn as a timeline, and the watchlist re-checks daily — so a fresh mutation after your token appears as an alert, not a surprise at registration.",
    coverage: "flag",
    link: { href: "/watchlist", label: "Watch a parcel" },
  },
  {
    icon: <Layers size={20} />,
    scam: "Disputed / partition land sold as clear",
    tell: "Undivided ancestral or partition-pending land sold as if it were a single clean holding — co-owners who never consented surface later.",
    help: "The title score and litigation check flag co-ownership signals and court cases naming the recorded owner, so an 'undisputed' plot that isn't gets caught early.",
    coverage: "flag",
    link: { href: "/risk-intel", label: "See risk layers" },
  },
  {
    icon: <Trees size={20} />,
    scam: "Encroachment on government / gauchar / forest land",
    tell: "Private sale of land that is actually gauchar (grazing), forest, or otherwise government-held and legally non-transferable.",
    help: "Our prohibited-category and restriction screen checks whether a parcel sits in a non-transferable category or protected zone before you commit any money.",
    coverage: "flag",
    link: { href: "/risk-intel", label: "Prohibited-category screen" },
  },
  {
    icon: <Gavel size={20} />,
    scam: "Litigation hidden from the buyer",
    tell: "A pending suit, injunction or appeal the seller simply doesn't mention — the case only surfaces after you've paid.",
    help: "The litigation check searches district-court records for cases naming the recorded owner, so pending disputes come up during diligence, not after.",
    coverage: "flag",
    link: { href: "/", label: "Run a litigation check" },
  },
  {
    icon: <Ban size={20} />,
    scam: "Land under acquisition / TP reservation",
    tell: "A plot quietly reserved under a Town Planning scheme or notified for acquisition — sold at full value before the reservation bites.",
    help: "The restriction engine cross-references TP reservations and known acquisition and compliance layers, so a reserved plot is flagged for you to confirm with the authority.",
    coverage: "verify",
    link: { href: "/compliance", label: "Compliance & TP checks" },
  },
];

/* ── What a clean title actually unlocks ── */
const UNLOCKS: { icon: React.ReactNode; title: string; desc: string }[] = [
  {
    icon: <Banknote size={19} />,
    title: "Bank loan & mortgage eligibility",
    desc: "Lenders and NBFCs need a clean, marketable title before they'll fund. A verified chain and a clean score make the collateral review far shorter.",
  },
  {
    icon: <FileSignature size={19} />,
    title: "Safe token & registration",
    desc: "Once the record checks out, you can pay the token and register with far less fear that the ground shifts under you between advance and deed.",
  },
  {
    icon: <Repeat size={19} />,
    title: "Clean resale later",
    desc: "A parcel that was clean when you bought — and that you kept on a watchlist — is far easier to sell on, because the paper trail stays unbroken.",
  },
  {
    icon: <Scale size={19} />,
    title: "A faster, cheaper legal opinion",
    desc: "Your lawyer starts from a structured English summary, a drawn chain of title and flagged risks — so the certified opinion takes less of their time, and less of your money.",
  },
  {
    icon: <Building2 size={19} />,
    title: "Development & finance approvals",
    desc: "Development permissions, project finance and joint-development deals all sit on clean title. Getting there first keeps the rest of the pipeline moving.",
  },
];

/* ── DIY vs Lawyer vs Satya-Lekh ── */
const COMPARE_ROWS: {
  label: string;
  diy: string;
  lawyer: string;
  us: string;
  usGood?: boolean;
}[] = [
  { label: "Time to a first read", diy: "Days of portal wrangling", lawyer: "1–3 weeks", us: "Minutes", usGood: true },
  { label: "Typical cost", diy: "Your time + fees", lawyer: "₹5,000–25,000+", us: "From a few hundred", usGood: true },
  { label: "English, structured output", diy: "No — raw local script", lawyer: "Sometimes", us: "Always", usGood: true },
  { label: "Chain of title drawn out", diy: "Manual, error-prone", lawyer: "Yes", us: "Automatic", usGood: true },
  { label: "Litigation check", diy: "Rarely done", lawyer: "Yes", us: "District-court search", usGood: true },
  { label: "Restriction & prohibited-category screen", diy: "Easy to miss", lawyer: "Depends on brief", us: "12 layers, every parcel", usGood: true },
  { label: "Ongoing daily monitoring", diy: "No", lawyer: "No", us: "Watchlist alerts", usGood: true },
  { label: "Certified copies for the bank", diy: "You queue at the SRO", lawyer: "Yes", us: "We fetch them", usGood: true },
  { label: "A certified legal title opinion", diy: "No", lawyer: "Yes — the final word", us: "No — we hand off to a lawyer", usGood: false },
];

/* ── Objection-handling FAQ ── */
const FAQS: { q: string; a: string }[] = [
  {
    q: "Is this official and legal?",
    a: "The records are official — we fetch them from state government portals and DigiLocker issuers, and certified copies come from the Sub-Registrar's office. But a Satya-Lekh report is informational, not a certified legal title opinion. It is the fast, honest first pass that tells you where to look; the final legal opinion still comes from a lawyer.",
  },
  {
    q: "Can it replace my lawyer?",
    a: "No, and we don't claim it does. Satya-Lekh makes your lawyer's job faster and cheaper by handing them a structured English summary, a drawn chain of title, a litigation check and flagged restrictions. For a transaction, a lawyer's certified opinion on certified copies is still the final step — we even help you find one in our legal directory.",
  },
  {
    q: "How current is the data?",
    a: "We read the record live from the official source at the time you search, and we preserve every fetch. Put a parcel on your watchlist and we re-check it daily, so a new mutation, encumbrance or ownership change reaches you as an alert. Records reflect what the government portal shows — occasional portal lag or backlog at the registrar is outside anyone's control, which is exactly why we also offer certified copies.",
  },
  {
    q: "What if my state isn't live yet?",
    a: "Gujarat (AnyROR — 7/12) is fully live today. For other states, the certified-copy channel works ahead of automated portal coverage, and Maharashtra and Karnataka are next on the roadmap. We label every state honestly as live, next up, or planned — see the coverage page for the current status.",
  },
  {
    q: "Is my data private?",
    a: "You search public land records — the same ones anyone can request from the government. Your searches, saved parcels and documents live in your account and locker for you. We don't sell your searches, and certified-copy requests go only to our on-ground partners and the reviewing advocate needed to fulfil the order.",
  },
  {
    q: "What does it cost?",
    a: "New users get free trial searches, and already-verified parcels are free to view again. Certified copies are transparently priced — a certified 7/12 with index-2 from about ₹1,500, and a 30-year search report at ₹4,999. No surprise fees: the speed and price of each request are shown before you commit.",
  },
];

/* ── How we stay honest ── */
const HONESTY: { icon: React.ReactNode; title: string; desc: string }[] = [
  {
    icon: <Landmark size={18} />,
    title: "Official-source provenance",
    desc: "Every record traces back to a government portal, a DigiLocker issuer, or a certified copy from the Sub-Registrar. We show where each document came from.",
  },
  {
    icon: <Eye size={18} />,
    title: "Coverage shown plainly",
    desc: "We publish exactly where we work and where we don't. No pretending we have a magic API into every Indian state.",
  },
  {
    icon: <BadgeCheck size={18} />,
    title: "Live, beta & planned — labelled",
    desc: "Every state and feature carries an honest status. If something is on the roadmap, we say so rather than imply it's ready.",
  },
  {
    icon: <Info size={18} />,
    title: "Clear on what we are not",
    desc: "A report is intelligence, not a legal title opinion. We say it on the report, on this page, and to your face.",
  },
];

export default function Trust() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-bg">
      <TopNav />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hero-mesh pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-[1000px] mx-auto text-center flex flex-col items-center gap-6">
          <span
            className="sl-anim inline-flex items-center gap-2.5 rounded-full border border-brand-border bg-brand-soft/70 px-3.5 py-1.5 text-xs font-semibold text-brand"
            style={{ animation: "sl-fade-up 0.6s cubic-bezier(0.22,0.61,0.36,1) both" }}
          >
            <ShieldCheck size={13} /> Why you can trust this
          </span>
          <h1
            className="sl-anim font-serif text-4xl sm:text-6xl font-semibold text-ink leading-[1.05] tracking-tight max-w-4xl"
            style={{ animation: "sl-fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) 0.08s both" }}
          >
            Property fraud in India is not rare.{" "}
            <em className="text-sheen not-italic sm:italic font-medium">
              Your paperwork should prove it isn&apos;t happening to you.
            </em>
          </h1>
          <p
            className="sl-anim text-lg text-ink-soft leading-relaxed max-w-2xl"
            style={{ animation: "sl-fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) 0.16s both" }}
          >
            India runs on presumptive titles — the government records who is
            <em> presumed </em>to own land, not who conclusively does. That gap is
            where forged records, fake attorneys and quietly-litigated plots slip
            through. A clean, verifiable record is your best defence, and reading it
            plainly is the whole point of Satya-Lekh.
          </p>
          <div
            className="sl-anim flex flex-wrap justify-center gap-x-10 gap-y-4 pt-2"
            style={{ animation: "sl-fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) 0.24s both" }}
          >
            {[
              { n: 8, suffix: "", label: "fraud patterns screened", tone: "text-brand" },
              { n: 12, suffix: "", label: "restriction layers", tone: "text-accent" },
              { n: 100, suffix: "", label: "0–100 title score", tone: "text-success" },
            ].map((s) => (
              <span key={s.label} className="flex flex-col items-center">
                <strong className={`font-mono tnum text-3xl font-bold leading-none ${s.tone}`}>
                  <CountUp target={s.n} suffix={s.suffix} />
                </strong>
                <span className="text-xs text-muted mt-1.5 uppercase tracking-[0.08em]">{s.label}</span>
              </span>
            ))}
          </div>
          <p
            className="sl-anim text-xs text-faint max-w-xl leading-relaxed pt-1"
            style={{ animation: "sl-fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) 0.3s both" }}
          >
            Land and property disputes are commonly cited as roughly two-thirds of
            civil cases in Indian courts — which is exactly why clean paperwork,
            before the money moves, matters so much.
          </p>
        </div>
      </section>

      {/* ── The fraud playbook ───────────────────────────────────── */}
      <section className="border-y border-border bg-surface py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><FileWarning size={12} /> The fraud playbook</p>
            <span className="rule-draw mb-3" aria-hidden="true" />
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4 max-w-2xl">
              The scams we screen for — and how the record gives them away
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-4">
              These are the real patterns behind land fraud in India. For each one:
              the scam, the tell hiding in the records, and how Satya-Lekh helps catch
              it. We&apos;re honest about the difference between what we{" "}
              <strong className="text-ink">flag automatically</strong> and what we tell
              you to <strong className="text-ink">verify through the certified channel</strong>.
            </p>
            <div className="flex flex-wrap gap-3 mb-10 text-[11px]">
              <span className={`badge border ${COVERAGE_META.flag.cls}`}>{COVERAGE_META.flag.icon} {COVERAGE_META.flag.label}</span>
              <span className={`badge border ${COVERAGE_META.verify.cls}`}>{COVERAGE_META.verify.icon} {COVERAGE_META.verify.label}</span>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SCAMS.map((s, i) => {
              const meta = COVERAGE_META[s.coverage];
              return (
                <Reveal key={s.scam} delay={(i % 3) * 90} variant="reveal-scale" className="h-full">
                  <div className="card card-lift p-6 flex flex-col gap-3.5 h-full">
                    <div className="flex items-start justify-between gap-3">
                      <span className="w-11 h-11 rounded-xl bg-danger-soft text-danger border border-danger-border/60 flex items-center justify-center shrink-0">
                        {s.icon}
                      </span>
                      <span className={`badge border text-[10px] uppercase tracking-[0.06em] ${meta.cls}`}>
                        {meta.icon} {s.coverage === "flag" ? "Flagged" : "Verify"}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-ink leading-snug">{s.scam}</h3>
                    <div className="flex flex-col gap-2.5 text-[13px]">
                      <p className="text-muted leading-relaxed">
                        <span className="font-semibold text-ink-soft">The tell — </span>{s.tell}
                      </p>
                      <p className="text-muted leading-relaxed">
                        <span className="font-semibold text-brand">How we help — </span>{s.help}
                      </p>
                    </div>
                    <Link
                      href={s.link.href}
                      className="mt-auto pt-2 text-xs font-semibold text-brand inline-flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      {s.link.label} <ArrowRight size={12} />
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={120}>
            <div className="mt-8 card bg-surface-soft/50 px-6 py-5 flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <Info size={18} />
              </span>
              <p className="text-sm text-ink-soft leading-relaxed">
                <strong className="text-ink">We don&apos;t overclaim.</strong>{" "}
                No record check can promise a title is fraud-free — some frauds live
                off-record entirely. What we do is surface the patterns that <em>do</em>{" "}
                leave a trace, and point you to a certified copy and a lawyer for the rest.
                An honest &quot;go verify this&quot; is worth more than a false &quot;all clear&quot;.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── What a clean title unlocks ───────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><CheckCircle2 size={12} /> After the check clears</p>
            <span className="rule-draw mb-3" aria-hidden="true" />
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4 max-w-2xl">
              What a clean title actually unlocks
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-12">
              A verified clean title isn&apos;t the finish line — it&apos;s the key that
              opens the next doors. Here&apos;s what changes the moment the record checks
              out, framed as outcomes, not promises.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {UNLOCKS.map((u, i) => (
              <Reveal key={u.title} delay={(i % 3) * 90} className="h-full">
                <div className="card p-6 flex flex-col gap-3 h-full">
                  <span className="w-11 h-11 rounded-xl bg-brand-soft text-brand border border-brand-border/60 flex items-center justify-center">
                    {u.icon}
                  </span>
                  <h3 className="text-base font-semibold text-ink">{u.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{u.desc}</p>
                </div>
              </Reveal>
            ))}

            {/* Cross-sell: certified channel — the honest final step */}
            <Reveal delay={180} variant="reveal-scale" className="h-full">
              <div className="card section-dark p-6 flex flex-col gap-3 h-full overflow-hidden">
                <div className="relative z-10 flex flex-col gap-3 h-full">
                  <span className="w-11 h-11 rounded-xl bg-white/10 text-accent-bright border border-white/15 flex items-center justify-center">
                    <Stamp size={19} />
                  </span>
                  <h3 className="text-base font-semibold text-white">The final step is still a lawyer</h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    A clean report gets you most of the way. For the transaction itself,
                    a certified copy plus a lawyer&apos;s opinion is the real finish line
                    — and we help you get both.
                  </p>
                  <div className="mt-auto pt-2 flex flex-col gap-2">
                    <Link href="/contact" className="btn bg-white text-pine hover:bg-brand-soft border border-white/10 text-sm w-full justify-center font-semibold">
                      Order a certified copy · ₹1,500–4,999
                    </Link>
                    <Link href="/directory" className="btn btn-ghost text-white/80 hover:text-white border border-white/20 hover:border-white/40 text-sm w-full justify-center">
                      Browse the legal directory <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── DIY vs Lawyer vs Satya-Lekh ──────────────────────────── */}
      <section className="border-y border-border bg-surface py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1000px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Scale size={12} /> An honest comparison</p>
            <span className="rule-draw mb-3" aria-hidden="true" />
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4">
              Do it yourself vs a lawyer vs Satya-Lekh
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-10">
              We&apos;re the fast first pass that makes the lawyer&apos;s job cheaper —
              not a replacement for a legal opinion. Here&apos;s where each option
              actually lands.
            </p>
          </Reveal>

          <Reveal variant="reveal-scale">
            <div className="card overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-x-2 px-4 sm:px-6 py-3.5 border-b border-border bg-surface-soft/50 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.06em]">
                <span className="text-muted">What matters</span>
                <span className="text-muted text-center">Do it yourself</span>
                <span className="text-muted text-center">A lawyer</span>
                <span className="text-brand text-center">Satya-Lekh</span>
              </div>
              <div className="divide-y divide-border">
                {COMPARE_ROWS.map((r, i) => (
                  <Reveal key={r.label} delay={Math.min(i * 45, 360)}>
                    <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-x-2 px-4 sm:px-6 py-3.5 items-center text-[12px] sm:text-[13px]">
                      <span className="font-medium text-ink leading-snug">{r.label}</span>
                      <span className="text-muted text-center leading-snug">{r.diy}</span>
                      <span className="text-muted text-center leading-snug">{r.lawyer}</span>
                      <span
                        className={`text-center leading-snug font-semibold inline-flex items-center justify-center gap-1 ${
                          r.usGood ? "text-brand" : "text-warning"
                        }`}
                      >
                        {r.usGood ? (
                          <CheckCircle2 size={13} className="shrink-0" />
                        ) : (
                          <Info size={13} className="shrink-0" />
                        )}
                        {r.us}
                      </span>
                    </div>
                  </Reveal>
                ))}
              </div>
              <div className="px-4 sm:px-6 py-3.5 border-t border-border bg-surface-soft/40 text-[11px] text-muted flex items-start gap-2">
                <Info size={13} className="text-accent shrink-0 mt-0.5" />
                Satya-Lekh is intelligence, not a certified legal title opinion. The
                last row is the point: for the deal itself, the lawyer has the final word
                — we just get them there faster and cheaper.
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Objection-handling FAQ ───────────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[820px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><MessageSquare size={12} /> Straight answers</p>
            <span className="rule-draw mb-3" aria-hidden="true" />
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4">
              The questions a careful buyer actually asks
            </h2>
            <p className="text-ink-soft leading-relaxed mb-10">
              No spin. If the honest answer is &quot;a lawyer does that part&quot;, that&apos;s
              what we&apos;ll tell you.
            </p>
          </Reveal>

          <div className="flex flex-col gap-3">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <Reveal key={f.q} delay={Math.min(i * 55, 330)}>
                  <div className="card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left"
                    >
                      <span className="text-[15px] font-semibold text-ink leading-snug">{f.q}</span>
                      <ChevronDown
                        size={18}
                        className={`text-brand shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      className="grid transition-all duration-300 ease-out"
                      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <p className="px-5 sm:px-6 pb-5 text-sm text-muted leading-relaxed">{f.a}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How we stay honest ───────────────────────────────────── */}
      <section className="border-y border-border bg-surface py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><ShieldCheck size={12} /> How we stay honest</p>
            <span className="rule-draw mb-3" aria-hidden="true" />
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4 max-w-2xl">
              Trust is a habit, not a badge
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-12">
              We&apos;d rather under-promise and be believed. Here&apos;s how that shows
              up in the product.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HONESTY.map((h, i) => (
              <Reveal key={h.title} delay={i * 90} variant="reveal-scale" className="h-full">
                <div className="card p-6 flex flex-col gap-3 h-full">
                  <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand border border-brand-border/60 flex items-center justify-center">
                    {h.icon}
                  </span>
                  <h3 className="text-sm font-semibold text-ink leading-snug">{h.title}</h3>
                  <p className="text-[13px] text-muted leading-relaxed">{h.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 card bg-surface-soft/50 px-6 py-5">
              <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <MapPin size={18} />
              </span>
              <p className="text-sm text-ink-soft leading-relaxed flex-1">
                <strong className="text-ink">See exactly where we work.</strong>{" "}
                Gujarat is live; other states are labelled next up or on the roadmap,
                and certified copies work ahead of automated coverage. No fine print.
              </p>
              <Link href="/coverage" className="btn btn-outline whitespace-nowrap shrink-0">
                See our coverage <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 text-xs text-faint leading-relaxed max-w-3xl flex items-start gap-2">
              <Database size={13} className="text-faint shrink-0 mt-0.5" />
              Satya-Lekh reports are generated from official government records but are
              not a legal title opinion. For a transaction, verify the index-2, a 30-year
              search report and any pending litigation with a lawyer — or order the
              certified pack and we&apos;ll do the legwork.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Closing CTA band ─────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-20">
        <Reveal>
          <div className="section-dark cta-sheen max-w-[1000px] mx-auto rounded-3xl px-8 py-14 sm:px-14 sm:py-16 overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-xl">
                <p className="eyebrow text-accent-bright mb-3">Don&apos;t take our word for it</p>
                <h2 className="font-serif text-3xl sm:text-[2.6rem] font-semibold text-white leading-[1.1] mb-4">
                  Read the truth of a title yourself.
                </h2>
                <p className="text-white/70 text-base leading-relaxed">
                  Run a real title check and see the fraud screens, chain of title and
                  restriction layers on an actual parcel. Have a tricky case or a state
                  we don&apos;t cover yet? Talk to us.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link
                  href="/"
                  className="btn btn-arrow bg-white text-pine hover:bg-brand-soft border border-white/10 px-7 py-3 text-base whitespace-nowrap font-semibold w-full"
                >
                  <Search size={15} /> Run a title check
                </Link>
                <Link
                  href="/contact"
                  className="btn btn-ghost text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-7 py-3 whitespace-nowrap w-full justify-center"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer strip ─────────────────────────────────────────── */}
      <footer className="border-t border-border px-4 sm:px-6 py-8">
        <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <span className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-brand" />
            © {new Date().getFullYear()} Satya-Lekh — land title intelligence for India.
          </span>
          <span>Reports are informational, drawn from official sources — not a certified legal title opinion.</span>
        </div>
      </footer>
    </main>
  );
}
