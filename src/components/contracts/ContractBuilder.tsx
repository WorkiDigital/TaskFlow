import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ContractTemplate,
  listContractTemplates,
  createDraft,
  getContractTemplate,
  sendContractToAutentique,
  updateContract,
} from "@/services/contractsService";
import { ContractTemplateSelector } from "@/components/contracts/ContractTemplateSelector";
import { ContractPreviewPanel } from "@/components/contracts/ContractPreviewPanel";
import { ContractFileUpload } from "@/components/contracts/ContractFileUpload";
import { renderTemplate } from "@/lib/templateUtils";

export function ContractBuilder() {
  const [form, setForm] = useState({
    title: "Retainer mensal — ",
    client: "",
    value: "",
    signerName: "",
    signerEmail: "",
    clauses:
      "1. Escopo do serviço.\n2. Prazos de entrega.\n3. Forma de pagamento.\n4. Confidencialidade.",
  });
  const [draftId, setDraftId] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [sendingAutentique, setSendingAutentique] = useState(false);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setLoadingTemplates(true);
    listContractTemplates()
      .then((res) => {
        if (res.error) toast.error(res.error);
        else setTemplates(res.data ?? []);
      })
      .finally(() => setLoadingTemplates(false));
  }, []);

  useEffect(() => {
    if (!selectedTemplateId) return;
    getContractTemplate(selectedTemplateId)
      .then((res) => {
        if (res.error) toast.error(res.error);
        else if (res.data)
          setForm((prev) => ({ ...prev, clauses: res.data!.content ?? prev.clauses }));
      })
      .catch((e) => toast.error(String(e)));
  }, [selectedTemplateId]);

  const save = async () => {
    if (!form.title.trim() || !form.client.trim()) {
      toast.error("Título e cliente são obrigatórios");
      return;
    }
    const renderedContent = renderTemplate(form.clauses, {
      title: form.title,
      client: form.client,
      value: form.value,
    });
    const result = await createDraft({
      title: form.title,
      client_name: form.client,
      value: Number(form.value) || undefined,
      content: renderedContent,
      template_id: selectedTemplateId || undefined,
      signer_name: form.signerName || undefined,
      signer_email: form.signerEmail || undefined,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      const id = result.data?.id ?? "";
      setDraftId(id);
      toast.success("Contrato salvo como rascunho");
      console.log("[ContractBuilder] rascunho criado:", id);
    }
  };

  const sendToAutentique = async () => {
    if (!draftId) {
      toast.error("Salve o rascunho antes de enviar ao Autentique");
      return;
    }
    if (!form.signerEmail.trim()) {
      toast.error("E-mail do signatário é obrigatório para enviar ao Autentique");
      return;
    }
    if (!fileUrl) {
      toast.error("Faça upload de um arquivo PDF ou DOCX antes de enviar ao Autentique");
      return;
    }
    // Atualiza signatário caso tenha mudado após salvar
    await updateContract(draftId, {
      signer_name: form.signerName || undefined,
      signer_email: form.signerEmail,
    });
    setSendingAutentique(true);
    const res = await sendContractToAutentique(draftId, fileUrl || undefined);
    setSendingAutentique(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Contrato enviado ao Autentique para assinatura");
      console.log("[ContractBuilder] enviado ao Autentique:", res.data);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <GlassCard>
        <h3 className="text-base font-semibold">Editor</h3>
        <p className="text-sm text-muted-foreground">
          Monte um contrato a partir do template padrão.
        </p>

        <ContractTemplateSelector
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          onSelect={setSelectedTemplateId}
        />
        <ContractFileUpload onUpload={setFileUrl} />

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ct-title">Título</Label>
            <Input
              id="ct-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ct-client">Cliente</Label>
              <Input
                id="ct-client"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-value">Valor (R$)</Label>
              <Input
                id="ct-value"
                inputMode="numeric"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ct-signer-name">Nome do signatário</Label>
              <Input
                id="ct-signer-name"
                placeholder="Nome completo"
                value={form.signerName}
                onChange={(e) => setForm({ ...form, signerName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-signer-email">E-mail do signatário</Label>
              <Input
                id="ct-signer-email"
                type="email"
                placeholder="email@cliente.com"
                value={form.signerEmail}
                onChange={(e) => setForm({ ...form, signerEmail: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ct-clauses">Cláusulas</Label>
            <Textarea
              id="ct-clauses"
              rows={8}
              value={form.clauses}
              onChange={(e) => setForm({ ...form, clauses: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPreviewOpen(true)}>
              Pré-visualizar
            </Button>
            <Button onClick={save} disabled={loadingTemplates}>
              Salvar rascunho
            </Button>
            <Button onClick={sendToAutentique} disabled={!draftId || sendingAutentique}>
              {sendingAutentique ? "Enviando..." : "Enviar ao Autentique"}
            </Button>
          </div>
        </div>
      </GlassCard>

      <ContractPreviewPanel content={form.clauses.replace(/\n/g, "<br/>")} />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Contrato</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 py-2">
            <div className="border-b border-border pb-4 space-y-1">
              <h2 className="text-lg font-semibold m-0">{form.title || "Sem título"}</h2>
              {form.client && (
                <p className="text-sm text-muted-foreground m-0">
                  Cliente: <span className="font-medium text-foreground">{form.client}</span>
                </p>
              )}
              {form.value && (
                <p className="text-sm text-muted-foreground m-0">
                  Valor: <span className="font-medium text-foreground">R$ {form.value}</span>
                </p>
              )}
              {form.signerName && (
                <p className="text-sm text-muted-foreground m-0">
                  Signatário: <span className="font-medium text-foreground">{form.signerName}</span>
                </p>
              )}
              {form.signerEmail && (
                <p className="text-sm text-muted-foreground m-0">
                  E-mail: <span className="font-medium text-foreground">{form.signerEmail}</span>
                </p>
              )}
            </div>
            <div
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: renderTemplate(form.clauses, {
                  title: form.title,
                  client: form.client,
                  value: form.value,
                }).replace(/\n/g, "<br/>"),
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
