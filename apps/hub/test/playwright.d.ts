/** Playwright is provided by the environment, not installed in the repo; only the parts the browser test uses are typed. */
declare module 'playwright' {
  export type Page = any; // eslint-disable-line @typescript-eslint/no-explicit-any
  export type Browser = any; // eslint-disable-line @typescript-eslint/no-explicit-any
  export const chromium: { launch(opts?: unknown): Promise<Browser> };
}
