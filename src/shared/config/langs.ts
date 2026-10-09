// Interface languages. The order is the order shown in the language selector; "en" has no URL prefix.
export const LANGUAGE_CODES = ["en", "zh", "es", "pt", "ru", "uk"] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const langs: { name: string }[] = LANGUAGE_CODES.map((name) => ({ name }));

export const isLanguageCode = (value: unknown): value is LanguageCode => (LANGUAGE_CODES as readonly string[]).includes(value as string);
