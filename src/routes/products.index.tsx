import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

// Legacy URL — permanently redirect to the Swedish version.
export const Route = createFileRoute("/products/")({
  validateSearch: z.object({ category: z.string().optional() }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/$lang/products", params: { lang: "sv" }, search, statusCode: 301 });
  },
});
