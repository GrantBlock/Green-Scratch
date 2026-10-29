import http from 'node:http';
import { Readable } from 'node:stream';

/** Serve a fetch-style handler on a local port (Node). Used by tests and the mock. */
export function listen(handler: (req: Request) => Promise<Response>, port = 0): Promise<{ url: string; close(): Promise<void> }> {
  const server = http.createServer(async (nodeReq, nodeRes) => {
    try {
      const url = `http://${nodeReq.headers.host ?? 'localhost'}${nodeReq.url ?? '/'}`;
      const method = nodeReq.method ?? 'GET';
      const hasBody = method !== 'GET' && method !== 'HEAD';
      const headers = new Headers();
      for (const [k, v] of Object.entries(nodeReq.headers)) if (v != null) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
      if (method === 'OPTIONS') { nodeRes.writeHead(204, cors()); return nodeRes.end(); }
      const req = new Request(url, { method, headers, body: hasBody ? (Readable.toWeb(nodeReq) as unknown as ReadableStream) : undefined, duplex: 'half' } as RequestInit);
      const res = await handler(req);
      const out: Record<string, string> = { ...cors() };
      res.headers.forEach((v, k) => { out[k] = v; });
      nodeRes.writeHead(res.status, out);
      if (res.body) nodeRes.end(Buffer.from(await res.arrayBuffer())); else nodeRes.end();
    } catch (e) {
      nodeRes.writeHead(500, { 'content-type': 'application/json' });
      nodeRes.end(JSON.stringify({ error: { code: 'validation_failed', message: e instanceof Error ? e.message : 'Unexpected error' } }));
    }
  });
  const cors = () => ({ 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,PUT,OPTIONS' });
  return new Promise((resolve) => {
    server.listen(port, () => {
      const addr = server.address();
      resolve({ url: `http://localhost:${typeof addr === 'object' && addr ? addr.port : 0}`, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }) });
    });
  });
}

/** Route /hub/* to the Hub handler and everything else to the Vault app, as the two real Workers will be reached. */
export function combine(vault: (req: Request) => Promise<Response>, hub: (req: Request) => Promise<Response>) {
  return (req: Request) => (new URL(req.url).pathname.startsWith('/hub/') ? hub(req) : vault(req));
}
