/** An error that maps to an API response: status, code from the contract, a message written for a person. */
export class HttpError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
export const badRequest = (message: string, fields?: Record<string, string>) => new HttpError(400, 'validation_failed', message, fields);
export const notFound = (what: string) => new HttpError(404, 'not_found', `${what} was not found.`);
export const conflict = (message: string) => new HttpError(409, 'conflict', message);
export const forbidden = (message: string) => new HttpError(403, 'forbidden', message);

/**
 * Errors lose their class and extra fields when they cross a Cloudflare service binding (RPC): only the message survives.
 * The Vault side encodes an expected error into the message; the Hub side decodes it, so a refusal stays a refusal (409, 403, ...)
 * instead of becoming a server error.
 */
const MARK = '@bc-http-error:';
export function encodeError(e: unknown): Error {
  if (e instanceof HttpError) return new Error(MARK + JSON.stringify({ status: e.status, code: e.code, message: e.message, fields: e.fields }));
  return e instanceof Error ? e : new Error(String(e));
}
export function decodeError(e: unknown): HttpError | null {
  if (e instanceof HttpError) return e;
  const msg = e instanceof Error ? e.message : '';
  const at = msg.indexOf(MARK);
  if (at < 0) return null;
  try {
    const j = JSON.parse(msg.slice(at + MARK.length)) as { status: number; code: string; message: string; fields?: Record<string, string> };
    return new HttpError(j.status, j.code, j.message, j.fields);
  } catch { return null; }
}
