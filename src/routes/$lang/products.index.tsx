import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteChrome";
import { ProductCard } from "@/components/site/ProductCard";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { pick, useLang } from "@/lib/i18n";
import { langLinks, ogLocale, ogUrl } from "@/lib/seo";

export const Route = createFileRoute("/$lang/products/")({
  validateSearch: z.object({ category: z.string().optional() }),
  loaderDeps: ({ search }) => ({ category: search.category }),
  loader: async ({ context, deps }) => {
    const [, categories] = await Promise.all([
      context.queryClient.ensureQueryData(productsQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]);
    return { category: categories.find((c) => c.slug === deps.category) ?? null };
  },
  head: ({ params, loaderData }) => {
    const lang = params.lang === "en" ? "en" : "sv";
    const cat = loaderData?.category;
    const name = cat ? pick(cat, "name", lang) : null;
    const title = name
      ? `FitLine ${name} – ${lang === "sv" ? "tillskott & produkter" : "supplements & products"}`
      : lang === "sv" ? "Produkter – FitLine tillskott & hudvård" : "Products – FitLine supplements & skincare";
    const desc = (cat && pick(cat, "description", lang)) ||
      (lang === "sv"
        ? "Hela FitLine-sortimentet: optimal tillgång, träning, skönhet, viktkontroll och särskilda behov."
        : "The full FitLine range: optimal supply, fitness, beauty, weight management and special needs.");
    const path = cat ? `/products?category=${cat.slug}` : "/products";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        ogUrl(lang, path),
        ogLocale(lang),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: langLinks(lang, path),
    };
  },
  component: ProductsPage,
});

function ProductsPage() {
  const { category } = Route.useSearch();
  const { t, lang } = useLang();
  const { data: products } = useSuspenseQuery(productsQuery());
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const active = categories.find((c) => c.slug === category);
  const list = active ? products.filter((p) => p.category_slugs.includes(active.slug)) : products;

  const chip = (on: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${on ? "bg-foreground text-background" : "border border-border bg-card hover:border-primary hover:text-primary"}`;

  return (
    <SiteLayout>
      <section className="bg-surface">
        <div className="container-site py-14">
          <h1 className="text-4xl font-bold md:text-5xl">{active ? pick(active, "name", lang) : t("all_products")}</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">{active ? pick(active, "description", lang) : t("products_sub")}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link to="/$lang/products" params={{ lang }} search={{}} className={chip(!active)}>{t("all_products")}</Link>
            {categories.map((c) => (
              <Link key={c.id} to="/$lang/products" params={{ lang }} search={{ category: c.slug }} className={chip(active?.id === c.id)}>
                {pick(c, "name", lang)}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="container-site py-12">
        {list.length === 0 ? (
          <p className="text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
