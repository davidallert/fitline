import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/catalog.functions";
import { pick, useLang } from "@/lib/i18n";

export function formatPrice(price: number | null, lang: "sv" | "en") {
  if (price == null) return "";
  return `${Number(price).toLocaleString(lang === "sv" ? "sv-SE" : "en-GB")} ${lang === "sv" ? "kr" : "SEK"}`;
}

export function ProductCard({ product }: { product: Product }) {
  const { lang, t } = useLang();
  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30"
    >
      <div className="relative aspect-square bg-product p-6">
        {product.is_new && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            {t("new_badge")}
          </span>
        )}
        {product.image_url && (
          <img
            src={product.image_url}
            alt={pick(product, "name", lang)}
            loading="lazy"
            className="size-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold leading-tight">{pick(product, "name", lang)}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{pick(product, "tagline", lang)}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-semibold">{formatPrice(product.price, lang)}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-primary">
            {t("read_more")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
