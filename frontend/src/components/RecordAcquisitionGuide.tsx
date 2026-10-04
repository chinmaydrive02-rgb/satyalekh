import Link from 'next/link';
import { ExternalLink, FileText, ArrowRight } from 'lucide-react';

type RecordContext = { district?: string; taluka?: string; village?: string; surveyNo?: string };
export default function RecordAcquisitionGuide({ district, taluka, village, surveyNo, uploadLink = false }: RecordContext & { uploadLink?: boolean }) {
  const context = [['District', district], ['Taluka', taluka], ['Village', village], ['Survey / block', surveyNo]];
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ district, taluka, village, survey_no: surveyNo })) if (value) query.set(key, value);
  const uploadHref = `/upload${query.size ? `?${query.toString()}` : ''}`;
  return <section aria-label="Get and review an official land record" className="rounded-xl border border-border bg-surface-soft p-4 sm:p-5 space-y-4 print:hidden">
    <div className="flex items-start gap-3"><FileText size={20} className="text-brand mt-1 shrink-0"/><div><h2 className="text-base font-semibold text-ink">Start with the official record</h2><p className="text-sm text-muted mt-1">If retrieval fails, obtain the record yourself and bring the original here for a preliminary review.</p></div></div>
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">{context.map(([label, value]) => <div key={label}><dt className="text-xs text-muted">{label}</dt><dd className="text-sm font-medium text-ink mt-1 break-words">{value || 'Choose on the official portal'}</dd></div>)}</dl>
    <div className="grid gap-3 sm:grid-cols-2">
      <a href="https://anyror.gujarat.gov.in/LandRecordRural.aspx" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-surface p-3 min-h-11 focus-visible:outline-2 focus-visible:outline-brand"><span className="flex items-center gap-2 text-sm font-semibold text-brand">Open AnyROR rural records <ExternalLink size={14}/></span><span className="block text-xs text-muted mt-2 leading-relaxed">Free informational view. Select the location and record type, then complete the portal CAPTCHA yourself. These details are not automatically filled in.</span></a>
      <a href="https://iora.gujarat.gov.in/ror_online.aspx" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-surface p-3 min-h-11 focus-visible:outline-2 focus-visible:outline-brand"><span className="flex items-center gap-2 text-sm font-semibold text-brand">Obtain a digitally signed RoR <ExternalLink size={14}/></span><span className="block text-xs text-muted mt-2 leading-relaxed">Government login, OTP and charges may apply. Complete them directly on iORA; Satyalekh does not handle your OTP or payment.</span></a>
    </div>
    <ol className="grid sm:grid-cols-3 gap-3 text-sm text-ink-soft list-none"><li><span className="eyebrow block mb-1">01 · Obtain</span>Save the original download, or print the informational view to PDF. Keep its date and document number.</li><li><span className="eyebrow block mb-1">02 · Upload</span>Upload the PDF or readable image. Compare the reading with the original and supply source excerpts.</li><li><span className="eyebrow block mb-1">03 · Review</span>Produce a preliminary analysis for lawyer review. Uploading a record does not establish title clearance.</li></ol>
    <p className="text-xs text-muted leading-relaxed"><a href="https://anyror.gujarat.gov.in/rorverify.aspx" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-2 inline-flex items-center gap-1 min-h-11">Verify a digitally signed RoR on AnyROR <ExternalLink size={12}/></a> — enter its document number yourself and compare the portal result. Satyalekh does not automatically verify authenticity. If the government portal is unavailable, retry later or contact the relevant revenue office.</p>
    {uploadLink && <Link href={uploadHref} className="btn btn-primary min-h-11 w-fit">Upload the official record <ArrowRight size={14}/></Link>}
  </section>;
}
