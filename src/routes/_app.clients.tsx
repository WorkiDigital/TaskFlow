import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users } from "lucide-react";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/services/supabase";
import { getCurrentUserAgency } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { agencyId } = await getCurrentUserAgency();
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        toast.error("Erro ao carregar clientes: " + error.message);
      } else {
        const mapped = (data || []).map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email || "",
          company: c.address || c.name,
          status: "active",
          mrr: 0,
          createdAt: c.created_at,
        }));
        setClients(mapped);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    const confirm = window.confirm(
      "Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.",
    );
    if (!confirm) return;

    try {
      const { agencyId } = await getCurrentUserAgency();
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id)
        .eq("agency_id", agencyId);

      if (error) {
        toast.error("Erro ao excluir cliente: " + error.message);
      } else {
        toast.success("Cliente excluído com sucesso!");
        loadClients();
      }
    } catch (err) {
      toast.error("Erro inesperado ao excluir cliente.");
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q),
    );
  }, [query, clients]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Clientes</h2>
          <p className="text-sm text-muted-foreground">{clients.length} clientes na sua carteira</p>
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
        <ClientsTable clients={filtered} onDelete={handleDeleteClient} />
      )}

      <ClientFormDialog open={open} onOpenChange={setOpen} onCreate={loadClients} />
    </div>
  );
}
