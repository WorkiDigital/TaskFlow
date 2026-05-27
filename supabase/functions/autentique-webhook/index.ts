import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseAdmin() {
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    supabaseKey,
    { global: { headers: { Authorization: `Bearer ${supabaseKey}` } } },
  );
}

function findDocumentId(payload: Record<string, unknown>) {
  const document = payload.document as Record<string, unknown> | undefined;
  const data = payload.data as Record<string, unknown> | undefined;
  const object = payload.object as Record<string, unknown> | undefined;

  return String(
    payload.document_id
      ?? payload.documentId
      ?? payload.id
      ?? document?.id
      ?? data?.id
      ?? data?.document_id
      ?? object?.id
      ?? "",
  );
}

function isSignedEvent(payload: Record<string, unknown>) {
  const event = String(payload.event ?? payload.type ?? payload.action ?? payload.status ?? "").toLowerCase();
  const document = payload.document as Record<string, unknown> | undefined;
  const data = payload.data as Record<string, unknown> | undefined;
  const status = String(document?.status ?? data?.status ?? "").toLowerCase();

  return event.includes("signed")
    || event.includes("signature")
    || event.includes("completed")
    || status === "signed"
    || status === "completed";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const webhookSecret = Deno.env.get("AUTENTIQUE_WEBHOOK_SECRET") ?? "";
  if (webhookSecret) {
    const provided = req.headers.get("x-webhook-secret") ?? new URL(req.url).searchParams.get("secret") ?? "";
    if (provided !== webhookSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
      });
    }
  }

  const supabase = getSupabaseAdmin();

  try {
    const payload = await req.json() as Record<string, unknown>;
    const documentId = findDocumentId(payload);

    if (!documentId) {
      return new Response(JSON.stringify({ received: true, matched: false, reason: "document_id ausente" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!isSignedEvent(payload)) {
      return new Response(JSON.stringify({ received: true, matched: false, documentId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .update({
        status: "signed",
        signed_at: new Date().toISOString(),
        signed_payload: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("autentique_document_id", documentId)
      .select("id, client_id, agency_id, deal_id")
      .maybeSingle<{ id: string; client_id: string | null; agency_id: string | null; deal_id: string | null }>();

    if (contractError) throw contractError;

    // Atualiza status do Deal e verifica o modo de início do onboarding
    let shouldAutoStartOnboarding = false;
    if (contract?.deal_id) {
      const { data: deal } = await supabase
        .from("client_deals")
        .update({ status: "contract_signed", updated_at: new Date().toISOString() })
        .eq("id", contract.deal_id)
        .select("onboarding_start_mode")
        .maybeSingle<{ onboarding_start_mode: string }>();

      if (deal?.onboarding_start_mode === "automatic_after_signature") {
        shouldAutoStartOnboarding = true;
      }
    }

    if (contract?.client_id) {
      const { data: run } = await supabase
        .from("onboarding_runs")
        .select("id")
        .eq("client_id", contract.client_id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string }>();

      if (run?.id) {
        await supabase.from("onboarding_step_logs").insert({
          run_id: run.id,
          step_id: "autentique_contract_signed",
          step_name: "Contrato assinado no Autentique",
          status: "completed",
          message: "Webhook do Autentique recebido e contrato marcado como assinado.",
          metadata: { contractId: contract.id, documentId },
        });
      }

      // Dispara automações com trigger contract_signed
      if (contract.agency_id) {
        try {
          await supabase.functions.invoke("automation-execute", {
            body: {
              trigger: "contract_signed",
              agencyId: contract.agency_id,
              clientId: contract.client_id,
              contractId: contract.id,
            },
          });
          console.log("[AutentiqueWebhook] automation-execute disparado para agency:", contract.agency_id);
        } catch (automationErr) {
          console.error("[AutentiqueWebhook] Falha ao disparar automation-execute:", automationErr);
        }

        if (shouldAutoStartOnboarding) {
          try {
            await supabase.functions.invoke("onboarding-execute", {
              body: { clientId: contract.client_id }
            });
            console.log("[AutentiqueWebhook] onboarding-execute auto-iniciado");
          } catch (onboardingErr) {
            console.error("[AutentiqueWebhook] Falha ao iniciar onboarding-execute:", onboardingErr);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true, matched: Boolean(contract), documentId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
