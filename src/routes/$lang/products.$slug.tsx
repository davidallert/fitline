import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteChrome";
import { ProductCard, formatPrice } from "@/components/site/ProductCard";
import { productQuery, productsQuery } from "@/lib/queries";
import { pick, useLang } from "@/lib/i18n";
import { productBuyUrl } from "@/config/site";

export const Route = createFileRoute("/$lang/products/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!product) throw notFound();
    await context.queryClient.ensureQueryData(productsQuery());
    return { name: product.name_sv, tagline: product.tagline_sv, image: product.image_url };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Produkten hittades inte – FitLine" }, { name: "robots", content: "noindex" }] };
    const meta = [
      { title: `${loaderData.name} – FitLine` },
      { name: "description", content: loaderData.tagline ?? "" },
      { property: "og:title", content: `${loaderData.name} – FitLine` },
      { property: "og:description", content: loaderData.tagline ?? "" },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (loaderData.image?.startsWith("https://")) {
      meta.push({ property: "og:image", content: loaderData.image }, { name: "twitter:image", content: loaderData.image });
    }
    return { meta };
  },
  notFoundComponent: NotFound,
  errorComponent: NotFound,
  component: ProductPage,
});

function NotFound() {
  return (
    <SiteLayout>
      <div className="container-site py-32 text-center">
        <h1 className="text-3xl font-bold">Produkten hittades inte / Product not found</h1>
        <Link to="/$lang/products" params={{ lang }} className="mt-6 inline-block font-semibold text-primary">← Produkter</Link>
      </div>
    </SiteLayout>
  );
}

function ProductPage() {
  const { slug } = Route.useParams();
  const { t, lang } = useLang();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const { data: all } = useSuspenseQuery(productsQuery());
  const images = product ? [product.image_url, ...product.gallery].filter(Boolean) as string[] : [];
  const [activeImg, setActiveImg] = useState(0);
  if (!product) return <NotFound />;

  const benefits = pick(product, "benefits", lang).split("\n").map((s) => s.trim()).filter(Boolean);
  const related = all.filter((p) => p.id !== product.id && p.category_slugs.some((c) => product.category_slugs.includes(c))).slice(0, 4);
  const buyUrl = productBuyUrl(product);

  return (
    <SiteLayout>
      <div className="container-site py-10">
        <Link to="/$lang/products" params={{ lang }} className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> {t("back")}
        </Link>
        <div className="mt-6 grid gap-12 lg:grid-cols-2">
          <div>
            <div className="aspect-square rounded-3xl bg-product p-10">
              {images[activeImg] && <img src={images[activeImg]} alt={pick(product, "name", lang)} className="size-full object-contain" />}
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {images.map((src, i) => (
                  <button key={src} onClick={() => setActiveImg(i)} className={`size-20 overflow-hidden rounded-xl border-2 bg-product p-1 ${i === activeImg ? "border-primary" : "border-transparent"}`}>
                    <img src={src} alt="" className="size-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="lg:py-6">
            {product.is_new && <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{t("new_badge")}</span>}
            <h1 className="mt-3 text-4xl font-bold md:text-5xl">{pick(product, "name", lang)}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{pick(product, "tagline", lang)}</p>
            <p className="mt-6 font-display text-3xl font-bold">{formatPrice(product.price, lang)}</p>
            {benefits.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("benefits")}</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-fresh-soft text-fresh"><Check className="size-3.5" /></span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button asChild variant="cta" size="xl" className="mt-10 w-full sm:w-auto">
              <a href={buyUrl} target="_blank" rel="noopener sponsored">{t("buy")} <ArrowUpRight /></a>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">{t("affiliate_note")}</p>
            <div className="mt-10 border-t border-border pt-8">
              <h2 className="text-xl font-semibold">{t("about_product")}</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{pick(product, "description", lang)}</p>
              {product.article_number && <p className="mt-4 text-xs text-muted-foreground">{t("article")} {product.article_number}</p>}
            </div>
          </div>
        </div>
        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="text-3xl font-bold">{t("related")}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}
