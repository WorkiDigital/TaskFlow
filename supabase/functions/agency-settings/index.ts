import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AgencySettings = {
  id: string;
  name: string;
  evolution_api_url: string | null;
  evolution_api_key: string | null;
  autentique_token: string | null;
};

function createAdminClient() {
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  return createClient(Deno.env.get("SUPABASE_URL") ?? "", supabaseKey, {
    global: { headers: { Authorization: `Bearer ${supabaseKey}` } },
  });
}

function toPublicSettings(settings: AgencySettings | null) {
  return {
    id: settings?.id,
    name: settings?.name ?? "Agencia Prime",
    evolution_api_url: settings?.evolution_api_url ?? undefined,
    is_autentique_configured: Boolean(settings?.autentique_token),
    is_evolution_configured: Boolean(settings?.evolution_api_url && settings?.evolution_api_key),
  };
}

async function getSettings(supabaseClient: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabaseClient
    .from("agency_settings")
    .select("id, name, evolution_api_url, evolution_api_key, autentique_token")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<AgencySettings>();

  if (error) {
    throw error;
  }

  return data;
}

async function ensureSettings(supabaseClient: ReturnType<typeof createAdminClient>) {
  const existing = await getSettings(supabaseClient);
  if (existing) return existing;

  const { data, error } = await supabaseClient
    .from("agency_settings")
    .insert({ name: "Agencia Prime" })
    .select("id, name, evolution_api_url, evolution_api_key, autentique_token")
    .single<AgencySettings>();

  if (error) {
    throw error;
  }

  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, token, url, apiKey } = await req.json();
    const supabaseClient = createAdminClient();
    const settings = await ensureSettings(supabaseClient);

    if (action === "get_public") {
      return new Response(JSON.stringify(toPublicSettings(settings)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_autentique_token") {
      const { data, error } = await supabaseClient
        .from("agency_settings")
        .update({ autentique_token: String(token ?? "") })
        .eq("id", settings.id)
        .select("id, name, evolution_api_url, evolution_api_key, autentique_token")
        .single<AgencySettings>();

      if (error) throw error;

      return new Response(JSON.stringify(toPublicSettings(data)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_evolution_config") {
      if (!url || !apiKey) {
        throw new Error("Informe URL e API key da Evolution.");
      }

      const { data, error } = await supabaseClient
        .from("agency_settings")
        .update({ evolution_api_url: String(url), evolution_api_key: String(apiKey) })
        .eq("id", settings.id)
        .select("id, name, evolution_api_url, evolution_api_key, autentique_token")
        .single<AgencySettings>();

      if (error) throw error;

      return new Response(JSON.stringify(toPublicSettings(data)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Acao invalida para agency-settings.");
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
