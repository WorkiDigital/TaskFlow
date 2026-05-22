import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users } from "lucide-react";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { mockClients } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    console.log("[Clients] carregando clientes (mock)");
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mockClients;
    return mockClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Clientes</h2>
          <p className="text-sm text-muted-foreground">{mockClients.length} clientes na sua carteira</p>
        </div>
        <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Novo cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, e-mail ou empresa..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description="Tente outro termo de busca ou cadastre um novo cliente."
          actionLabel="Novo cliente"
          onAction={() => setOpen(true)}
        />
      ) : (
        <ClientsTable clients={filtered} />
      )}

      <ClientFormDialog open={open} onOpenChange={setOpen} onCreate={() => setQuery("")} />
    </div>
  );
}
