const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/lib/normaliseRiskScreen.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
new Function('exports', compiled)(exportsObject);
const { normaliseScreen } = exportsObject;

test('renders server title fields and computes counts from actual layers', () => {
  const result = normaliseScreen({ verdict: 'Further checks required', summary: { clear: 999 }, layers: [
    { key: 'heritage_asi', title: 'Heritage & ASI monuments', outcome: 'unknown', finding: 'Coordinates not provided', advice: 'Verify location', citation: 'AMASR' },
    { key: 'agri', title: 'Agricultural status', outcome: 'caution', finding: 'Conversion required' },
  ] });
  assert.equal(result.layers.length, 2);
  assert.equal(result.layers[0].layer, 'Heritage & ASI monuments');
  assert.equal(result.layers[0].advice, 'Verify location');
  assert.equal(result.layers[0].citation, 'AMASR');
  assert.deepEqual(result.counts, { clear: 0, caution: 1, restricted: 0, unknown: 1 });
  assert.equal(result.summary, undefined);
});

test('preserves local sample response and prose summary', () => {
  const result = normaliseScreen({ summary: 'Sample only', layers: [{ layer: 'GDCR', outcome: 'restricted', finding: 'No development' }] });
  assert.equal(result.layers[0].layer, 'GDCR');
  assert.equal(result.summary, 'Sample only');
  assert.equal(result.counts.restricted, 1);
});

test('malformed data never becomes a clear result', () => {
  const result = normaliseScreen({ layers: [null, {}, { title: 'Test', outcome: 'unexpected', finding: {} }] });
  assert.equal(result.layers.length, 1);
  assert.equal(result.layers[0].outcome, 'unknown');
  assert.equal(result.layers[0].finding, '');
  assert.deepEqual(normaliseScreen(null).layers, []);
});
