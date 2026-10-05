import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { productBuyUrl } from "@/config/site";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  component: EditProduct,
});

type Form = {
  slug: string; article_number: string; name_sv: string; name_en: string;
  tagline_sv: string; tagline_en: string; description_sv: string; description_en: string;
  benefits_sv: string; benefits_en: string; price: string; image_url: string; gallery: string[];
  external_url: string; is_featured: boolean; is_new: boolean; is_published: boolean; sort_order: string;
};
const empty: Form = {
  slug: "", article_number: "", name_sv: "", name_en: "", tagline_sv: "", tagline_en: "",
  description_sv: "", description_en: "", benefits_sv: "", benefits_en: "", price: "", image_url: "",
  gallery: [], external_url: "", is_featured: false, is_new: false, is_published: true, sort_order: "0",
};

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function uploadImage(file: File) {
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file);
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2) throw e2;
  return data.signedUrl;
}

function EditProduct() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState<Form>(empty);
  const [cats, setCats] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const { data: existing } = useQuery({
    queryKey: ["admin-product", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, product_categories(category_id)").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    const s = (v: unknown) => (v == null ? "" : String(v));
    setF({
      slug: existing.slug, article_number: s(existing.article_number), name_sv: existing.name_sv, name_en: existing.name_en,
      tagline_sv: s(existing.tagline_sv), tagline_en: s(existing.tagline_en), description_sv: s(existing.description_sv),
      description_en: s(existing.description_en), benefits_sv: s(existing.benefits_sv), benefits_en: s(existing.benefits_en),
      price: s(existing.price), image_url: s(existing.image_url), gallery: existing.gallery ?? [], external_url: s(existing.external_url),
      is_featured: existing.is_featured, is_new: existing.is_new, is_published: existing.is_published, sort_order: s(existing.sort_order),
    });
    setCats(existing.product_categories.map((pc: { category_id: string }) => pc.category_id));
  }, [existing]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>, target: "main" | "gallery") {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await uploadImage(file);
      if (target === "main") set("image_url", url);
      else set("gallery", [...f.gallery, url]);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function save() {
    if (!f.name_sv.trim()) { toast.error("Swedish name is required"); return; }
    setSaving(true);
    const payload = {
      slug: f.slug.trim() || slugify(f.name_sv),
      article_number: f.article_number.trim() || null,
      name_sv: f.name_sv.trim(), name_en: f.name_en.trim() || f.name_sv.trim(),
      tagline_sv: f.tagline_sv || null, tagline_en: f.tagline_en || null,
      description_sv: f.description_sv || null, description_en: f.description_en || null,
      benefits_sv: f.benefits_sv || null, benefits_en: f.benefits_en || null,
      price: f.price ? Number(f.price) : null, image_url: f.image_url || null, gallery: f.gallery,
      external_url: f.external_url.trim() || null, is_featured: f.is_featured, is_new: f.is_new,
      is_published: f.is_published, sort_order: Number(f.sort_order) || 0,
    };
    const res = isNew
      ? await supabase.from("products").insert(payload).select("id").single()
      : await supabase.from("products").update(payload).eq("id", id).select("id").single();
    if (res.error) { setSaving(false); { toast.error(res.error.message); return; } }
    const pid = res.data.id;
    await supabase.from("product_categories").delete().eq("product_id", pid);
    if (cats.length) await supabase.from("product_categories").insert(cats.map((c) => ({ product_id: pid, category_id: c })));
    setSaving(false);
    qc.invalidateQueries();
    toast.success("Saved");
    if (isNew) navigate({ to: "/admin/products/$id", params: { id: pid } });
  }

  async function remove() {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries();
    navigate({ to: "/admin" });
  }

  const field = (k: keyof Form, label: string, area = false) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {area ? (
        <Textarea rows={4} value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} />
      ) : (
        <Input value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Products</Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isNew ? "New product" : f.name_sv}</h1>
        <div className="flex gap-2">
          {!isNew && <Button variant="outline" onClick={remove}><Trash2 /> Delete</Button>}
          <Button variant="cta" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
            <h2 className="font-semibold md:col-span-2">Svenska</h2>
            {field("name_sv", "Namn")}
            {field("tagline_sv", "Kort beskrivning")}
            <div className="md:col-span-2">{field("description_sv", "Beskrivning", true)}</div>
            <div className="md:col-span-2">{field("benefits_sv", "Fördelar (en per rad)", true)}</div>
          </section>
          <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
            <h2 className="font-semibold md:col-span-2">English</h2>
            {field("name_en", "Name")}
            {field("tagline_en", "Short description")}
            <div className="md:col-span-2">{field("description_en", "Description", true)}</div>
            <div className="md:col-span-2">{field("benefits_en", "Benefits (one per line)", true)}</div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Images</h2>
            <div className="aspect-square rounded-xl bg-product p-4">{f.image_url && <img src={f.image_url} alt="" className="size-full object-contain" />}</div>
            {field("image_url", "Main image URL")}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-border py-2 text-sm font-semibold hover:border-primary">
              <Upload className="size-4" /> Upload main image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e, "main")} />
            </label>
            <div className="flex flex-wrap gap-2">
              {f.gallery.map((g) => (
                <div key={g} className="relative size-16 rounded-lg bg-product p-1">
                  <img src={g} alt="" className="size-full object-contain" />
                  <button onClick={() => set("gallery", f.gallery.filter((x) => x !== g))} className="absolute -right-1 -top-1 rounded-full bg-foreground p-0.5 text-background"><X className="size-3" /></button>
                </div>
              ))}
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-border py-2 text-sm font-semibold hover:border-primary">
              <Upload className="size-4" /> Add gallery image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e, "gallery")} />
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Details & link</h2>
            {field("price", "Price (SEK)")}
            {field("article_number", "FitLine article number")}
            {field("external_url", "Custom buy link (optional)")}
            <p className="break-all text-xs text-muted-foreground">Buy button goes to: {productBuyUrl({ external_url: f.external_url, article_number: f.article_number })}</p>
            {field("slug", "URL slug")}
            {field("sort_order", "Sort order")}
            {([["is_published", "Published"], ["is_featured", "Featured on home"], ["is_new", "New badge"]] as const).map(([k, l]) => (
              <div key={k} className="flex items-center justify-between"><Label>{l}</Label><Switch checked={f[k]} onCheckedChange={(v) => set(k, v)} /></div>
            ))}
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Categories</h2>
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-primary" checked={cats.includes(c.id)} onChange={(e) => setCats(e.target.checked ? [...cats, c.id] : cats.filter((x) => x !== c.id))} />
                {c.name_sv} / {c.name_en}
              </label>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
