import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DbProjectColumn, ColumnAutomationConfig } from "@/services/projectsService";

const PRESET_COLORS = [
  { hex: "#6b7280", label: "Cinza" },
  { hex: "#94a3b8", label: "Slate" },
  { hex: "#3b82f6", label: "Azul" },
  { hex: "#8b5cf6", label: "Roxo" },
  { hex: "#eab308", label: "Amarelo" },
  { hex: "#f97316", label: "Laranja" },
  { hex: "#ef4444", label: "Vermelho" },
  { hex: "#10b981", label: "Verde" },
  { hex: "#22c55e", label: "Verde claro" },
  { hex: "#06b6d4", label: "Ciano" },
  { hex: "#ec4899", label: "Rosa" },
  { hex: "#f59e0b", label: "Âmbar" },
];

const PRESET_ICONS = ["📋", "✅", "🔄", "👀", "⏳", "🎉", "🏁", "🚀", "💡", "⚡", "🔥", "📌", "🎯", "💬", "📝", "🔍"];

interface ColumnSettingsSheetProps {
  open: boolean;
  column?: Partial<DbProjectColumn>;
  onSave: (data: {
    title: string;
    color: string;
    icon: string;
    is_final_column: boolean;
    automation_config: ColumnAutomationConfig;
  }) => void;
  onClose: () => void;
}

export function ColumnSettingsSheet({ open, column, onSave, onClose }: ColumnSettingsSheetProps) {
  const [title, setTitle] = useState(column?.title ?? "Nova coluna");
  const [color, setColor] = useState(column?.color ?? "#3b82f6");
  const [icon, setIcon] = useState(column?.icon ?? "📋");
  const [isFinal, setIsFinal] = useState(column?.is_final_column ?? false);
  const [automation, setAutomation] = useState<ColumnAutomationConfig>(
    column?.automation_config ?? {
      notify_assignee: false,
      notify_whatsapp_client: false,
      mark_project_done: false,
    },
  );

  const isEdit = !!column?.id;

  function handleSave() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), color, icon, is_final_column: isFinal, automation_config: automation });
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="bg-background border-border sm:max-w-md flex flex-col p-0">
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <SheetHeader>
            <SheetTitle>{isEdit ? "Configurar coluna" : "Nova coluna"}</SheetTitle>
            <SheetDescription>
              Defina nome, aparência e automações desta coluna.
            </SheetDescription>
          </SheetHeader>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-sm font-medium" style={{ color }}>
                {title || "Nome da coluna"}
              </p>
              <p className="text-[10px] text-muted-foreground">0 tarefas</p>
            </div>
            <div className="ml-auto w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Em revisão" />
          </div>

          {/* Ícone */}
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {PRESET_ICONS.map((em) => (
                <button
                  key={em}
                  onClick={() => setIcon(em)}
                  className={`text-lg p-1.5 rounded-lg transition-all ${
                    icon === em
                      ? "bg-primary/20 ring-1 ring-primary/50"
                      : "hover:bg-white/10"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  title={c.label}
                  onClick={() => setColor(c.hex)}
                  className={`w-full aspect-square rounded-lg transition-all ${
                    color === c.hex ? "ring-2 ring-white/60 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Automações */}
          <div className="space-y-3">
            <Label>Quando uma tarefa entrar aqui</Label>
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Notificar responsável</p>
                  <p className="text-[11px] text-muted-foreground">
                    Avisa o membro atribuído da tarefa
                  </p>
                </div>
                <Switch
                  checked={automation.notify_assignee}
                  onCheckedChange={(v) => setAutomation((a) => ({ ...a, notify_assignee: v }))}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Notificar cliente via WhatsApp</p>
                  <p className="text-[11px] text-muted-foreground">
                    Envia mensagem ao grupo do cliente
                  </p>
                </div>
                <Switch
                  checked={automation.notify_whatsapp_client}
                  onCheckedChange={(v) =>
                    setAutomation((a) => ({ ...a, notify_whatsapp_client: v }))
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Marcar projeto como concluído</p>
                  <p className="text-[11px] text-muted-foreground">
                    Altera status do projeto para &quot;Finalizado&quot;
                  </p>
                </div>
                <Switch
                  checked={automation.mark_project_done}
                  onCheckedChange={(v) => setAutomation((a) => ({ ...a, mark_project_done: v }))}
                />
              </div>
            </div>
          </div>

          {/* Coluna final */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="text-sm font-medium">Coluna final</p>
              <p className="text-[11px] text-muted-foreground">
                Marca tarefas como concluídas ao entrar aqui
              </p>
            </div>
            <Switch checked={isFinal} onCheckedChange={setIsFinal} />
          </div>
        </div>

        <SheetFooter className="p-6 border-t border-border bg-white/3 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()} className="bg-primary hover:bg-primary/90">
            {isEdit ? "Salvar" : "Criar coluna"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
