import { createFileRoute } from "@tanstack/react-router";
import { AgencyTemplatesManager } from "@/components/templates/AgencyTemplatesManager";

export const Route = createFileRoute("/_app/templates")({
  component: TemplatesPage,
});

function TemplatesPage() {
  return <AgencyTemplatesManager />;
}
