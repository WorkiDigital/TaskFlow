import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { teamMembers } from "@/lib/mock-data";
import { toast } from "sonner";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [agency, setAgency] = useState({
    name: "Agência Prime",
    domain: "agenciaprime.com",
    bio: "Estratégia, performance e branding para marcas que querem escalar.",
  });
  const [notifs, setNotifs] = useState({ email: true, push: false, weekly: true });

  const integrations = [
    { name: "WhatsApp", description: "Mensagens automatizadas via Evolution API" },
    { name: "Autentique", description: "Assinatura eletrônica de contratos" },
    { name: "Google Drive", description: "Sincronize documentos do cliente" },
    { name: "IA Studio", description: "Assistente para briefings e propostas" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Configurações</h2>
        <p className="text-sm text-muted-foreground">Personalize sua agência, equipe e integrações.</p>
      </div>

      <Tabs defaultValue="agency" className="space-y-6">
        <TabsList className="glass-panel">
          <TabsTrigger value="agency">Agência</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="agency" className="space-y-4">
          <GlassCard>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-xl font-semibold text-primary-foreground">
                AP
              </div>
              <div>
                <p className="text-sm font-medium">Logo da agência</p>
                <p className="text-xs text-muted-foreground">PNG ou SVG, máx 2MB</p>
                <Button variant="ghost" size="sm" className="mt-1 px-0 text-primary" onClick={() => toast("Upload (demo)")}>
                  Trocar logo
                </Button>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ag-name">Nome</Label>
                <Input id="ag-name" value={agency.name} onChange={(e) => setAgency({ ...agency, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ag-domain">Domínio</Label>
                <Input id="ag-domain" value={agency.domain} onChange={(e) => setAgency({ ...agency, domain: e.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="ag-bio">Sobre</Label>
                <Textarea id="ag-bio" rows={3} value={agency.bio} onChange={(e) => setAgency({ ...agency, bio: e.target.value })} />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={() => { console.log("[Settings] agência salva (mock):", agency); toast.success("Alterações salvas"); }}>
                Salvar
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="team" className="space-y-3">
          {teamMembers.map((m) => (
            <GlassCard key={m.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {m.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
              </div>
              <StatusBadge tone="success">Ativo</StatusBadge>
            </GlassCard>
          ))}
        </TabsContent>

        <TabsContent value="integrations" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {integrations.map((i) => (
            <GlassCard key={i.name} className="flex items-start justify-between gap-3 opacity-90">
              <div>
                <p className="font-medium">{i.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{i.description}</p>
              </div>
              <StatusBadge tone="neutral">Em breve</StatusBadge>
            </GlassCard>
          ))}
        </TabsContent>

        <TabsContent value="preferences">
          <GlassCard className="space-y-4">
            {[
              { key: "email" as const, label: "Notificações por e-mail", desc: "Receba atualizações importantes no seu e-mail." },
              { key: "push" as const, label: "Notificações push", desc: "Alertas em tempo real no navegador." },
              { key: "weekly" as const, label: "Resumo semanal", desc: "Recap de métricas toda segunda-feira." },
            ].map((p) => (
              <div key={p.key} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
                <Switch
                  checked={notifs[p.key]}
                  onCheckedChange={(v) => setNotifs({ ...notifs, [p.key]: v })}
                />
              </div>
            ))}
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
