"use client";

import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Loader2, Gift } from 'lucide-react';
import { API_BASE_URL, getUserEmail, fetchCredits, fetchConfig, fetchSurveyOptions, AppConfig } from '@/lib/api';

const RECORD_TYPES = [
  { value: 'OLD_SCAN_712', label: 'Old Scanned 7/12 (VF-7/12)' },
  { value: 'VF7',          label: 'VF-7 Survey No Details' },
  { value: 'VF8A',         label: 'VF-8A Khata Details' },
  { value: 'VF6',          label: 'VF-6 Entry Details' },
  { value: 'INTEGRATED',   label: 'Integrated Survey Details' },
  { value: 'OWNER_NAME',   label: 'Search by Owner Name' },
];

interface Village { english: string; gujarati: string; }

export default function SearchWidget({ onPlotSelect }: { onPlotSelect: (plot: any) => void }) {
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
      .then(d => setTalukas(d.talukas || []))
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
    fetch(`${API_BASE_URL}/options/villages?district=${encodeURIComponent(district)}&taluka=${encodeURIComponent(taluka)}`)
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
    // no credits, send them to the pricing page first.
    const email = getUserEmail();
    if (email) {
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
      `/property/SURVEY-${surveyNo.trim()}` +
      `?district=${encodeURIComponent(district)}` +
      `&taluka=${encodeURIComponent(taluka)}` +
      `&village=${encodeURIComponent(villageParam)}` +
      `&record_type=${recordType}`;
  };

  const selectCls = "w-full px-4 py-3 bg-[#1c1b1b] border-b-2 border-[#3b494b] text-[#dbfcff] text-sm font-mono focus:outline-none focus:border-[#00f0ff] transition-colors appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
  const inputCls  = "w-full px-4 py-3 bg-[#1c1b1b] border-b-2 border-[#3b494b] text-[#dbfcff] text-sm font-mono focus:outline-none focus:border-[#00f0ff] transition-colors placeholder:text-[#3b494b]";

  return (
    <div className="glass-panel w-full max-w-[340px] sm:w-[320px] p-5 sm:p-6 flex flex-col gap-5 max-h-[calc(100vh-100px)] overflow-y-auto">
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-[#dbfcff] font-display font-medium text-[28px] uppercase tracking-tight leading-none">Satya-Lekh</h1>
        <span className="text-[#00f0ff] uppercase tracking-[0.2em] text-[10px] font-bold">Title Intelligence HUD</span>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-[#00f0ff] to-transparent opacity-40" />

      <form onSubmit={handleSearch} className="flex flex-col gap-4">

        {/* Record Type */}
        <div className="flex flex-col gap-2">
          <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">Record Type</label>
          <div className="relative">
            <select value={recordType} onChange={e => setRecordType(e.target.value)}
              className={selectCls} style={{ backgroundColor: '#1c1b1b' }}>
              {RECORD_TYPES.map(rt => (
                <option key={rt.value} value={rt.value} style={{ backgroundColor: '#1c1b1b' }}>{rt.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b494b] pointer-events-none" />
          </div>
        </div>

        {/* District */}
        <div className="flex flex-col gap-2">
          <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">District (જીલ્લો)</label>
          <div className="relative">
            <select value={district} onChange={e => setDistrict(e.target.value)}
              className={selectCls} disabled={loadingDistricts} style={{ backgroundColor: '#1c1b1b' }}>
              <option value="" style={{ backgroundColor: '#1c1b1b' }}>
                {loadingDistricts ? 'Loading...' : '— Select District —'}
              </option>
              {districts.map(d => (
                <option key={d} value={d} style={{ backgroundColor: '#1c1b1b' }}>{d}</option>
              ))}
            </select>
            {loadingDistricts
              ? <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00f0ff] animate-spin pointer-events-none" />
              : <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b494b] pointer-events-none" />}
          </div>
        </div>

        {/* Taluka */}
        <div className="flex flex-col gap-2">
          <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">Taluka (તાલુકો)</label>
          <div className="relative">
            <select value={taluka} onChange={e => setTaluka(e.target.value)}
              className={selectCls} disabled={!district || loadingTalukas} style={{ backgroundColor: '#1c1b1b' }}>
              <option value="" style={{ backgroundColor: '#1c1b1b' }}>
                {!district ? '— Select District First —' : loadingTalukas ? 'Loading...' : '— Select Taluka —'}
              </option>
              {talukas.map(t => (
                <option key={t} value={t} style={{ backgroundColor: '#1c1b1b' }}>{t}</option>
              ))}
            </select>
            {loadingTalukas
              ? <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00f0ff] animate-spin pointer-events-none" />
              : <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b494b] pointer-events-none" />}
          </div>
        </div>

        {/* Village — free text input (English or Gujarati works; backend fuzzy-matches) */}
        <div className="flex flex-col gap-2">
          <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
            Village (ગામ)
            {loadingVillages && <span className="text-[#00f0ff] text-[9px] font-normal normal-case tracking-normal">fetching from AnyROR…</span>}
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
            className="text-left text-[9px] text-[#00f0ff]/80 hover:text-[#00f0ff] underline underline-offset-2 decoration-[#00f0ff]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 w-fit"
          >
            {loadingVillages
              ? <><Loader2 size={9} className="animate-spin" /> Loading suggestions from AnyROR…</>
              : villages.length > 0
                ? <>↻ Reload suggestions ({villages.length} villages loaded)</>
                : <>Load village suggestions from AnyROR (takes ~20s)</>}
          </button>
          {villageError && (
            <p className="text-[#849495] text-[9px] leading-relaxed">Could not load suggestions — just type your village name above (English works fine).</p>
          )}
          {loadingVillages && (
            <p className="text-[#3b494b] text-[9px] leading-relaxed">Launching headless browser → navigating AnyROR → reading real village list. Cached after first load. You can also just type the name and search now.</p>
          )}
        </div>

        {/* Survey / Khata / Owner */}
        <div className="flex flex-col gap-2">
          <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">{surveyLabel}</label>
          <input
            type="text"
            value={surveyNo}
            onChange={e => setSurveyNo(e.target.value)}
            placeholder={isOwnerSearch ? 'Enter owner name' : 'e.g. 123'}
            list={!isOwnerSearch && surveyOptions.length > 0 ? 'sw-survey-suggestions' : undefined}
            className={inputCls}
          />
          {!isOwnerSearch && surveyOptions.length > 0 && (
            <datalist id="sw-survey-suggestions">
              {surveyOptions.map(s => <option key={s} value={s} />)}
            </datalist>
          )}
          {!isOwnerSearch && (
            surveyOptions.length > 0
              ? <p className="text-[#4edea3] text-[9px] leading-relaxed">✓ {surveyOptions.length} verified survey numbers known for this village — start typing to see them</p>
              : <p className="text-[#3b494b] text-[9px] leading-relaxed">Common formats: 123, 123/1, 123 P, 45 A — check AnyROR for exact format</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className="mt-2 w-full h-[48px] bg-gradient-to-br from-[#0bd9e4] to-[#00f0ff] hover:brightness-110 active:brightness-90 text-[#002022] font-bold text-sm uppercase tracking-[0.15em] transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center justify-center gap-2"><Search size={14} /> Initialize Vector</span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
        {config?.payments_enabled && (
          <div className="flex items-center justify-center gap-2 text-[9px] text-[#4edea3] border border-[#4edea3]/30 bg-[#4edea3]/5 px-3 py-2">
            <Gift size={10} /> {config.free_trial_credits} free search{config.free_trial_credits === 1 ? '' : 'es'} for new users — no card needed
          </div>
        )}
        <p className="text-[#3b494b] text-[9px] leading-relaxed text-center">First search may take 60-90s while the backend warms up.</p>
      </form>
    </div>
  );
}
