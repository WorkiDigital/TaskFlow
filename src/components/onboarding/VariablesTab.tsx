import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X, Shield, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Variable } from "@/data/onboardingTypes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface VariablesTabProps {
  variables: Variable[];
  onAdd: (v: Omit<Variable, "id">) => void;
  onUpdate: (id: string, patch: Partial<Variable>) => void;
  onDelete: (id: string) => void;
}

export function VariablesTab({ variables, onAdd, onUpdate, onDelete }: VariablesTabProps) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newVar, setNewVar] = useState({ key: "", label: "", mockValue: "" });
  const [editValues, setEditValues] = useState<{ label: string; mockValue: string }>({
    label: "",
    mockValue: "",
  });

  const filtered = variables.filter(
    (v) =>
      !search ||
      v.key.includes(search.toLowerCase()) ||
      v.label.toLowerCase().includes(search.toLowerCase()),
  );

  const systemVars = filtered.filter((v) => v.isSystem);
  const customVars = filtered.filter((v) => !v.isSystem);

  const startEdit = (v: Variable) => {
    setEditingId(v.id);
    setEditValues({ label: v.label, mockValue: v.mockValue });
  };

  const saveEdit = (id: string) => {
    onUpdate(id, { label: editValues.label, mockValue: editValues.mockValue });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newVar.key.trim() || !newVar.label.trim()) return;
    const key = newVar.key.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    onAdd({ key, label: newVar.label, mockValue: newVar.mockValue, usedIn: [], isSystem: false });
    setNewVar({ key: "", label: "", mockValue: "" });
    setShowAdd(false);
    console.log("[VariableManager] new variable added:", key);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar variável..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova variável
        </Button>
      </div>

      {/* Info */}
      <div className="glass-card p-4 flex items-start gap-3 border-primary/10 bg-primary/5">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-sm">💡</span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Como usar variáveis</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Insira <code className="bg-white/10 px-1 rounded text-primary">{"{{chave}}"}</code> em
            mensagens, contratos e descrições de grupos para inserir valores dinâmicos.
          </p>
        </div>
      </div>

      {/* Variáveis do sistema */}
      {systemVars.length > 0 && (
        <VariableGroup
          title="Variáveis do Sistema"
          description="Alimentadas automaticamente pelos formulários"
          icon={<Shield className="w-3.5 h-3.5 text-primary" />}
          variables={systemVars}
          editingId={editingId}
          editValues={editValues}
          onStartEdit={startEdit}
          onEditChange={(p) => setEditValues((prev) => ({ ...prev, ...p }))}
          onSaveEdit={saveEdit}
          onCancelEdit={() => setEditingId(null)}
          onDelete={(id) => setDeleteId(id)}
        />
      )}

      {/* Variáveis customizadas */}
      {customVars.length > 0 && (
        <VariableGroup
          title="Variáveis Personalizadas"
          description="Criadas pela sua agência"
          variables={customVars}
          editingId={editingId}
          editValues={editValues}
          onStartEdit={startEdit}
          onEditChange={(p) => setEditValues((prev) => ({ ...prev, ...p }))}
          onSaveEdit={saveEdit}
          onCancelEdit={() => setEditingId(null)}
          onDelete={(id) => setDeleteId(id)}
        />
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma variável encontrada</p>
        </div>
      )}

      {/* Dialog: adicionar */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-popover border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Variável</DialogTitle>
            <DialogDescription>
              Crie uma variável para usar em mensagens e documentos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Chave da variável *</Label>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-sm px-2 py-2 bg-white/5 border border-border rounded-l-xl border-r-0">
                  {"{{"}
                </span>
                <Input
                  value={newVar.key}
                  onChange={(e) =>
                    setNewVar((p) => ({
                      ...p,
                      key: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase(),
                    }))
                  }
                  placeholder="nome_variavel"
                  className="rounded-none border-x-0"
                />
                <span className="text-muted-foreground text-sm px-2 py-2 bg-white/5 border border-border rounded-r-xl border-l-0">
                  {"}}"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Somente letras, números e underscore</p>
            </div>
            <div className="space-y-1.5">
              <Label>Label (nome amigável) *</Label>
              <Input
                value={newVar.label}
                onChange={(e) => setNewVar((p) => ({ ...p, label: e.target.value }))}
                placeholder="Ex: Nome do Responsável"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valor mockado para preview</Label>
              <Input
                value={newVar.mockValue}
                onChange={(e) => setNewVar((p) => ({ ...p, mockValue: e.target.value }))}
                placeholder="Ex: Carlos Silva"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={!newVar.key || !newVar.label}>
              Criar variável
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: confirmar exclusão */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="bg-popover border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir variável?</DialogTitle>
            <DialogDescription>
              Remover esta variável pode quebrar mensagens ou documentos que a utilizam.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── VariableGroup ────────────────────────────────────────────────────────────

interface VariableGroupProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  variables: Variable[];
  editingId: string | null;
  editValues: { label: string; mockValue: string };
  onStartEdit: (v: Variable) => void;
  onEditChange: (p: Partial<{ label: string; mockValue: string }>) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
}

function VariableGroup({
  title,
  description,
  icon,
  variables,
  editingId,
  editValues,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: VariableGroupProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div>
          <p className="text-xs font-semibold text-foreground">{title}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
        <Badge
          variant="outline"
          className="ml-auto text-[10px] border-border text-muted-foreground"
        >
          {variables.length}
        </Badge>
      </div>
      <div className="glass-card overflow-hidden divide-y divide-border">
        {variables.map((v) => (
          <VariableRow
            key={v.id}
            variable={v}
            isEditing={editingId === v.id}
            editValues={editValues}
            onStartEdit={() => onStartEdit(v)}
            onEditChange={onEditChange}
            onSaveEdit={() => onSaveEdit(v.id)}
            onCancelEdit={onCancelEdit}
            onDelete={() => onDelete(v.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── VariableRow ──────────────────────────────────────────────────────────────

interface VariableRowProps {
  variable: Variable;
  isEditing: boolean;
  editValues: { label: string; mockValue: string };
  onStartEdit: () => void;
  onEditChange: (p: Partial<{ label: string; mockValue: string }>) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

function VariableRow({
  variable,
  isEditing,
  editValues,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: VariableRowProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-all group",
        isEditing && "bg-primary/5",
      )}
    >
      {/* Chave */}
      <div className="shrink-0 w-48 pt-0.5">
        <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
          {`{{${variable.key}}}`}
        </code>
      </div>

      {/* Info ou edição */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-1.5">
            <Input
              value={editValues.label}
              onChange={(e) => onEditChange({ label: e.target.value })}
              placeholder="Label"
              className="h-7 text-xs"
              autoFocus
            />
            <Input
              value={editValues.mockValue}
              onChange={(e) => onEditChange({ mockValue: e.target.value })}
              placeholder="Valor mockado para preview"
              className="h-7 text-xs"
            />
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-foreground">{variable.label}</p>
            {variable.mockValue && (
              <p className="text-xs text-muted-foreground mt-0.5">Preview: {variable.mockValue}</p>
            )}
            {variable.usedIn.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {variable.usedIn.map((u) => (
                  <span
                    key={u}
                    className="text-[10px] bg-white/5 border border-border px-1.5 py-0.5 rounded-md text-muted-foreground"
                  >
                    {u}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-1 shrink-0">
        {isEditing ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-success hover:text-success"
              onClick={onSaveEdit}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground"
              onClick={onCancelEdit}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onStartEdit}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {!variable.isSystem && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
            {variable.isSystem && (
              <div className="h-7 w-7 flex items-center justify-center">
                <Shield className="w-3 h-3 text-muted-foreground/30" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
