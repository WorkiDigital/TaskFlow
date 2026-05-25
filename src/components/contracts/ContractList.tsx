import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Contract } from "@/lib/types";
import { FileText, ExternalLink, MoreVertical, Trash2, Pencil } from "lucide-react";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { listContracts, deleteContract, updateContract } from "@/services/contractsService";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function ContractList() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    value: "",
    signerName: "",
    signerEmail: "",
  });
  const [saving, setSaving] = useState(false);

  const loadContracts = () => {
    setLoading(true);
    listContracts().then((result) => {
      if (result.error) {
        setError(result.error);
      } else {
        setContracts(result.data ?? []);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este contrato?")) return;
    const res = await deleteContract(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Contrato excluído com sucesso");
      loadContracts();
    }
  };

  const handleEditClick = (c: Contract) => {
    setEditingContract(c);
    setEditForm({
      title: c.title || "",
      value: c.value ? String(c.value) : "",
      signerName: c.signer_name || "",
      signerEmail: c.signer_email || "",
    });
  };

  const saveEdit = async () => {
    if (!editingContract) return;
    setSaving(true);
    const res = await updateContract(editingContract.id, {
      title: editForm.title,
      value: Number(editForm.value) || undefined,
      signer_name: editForm.signerName,
      signer_email: editForm.signerEmail,
    });
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Contrato atualizado");
      setEditingContract(null);
      loadContracts();
    }
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        Carregando contratos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Erro: {error}
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhum contrato encontrado.</p>
        <p className="text-xs text-muted-foreground/60">
          Crie um novo contrato usando o editor abaixo.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {contracts.map((c) => (
        <GlassCard
          key={c.id}
          hover
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate font-medium pr-4">{c.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {c.client_name ?? c.client_id ?? "—"}
                {c.value
                  ? ` · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(c.value)}`
                  : ""}
              </p>
              {c.signer_email && (
                <p className="text-xs text-muted-foreground">
                  Signatário: {c.signer_name ? `${c.signer_name} · ` : ""}
                  {c.signer_email}
                </p>
              )}
              {c.signed_at && (
                <p className="text-xs text-muted-foreground">
                  Assinado em: {new Date(c.signed_at).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {c.signature_url && (
              <a
                href={c.signature_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:opacity-80"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Assinar
              </a>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(c.created_at).toLocaleDateString("pt-BR")}
            </span>
            <ContractStatusBadge status={c.status} />

            {c.status !== "signed" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditClick(c)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(c.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </GlassCard>
      ))}

      <Dialog open={!!editingContract} onOpenChange={(open) => !open && setEditingContract(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Contrato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                value={editForm.value}
                onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nome do Signatário</Label>
              <Input
                value={editForm.signerName}
                onChange={(e) => setEditForm({ ...editForm, signerName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail do Signatário</Label>
              <Input
                type="email"
                value={editForm.signerEmail}
                onChange={(e) => setEditForm({ ...editForm, signerEmail: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContract(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
