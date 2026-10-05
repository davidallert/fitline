import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/subscribers")({
  component: Subscribers,
});

function Subscribers() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["subscribers"],
    queryFn: async () => (await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  function exportCsv() {
    const csv = "email,language,subscribed_at\n" + data.map((s) => `${s.email},${s.language},${s.created_at}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "subscribers.csv";
    a.click();
  }
  async function del(id: string) {
    if (!confirm("Remove subscriber?")) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["subscribers"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscribers ({data.length})</h1>
        <Button variant="outline" onClick={exportCsv} disabled={!data.length}><Download /> Export CSV</Button>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground"><tr><th className="p-3">Email</th><th className="p-3">Language</th><th className="p-3">Date</th><th className="p-3" /></tr></thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-3 font-medium">{s.email}</td>
                <td className="p-3 uppercase">{s.language}</td>
                <td className="p-3">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right"><button onClick={() => del(s.id)} className="text-muted-foreground hover:text-destructive">Remove</button></td>
              </tr>
            ))}
            {!data.length && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No subscribers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
