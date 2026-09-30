import type { RiskScreenResponse, ScreenLayerResult, ScreenOutcome } from "./riskLayers";

const VALID_OUTCOMES: ScreenOutcome[] = ["clear", "caution", "restricted", "unknown"];

/** Accept the API's title field and the local sample's layer field. */
export function normaliseScreen(payload: unknown): RiskScreenResponse {
  const raw = payload && typeof payload === "object"
    ? payload as Record<string, unknown> : {};
  const layers: ScreenLayerResult[] = [];
  for (const item of Array.isArray(raw.layers) ? raw.layers : []) {
    if (!item || typeof item !== "object") continue;
    const layer = typeof item.title === "string" ? item.title : item.layer;
    if (typeof layer !== "string" || !layer.trim()) continue;
    layers.push({
      layer,
      outcome: VALID_OUTCOMES.includes(item.outcome) ? item.outcome : "unknown",
      finding: typeof item.finding === "string" ? item.finding : "",
      ...(typeof item.advice === "string" && item.advice ? { advice: item.advice } : {}),
      ...(typeof item.citation === "string" && item.citation ? { citation: item.citation } : {}),
    });
  }
  // The API's summary contains counts; samples use prose. Derive counts from
  // the accepted layers so malformed data cannot make the screen look clear.
  const counts: Record<ScreenOutcome, number> = { clear: 0, caution: 0, restricted: 0, unknown: 0 };
  for (const layer of layers) counts[layer.outcome]++;
  return {
    verdict: typeof raw.verdict === "string" ? raw.verdict : undefined,
    summary: typeof raw.summary === "string" ? raw.summary : undefined,
    layers,
    counts,
  };
}
