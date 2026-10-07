import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export type Lang = "sv" | "en";

const dict = {
  sv: {
    nav_home: "Hem",
    nav_products: "Produkter",
    nav_why: "Varför FitLine",
    shop_cta: "Handla hos FitLine",
    hero_kicker: "Näring på cellnivå",
    hero_title: "Känn skillnaden. Varje dag.",
    hero_sub: "Premiumtillskott från Tyskland med patenterad NTC®-teknik – för mer energi, bättre återhämtning och välmående inifrån.",
    hero_cta: "Utforska produkterna",
    hero_secondary: "Varför FitLine?",
    trust_1: "Kölner Liste®-listad",
    trust_2: "Över 30 år av forskning",
    trust_3: "Används av världens elitidrottare",
    categories_title: "Hitta det som passar dig",
    featured_title: "Mest älskade",
    featured_sub: "Produkterna som våra kunder kommer tillbaka till.",
    view_all: "Se alla",
    ntc_title: "Hemligheten heter NTC®",
    ntc_body: "Nutrient Transport Concept levererar näringsämnena dit de behövs – när de behövs. Det betyder att din kropp faktiskt kan ta upp det du ger den.",
    benefit_1_t: "Snabbt upptag",
    benefit_1_b: "Pulverdrycker som kroppen tar upp effektivt.",
    benefit_2_t: "Dopingfritt",
    benefit_2_b: "Testade och listade för elitidrott.",
    benefit_3_t: "Enkelt i vardagen",
    benefit_3_b: "En dryck på morgonen, en på kvällen.",
    newsletter_title: "Få tips & erbjudanden",
    newsletter_sub: "Hälsotips, nya produkter och kampanjer direkt i inkorgen. Inget spam.",
    newsletter_placeholder: "Din e-postadress",
    newsletter_btn: "Prenumerera",
    newsletter_ok: "Tack! Du är nu prenumerant.",
    newsletter_err: "Ange en giltig e-postadress.",
    all_products: "Alla produkter",
    products_sub: "Utforska hela sortimentet och köp direkt hos FitLine.",
    buy: "Köp hos FitLine",
    read_more: "Läs mer",
    benefits: "Fördelar",
    about_product: "Om produkten",
    article: "Art.nr",
    related: "Du kanske också gillar",
    not_found: "Produkten hittades inte",
    back: "Tillbaka till produkter",
    affiliate_note: "Du skickas vidare till FitLines officiella webbshop för att slutföra köpet.",
    footer_disclaimer: "Detta är en oberoende partnersida. Alla köp sker via FitLines officiella webbshop.",
    new_badge: "Nyhet",
    empty: "Inga produkter här ännu.",
    from: "kr",
  },
  en: {
    nav_home: "Home",
    nav_products: "Products",
    nav_why: "Why FitLine",
    shop_cta: "Shop at FitLine",
    hero_kicker: "Nutrition at cell level",
    hero_title: "Feel the difference. Every day.",
    hero_sub: "Premium supplements from Germany with patented NTC® technology – for more energy, better recovery and wellbeing from within.",
    hero_cta: "Explore products",
    hero_secondary: "Why FitLine?",
    trust_1: "Listed on the Cologne List®",
    trust_2: "30+ years of research",
    trust_3: "Trusted by elite athletes",
    categories_title: "Find what fits you",
    featured_title: "Most loved",
    featured_sub: "The products our customers keep coming back to.",
    view_all: "View all",
    ntc_title: "The secret is NTC®",
    ntc_body: "The Nutrient Transport Concept delivers nutrients where they're needed – when they're needed. So your body can actually absorb what you give it.",
    benefit_1_t: "Fast absorption",
    benefit_1_b: "Powder drinks your body absorbs efficiently.",
    benefit_2_t: "Doping-free",
    benefit_2_b: "Tested and listed for elite sport.",
    benefit_3_t: "Easy every day",
    benefit_3_b: "One drink in the morning, one at night.",
    newsletter_title: "Get tips & offers",
    newsletter_sub: "Health tips, new products and promotions straight to your inbox. No spam.",
    newsletter_placeholder: "Your email address",
    newsletter_btn: "Subscribe",
    newsletter_ok: "Thanks! You're subscribed.",
    newsletter_err: "Please enter a valid email.",
    all_products: "All products",
    products_sub: "Explore the full range and buy directly from FitLine.",
    buy: "Buy at FitLine",
    read_more: "Read more",
    benefits: "Benefits",
    about_product: "About the product",
    article: "Item no.",
    related: "You may also like",
    not_found: "Product not found",
    back: "Back to products",
    affiliate_note: "You'll be redirected to FitLine's official shop to complete your purchase.",
    footer_disclaimer: "This is an independent partner site. All purchases are made through FitLine's official shop.",
    new_badge: "New",
    empty: "No products here yet.",
    from: "SEK",
  },
} as const;

export type DictKey = keyof (typeof dict)["sv"];

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string };
const LangContext = createContext<Ctx | null>(null);

export function langFromPath(pathname: string): Lang {
  return pathname.split("/")[1] === "en" ? "en" : "sv";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const navigate = useNavigate();
  const lang = langFromPath(pathname);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    const parts = pathname.split("/");
    if (parts[1] === "sv" || parts[1] === "en") {
      parts[1] = l;
      navigate({ href: parts.join("/") + (search ?? "") });
    } else navigate({ to: "/$lang", params: { lang: l } });
  };
  return (
    <LangContext.Provider value={{ lang, setLang, t: (k) => dict[lang][k] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

/** Pick a localized field (e.g. name_sv / name_en), falling back to Swedish. */
export function pick<T extends Record<string, unknown>>(obj: T, field: string, lang: Lang): string {
  const v = obj[`${field}_${lang}`] as string | null | undefined;
  return (v && v.trim()) || ((obj[`${field}_sv`] as string | null) ?? "");
}
