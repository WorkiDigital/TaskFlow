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
  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (!response.ok) {
    const message = payload?.response?.message ?? payload?.message ?? payload?.error;
    const detail = Array.isArray(message) ? message.join(" ") : message;
    throw new Error(detail ?? `Evolution API retornou HTTP ${response.status}: ${responseText || response.statusText}`);
  }

  return payload;
}

async function getInstanceApiKey(baseUrl: string, globalApiKey: string, instanceName: string) {
  const payload = await requestEvolution(
    `${baseUrl}/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`,
    globalApiKey,
  );

  if (!Array.isArray(payload) && typeof payload === "object") {
    return String(payload?.token ?? payload?.apikey ?? payload?.instance?.apikey ?? payload?.instance?.token ?? globalApiKey);
  }

  const instances = Array.isArray(payload) ? payload : Array.isArray(payload?.value) ? payload.value : [];
  const match = instances.find((item: Record<string, unknown>) => {
    const instance = item.instance as Record<string, unknown> | undefined;
    return instance?.instanceName === instanceName || item.name === instanceName;
  });
  const instance = match?.instance as Record<string, unknown> | undefined;

  return String(instance?.apikey ?? instance?.token ?? match?.token ?? match?.apikey ?? globalApiKey);
}

async function normalizeRecipient(baseUrl: string, apiKey: string, instanceName: string, number: string) {
  if (number.includes("@")) return number;

  const payload = await requestEvolution(`${baseUrl}/chat/whatsappNumbers/${instanceName}`, apiKey, {
    method: "POST",
    body: JSON.stringify({ numbers: [number] }),
  });
  const results = Array.isArray(payload) ? payload : Array.isArray(payload?.value) ? payload.value : [];
  const [result] = results as Array<Record<string, unknown>>;

  if (!result?.exists) {
    throw new Error(`Numero ${number} nao encontrado no WhatsApp.`);
  }

  const jid = String(result.jid ?? "");
  if (jid.endsWith("@s.whatsapp.net")) {
    return jid.replace("@s.whatsapp.net", "");
  }

  return String(result.number ?? number);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      action,
      instanceName = "TaskFlow-Evolution-1",
      number,
      text,
      delay = 1200,
      linkPreview = true,
      mentionsEveryOne = false,
      mentioned = [],
    } = await req.json();

    if (action !== "send_text") {
      throw new Error("Acao invalida para evolution-message.");
    }

    if (!number || !text) {
      throw new Error("Informe number e text para enviar a mensagem.");
    }

    const { baseUrl, apiKey } = await getEvolutionSettings(req);
    const instanceApiKey = await getInstanceApiKey(baseUrl, apiKey, instanceName);
    const recipient = await normalizeRecipient(baseUrl, instanceApiKey, instanceName, String(number));
    const messagePayload: Record<string, unknown> = {
      number: recipient,
      text,
      delay,
      linkPreview,
    };

    if (mentionsEveryOne) {
      messagePayload.mentionsEveryOne = true;
    }

    if (Array.isArray(mentioned) && mentioned.length > 0) {
      messagePayload.mentioned = mentioned;
    }

    const payload = await requestEvolution(`${baseUrl}/message/sendText/${instanceName}`, instanceApiKey, {
      method: "POST",
      body: JSON.stringify(messagePayload),
    });

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
