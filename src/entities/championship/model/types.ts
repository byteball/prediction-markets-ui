export interface Championship {
  name: string;
  code: string;
  emblem?: string;
  [key: string]: unknown;
}

/** Championships by sport type, e.g. { soccer: [...] }. */
export type Championships = Record<string, Championship[]>;
