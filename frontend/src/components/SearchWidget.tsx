"use client";

import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

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
    if (!district) { setTalukas([]); setTaluka(''); setVillages([]); setVillage(''); return; }
    setLoadingTalukas(true);
    setTaluka(''); setVillages([]); setVillage('');
    fetch(`${API_BASE_URL}/options/talukas?district=${encodeURIComponent(district)}`)
      .then(r => r.json())
      .then(d => setTalukas(d.talukas || []))
      .catch(() => setTalukas([]))
      .finally(() => setLoadingTalukas(false));
  }, [district]);

  // Load villages from AnyROR live (~20s first load, cached after)
  useEffect(() => {
    if (!district || !taluka) { setVillages([]); setVillage(''); return; }
    setLoadingVillages(true);
    setVillage(''); setVillageError(false);
    fetch(`${API_BASE_URL}/options/villages?district=${encodeURIComponent(district)}&taluka=${encodeURIComponent(taluka)}`)
      .then(r => r.json())
      .then(d => {
        const list: Village[] = d.villages || [];
        setVillages(list);
        if (list.length === 0) setVillageError(true);
      })
      .catch(() => setVillageError(true))
      .finally(() => setLoadingVillages(false));
  }, [district, taluka]);

  const isOwnerSearch = recordType === 'OWNER_NAME' || recordType === 'OTHER_LANG';
  const surveyLabel = isOwnerSearch ? 'Owner Name' :
    recordType === 'VF8A' ? 'Khata No.' :
    recordType === 'VF6' || recordType === 'OLD_SCAN_6' ? 'Entry No.' :
    'Survey / Block No. (સર્વે નંબર)';

  const isFormValid = district && taluka && village && surveyNo.trim();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    const villageObj = villages.find(v => v.english === village);
    const villageParam = villageObj ? villageObj.gujarati : village;
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
    <div className="glass-panel w-[320px] p-6 flex flex-col gap-5">
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

        {/* Village */}
        <div className="flex flex-col gap-2">
          <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
            Village (ગામ)
            {loadingVillages && <span className="text-[#00f0ff] text-[9px] font-normal normal-case tracking-normal">fetching from AnyROR…</span>}
          </label>
          <div className="relative">
            <select value={village} onChange={e => setVillage(e.target.value)}
              className={selectCls} disabled={!taluka || loadingVillages} style={{ backgroundColor: '#1c1b1b' }}>
              <option value="" style={{ backgroundColor: '#1c1b1b' }}>
                {!taluka ? '— Select Taluka First —'
                  : loadingVillages ? 'Loading villages (~20s)…'
                  : villageError ? '— Error loading villages —'
                  : villages.length === 0 ? '— No villages found —'
                  : '— Select Village —'}
              </option>
              {villages.map(v => (
                <option key={v.gujarati} value={v.english} style={{ backgroundColor: '#1c1b1b' }}>{v.english}</option>
              ))}
            </select>
            {loadingVillages
              ? <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00f0ff] animate-spin pointer-events-none" />
              : <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b494b] pointer-events-none" />}
          </div>
          {loadingVillages && (
            <p className="text-[#3b494b] text-[9px] leading-relaxed">Launching headless browser → navigating AnyROR → reading real village list. Cached after first load.</p>
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
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className="mt-2 w-full h-[48px] bg-gradient-to-br from-[#0bd9e4] to-[#00f0ff] hover:brightness-110 active:brightness-90 text-[#002022] font-bold text-sm uppercase tracking-[0.15em] transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center justify-center gap-2"><Search size={14} /> Initialize Vector</span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </form>
    </div>
  );
}
