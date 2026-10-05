import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin – FitLine Partner" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return !!data;
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const tab = "rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground";
  const active = { className: "bg-foreground !text-background" };

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card">
        <div className="container-site flex h-16 items-center justify-between gap-4">
          <Link to="/" className="font-display text-lg font-bold">FitLine<span className="text-primary">.</span> Admin</Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
          </div>
        </div>
        {isAdmin && (
          <nav className="container-site flex gap-1 overflow-x-auto pb-3">
            <Link to="/admin" activeOptions={{ exact: true }} activeProps={active} className={tab}>Products</Link>
            <Link to="/admin/categories" activeProps={active} className={tab}>Categories</Link>
            <Link to="/admin/subscribers" activeProps={active} className={tab}>Subscribers</Link>
            <Link to="/admin/admins" activeProps={active} className={tab}>Admins</Link>
          </nav>
        )}
      </header>
      <main className="container-site py-8">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : isAdmin ? (
          <Outlet />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8">
            <h1 className="text-xl font-bold">No admin access</h1>
            <p className="mt-2 text-muted-foreground">Your account isn't an admin yet. Ask an existing admin to grant you access.</p>
          </div>
        )}
      </main>
    </div>
  );
}
