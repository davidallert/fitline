import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { grantAdmin, listAdmins, revokeAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/admins")({
  component: Admins,
});

function Admins() {
  const qc = useQueryClient();
  const list = useServerFn(listAdmins);
  const grant = useServerFn(grantAdmin);
  const revoke = useServerFn(revokeAdmin);
  const [email, setEmail] = useState("");
  const { data = [] } = useQuery({ queryKey: ["admins"], queryFn: () => list() });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await grant({ data: { email } });
      if (r.ok) { toast.success(r.message); setEmail(""); qc.invalidateQueries({ queryKey: ["admins"] }); }
      else toast.error(r.message);
    } catch (err) { toast.error((err as Error).message); }
  }
  async function remove(userId: string) {
    try { await revoke({ data: { userId } }); qc.invalidateQueries({ queryKey: ["admins"] }); }
    catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Admins</h1>
      <p className="text-sm text-muted-foreground">To invite someone: ask them to create an account at /auth, then enter their email here.</p>
      <form onSubmit={add} className="flex gap-2">
        <Input type="email" required placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button variant="cta" type="submit">Grant admin</Button>
      </form>
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {data.map((a) => (
          <div key={a.id} className="flex items-center justify-between p-4">
            <span className="font-medium">{a.email}</span>
            <button onClick={() => remove(a.id)} className="text-sm text-muted-foreground hover:text-destructive">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
