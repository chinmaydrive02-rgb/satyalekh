// Ahmedabad infrastructure intelligence layer — curated coordinates for
// deterministic proximity analysis (metro, rail, airport, lakes, corridors).
// Positions are indicative (±300 m) — used for distance estimates and map
// overlay, not survey-grade output.

export type Pt = { name: string; lng: number; lat: number };

export const METRO_STATIONS: Pt[] = [
  // East–West line (Vastral Gam ↔ Thaltej Gam)
  { name: 'Vastral Gam Metro', lng: 72.6700, lat: 23.0070 },
  { name: 'Rabari Colony Metro', lng: 72.6520, lat: 23.0100 },
  { name: 'Amraiwadi Metro', lng: 72.6380, lat: 23.0130 },
  { name: 'Apparel Park Metro', lng: 72.6270, lat: 23.0170 },
  { name: 'Kankaria East Metro', lng: 72.6130, lat: 23.0220 },
  { name: 'Kalupur Railway Station Metro', lng: 72.6011, lat: 23.0258 },
  { name: 'Gheekanta Metro', lng: 72.5900, lat: 23.0290 },
  { name: 'Shahpur Metro', lng: 72.5790, lat: 23.0330 },
  { name: 'Old High Court Metro (interchange)', lng: 72.5710, lat: 23.0400 },
  { name: 'Stadium Metro', lng: 72.5600, lat: 23.0390 },
  { name: 'Commerce Six Roads Metro', lng: 72.5530, lat: 23.0380 },
  { name: 'Gujarat University Metro', lng: 72.5436, lat: 23.0367 },
  { name: 'Gurukul Road Metro', lng: 72.5330, lat: 23.0400 },
  { name: 'Doordarshan Kendra Metro', lng: 72.5230, lat: 23.0440 },
  { name: 'Thaltej Metro', lng: 72.5121, lat: 23.0497 },
  // North–South line (APMC ↔ Motera) + Gandhinagar extension
  { name: 'APMC Vasna Metro', lng: 72.5770, lat: 22.9910 },
  { name: 'Jivraj Park Metro', lng: 72.5660, lat: 22.9980 },
  { name: 'Paldi Metro', lng: 72.5660, lat: 23.0110 },
  { name: 'Gandhigram Metro', lng: 72.5690, lat: 23.0250 },
  { name: 'Usmanpura Metro', lng: 72.5710, lat: 23.0500 },
  { name: 'Vadaj Metro', lng: 72.5740, lat: 23.0600 },
  { name: 'Ranip Metro', lng: 72.5760, lat: 23.0660 },
  { name: 'Sabarmati Railway Station Metro', lng: 72.5860, lat: 23.0717 },
  { name: 'Motera Stadium Metro', lng: 72.5970, lat: 23.0920 },
  { name: 'GIFT City Metro', lng: 72.6840, lat: 23.1560 },
  { name: 'Gandhinagar Sector-1 Metro', lng: 72.6360, lat: 23.2150 },
];

export const KEY_POINTS: Pt[] = [
  { name: 'SVP International Airport', lng: 72.6347, lat: 23.0772 },
  { name: 'Kalupur (Ahmedabad Jn) Railway Station', lng: 72.6011, lat: 23.0258 },
  { name: 'Sabarmati Railway Station', lng: 72.5797, lat: 23.0717 },
  { name: 'GIFT City', lng: 72.6840, lat: 23.1560 },
  { name: 'Sanand GIDC', lng: 72.3720, lat: 22.9920 },
  { name: 'CTM / NH-48 junction', lng: 72.6350, lat: 22.9980 },
];

export const WATER_BODIES: Pt[] = [
  { name: 'Kankaria Lake', lng: 72.6026, lat: 23.0063 },
  { name: 'Vastrapur Lake', lng: 72.5290, lat: 23.0379 },
  { name: 'Chandola Lake', lng: 72.6014, lat: 22.9905 },
  { name: 'Thol Lake (sanctuary)', lng: 72.3976, lat: 23.1457 },
  { name: 'Chharodi Lake', lng: 72.4900, lat: 23.0850 },
];

// Sabarmati river: approximate centerline longitude varies with latitude
function sabarmatiLngAt(lat: number): number {
  // From ~72.566 at lat 22.94 to ~72.59 at lat 23.12 (gentle NE slope)
  return 72.566 + Math.max(0, Math.min(1, (lat - 22.94) / 0.18)) * 0.024;
}

// SG Highway: roughly N-S at lng ≈ 72.507 between lat 22.96 and 23.13
const SG_HWY = { lng: 72.507, latMin: 22.96, latMax: 23.13 };

const toR = Math.PI / 180;
export function distM(aLng: number, aLat: number, bLng: number, bLat: number): number {
  const R = 6371000;
  const dLat = (bLat - aLat) * toR, dLng = (bLng - aLng) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * toR) * Math.cos(bLat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function nearest(lng: number, lat: number, pts: Pt[]): { p: Pt; d: number } {
  let best = { p: pts[0], d: Infinity };
  for (const p of pts) {
    const d = distM(lng, lat, p.lng, p.lat);
    if (d < best.d) best = { p, d };
  }
  return best;
}

const fmtKm = (m: number) => m < 1000 ? `${Math.round(m / 50) * 50} m` : `${(m / 1000).toFixed(1)} km`;

export interface InfraIntel {
  inCoverage: boolean;            // within ~60 km of Ahmedabad
  rows: { label: string; value: string; flag?: 'good' | 'warn' | 'bad' }[];
  redFlags: string[];
  factsText: string;              // verified facts block for the analyst engine
}

export function analyzeInfra(lng: number, lat: number): InfraIntel {
  const cityDist = distM(lng, lat, 72.5714, 23.0225);
  if (cityDist > 60000) {
    return { inCoverage: false, rows: [], redFlags: [], factsText: '' };
  }
  const rows: InfraIntel['rows'] = [];
  const redFlags: string[] = [];
  const facts: string[] = [];

  const m = nearest(lng, lat, METRO_STATIONS);
  rows.push({ label: 'Nearest Metro', value: `${m.p.name} — ${fmtKm(m.d)}`, flag: m.d < 1500 ? 'good' : undefined });
  facts.push(`Nearest metro station: ${m.p.name}, ${fmtKm(m.d)} away.`);

  const air = KEY_POINTS[0];
  const airD = distM(lng, lat, air.lng, air.lat);
  rows.push({ label: 'Airport (SVPIA)', value: fmtKm(airD) });
  facts.push(`SVP International Airport: ${fmtKm(airD)}.`);
  if (airD < 4000) {
    rows.push({ label: 'Airport funnel zone', value: 'Possible AAI height restrictions', flag: 'warn' });
    redFlags.push('Within ~4 km of SVPIA — AAI height clearance (NOC) may cap building height.');
    facts.push('Parcel lies within ~4 km of the airport; AAI height restrictions likely apply.');
  }

  const rail = nearest(lng, lat, [KEY_POINTS[1], KEY_POINTS[2]]);
  rows.push({ label: 'Nearest Railway Stn', value: `${rail.p.name} — ${fmtKm(rail.d)}` });
  facts.push(`Nearest railway station: ${rail.p.name}, ${fmtKm(rail.d)}.`);

  const sgD = lat >= SG_HWY.latMin && lat <= SG_HWY.latMax
    ? Math.abs(lng - SG_HWY.lng) * 111320 * Math.cos(lat * toR)
    : distM(lng, lat, SG_HWY.lng, Math.max(SG_HWY.latMin, Math.min(SG_HWY.latMax, lat)));
  rows.push({ label: 'SG Highway', value: fmtKm(sgD), flag: sgD < 2000 ? 'good' : undefined });
  facts.push(`SG Highway corridor: ${fmtKm(sgD)}.`);

  const riverD = Math.abs(lng - sabarmatiLngAt(lat)) * 111320 * Math.cos(lat * toR);
  rows.push({ label: 'Sabarmati River', value: fmtKm(riverD), flag: riverD < 200 ? 'warn' : undefined });
  if (riverD < 200) {
    redFlags.push('Within ~200 m of the Sabarmati — verify riverfront development control line and flood plain notification.');
    facts.push(`Parcel is approximately ${fmtKm(riverD)} from the Sabarmati river — flood-plain/DC-line check required.`);
  }

  const lake = nearest(lng, lat, WATER_BODIES);
  if (lake.d < 3000) {
    rows.push({ label: 'Nearest Lake', value: `${lake.p.name} — ${fmtKm(lake.d)}`, flag: lake.d < 150 ? 'bad' : undefined });
    facts.push(`Nearest notified water body: ${lake.p.name}, ${fmtKm(lake.d)}.`);
    if (lake.d < 150) {
      redFlags.push(`Within ~150 m of ${lake.p.name} — CGDCR water-body buffer (no-construction margin) very likely applies; verify FTL and buffer with AUDA/AMC.`);
    }
  }

  const gift = KEY_POINTS[3];
  const giftD = distM(lng, lat, gift.lng, gift.lat);
  if (giftD < 12000) {
    rows.push({ label: 'GIFT City', value: fmtKm(giftD), flag: 'good' });
    facts.push(`GIFT City: ${fmtKm(giftD)}.`);
  }
  const sanand = KEY_POINTS[4];
  const sanandD = distM(lng, lat, sanand.lng, sanand.lat);
  if (sanandD < 15000) {
    rows.push({ label: 'Sanand GIDC', value: fmtKm(sanandD), flag: 'good' });
    facts.push(`Sanand industrial estate: ${fmtKm(sanandD)}.`);
  }

  return { inCoverage: true, rows, redFlags, factsText: facts.join(' ') };
}
