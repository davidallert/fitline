import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"] & { category_slugs: string[] };
export type Category = Database["public"]["Tables"]["categories"]["Row"];

function publicClient() {
  return createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const SELECT = "*, product_categories(categories(slug))";

type Raw = Database["public"]["Tables"]["products"]["Row"] & {
  product_categories: { categories: { slug: string } | null }[];
};
function shape(rows: Raw[]): Product[] {
  return rows.map(({ product_categories, ...p }) => ({
    ...p,
    category_slugs: product_categories.map((pc) => pc.categories?.slug).filter(Boolean) as string[],
  }));
}

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient().from("categories").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data;
});

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ featured: z.boolean().optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    let q = publicClient().from("products").select(SELECT).eq("is_published", true).order("sort_order");
    if (data.featured) q = q.eq("is_featured", true);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return shape(rows as unknown as Raw[]);
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await publicClient()
      .from("products")
      .select(SELECT)
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? shape([row as unknown as Raw])[0] : null;
  });
