"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Loader2, Gift, FlaskConical } from 'lucide-react';
import { API_BASE_URL, getUserEmail, fetchCredits, fetchConfig, fetchSurveyOptions, AppConfig, isDemoActive, demoHeaders } from '@/lib/api';

// ── DEMO MODE ── one-click sample parcels matching backend/demo.py fixtures
const DEMO_SAMPLES = [
  { label: 'Clear title',        sub: 'Navrangpura 128 P', district: 'Ahmedabad', taluka: 'City',     village: 'Navrangpura', survey: '128 P' },
  { label: 'Caution · live boja', sub: 'Sanand 45',        district: 'Ahmedabad', taluka: 'Sanand',   village: 'Sanand',      survey: '45' },
  { label: 'High risk · 72-AA',  sub: 'Dholera 72',        district: 'Ahmedabad', taluka: 'Dholera',  village: 'Dholera',     survey: '72' },
  { label: 'Clear · Surat',      sub: 'Bhimrad 301',       district: 'Surat',     taluka: 'Choryasi', village: 'Bhimrad',     survey: '301' },
  { label: 'Error + suggestions', sub: 'Survey 999',       district: 'Ahmedabad', taluka: 'City',     village: 'Navrangpura', survey: '999' },
];

const RECORD_TYPES = [
  { value: 'OLD_SCAN_712', label: 'Old Scanned 7/12 (VF-7/12)' },
  { value: 'VF7',          label: 'VF-7 Survey No Details' },
  { value: 'VF8A',         label: 'VF-8A Khata Details' },
  { value: 'VF6',          label: 'VF-6 Entry Details' },
  { value: 'INTEGRATED',   label: 'Integrated Survey Details' },
  { value: 'OWNER_NAME',   label: 'Search by Owner Name' },
];

interface Village { english: string; gujarati: string; }

export default function SearchWidget({ onPlotSelect }: { onPlotSelect?: (plot: any) => void }) {
  const [recordType, setRecordType] = useState('OLD_SCAN_712');

  const [districts, setDistricts] = useState<string[]>([]);
  const [talukas, setTalukas]     = useState<string[]>([]);
  const [villages, setVillages]   = useState<Village[]>([]);

  const [district, setDistrict] = useState('');
  const [taluka, setTaluka]     = useState('');
  const [village, setVillage]   = useState('');
  const [surveyNo, setSurveyNo] = useState('');

  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTalukas, setLoadingTalukas]     = useState(false);
  const [loadingVillages, setLoadingVillages]   = useState(false);
  const [villageError, setVillageError]         = useState(false);
  const [config, setConfig]                     = useState<AppConfig | null>(null);
  const [surveyOptions, setSurveyOptions]       = useState<string[]>([]);

  // ── DEMO MODE ── client-only (avoids hydration mismatch); a pending fill
  // survives the cascading district→taluka reset when a sample chip is clicked.
  const [demoActive, setDemoActive] = useState(false);
  const pendingTaluka = useRef<string | null>(null);
  useEffect(() => { setDemoActive(isDemoActive()); }, []);

  const applyDemoSample = (s: typeof DEMO_SAMPLES[number]) => {
    setRecordType('OLD_SCAN_712');
    setVillage(s.village);
    setSurveyNo(s.survey);
    if (s.district === district) {
      setTaluka(s.taluka);
    } else {
      // Changing district clears taluka and reloads the list — set it after load
      pendingTaluka.current = s.taluka;
      setDistrict(s.district);
    }
  };

  // Load public config (payments / free trial info)
  useEffect(() => { fetchConfig().then(c => { if (c) setConfig(c); }); }, []);

  // When a village name has been typed, look up cached real survey numbers
  // (instant — populated by previous scrapes; empty for fresh villages)
  useEffect(() => {
    const v = village.trim();
    if (!district || !taluka || v.length < 3) { setSurveyOptions([]); return; }
    const t = setTimeout(() => {
      fetchSurveyOptions(district, taluka, v).then(setSurveyOptions);
    }, 600);
    return () => clearTimeout(t);
  }, [district, taluka, village]);

  // Load districts on mount
  useEffect(() => {
    setLoadingDistricts(true);
    fetch(`${API_BASE_URL}/options/districts`)
      .then(r => r.json())
      .then(d => setDistricts(d.districts || []))
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, []);

  // Load talukas when district changes
  useEffect(() => {
    if (!district) { setTalukas([]); setTaluka(''); setVillages([]); return; }
    setLoadingTalukas(true);
    setTaluka(''); setVillages([]);
    fetch(`${API_BASE_URL}/options/talukas?district=${encodeURIComponent(district)}`)
      .then(r => r.json())
      .then(d => {
        setTalukas(d.talukas || []);
        // ── DEMO MODE ── finish a pending sample-chip fill
        if (pendingTaluka.current && (d.talukas || []).includes(pendingTaluka.current)) {
          setTaluka(pendingTaluka.current);
        }
        pendingTaluka.current = null;
      })
      .catch(() => setTalukas([]))
      .finally(() => setLoadingTalukas(false));
  }, [district]);

  // Clear stale suggestions when taluka changes (village stays free-typed)
  useEffect(() => {
    setVillages([]);
    setVillageError(false);
  }, [district, taluka]);

  // OPTIONAL enhancement: fetch live village suggestions from AnyROR (~20s).
  // The village text input works without this — the backend fuzzy-matches
  // free-typed English names against the live AnyROR dropdown.
  const loadVillageSuggestions = () => {
    if (!district || !taluka || loadingVillages) return;
    setLoadingVillages(true);
    setVillageError(false);
    fetch(`${API_BASE_URL}/options/villages?district=${encodeURIComponent(district)}&taluka=${encodeURIComponent(taluka)}`,
      { headers: demoHeaders() }) // demo mode: instant fixture list
      .then(r => r.json())
      .then(d => {
        const list: Village[] = d.villages || [];
        setVillages(list);
        if (list.length === 0) setVillageError(true);
      })
      .catch(() => setVillageError(true))
      .finally(() => setLoadingVillages(false));
  };

  const isOwnerSearch = recordType === 'OWNER_NAME' || recordType === 'OTHER_LANG';
  const surveyLabel = isOwnerSearch ? 'Owner Name' :
    recordType === 'VF8A' ? 'Khata No.' :
    recordType === 'VF6' || recordType === 'OLD_SCAN_6' ? 'Entry No.' :
    'Survey / Block No. (સર્વે નંબર)';

  const isFormValid = district && taluka && village.trim() && surveyNo.trim();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    // Credit gate: if payments are enabled on the backend and the user has
    // no credits, send them to the pricing page first. Demo sessions skip
    // the gate — the backend never charges credits for demo jobs.
    const email = getUserEmail();
    if (email && !isDemoActive()) {
      const info = await fetchCredits(email);
      if (info?.payments_enabled && info.credits <= 0) {
        window.location.href = '/pricing';
        return;
      }
    }
    // If the typed name matches a loaded suggestion, send its Gujarati name
    // (exact AnyROR match). Otherwise send the free-typed English name — the
    // backend scraper fuzzy-matches it against the live AnyROR dropdown.
    const typed = village.trim();
    const villageObj = villages.find(v => v.english.toLowerCase() === typed.toLowerCase());
    const villageParam = villageObj ? villageObj.gujarati : typed;
    window.location.href =
      `/property/SURVEY-${encodeURIComponent(surveyNo.trim())}` +
      `?district=${encodeURIComponent(district)}` +
      `&taluka=${encodeURIComponent(taluka)}` +
      `&village=${encodeURIComponent(villageParam)}` +
      `&record_type=${recordType}`;
  };

  const selectCls = "input appearance-none cursor-pointer pr-9";
  const inputCls  = "input";

  return (
    <div className="card w-full p-6 sm:p-7 flex flex-col gap-5 shadow-lg">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-ink">Check a land title</h2>
        <p className="text-sm text-muted">Official 7/12 record, in English, with risk analysis.</p>
      </div>

      {/* ── DEMO MODE ── one-click sample parcels (fixtures in backend/demo.py) */}
      {demoActive && (
        <div className="flex flex-col gap-2 -mt-1">
          <span className="text-xs font-medium text-warning flex items-center gap-1.5">
            <FlaskConical size={12} /> Demo samples — click to fill the form
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_SAMPLES.map(s => (
              <button
                key={s.survey + s.village}
                type="button"
                onClick={() => applyDemoSample(s)}
                className="badge bg-warning-soft text-warning border border-warning-border hover:border-warning transition-colors cursor-pointer"
                title={`${s.village}, ${s.taluka}, ${s.district} — Survey ${s.survey}`}
              >
                {s.label} <span className="font-normal opacity-75">{s.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="flex flex-col gap-4">

        {/* Record Type */}
        <div className="flex flex-col gap-1.5">
          <label className="label">Record type</label>
          <div className="relative">
            <select value={recordType} onChange={e => setRecordType(e.target.value)} className={selectCls}>
              {RECORD_TYPES.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* District */}
          <div className="flex flex-col gap-1.5">
            <label className="label">District (જીલ્લો)</label>
            <div className="relative">
              <select value={district} onChange={e => setDistrict(e.target.value)}
                className={selectCls} disabled={loadingDistricts}>
                <option value="">
                  {loadingDistricts ? 'Loading…' : 'Select district'}
                </option>
                {districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {loadingDistricts
                ? <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand animate-spin pointer-events-none" />
                : <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />}
            </div>
          </div>

          {/* Taluka */}
          <div className="flex flex-col gap-1.5">
            <label className="label">Taluka (તાલુકો)</label>
            <div className="relative">
              <select value={taluka} onChange={e => setTaluka(e.target.value)}
                className={selectCls} disabled={!district || loadingTalukas}>
                <option value="">
                  {!district ? 'Select district first' : loadingTalukas ? 'Loading…' : 'Select taluka'}
                </option>
                {talukas.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {loadingTalukas
                ? <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand animate-spin pointer-events-none" />
                : <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />}
            </div>
          </div>
        </div>

        {/* Village — free text input (English or Gujarati works; backend fuzzy-matches) */}
        <div className="flex flex-col gap-1.5">
          <label className="label flex items-center gap-2">
            Village (ગામ)
            {loadingVillages && <span className="text-brand text-xs font-normal">fetching from AnyROR…</span>}
          </label>
          <input
            type="text"
            value={village}
            onChange={e => setVillage(e.target.value)}
            placeholder="e.g. Navrangpura, Vejalpur, Bopal"
            list="sw-village-suggestions"
            className={inputCls}
          />
          <datalist id="sw-village-suggestions">
            {villages.map(v => (
              <option key={v.gujarati} value={v.english} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={loadVillageSuggestions}
            disabled={!district || !taluka || loadingVillages}
            className="text-left text-xs text-brand hover:text-brand-strong underline underline-offset-2 decoration-brand/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 w-fit"
          >
            {loadingVillages
              ? <><Loader2 size={11} className="animate-spin" /> Loading suggestions from AnyROR…</>
              : villages.length > 0
                ? <>↻ Reload suggestions ({villages.length} villages loaded)</>
                : <>Load village suggestions from AnyROR (takes ~20s)</>}
          </button>
          {villageError && (
            <p className="text-muted text-xs leading-relaxed">Could not load suggestions — just type your village name above (English works fine).</p>
          )}
          {loadingVillages && (
            <p className="text-faint text-xs leading-relaxed">Reading the live AnyROR village list — cached after first load. You can also just type the name and search now.</p>
          )}
        </div>

        {/* Survey / Khata / Owner */}
        <div className="flex flex-col gap-1.5">
          <label className="label">{surveyLabel}</label>
          <input
            type="text"
            value={surveyNo}
            onChange={e => setSurveyNo(e.target.value)}
            placeholder={isOwnerSearch ? 'Enter owner name' : 'e.g. 123'}
            list={!isOwnerSearch && surveyOptions.length > 0 ? 'sw-survey-suggestions' : undefined}
            className={`${inputCls} font-mono`}
          />
          {!isOwnerSearch && surveyOptions.length > 0 && (
            <datalist id="sw-survey-suggestions">
              {surveyOptions.map(s => <option key={s} value={s} />)}
            </datalist>
          )}
          {!isOwnerSearch && (
            surveyOptions.length > 0
              ? <p className="text-success text-xs leading-relaxed">✓ {surveyOptions.length} verified survey numbers known for this village — start typing to see them</p>
              : <p className="text-faint text-xs leading-relaxed">Common formats: 123, 123/1, 123 P, 45 A — check AnyROR for exact format</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className="btn btn-primary w-full h-12 text-base mt-1"
        >
          <Search size={16} /> Check this title
        </button>
        {config?.payments_enabled && (
          <div className="flex items-center justify-center gap-2 text-xs text-success bg-success-soft border border-success-border rounded-lg px-3 py-2">
            <Gift size={12} /> {config.free_trial_credits} free search{config.free_trial_credits === 1 ? '' : 'es'} for new users — no card needed
          </div>
        )}
        <p className="text-faint text-xs leading-relaxed text-center">
          The search starts automatically on the next page.
          First search can take 2–3 minutes; repeat searches return instantly from cache.
        </p>
      </form>
    </div>
  );
}
