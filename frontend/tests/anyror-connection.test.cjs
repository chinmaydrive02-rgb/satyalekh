const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/app/api/anyror-connection/route.ts'), 'utf8');

function load(mode = 'ready') {
  const calls = [];
  const https = { get(options, callback) {
    calls.push(options);
    const request = new EventEmitter();
    request.destroy = () => {};
    setImmediate(() => {
      const socket = new EventEmitter();
      request.emit('socket', socket);
      socket.emit('lookup');
      if (mode === 'deadline') return request.emit('error', Object.assign(new Error('PRIVATE'), { name: 'AbortError' }));
      socket.emit('connect'); socket.emit('secureConnect');
      const response = new EventEmitter();
      response.statusCode = mode === 'redirect' ? 302 : 200;
      response.destroy = () => {};
      callback(response);
      response.emit('data', mode === 'oversized' ? Buffer.alloc(100000) : Buffer.from('ContentPlaceHolder1_ddlDistrict ContentPlaceHolder1_drpLandRecord PRIVATE COOKIE'));
      response.emit('end');
    });
    return request;
  }};
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText,
    { module, exports: module.exports, require: name => name === 'node:https' ? https : require(name),
      Buffer, URL, Request, Response, AbortSignal, Date, process: { env: { VERCEL_REGION: 'bom1' } }, console: { error() {} } });
  return { GET: module.exports.GET, calls };
}

test('fixed hostname IPv4 verified TLS, bounded no raw source', async () => {
  const { GET, calls } = load();
  const response = await GET(new Request('https://example.test/api/anyror-connection'));
  const data = await response.json();
  assert.equal(data.outcome, 'ready'); assert.equal(data.region, 'bom1');
  assert.equal(calls[0].hostname, 'anyror.gujarat.gov.in');
  assert.equal(calls[0].path, '/LandRecordRural.aspx'); assert.equal(calls[0].family, 4);
  assert.equal(calls[0].rejectUnauthorized, true); assert.ok(calls[0].signal);
  assert.equal(JSON.stringify(data).includes('PRIVATE'), false);
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=0, s-maxage=300');
});
test('query destinations rejected without request', async () => {
  const { GET, calls } = load();
  assert.equal((await GET(new Request('https://example.test/api/anyror-connection?url=http://private'))).status, 400);
  assert.equal(calls.length, 0);
});
for (const mode of ['deadline', 'redirect', 'oversized']) {
  test(`${mode} is unavailable, does not leak or follow`, async () => {
    const { GET, calls } = load(mode);
    const response = await GET(new Request('https://example.test/api/anyror-connection'));
    const data = await response.json();
    assert.equal(data.outcome, 'unavailable'); assert.equal(calls.length, 1);
    assert.equal(JSON.stringify(data).includes('PRIVATE'), false);
    if (mode === 'deadline') { assert.equal(data.stage, 'tcp'); assert.equal(data.failure, 'deadline'); }
    if (mode === 'redirect') assert.equal(data.http_status, 302);
    if (mode === 'oversized') assert.equal(data.failure, 'body_limit');
  });
}
