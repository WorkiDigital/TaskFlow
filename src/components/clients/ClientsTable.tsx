import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Client, ClientStatus } from "@/lib/types";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const statusMap: Record<
  ClientStatus,
  { label: string; tone: Parameters<typeof StatusBadge>[0]["tone"] }
> = {
  active: { label: "Ativo", tone: "success" },
  onboarding: { label: "Onboarding", tone: "primary" },
  paused: { label: "Pausado", tone: "warning" },
  churned: { label: "Churn", tone: "danger" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);

export function ClientsTable({
  clients,
  onDelete,
}: {
  clients: Client[];
  onDelete: (id: string) => void;
}) {
  const copyLink = (clientId: string) => {
    const url = `${window.location.origin}/capture/${clientId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
        <table className="w-full">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">MRR</th>
              <th className="px-4 py-3 font-medium">Desde</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {clients.map((c) => {
              const s = statusMap[c.status];
              return (
                <tr key={c.id} className="transition-colors hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </td>
                  <td className="px-4 py-3">{c.company}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
                  </td>
                  <td className="px-4 py-3">{c.mrr > 0 ? fmt(c.mrr) : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ações">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card">
                        <DropdownMenuItem onClick={() => copyLink(c.id)} className="cursor-pointer">
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar Link Captação
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(c.id)}
                          className="cursor-pointer text-red-400 focus:bg-red-500/20 focus:text-red-300"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir Cliente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {clients.map((c) => {
          const s = statusMap[c.status];
          return (
            <div key={c.id} className="glass-card p-4 relative">
              <div className="absolute right-4 top-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Ações" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-card">
                    <DropdownMenuItem onClick={() => copyLink(c.id)} className="cursor-pointer">
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Link Captação
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(c.id)}
                      className="cursor-pointer text-red-400 focus:bg-red-500/20 focus:text-red-300"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Cliente
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-start justify-between gap-3 pr-8">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.company}</p>
                </div>
              </div>
              <div className="mt-2 mb-3">
                <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>MRR {c.mrr > 0 ? fmt(c.mrr) : "—"}</span>
                <span>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
