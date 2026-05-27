import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function getSupabaseAdmin() {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  return createClient(Deno.env.get("SUPABASE_URL") ?? "", key, {
    global: { headers: { Authorization: `Bearer ${key}` } },
  });
}

export function normalizePhone(value?: string | null): string {
  return String(value ?? "").replace(/\D/g, "");
}

export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => variables[String(key).trim()] ?? "");
}

export async function requestEvolution(url: string, apiKey: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  let resp: Response;
  try {
    resp = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Evolution API timeout após 15s: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
  const text = await resp.text();
  const payload = text ? JSON.parse(text) : {};
  if (!resp.ok) {
    const msg = payload?.response?.message ?? payload?.message ?? payload?.error;
    const detail = Array.isArray(msg) ? msg.join(" ") : msg;
    throw new Error(detail ?? `Evolution API retornou HTTP ${resp.status}: ${text || resp.statusText}`);
  }
  return payload;
}

export async function getInstanceApiKey(baseUrl: string, globalKey: string, instanceName: string): Promise<string> {
  try {
    const payload = await requestEvolution(
      `${baseUrl}/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`,
      globalKey,
    );
    const instances = Array.isArray(payload) ? payload : Array.isArray(payload?.value) ? payload.value : [payload];
    const match = instances.find((i: Record<string, unknown>) => {
      const inst = i.instance as Record<string, unknown> | undefined;
      return inst?.instanceName === instanceName || i.name === instanceName;
    });
    const inst = (match?.instance as Record<string, unknown> | undefined) ?? match ?? {};
    return String(inst.apikey ?? inst.token ?? globalKey);
  } catch {
    return globalKey;
  }
}

export function extractGroupJid(payload: Record<string, unknown>): string {
  const candidates = [
    payload.jid,
    payload.id,
    payload.groupJid,
    payload.remoteJid,
    (payload.group as Record<string, unknown> | undefined)?.jid,
    (payload.group as Record<string, unknown> | undefined)?.id,
  ];
  return candidates.map(v => String(v ?? "")).find(v => v.endsWith("@g.us")) ?? "";
}
