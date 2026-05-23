import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AgencySettings = {
  evolution_api_url: string | null;
  evolution_api_key: string | null;
};

async function getEvolutionSettings(req: Request): Promise<{ baseUrl: string; apiKey: string }> {
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    supabaseKey,
    { global: { headers: { Authorization: `Bearer ${supabaseKey}` } } },
  );

  const { data, error } = await supabaseClient
    .from("agency_settings")
    .select("evolution_api_url, evolution_api_key")
    .limit(1)
    .single<AgencySettings>();

  if (error || !data?.evolution_api_url || !data?.evolution_api_key) {
    throw new Error("Credenciais da Evolution API nao encontradas em agency_settings.");
  }

  return {
    baseUrl: data.evolution_api_url.replace(/\/$/, ""),
    apiKey: data.evolution_api_key,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { instanceName = "TaskFlow-Evolution-1", getParticipants = false } = await req.json();
    const { baseUrl, apiKey } = await getEvolutionSettings(req);
    const response = await fetch(
      `${baseUrl}/group/fetchAllGroups/${instanceName}?getParticipants=${getParticipants}`,
      {
        headers: {
          apikey: apiKey,
          "Content-Type": "application/json",
        },
      },
    );
    const text = await response.text();
    const payload = text ? JSON.parse(text) : [];

    if (!response.ok) {
      throw new Error(payload?.message ?? payload?.error ?? `Evolution API retornou HTTP ${response.status}.`);
    }

    return new Response(JSON.stringify(payload), {
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
