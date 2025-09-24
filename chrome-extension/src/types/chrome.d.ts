// Minimal ambient declaration to satisfy TypeScript in extension runtime
declare const chrome: any;

declare interface ChromeTab {
  id?: number;
  url?: string | null;
}
