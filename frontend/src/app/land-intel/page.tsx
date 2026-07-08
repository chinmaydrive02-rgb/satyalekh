"use client";

// Land Intel — HydraLakes-style "Know Your Land": draw any parcel on the
// satellite map → instant area in Indian units → AI land report from open
// geo-data + Gemini. Works for ANY location (no land records needed).

import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import Mapbox, { Source, Layer, MapRef, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import { Reveal } from '@/components/motion';
import { API_BASE_URL, demoHeaders, isDemoActive } from '@/lib/api';
import { analyzeInfra, METRO_STATIONS, InfraIntel } from '@/lib/ahmedabadInfra';
import { Ruler, Trash2, Undo2, Loader2, Printer, Search, MapPin, AlertTriangle, Droplets, Mountain, CloudRain, Route, Scale, TrendingUp, Landmark, TrainFront, FileSignature, Building2, FileText, FlaskConical } from 'lucide-react';

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
  const [placeName, setPlaceName] = useState('');
  const [refNo] = useState(() => `SL-${Date.now().toString(36).toUpperCase()}`);
  const [demoActive, setDemoActive] = useState(false);

  // ── DEMO MODE ── seed a sample parcel (Navrangpura) so the "Generate
  // Report" flow is one click away and always reaches the seeded fixture.
  useEffect(() => {
    if (!isDemoActive()) return;
    setDemoActive(true);
    setPoints([
      [72.5610, 23.0380],
      [72.5628, 23.0380],
      [72.5628, 23.0366],
      [72.5610, 23.0366],
    ]);
    setPlaceName('Navrangpura, Ahmedabad, Gujarat');
    setQuery('Navrangpura, Ahmedabad');
  }, []);

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

  // Deterministic infrastructure analysis (metro/airport/rail/lakes/corridors)
  const infra = useMemo<InfraIntel | null>(
    () => (centroid && points.length >= 3 ? analyzeInfra(centroid[0], centroid[1]) : null),
    [centroid, points.length]);

  // Auto reverse-geocode the parcel so the report is anchored to the real
  // locality (coordinates alone are unreliable for narrative analysis)
  useEffect(() => {
    if (!centroid || points.length < 3) { setPlaceName(''); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${centroid[0]},${centroid[1]}.json?access_token=${MAPBOX_TOKEN}&types=locality,place,neighborhood,address&limit=1`);
        const data = await res.json();
        setPlaceName(data?.features?.[0]?.place_name || '');
      } catch { /* non-fatal */ }
    }, 500);
    return () => clearTimeout(t);
  }, [centroid?.[0], centroid?.[1], points.length]);

  const metroGeojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: METRO_STATIONS.map(s => ({
      type: 'Feature' as const, properties: { name: s.name },
      geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] },
    })),
  }), []);

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
        headers: { 'Content-Type': 'application/json', ...demoHeaders() },
        body: JSON.stringify({
          lat: centroid[1], lng: centroid[0], area_sqm: area,
          place_hint: placeName || query || undefined,
          verified_facts: infra?.factsText || undefined,
        }),
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
    { icon: <MapPin size={14}/>, title: 'Location & Situation', text: report.report.location_summary },
    { icon: <Mountain size={14}/>, title: 'Soil & Terrain', text: report.report.soil_terrain },
    { icon: <Droplets size={14}/>, title: 'Water & Flood Risk', text: report.report.water_flood_risk },
    { icon: <CloudRain size={14}/>, title: 'Climate', text: report.report.climate },
    { icon: <Route size={14}/>, title: 'Connectivity & Access', text: report.report.connectivity },
    { icon: <Scale size={14}/>, title: 'Land Use & Zoning', text: report.report.land_use_zoning },
    { icon: <Building2 size={14}/>, title: 'Development Potential', text: report.report.development_potential },
    { icon: <TrendingUp size={14}/>, title: 'Market Outlook', text: report.report.market_outlook },
    { icon: <Landmark size={14}/>, title: 'Statutory Verifications Required', text: report.report.legal_notes },
  ] : [];

  const allRedFlags: string[] = [
    ...(infra?.redFlags || []),
    ...((report && Array.isArray(report.report.red_flags)) ? report.report.red_flags : []),
  ];

  return (
    <main className="min-h-screen bg-bg text-ink pt-16 relative">
      <TopNav />
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">

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
            <Source id="metro" type="geojson" data={metroGeojson as any}>
              <Layer id="metro-pts" type="circle"
                paint={{ 'circle-radius': 3.5, 'circle-color': '#f59e0b', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1 }} />
            </Source>
            <Source id="draw" type="geojson" data={geojson as any}>
              <Layer id="draw-fill" type="fill" filter={['==', '$type', 'Polygon']}
                paint={{ 'fill-color': '#2dd4bf', 'fill-opacity': 0.18 }} />
              <Layer id="draw-line" type="line" filter={['!=', '$type', 'Point']}
                paint={{ 'line-color': '#2dd4bf', 'line-width': 2 }} />
              <Layer id="draw-pts" type="circle" filter={['==', '$type', 'Point']}
                paint={{ 'circle-radius': 4, 'circle-color': '#2dd4bf', 'circle-stroke-color': '#115e59', 'circle-stroke-width': 1.5 }} />
            </Source>
          </Mapbox>

          {/* Search + draw controls */}
          <div className="absolute top-3 left-3 right-3 sm:right-auto sm:w-[360px] flex flex-col gap-2 print:hidden">
            <form onSubmit={searchPlace} className="flex gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search place — e.g. Shela, Ahmedabad"
                className="input flex-1 shadow-md" />
              <button type="submit" className="btn btn-primary px-3.5 shadow-md"><Search size={15}/></button>
            </form>
            <div className="flex gap-2">
              <button onClick={() => { setPoints(p => p.slice(0, -1)); setReport(null); }}
                className="btn btn-outline flex-1 py-2 text-sm shadow-md">
                <Undo2 size={13}/> Undo
              </button>
              <button onClick={() => { setPoints([]); setReport(null); }}
                className="btn btn-outline flex-1 py-2 text-sm shadow-md hover:text-danger hover:border-danger-border">
                <Trash2 size={13}/> Clear
              </button>
            </div>
            {points.length < 3 && (
              <div className="card px-3 py-2.5 text-sm text-ink-soft shadow-md">
                Tap the map to drop boundary points around your land ({points.length}/3 minimum)
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-[420px] border-l border-border bg-surface overflow-y-auto p-5 flex flex-col gap-5">
          <Reveal>
            <div>
              <p className="eyebrow mb-1">Land Intel</p>
              <h1 className="text-2xl font-bold text-ink">Draw · Measure · Assess</h1>
              <p className="text-sm text-muted mt-1">Due diligence for any parcel in India — no land records needed.</p>
            </div>
          </Reveal>

          {demoActive && (
            <div className="text-xs text-warning bg-warning-soft border border-warning-border rounded-lg px-3 py-2 flex items-start gap-2">
              <FlaskConical size={13} className="mt-0.5 shrink-0" />
              <span>Demo mode — a sample Navrangpura parcel is pre-drawn. Just hit <span className="font-semibold">Generate Due Diligence Report</span> to see a seeded assessment.</span>
            </div>
          )}

          {/* Measurements */}
          <Reveal delay={90}>
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2"><Ruler size={14} className="text-brand"/> Measurements</h2>
            {area > 0 ? (
              <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                <div><span className="eyebrow block">Sq Metres</span><span className="text-ink">{fmt(area, 0)}</span></div>
                <div><span className="eyebrow block">Sq Yards</span><span className="text-ink">{fmt(area * 1.19599, 0)}</span></div>
                <div><span className="eyebrow block">Acres</span><span className="text-success font-semibold">{fmt(area / 4046.86, 3)}</span></div>
                <div><span className="eyebrow block">Hectares</span><span className="text-ink">{fmt(area / 10000, 3)}</span></div>
                <div><span className="eyebrow block">Guntha</span><span className="text-ink">{fmt(area / 101.17, 2)}</span></div>
                <div><span className="eyebrow block">Bigha (Guj.)</span><span className="text-ink">{fmt(area / 1618.74, 3)}</span></div>
                <div className="col-span-2"><span className="eyebrow block">Perimeter</span><span className="text-ink">{fmt(perimeter, 0)} m</span></div>
              </div>
            ) : (
              <p className="text-sm text-muted">Draw at least 3 points on the map to measure your plot.</p>
            )}
          </div>
          </Reveal>

          {/* Resolved locality */}
          {placeName && (
            <div className="text-sm text-success border border-success-border bg-success-soft rounded-lg px-3 py-2 flex items-start gap-2">
              <MapPin size={13} className="mt-0.5 shrink-0"/> {placeName}
            </div>
          )}

          {/* Deterministic infrastructure & transit analysis */}
          {infra?.inCoverage && infra.rows.length > 0 && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2"><TrainFront size={14} className="text-brand"/> Infrastructure &amp; Transit</h2>
              <div className="flex flex-col gap-2">
                {infra.rows.map((r, i) => (
                  <div key={i} className="flex justify-between gap-3 text-sm border-b border-border pb-1.5">
                    <span className="text-muted">{r.label}</span>
                    <span className={`font-mono text-right ${r.flag === 'good' ? 'text-success' : r.flag === 'warn' ? 'text-warning' : r.flag === 'bad' ? 'text-danger' : 'text-ink'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-faint mt-2">Measured from parcel centroid · indicative positions (±300 m) · metro stations shown as amber dots on map</p>
            </div>
          )}

          {/* Generate */}
          <button onClick={generateReport} disabled={!centroid || loading}
            className="btn btn-primary w-full py-3.5 print:hidden">
            {loading ? <><Loader2 size={15} className="animate-spin"/> Preparing Report…</> : <><FileText size={15}/> Generate Due Diligence Report</>}
          </button>
          {loading && <p className="text-xs text-faint text-center -mt-3">Surveying parcel parameters and compiling the assessment (~20-40s)…</p>}
          {error && <div className="text-sm text-danger px-3 py-2 rounded-lg border border-danger-border bg-danger-soft">{error}</div>}

          {/* Report */}
          {report && (
            <div className="flex flex-col gap-3">
              {/* Formal report header */}
              <div
                className="sl-anim card p-4 bg-surface-soft/60"
                style={{ animation: 'sl-fade-up 0.45s cubic-bezier(0.22,0.61,0.36,1) both' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-ink">Preliminary Land Due Diligence Report</h2>
                    <p className="text-xs font-mono text-muted mt-1">
                      Ref {refNo} · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · Satya-Lekh
                    </p>
                  </div>
                  <button onClick={() => window.print()} className="text-brand text-xs font-semibold flex items-center gap-1 hover:text-brand-strong print:hidden shrink-0">
                    <Printer size={12}/> Print
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs font-mono text-muted">
                  <span>Coordinates: {centroid ? `${centroid[1].toFixed(5)}, ${centroid[0].toFixed(5)}` : '—'}</span>
                  <span>Extent: {fmt(area / 4046.86, 2)} acres</span>
                  {report.elevation_m != null && <span>Elevation: {fmt(report.elevation_m, 0)} m AMSL</span>}
                  {report.annual_rain_mm != null && <span>Annual precipitation: {fmt(report.annual_rain_mm, 0)} mm</span>}
                </div>
              </div>

              {report.report.executive_summary && (
                <div
                  className="sl-anim card border-l-4 border-l-brand p-4"
                  style={{ animation: 'sl-fade-up 0.45s cubic-bezier(0.22,0.61,0.36,1) 60ms both' }}
                >
                  <h3 className="text-xs font-semibold text-brand mb-1.5 uppercase tracking-wide">Executive Summary</h3>
                  <p className="text-sm text-ink-soft leading-relaxed">{report.report.executive_summary}</p>
                </div>
              )}

              {/* Suitability */}
              {report.report.suitability && (
                <div className="grid grid-cols-3 gap-2">
                  {(['agriculture', 'residential', 'commercial'] as const).map((k, ki) => (
                    <div
                      key={k}
                      className="sl-anim card p-3 text-center"
                      style={{ animation: `sl-fade-up 0.45s cubic-bezier(0.22,0.61,0.36,1) ${120 + ki * 70}ms both` }}
                    >
                      <div className="text-2xl font-bold font-mono text-brand">{report.report.suitability[k]}<span className="text-xs text-faint">/10</span></div>
                      <div className="eyebrow mt-1">{k}</div>
                    </div>
                  ))}
                </div>
              )}

              {sections.map((s, i) => s.text && (
                <div
                  key={i}
                  className="sl-anim card p-4"
                  style={{ animation: `sl-slide-in 0.5s cubic-bezier(0.22,0.61,0.36,1) ${Math.min(180 + i * 60, 500)}ms both` }}
                >
                  <h3 className="text-xs font-semibold text-brand mb-1.5 uppercase tracking-wide flex items-center gap-2">{s.icon} {s.title}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed">{s.text}</p>
                </div>
              ))}

              {allRedFlags.length > 0 && (
                <div className="card border-danger-border bg-danger-soft/50 p-4">
                  <h3 className="text-xs font-semibold text-danger mb-2 uppercase tracking-wide flex items-center gap-2"><AlertTriangle size={13}/> Matters Requiring Attention</h3>
                  <ul className="flex flex-col gap-1.5">
                    {allRedFlags.map((f: string, i: number) => (
                      <li key={i} className="text-sm text-ink-soft leading-relaxed flex gap-2"><span className="text-danger">▸</span>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Certified report upsell */}
              <div className="card border-warning-border bg-warning-soft/50 p-4 print:hidden">
                <h3 className="text-xs font-semibold text-warning mb-1.5 uppercase tracking-wide flex items-center gap-2"><FileSignature size={13}/> Advocate-Certified Report</h3>
                <p className="text-sm text-ink-soft leading-relaxed mb-3">
                  Need this opinion stamped and signed for a bank, court, or transaction? Our empanelled
                  advocate reviews the parcel against the official 7/12 record, index-2 and encumbrance
                  search, and issues a certified due-diligence report on letterhead.
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-bold text-warning">₹4,999 <span className="text-xs text-muted font-normal">· 48 hrs</span></span>
                  <Link href="/contact" className="btn btn-primary py-2 px-4 text-sm">Request Certification</Link>
                </div>
              </div>

              <Link href="/" className="text-center text-sm text-success border border-success-border bg-success-soft rounded-lg px-3 py-2.5 hover:bg-success-soft/70 transition-colors">
                Have the survey number? Run the official Title Clearance check on the 7/12 record →
              </Link>
              <p className="text-xs text-faint leading-relaxed">
                This preliminary assessment is generated from geospatial survey parameters and regional planning
                data for the stated coordinates. It does not constitute a legal opinion or a title search, and is
                not a substitute for verification of revenue records, the sanctioned development plan and an
                advocate&apos;s search report. Liability limited to the fee paid. Standard digital report: complimentary during beta.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
