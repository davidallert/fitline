import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Award, FlaskConical, ShieldCheck, Sparkles, Sun, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteChrome";
import { ProductCard } from "@/components/site/ProductCard";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { pick, useLang } from "@/lib/i18n";
import hero from "@/assets/hero.jpg";
import lifestyle from "@/assets/lifestyle.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FitLine – Premiumtillskott med NTC® | Partner" },
      { name: "description", content: "Upptäck FitLines premiumtillskott med patenterad NTC®-teknik för energi, återhämtning och välmående." },
      { property: "og:title", content: "FitLine – Premiumtillskott med NTC®" },
      { property: "og:description", content: "Energi, återhämtning och välmående inifrån. Utforska FitLines produkter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery(true)),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]),
  component: Home,
});

function Home() {
  const { t, lang } = useLang();
  const { data: featured } = useSuspenseQuery(productsQuery(true));
  const { data: categories } = useSuspenseQuery(categoriesQuery());

  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <img src={hero} alt="" width={1600} height={1008} className="absolute inset-0 size-full object-cover object-right" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="container-site relative py-24 md:py-36">
          <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" /> {t("hero_kicker")}
            </span>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] md:text-6xl">{t("hero_title")}</h1>
            <p className="mt-5 text-lg text-muted-foreground">{t("hero_sub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="cta" size="xl">
                <Link to="/products">{t("hero_cta")} <ArrowRight /></Link>
              </Button>
              <Button asChild variant="pill" size="xl">
                <a href="#why">{t("hero_secondary")}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="container-site grid gap-4 py-6 text-sm font-medium sm:grid-cols-3">
          {[
            [ShieldCheck, t("trust_1")],
            [FlaskConical, t("trust_2")],
            [Award, t("trust_3")],
          ].map(([Icon, label], i) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <div key={i} className="flex items-center justify-center gap-2">
                <I className="size-5 text-fresh" /> {label as string}
              </div>
            );
          })}
        </div>
      </section>

      <section className="container-site py-20">
        <h2 className="text-3xl font-bold md:text-4xl">{t("categories_title")}</h2>
        <div className="mt-8 flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/products"
              search={{ category: c.slug }}
              className="rounded-full border border-border bg-card px-5 py-3 font-semibold shadow-soft transition-colors hover:border-primary hover:text-primary"
            >
              {pick(c, "name", lang)}
            </Link>
          ))}
        </div>
      </section>

      <section className="container-site pb-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">{t("featured_title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("featured_sub")}</p>
          </div>
          <Link to="/products" className="hidden items-center gap-1 font-semibold text-primary sm:flex">
            {t("view_all")} <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section id="why" className="bg-fresh-soft">
        <div className="container-site grid items-center gap-12 py-20 md:grid-cols-2">
          <img src={lifestyle} alt="" loading="lazy" width={1200} height={1408} className="aspect-[4/5] w-full rounded-3xl object-cover shadow-soft" />
          <div>
            <h2 className="text-4xl font-bold">{t("ntc_title")}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("ntc_body")}</p>
            <div className="mt-10 space-y-6">
              {[
                [Zap, "benefit_1_t", "benefit_1_b"],
                [ShieldCheck, "benefit_2_t", "benefit_2_b"],
                [Sun, "benefit_3_t", "benefit_3_b"],
              ].map(([Icon, tk, bk]) => {
                const I = Icon as typeof Zap;
                return (
                  <div key={tk as string} className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-card text-primary shadow-soft"><I className="size-5" /></span>
                    <div>
                      <p className="font-display font-semibold">{t(tk as "benefit_1_t")}</p>
                      <p className="text-muted-foreground">{t(bk as "benefit_1_b")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button asChild variant="cta" size="xl" className="mt-10">
              <Link to="/products">{t("hero_cta")} <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
