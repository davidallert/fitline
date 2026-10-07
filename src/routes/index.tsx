import { createFileRoute, redirect } from "@tanstack/react-router";

// Root defaults to Swedish; English visitors use the switcher or /en.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/$lang", params: { lang: "sv" }, statusCode: 301 });
  },
});
