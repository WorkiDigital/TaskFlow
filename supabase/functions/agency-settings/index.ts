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
  ai_provider: string | null;
  ai_provider_keys: Record<string, string> | null;
  ai_model: string | null;
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
    ai_provider: settings?.ai_provider ?? "claude",
    ai_model: settings?.ai_model ?? null,
    ai_provider_configured: Boolean(
      settings?.ai_provider_keys &&
      settings.ai_provider &&
      (settings.ai_provider_keys as Record<string, string>)[settings.ai_provider]
    ),
  };
}

async function getSettings(supabaseClient: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabaseClient
    .from("agency_settings")
    .select("id, name, evolution_api_url, evolution_api_key, autentique_token, ai_provider, ai_provider_keys, ai_model")
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
    .select("id, name, evolution_api_url, evolution_api_key, autentique_token, ai_provider, ai_provider_keys, ai_model")
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
    const { action, token, url, apiKey, provider, model } = await req.json();
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

    if (action === "update_ai_provider") {
      const validProviders = ["claude", "gpt", "gemini"];
      if (!provider || !validProviders.includes(String(provider))) {
        throw new Error("Provider inválido. Use: claude, gpt ou gemini.");
      }

      const existingKeys = (settings.ai_provider_keys ?? {}) as Record<string, string>;
      const updatedKeys = apiKey ? { ...existingKeys, [String(provider)]: String(apiKey) } : existingKeys;

      const { data, error } = await supabaseClient
        .from("agency_settings")
        .update({
          ai_provider: String(provider),
          ai_provider_keys: updatedKeys,
          ai_model: model ? String(model) : null,
        })
        .eq("id", settings.id)
        .select("id, name, evolution_api_url, evolution_api_key, autentique_token, ai_provider, ai_provider_keys, ai_model")
        .single<AgencySettings>();

      if (error) throw error;

      return new Response(JSON.stringify(toPublicSettings(data)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_ai_provider") {
      return new Response(
        JSON.stringify({
          provider: settings.ai_provider ?? "claude",
          model: settings.ai_model ?? null,
          isConfigured: Boolean(
            settings.ai_provider_keys &&
            settings.ai_provider &&
            (settings.ai_provider_keys as Record<string, string>)[settings.ai_provider]
          ),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    throw new Error("Acao invalida para agency-settings.");
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
