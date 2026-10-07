import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy URL — permanently redirect to the Swedish version.
export const Route = createFileRoute("/products/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/$lang/products/$slug", params: { lang: "sv", slug: params.slug }, statusCode: 301 });
  },
});
