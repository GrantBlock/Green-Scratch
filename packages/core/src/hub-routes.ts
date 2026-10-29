/**
 * The Hub's public routes, written against the narrow VaultPublicApi only. The Hub app (track C3) and the mock server both
 * use this; it has no access to records, the database or file storage.
 */
import { ContactSubmission } from '@bc/contract';
import type { VaultPublicApi } from '@bc/contract';
import { badRequest, decodeError, HttpError, notFound } from './errors.ts';
import { MAX_UPLOAD_BYTES, sha256Hex } from './util.ts';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const SHARE_ERRORS = { not_found: [404, 'This link does not exist.'], expired: [410, 'This link has expired.'], revoked: [410, 'This link has been revoked.'] } as const;
const shareError = (code: keyof typeof SHARE_ERRORS) => json(SHARE_ERRORS[code][0], { error: { code, message: SHARE_ERRORS[code][1] } });

export function createHubHandler(api: VaultPublicApi): (req: Request) => Promise<Response> {
  return async (req) => {
    try {
      const u = new URL(req.url);
      const path = u.pathname;
      const m = req.method;
      const rest = path.split('/').filter(Boolean).map(decodeURIComponent); // ['hub', ...]
      if (rest[0] !== 'hub') throw notFound('That page');

      if (m === 'POST' && path === '/hub/api/contact') {
        const body = await req.json().catch(() => { throw badRequest('The request body is not valid JSON.'); });
        const p = ContactSubmission.safeParse(body);
        if (!p.success) throw badRequest('Check the form and try again.', Object.fromEntries(p.error.issues.map((i) => [i.path.join('.') || '_', i.message])));
        return json(200, await api.submitContact(p.data));
      }
      if (m === 'GET' && path === '/hub/api/library') return json(200, await api.listLibrary());
      if (m === 'GET' && rest[1] === 'api' && rest[2] === 'library' && rest.length === 4) {
        const e = await api.getLibraryEntry(rest[3]!);
        if (!e) throw notFound('That entry');
        return json(200, e);
      }
      if (m === 'GET' && rest[1] === 'api' && rest[2] === 'library' && rest.length === 5 && rest[4] === 'file') {
        const f = await api.readDocument({ library: true }, rest[3]!);
        if (!f) throw notFound('That file');
        return new Response(f.body, { headers: { 'content-type': f.mimeType, 'content-disposition': `inline; filename="${f.fileName.replace(/[^\w. -]/g, '_')}"` } });
      }
      if (rest[1] === 'p' && rest[2]) {
        const token = rest[2];
        const tokenHash = await sha256Hex(token);
        if (m === 'GET' && rest.length === 3) {
          const page = await api.getSharePage(tokenHash);
          if ('error' in page) return shareError(page.error);
          return json(200, JSON.parse(JSON.stringify(page).replaceAll('/hub/p/{token}/', `/hub/p/${token}/`)));
        }
        if (m === 'GET' && rest.length === 5 && rest[3] === 'files') {
          const f = await api.readDocument({ tokenHash }, rest[4]!);
          if (!f) throw notFound('That file');
          return new Response(f.body, { headers: { 'content-type': f.mimeType, 'content-disposition': `attachment; filename="${f.fileName.replace(/[^\w. -]/g, '_')}"`, 'cache-control': 'private, no-store' } });
        }
        if (m === 'POST' && rest.length === 5 && rest[3] === 'uploads') {
          if (!req.body) throw badRequest('Send the file as the request body.');
          const declared = Number(req.headers.get('content-length') ?? 0);
          if (declared > MAX_UPLOAD_BYTES) throw new HttpError(413, 'validation_failed', 'That file is larger than 25 MB.');
          const fileName = decodeURIComponent(req.headers.get('x-file-name') ?? 'upload.bin');
          const r = await api.acceptUpload(tokenHash, rest[4]!, { fileName, mimeType: req.headers.get('content-type') ?? undefined, body: req.body });
          if ('error' in r) return shareError(r.error);
          return json(200, r);
        }
      }
      throw notFound('That page');
    } catch (e) {
      const known = decodeError(e);
      if (known) return json(known.status, { error: { code: known.code, message: known.message, fields: known.fields } });
      console.error('Unhandled Hub error', e);
      return json(500, { error: { code: 'validation_failed', message: 'Something went wrong. Try again.' } });
    }
  };
}
