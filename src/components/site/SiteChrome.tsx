import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { shopUrl } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";

function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-full border border-border p-0.5 text-xs font-semibold">
      {(["sv", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${lang === l ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Header() {
  const { t } = useLang();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link to="/$lang" params={{ lang }} className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="size-4" />
          </span>
          FitLine<span className="text-primary">.</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          <Link to="/$lang" params={{ lang }} activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }} className="hover:text-primary">
            {t("nav_home")}
          </Link>
          <Link to="/$lang/products" params={{ lang }} activeProps={{ className: "text-primary" }} className="hover:text-primary">
            {t("nav_products")}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LangSwitch />
          <Button asChild variant="cta" size="sm" className="hidden px-4 sm:inline-flex">
            <a href={shopUrl()} target="_blank" rel="noopener sponsored">
              {t("shop_cta")} <ArrowUpRight />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function Newsletter() {
  const { t, lang } = useLang();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || v.length > 255) return setState("err");
    setState("loading");
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: v, language: lang });
    if (error && error.code !== "23505") return setState("err");
    setState("ok");
    setEmail("");
  }

  return (
    <section className="container-site py-20">
      <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-ink-foreground md:px-14">
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/40 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">{t("newsletter_title")}</h2>
            <p className="mt-3 text-ink-foreground/70">{t("newsletter_sub")}</p>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (state !== "loading") setState("idle"); }}
              placeholder={t("newsletter_placeholder")}
              className="h-12 flex-1 rounded-full border border-ink-foreground/20 bg-ink-foreground/10 px-5 text-ink-foreground placeholder:text-ink-foreground/50 focus:border-primary focus:outline-none"
            />
            <Button type="submit" variant="cta" size="xl" disabled={state === "loading"}>
              {t("newsletter_btn")}
            </Button>
          </form>
        </div>
        {state === "ok" && <p className="relative mt-4 text-sm text-fresh-soft">{t("newsletter_ok")}</p>}
        {state === "err" && <p className="relative mt-4 text-sm text-primary-soft">{t("newsletter_err")}</p>}
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-site flex flex-col gap-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p className="font-display font-bold text-foreground">FitLine<span className="text-primary">.</span></p>
        <p className="max-w-xl">{t("footer_disclaimer")}</p>
        <Link to="/admin" className="hover:text-foreground">Admin</Link>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Newsletter />
      <Footer />
    </div>
  );
}
