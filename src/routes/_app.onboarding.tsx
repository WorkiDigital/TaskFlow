import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { OnboardingWorkspace } from "@/components/onboarding/OnboardingWorkspace";

export const Route = createFileRoute("/_app/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  useEffect(() => {
    console.log("[Onboarding] workspace carregado");
  }, []);

  return <OnboardingWorkspace />;
}
