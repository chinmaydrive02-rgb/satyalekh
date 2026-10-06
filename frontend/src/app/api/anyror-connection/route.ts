import https from 'node:https';

export const runtime = 'nodejs';
export const maxDuration = 15;

// A fixed public form only: no proxy destination, parcel, cookies or AI call.
// Successful responses are shared at the CDN for five minutes.
export async function GET(request: Request) {
  if (new URL(request.url).search) return Response.json({ error: 'Parameters are not accepted.' }, { status: 400 });
  const started = Date.now();
  let stage = 'dns';
  const region = process.env.VERCEL_REGION || 'local';
  const observation: Record<string, string | number | boolean> = { region, family: 'ipv4' };
  const result = await new Promise<Record<string, string | number | boolean>>(resolve => {
    let settled = false;
    const finish = (fields: Record<string, string | number | boolean>) => {
      if (settled) return;
      settled = true;
      resolve({ ...observation, stage, elapsed_ms: Date.now() - started, ...fields });
    };
    const req = https.get({ hostname: 'anyror.gujarat.gov.in', port: 443,
      path: '/LandRecordRural.aspx', family: 4, rejectUnauthorized: true,
      headers: { 'User-Agent': 'Satyalekh-Connection-Check/1.0', 'Accept-Encoding': 'identity' },
      signal: AbortSignal.timeout(8000),
    }, response => {
      stage = 'http';
      observation.http_status = response.statusCode || 0;
      let body = Buffer.alloc(0);
      response.on('data', (chunk: Buffer) => {
        const remaining = 65536 - body.length;
        body = Buffer.concat([body, Buffer.from(chunk).subarray(0, remaining)]);
        if (body.length >= 65536) {
          finish({ outcome: 'unavailable', failure: 'body_limit' });
          response.destroy(); req.destroy();
        }
      });
      response.on('end', () => {
        const district = body.includes(Buffer.from('ContentPlaceHolder1_ddlDistrict'));
        const record = body.includes(Buffer.from('ContentPlaceHolder1_drpLandRecord'));
        finish({ outcome: response.statusCode === 200 && district && record ? 'ready' : 'unavailable',
          district_control: district, record_control: record });
      });
      response.on('error', () => finish({ outcome: 'unavailable', failure: 'response' }));
    });
    req.on('socket', socket => {
      socket.on('lookup', () => { stage = 'tcp'; observation.dns_ms = Date.now() - started; });
      socket.on('connect', () => { stage = 'tls'; observation.tcp_ready_ms = Date.now() - started; });
      socket.on('secureConnect', () => { stage = 'http'; observation.tls_ready_ms = Date.now() - started; });
    });
    req.on('error', error => {
      console.error('AnyROR connection check unavailable', { stage });
      finish({ outcome: 'unavailable', failure: error.name === 'AbortError' ? 'deadline' : 'connection' });
    });
  });
  return Response.json(result, { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300' } });
}
