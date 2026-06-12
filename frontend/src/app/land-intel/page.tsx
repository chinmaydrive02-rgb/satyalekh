"use client";

// Land Intel — HydraLakes-style "Know Your Land": draw any parcel on the
// satellite map → instant area in Indian units → AI land report from open
// geo-data + Gemini. Works for ANY location (no land records needed).

import React, { useRef, useState, useMemo, useCallback } from 'react';
import Mapbox, { Source, Layer, MapRef, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import TopNav from '@/components/TopNav';
import { API_BASE_URL } from '@/lib/api';
import { Ruler, Sparkles, Trash2, Undo2, Loader2, Printer, Search, MapPin, AlertTriangle, Droplets, Mountain, CloudRain, Route, Scale, TrendingUp, Landmark } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  'pk.eyJ1IjoiY2hpbm1heTEyMDYiLCJhIjoiY21rOW5neGw3MXF1MjNkc2M2NTRpaW93dSJ9.Iyf99AosQ3obQDU6JIwFOA';

type LngLat = [number, number];

// Spherical polygon area (m²) — sufficient accuracy for land parcels
function polygonAreaSqm(pts: LngLat[]): number {
  if (pts.length < 3) return 0;
  const R = 6378137;
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const [l1, p1] = pts[i].map(d => (d * Math.PI) / 180);
    const [l2, p2] = pts[(i + 1) % pts.length].map(d => (d * Math.PI) / 180);
    total += (l2 - l1) * (2 + Math.sin(p1) + Math.sin(p2));
  }
  return Math.abs((total * R * R) / 2);
}

function haversine(a: LngLat, b: LngLat): number {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toR, dLng = (b[0] - a[0]) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * toR) * Math.cos(b[1] * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const fmt = (n: number, d = 2) => n.toLocaleString('en-IN', { maximumFractionDigits: d });

export default function LandIntel() {
  const mapRef = useRef<MapRef | null>(null);
  const [points, setPoints] = useState<LngLat[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const area = useMemo(() => polygonAreaSqm(points), [points]);
  const perimeter = useMemo(() => {
    if (points.length < 2) return 0;
    let p = 0;
    for (let i = 0; i < points.length; i++) p += haversine(points[i], points[(i + 1) % points.length]);
    return p;
  }, [points]);

  const centroid = useMemo<LngLat | null>(() => {
    if (!points.length) return null;
    return [points.reduce((s, p) => s + p[0], 0) / points.length,
            points.reduce((s, p) => s + p[1], 0) / points.length];
  }, [points]);

  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: [
      ...(points.length >= 3 ? [{ type: 'Feature' as const, properties: {},
        geometry: { type: 'Polygon' as const, coordinates: [[...points, points[0]]] } }] : []),
      ...(points.length >= 2 ? [{ type: 'Feature' as const, properties: {},
        geometry: { type: 'LineString' as const, coordinates: points } }] : []),
      ...points.map(p => ({ type: 'Feature' as const, properties: {},
        geometry: { type: 'Point' as const, coordinates: p } })),
    ],
  }), [points]);

  const onMapClick = useCallback((e: any) => {
    setPoints(prev => [...prev, [e.lngLat.lng, e.lngLat.lat]]);
    setReport(null);
  }, []);

  const searchPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=IN&limit=1`);
      const data = await res.json();
      const c = data?.features?.[0]?.center;
      if (c) mapRef.current?.flyTo({ center: c, zoom: 15 });
    } catch { /* ignore */ }
  };

  const generateReport = async () => {
    if (!centroid || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/land-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: centroid[1], lng: centroid[0], area_sqm: area, place_hint: query || undefined }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || 'Server error');
      }
      setReport(await res.json());
    } catch (e: any) {
      setError(e.message?.includes('fetch') ? 'Backend warming up (60-90s on free hosting) — try again shortly.' : e.message);
    } finally {
      setLoading(false);
    }
  };

  const sections = report ? [
    { icon: <MapPin size={14}/>, title: 'Location', text: report.report.location_summary },
    { icon: <Mountain size={14}/>, title: 'Soil & Terrain', text: report.report.soil_terrain },
    { icon: <Droplets size={14}/>, title: 'Water & Flood Risk', text: report.report.water_flood_risk },
    { icon: <CloudRain size={14}/>, title: 'Climate', text: report.report.climate },
    { icon: <Route size={14}/>, title: 'Connectivity', text: report.report.connectivity },
    { icon: <Scale size={14}/>, title: 'Land Use & Zoning', text: report.report.land_use_zoning },
    { icon: <TrendingUp size={14}/>, title: 'Market Outlook', text: report.report.market_outlook },
    { icon: <Landmark size={14}/>, title: 'Legal Checks', text: report.report.legal_notes },
  ] : [];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] pt-[60px] relative">
      <TopNav />
      <div className="flex flex-col lg:flex-row h-[calc(100vh-60px)]">

        {/* Map */}
        <div className="relative flex-1 min-h-[50vh]">
          <Mapbox
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{ longitude: 72.5066, latitude: 23.0339, zoom: 12 }}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            onClick={onMapClick}
            cursor="crosshair"
          >
            <NavigationControl position="bottom-right" />
            <GeolocateControl position="bottom-right" />
            <Source id="draw" type="geojson" data={geojson as any}>
              <Layer id="draw-fill" type="fill" filter={['==', '$type', 'Polygon']}
                paint={{ 'fill-color': '#00f0ff', 'fill-opacity': 0.15 }} />
              <Layer id="draw-line" type="line" filter={['!=', '$type', 'Point']}
                paint={{ 'line-color': '#00f0ff', 'line-width': 2 }} />
              <Layer id="draw-pts" type="circle" filter={['==', '$type', 'Point']}
                paint={{ 'circle-radius': 4, 'circle-color': '#00f0ff', 'circle-stroke-color': '#002022', 'circle-stroke-width': 1.5 }} />
            </Source>
          </Mapbox>

          {/* Search + draw controls */}
          <div className="absolute top-3 left-3 right-3 sm:right-auto sm:w-[360px] flex flex-col gap-2 print:hidden">
            <form onSubmit={searchPlace} className="flex gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search place — e.g. Shela, Ahmedabad"
                className="flex-1 bg-[#0a0a0a]/90 backdrop-blur border border-[#3b494b] text-[#dbfcff] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#00f0ff]" />
              <button type="submit" className="px-3 bg-[#00f0ff] text-[#002022]"><Search size={14}/></button>
            </form>
            <div className="flex gap-2">
              <button onClick={() => { setPoints(p => p.slice(0, -1)); setReport(null); }}
                className="flex-1 py-2 bg-[#0a0a0a]/90 backdrop-blur border border-[#3b494b] text-[#849495] text-[10px] font-bold uppercase tracking-widest hover:text-[#dbfcff] flex items-center justify-center gap-1.5">
                <Undo2 size={12}/> Undo
              </button>
              <button onClick={() => { setPoints([]); setReport(null); }}
                className="flex-1 py-2 bg-[#0a0a0a]/90 backdrop-blur border border-[#3b494b] text-[#849495] text-[10px] font-bold uppercase tracking-widest hover:text-[#ba1b24] flex items-center justify-center gap-1.5">
                <Trash2 size={12}/> Clear
              </button>
            </div>
            {points.length < 3 && (
              <div className="bg-[#0a0a0a]/90 backdrop-blur border border-[#00f0ff]/30 px-3 py-2 text-[10px] text-[#00f0ff]">
                Tap the map to drop boundary points around your land ({points.length}/3 minimum)
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-[420px] border-l border-[#3b494b]/40 bg-[#111]/95 overflow-y-auto p-5 flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-display uppercase tracking-tight text-[#00f0ff]">Land Intel</h1>
            <p className="text-[10px] text-[#849495] uppercase tracking-[0.2em] mt-1">Draw · Measure · AI Report — anywhere in India</p>
          </div>

          {/* Measurements */}
          <div className="glass-panel border border-[#3b494b]/40 p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#849495] mb-3 flex items-center gap-2"><Ruler size={13}/> Measurements</h2>
            {area > 0 ? (
              <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                <div><span className="text-[#3b494b] text-[9px] uppercase block">Sq Metres</span><span className="text-[#dbfcff]">{fmt(area, 0)}</span></div>
                <div><span className="text-[#3b494b] text-[9px] uppercase block">Sq Yards</span><span className="text-[#dbfcff]">{fmt(area * 1.19599, 0)}</span></div>
                <div><span className="text-[#3b494b] text-[9px] uppercase block">Acres</span><span className="text-[#4edea3]">{fmt(area / 4046.86, 3)}</span></div>
                <div><span className="text-[#3b494b] text-[9px] uppercase block">Hectares</span><span className="text-[#dbfcff]">{fmt(area / 10000, 3)}</span></div>
                <div><span className="text-[#3b494b] text-[9px] uppercase block">Guntha</span><span className="text-[#dbfcff]">{fmt(area / 101.17, 2)}</span></div>
                <div><span className="text-[#3b494b] text-[9px] uppercase block">Bigha (Guj.)</span><span className="text-[#dbfcff]">{fmt(area / 1618.74, 3)}</span></div>
                <div className="col-span-2"><span className="text-[#3b494b] text-[9px] uppercase block">Perimeter</span><span className="text-[#dbfcff]">{fmt(perimeter, 0)} m</span></div>
              </div>
            ) : (
              <p className="text-[10px] text-[#3b494b]">Draw at least 3 points on the map to measure your plot.</p>
            )}
          </div>

          {/* Generate */}
          <button onClick={generateReport} disabled={!centroid || loading}
            className="w-full py-4 bg-gradient-to-r from-[#0bd9e4] to-[#00f0ff] text-[#002022] text-sm font-bold tracking-[0.15em] uppercase hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 print:hidden">
            {loading ? <><Loader2 size={15} className="animate-spin"/> Analysing…</> : <><Sparkles size={15}/> Generate AI Land Report</>}
          </button>
          {loading && <p className="text-[9px] text-[#3b494b] text-center -mt-3">Fetching elevation + rainfall data, composing report (~15-30s)…</p>}
          {error && <div className="text-[10px] font-mono text-[#ba1b24] px-3 py-2 border border-[#ba1b24]/40 bg-[#ba1b24]/5">{error}</div>}

          {/* Report */}
          {report && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-[10px] font-mono text-[#849495]">
                  {report.elevation_m != null && <span>⛰ {fmt(report.elevation_m, 0)}m elev</span>}
                  {report.annual_rain_mm != null && <span>🌧 {fmt(report.annual_rain_mm, 0)}mm/yr</span>}
                </div>
                <button onClick={() => window.print()} className="text-[#00f0ff] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-[#dbfcff] print:hidden">
                  <Printer size={12}/> Print
                </button>
              </div>

              {/* Suitability */}
              {report.report.suitability && (
                <div className="grid grid-cols-3 gap-2">
                  {(['agriculture', 'residential', 'commercial'] as const).map(k => (
                    <div key={k} className="glass-panel border border-[#3b494b]/40 p-3 text-center">
                      <div className="text-2xl font-display text-[#00f0ff]">{report.report.suitability[k]}<span className="text-[10px] text-[#3b494b]">/10</span></div>
                      <div className="text-[8px] uppercase tracking-widest text-[#849495] mt-1">{k}</div>
                    </div>
                  ))}
                </div>
              )}

              {sections.map((s, i) => s.text && (
                <div key={i} className="glass-panel border border-[#3b494b]/40 p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00f0ff] mb-1.5 flex items-center gap-2">{s.icon} {s.title}</h3>
                  <p className="text-[11px] text-[#b8c8c9] leading-relaxed">{s.text}</p>
                </div>
              ))}

              {Array.isArray(report.report.red_flags) && report.report.red_flags.length > 0 && (
                <div className="glass-panel border border-[#ba1b24]/40 bg-[#ba1b24]/5 p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#ba1b24] mb-2 flex items-center gap-2"><AlertTriangle size={13}/> Red Flags</h3>
                  <ul className="flex flex-col gap-1.5">
                    {report.report.red_flags.map((f: string, i: number) => (
                      <li key={i} className="text-[11px] text-[#b8c8c9] leading-relaxed flex gap-2"><span className="text-[#ba1b24]">▸</span>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              <a href={`/?d=1`} className="text-center text-[10px] text-[#4edea3] border border-[#4edea3]/30 bg-[#4edea3]/5 px-3 py-2.5 hover:bg-[#4edea3]/10 transition-colors">
                Have the survey number? Run a full Title Clearance check on the official 7/12 record →
              </a>
              <p className="text-[8px] text-[#3b494b] leading-relaxed">
                AI-composed from open geo-data (Open-Meteo) and regional knowledge — indicative only, verify before transacting. Free during beta.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
