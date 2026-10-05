import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Cat = Database["public"]["Tables"]["categories"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

function Row({ c, onDone }: { c?: Cat; onDone: () => void }) {
  const [v, setV] = useState({
    slug: c?.slug ?? "", name_sv: c?.name_sv ?? "", name_en: c?.name_en ?? "",
    description_sv: c?.description_sv ?? "", description_en: c?.description_en ?? "", sort_order: String(c?.sort_order ?? 0),
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  async function save() {
    if (!v.name_sv || !v.slug) { toast.error("Slug and Swedish name are required"); return; }
    const payload = { ...v, name_en: v.name_en || v.name_sv, sort_order: Number(v.sort_order) || 0 };
    const { error } = c
      ? await supabase.from("categories").update(payload).eq("id", c.id)
      : await supabase.from("categories").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    onDone();
  }
  async function del() {
    if (!c || !confirm("Delete category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    onDone();
  }

  return (
    <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 md:grid-cols-6">
      <Input placeholder="slug" value={v.slug} onChange={set("slug")} />
      <Input placeholder="Namn (sv)" value={v.name_sv} onChange={set("name_sv")} />
      <Input placeholder="Name (en)" value={v.name_en} onChange={set("name_en")} />
      <Input placeholder="Beskrivning (sv)" value={v.description_sv} onChange={set("description_sv")} />
      <Input placeholder="Description (en)" value={v.description_en} onChange={set("description_en")} />
      <div className="flex gap-2">
        <Input className="w-16" value={v.sort_order} onChange={set("sort_order")} />
        <Button variant="cta" onClick={save}>{c ? "Save" : "Add"}</Button>
        {c && <Button variant="outline" onClick={del}>✕</Button>}
      </div>
    </div>
  );
}

function AdminCategories() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const done = () => qc.invalidateQueries();
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Categories</h1>
      {data.map((c) => <Row key={c.id} c={c} onDone={done} />)}
      <h2 className="pt-4 font-semibold">Add category</h2>
      <Row key={data.length} onDone={done} />
    </div>
  );
}
