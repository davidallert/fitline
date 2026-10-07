import type { Lang } from "./i18n";

export const SITE_URL = "https://fitline-now.lovable.app";

/** Canonical + hreflang links for a path (without the /sv|/en prefix), e.g. "/products/basics". */
export function langLinks(lang: Lang, path: string) {
  const p = path === "/" ? "" : path;
  return [
    { rel: "canonical", href: `${SITE_URL}/${lang}${p}` },
    { rel: "alternate", hrefLang: "sv", href: `${SITE_URL}/sv${p}` },
    { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/en${p}` },
    { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/sv${p}` },
  ];
}

export function ogUrl(lang: Lang, path: string) {
  return { property: "og:url", content: `${SITE_URL}/${lang}${path === "/" ? "" : path}` };
}

export function ogLocale(lang: Lang) {
  return { property: "og:locale", content: lang === "sv" ? "sv_SE" : "en_GB" };
}
