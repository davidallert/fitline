import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { SITE_URL } from "@/lib/seo";

const LANGS = ["sv", "en"] as const;

function entry(path: string, lastmod?: string | null) {
  const alts = LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}/${l}${path}"/>`).join("") +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/sv${path}"/>`;
  return LANGS.map(
    (l) =>
      `<url><loc>${SITE_URL}/${l}${path.replace(/&/g, "&amp;")}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""}${alts.replace(/&(?!amp;)/g, "&amp;")}</url>`,
  ).join("");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const [prods, cats] = await Promise.all([
          sb.from("products").select("slug, updated_at").eq("is_published", true).order("sort_order").range(0, 4999),
          sb.from("categories").select("slug").order("sort_order"),
        ]);
        if (prods.error || cats.error) return new Response("Sitemap unavailable", { status: 500 });
        const urls = [
          entry(""),
          entry("/products"),
          ...cats.data.map((c) => entry(`/products?category=${encodeURIComponent(c.slug)}`)),
          ...prods.data.map((p) => entry(`/products/${p.slug}`, p.updated_at)),
        ].join("");
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
