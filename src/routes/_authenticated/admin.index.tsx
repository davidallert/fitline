import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminProducts,
});

function AdminProducts() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  async function toggle(id: string, field: "is_published" | "is_featured", value: boolean) {
    const { error } = await supabase.from("products").update(field === "is_published" ? { is_published: value } : { is_featured: value }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products ({data.length})</h1>
        <Button asChild variant="cta"><Link to="/admin/products/$id" params={{ id: "new" }}><Plus /> New product</Link></Button>
      </div>
      {isLoading ? <p className="mt-6 text-muted-foreground">Loading…</p> : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr><th className="p-3">Product</th><th className="p-3">Price</th><th className="p-3">Published</th><th className="p-3">Featured</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="size-12 shrink-0 rounded-lg bg-product p-1">{p.image_url && <img src={p.image_url} alt="" className="size-full object-contain" />}</div>
                      <div><p className="font-semibold">{p.name_sv}</p><p className="text-xs text-muted-foreground">/{p.slug}</p></div>
                    </div>
                  </td>
                  <td className="p-3">{p.price ?? "–"} {p.currency}</td>
                  <td className="p-3"><Switch checked={p.is_published} onCheckedChange={(v) => toggle(p.id, "is_published", v)} /></td>
                  <td className="p-3"><Switch checked={p.is_featured} onCheckedChange={(v) => toggle(p.id, "is_featured", v)} /></td>
                  <td className="p-3 text-right"><Link to="/admin/products/$id" params={{ id: p.id }} className="font-semibold text-primary">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
