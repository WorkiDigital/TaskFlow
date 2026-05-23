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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { contractId, fileUrl } = await req.json();
    if (!contractId) throw new Error("contractId é obrigatório");
    if (!fileUrl) throw new Error("É necessário fazer upload de um arquivo PDF ou DOCX antes de enviar ao Autentique");

    const supabase = getSupabaseAdmin();

    // 1. Busca o contrato
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, title, content, signer_name, signer_email, client_name")
      .eq("id", contractId)
      .maybeSingle();

    if (contractError) throw new Error(contractError.message);
    if (!contract) throw new Error("Contrato não encontrado");
    if (!contract.signer_email) throw new Error("E-mail do signatário não preenchido no contrato");

    // 2. Busca token Autentique
    const { data: settings, error: settingsError } = await supabase
      .from("agency_settings")
      .select("autentique_token")
      .limit(1)
      .single();

    if (settingsError) throw new Error(settingsError.message);
    const token = settings?.autentique_token;
    if (!token) throw new Error("Token Autentique não configurado. Acesse Configurações → Integrações → Autentique.");

    console.log("[ContractSendAutentique] Enviando contrato:", contractId, "para:", contract.signer_email);

    // 3. Baixa o arquivo como binário (PDF/DOCX — preserva formato original)
    const fileResp = await fetch(fileUrl);
    if (!fileResp.ok) {
      throw new Error(`Não foi possível baixar o arquivo do contrato (HTTP ${fileResp.status})`);
    }
    const fileBuffer = await fileResp.arrayBuffer();
    const contentType = fileResp.headers.get("content-type") || "application/pdf";

    // Deriva extensão a partir da URL do arquivo
    const urlPath = fileUrl.split("?")[0]; // remove query params
    const rawExt = urlPath.split(".").pop()?.toLowerCase() ?? "pdf";
    const safeExt = ["pdf", "docx", "doc", "odt"].includes(rawExt) ? rawExt : "pdf";
    const fileName = `contrato-${contractId}.${safeExt}`;

    const fileBlob = new Blob([fileBuffer], { type: contentType });

    // 4. Monta multipart para Autentique GraphQL (spec: chave numérica "0")
    const operations = {
      query: `mutation CreateDocument($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
        createDocument(document: $document, signers: $signers, file: $file) {
          id
          name
          signatures { public_id name email link { short_link } }
        }
      }`,
      variables: {
        document: { name: contract.title ?? `Contrato ${contractId}` },
        signers: [{
          email: contract.signer_email,
          name: contract.signer_name ?? contract.client_name ?? "Signatário",
          action: "SIGN",
        }],
        file: null,
      },
    };

    const formData = new FormData();
    formData.append("operations", JSON.stringify(operations));
    formData.append("map", JSON.stringify({ "0": ["variables.file"] }));
    formData.append("0", fileBlob, fileName);

    // 5. Chama Autentique
    const response = await fetch("https://api.autentique.com.br/v2/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.errors) {
      const msg = Array.isArray(payload.errors)
        ? payload.errors.map((e: { message: string }) => e.message).join(" | ")
        : (payload.message ?? `Autentique retornou HTTP ${response.status}`);
      throw new Error(msg);
    }

    const document = payload?.data?.createDocument ?? {};
    const signatureUrl = document?.signatures?.[0]?.link?.short_link ?? null;

    // 6. Atualiza contrato
    await supabase
      .from("contracts")
      .update({
        status: "sent",
        autentique_document_id: document.id ?? null,
        signature_url: signatureUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    console.log("[ContractSendAutentique] Enviado com sucesso. DocumentId:", document.id);

    return new Response(
      JSON.stringify({ success: true, documentId: document.id ?? null, signatureUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[ContractSendAutentique] Erro:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
