/**
 * Affiliate configuration — change these values to update every "Buy" link on the site.
 *
 * AFFILIATE_ID: your FitLine partner ID. Leave the placeholder until you have one.
 * AFFILIATE_PARAM: the query-string key FitLine uses for partner tracking.
 * FITLINE_SHOP_URL: base URL of the official FitLine shop.
 */
export const AFFILIATE_ID = "YOUR-PARTNER-ID";
export const AFFILIATE_PARAM = "ref";
export const FITLINE_SHOP_URL = "https://www.fitline.com/se/sv-se";

export function withAffiliate(url: string): string {
  if (!AFFILIATE_ID) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has(AFFILIATE_PARAM)) u.searchParams.set(AFFILIATE_PARAM, AFFILIATE_ID);
    return u.toString();
  } catch {
    return url;
  }
}

/** Product buy link: explicit link set in admin wins, else the FitLine product page by article number. */
export function productBuyUrl(p: { external_url?: string | null; article_number?: string | null }) {
  const base =
    p.external_url ||
    (p.article_number ? `${FITLINE_SHOP_URL}/products/${p.article_number}` : `${FITLINE_SHOP_URL}/products`);
  return withAffiliate(base);
}

export const shopUrl = () => withAffiliate(`${FITLINE_SHOP_URL}/products`);
