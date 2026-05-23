import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { onboardingService } from "@/services/onboardingService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/capture/$clientId")({
  component: CaptureForm,
});

function CaptureForm() {
  const { clientId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clientData, setClientData] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    cnpj_cpf: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    async function loadClient() {
      if (!clientId) return;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (data && !error) {
        setClientData(data);
        setForm({
          name: data.name || "",
          email: data.email || "",
          cnpj_cpf: data.cnpj_cpf || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      } else {
        toast.error("Cliente não encontrado.");
      }
      setLoading(false);
    }
    loadClient();
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase
      .from("clients")
      .update({
        name: form.name,
        email: form.email,
        cnpj_cpf: form.cnpj_cpf,
        phone: form.phone,
        address: form.address,
      })
      .eq("id", clientId);

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar os dados.");
      setSubmitting(false);
    } else {
      try {
        const payload = {
          nome_cliente: { label: "Nome completo", value: form.name },
          email_cliente: { label: "E-mail", value: form.email },
          telefone_cliente: { label: "Telefone / WhatsApp", value: form.phone },
          cpf_cnpj_cliente: { label: "CPF ou CNPJ", value: form.cnpj_cpf },
          endereco_cliente: { label: "Endereço completo", value: form.address },
          nome_projeto: { label: "Nome do projeto", value: `Onboarding ${form.name}` },
          valor_projeto: { label: "Valor do projeto", value: "0" },
          prazo_projeto: { label: "Prazo de entrega", value: new Date().toISOString().split('T')[0] }
        };

        await onboardingService.submitPublicForm({
          formId: "form_contractual_default",
          clientId,
          payload
        });
        
        setSuccess(true);
      } catch (onbErr) {
        console.error("Error resuming onboarding:", onbErr);
        toast.warning("Dados salvos, mas houve um problema ao iniciar a automação.");
        setSuccess(true);
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Carregando formulário...</div>
      </div>
    );
  }

  if (!clientData && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-card p-8 text-center border-destructive">
          <h1 className="text-xl font-bold text-destructive">Acesso Inválido</h1>
          <p className="text-muted-foreground mt-2">O link fornecido é inválido ou expirou.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Dados Recebidos!</h1>
          <p className="text-muted-foreground">
            Obrigado, {form.name.split(" ")[0]}! Seus dados foram salvos com sucesso e nosso time já está preparando seu contrato.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[var(--color-background)]">
      <div className="glass-card max-w-lg w-full p-6 sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Ficha de Cadastro</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Por favor, preencha seus dados fiscais para a geração do contrato.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo / Razão Social</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={submitting}
              className="bg-white/5"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cnpj_cpf">CNPJ / CPF</Label>
            <Input
              id="cnpj_cpf"
              required
              placeholder="00.000.000/0000-00"
              value={form.cnpj_cpf}
              onChange={(e) => setForm({ ...form, cnpj_cpf: e.target.value })}
              disabled={submitting}
              className="bg-white/5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail de Contato</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={submitting}
              className="bg-white/5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone / WhatsApp</Label>
            <Input
              id="phone"
              required
              placeholder="(00) 00000-0000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={submitting}
              className="bg-white/5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço Completo</Label>
            <Input
              id="address"
              required
              placeholder="Rua, Número, Bairro, Cidade - UF"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              disabled={submitting}
              className="bg-white/5"
            />
          </div>

          <Button type="submit" className="w-full mt-4" size="lg" disabled={submitting}>
            {submitting ? "Enviando dados..." : "Enviar e Gerar Contrato"}
          </Button>
        </form>
      </div>
    </div>
  );
}
