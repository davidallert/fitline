import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteChrome";
import { ProductCard } from "@/components/site/ProductCard";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { pick, useLang } from "@/lib/i18n";

export const Route = createFileRoute("/$lang/products/")({
  validateSearch: z.object({ category: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Produkter – FitLine tillskott & hudvård" },
      { name: "description", content: "Hela FitLine-sortimentet: optimal tillgång, träning, skönhet, viktkontroll och särskilda behov." },
      { property: "og:title", content: "FitLine-produkter" },
      { property: "og:description", content: "Utforska FitLines tillskott och hudvård per kategori." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]),
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
