import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (params.lang !== "sv" && params.lang !== "en") throw notFound();
  },
  component: () => <Outlet />,
});
