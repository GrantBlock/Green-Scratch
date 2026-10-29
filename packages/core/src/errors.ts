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
