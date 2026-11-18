import { createFileRoute } from "@tanstack/react-router";
import App from "@/nova/App";
import ErrorBoundary from "@/nova/components/ErrorBoundary";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NOVA — Premium Streaming" },
      { name: "description", content: "Watch trending series, live TV, sports and clips on NOVA." },
      { property: "og:title", content: "NOVA — Premium Streaming" },
      { property: "og:description", content: "Watch trending series, live TV, sports and clips on NOVA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  ),
});
