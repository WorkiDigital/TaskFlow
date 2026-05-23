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

async function requestEvolution(url: string, apiKey: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(payload?.message ?? payload?.error ?? `Evolution API retornou HTTP ${response.status}.`);
  }

  return payload;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, instanceName = "TaskFlow-Evolution-1" } = await req.json();
    const { baseUrl, apiKey } = await getEvolutionSettings(req);

    let result;

    if (action === "status") {
      try {
        result = await requestEvolution(`${baseUrl}/instance/connectionState/${instanceName}`, apiKey);
      } catch (error) {
        if (error instanceof Error && error.message.toLowerCase().includes("not found")) {
          result = { instance: { instanceName, state: "close" } };
        } else {
          throw error;
        }
      }
    } else if (action === "connect") {
      try {
        result = await requestEvolution(`${baseUrl}/instance/connect/${instanceName}`, apiKey);
      } catch (error) {
        if (!(error instanceof Error) || !error.message.toLowerCase().includes("not found")) {
          throw error;
        }

        result = await requestEvolution(`${baseUrl}/instance/create`, apiKey, {
          method: "POST",
          body: JSON.stringify({
            instanceName,
            integration: "WHATSAPP-BAILEYS",
            qrcode: true,
            groupsIgnore: false,
            alwaysOnline: true,
            readMessages: true,
            readStatus: true,
            syncFullHistory: false,
          }),
        });
      }
    } else if (action === "logout") {
      result = await requestEvolution(`${baseUrl}/instance/logout/${instanceName}`, apiKey, {
        method: "DELETE",
      });
    } else {
      throw new Error("Acao invalida para evolution-instance.");
    }

    return new Response(JSON.stringify(result), {
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
