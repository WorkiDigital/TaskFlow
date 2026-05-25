import { TemplateColumn } from "@/data/templateTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { ArrowUp, ArrowDown, Plus, Trash2, Palette, KanbanSquare } from "lucide-react";
import { toast } from "sonner";

interface TemplateColumnBuilderProps {
  columns: TemplateColumn[];
  onChange: (columns: TemplateColumn[]) => void;
}

const PRESET_COLORS = [
  { class: "bg-slate-400", name: "Cinza" },
  { class: "bg-blue-500", name: "Azul" },
  { class: "bg-pink-500", name: "Rosa" },
  { class: "bg-purple-500", name: "Roxo" },
  { class: "bg-orange-500", name: "Laranja" },
  { class: "bg-yellow-500", name: "Amarelo" },
  { class: "bg-emerald-500", name: "Esmeralda" },
  { class: "bg-sky-500", name: "Céu" },
];

export function TemplateColumnBuilder({ columns, onChange }: TemplateColumnBuilderProps) {
  const handleAddColumn = () => {
    const nextPos = columns.length + 1;
    const newCol: TemplateColumn = {
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: `Nova Coluna ${nextPos}`,
      position: nextPos,
      color: PRESET_COLORS[Math.min(columns.length, PRESET_COLORS.length - 1)].class,
      isFinalColumn: false,
    };
    onChange([...columns, newCol]);
    console.log("[TemplateColumnBuilder] Added column:", newCol.id);
  };

  const handleUpdateColumn = (id: string, patch: Partial<TemplateColumn>) => {
    onChange(columns.map((col) => (col.id === id ? { ...col, ...patch } : col)));
  };

  const handleRemoveColumn = (id: string) => {
    const updated = columns
      .filter((col) => col.id !== id)
      .map((col, idx) => ({
        ...col,
        position: idx + 1,
      }));
    onChange(updated);
    console.log("[TemplateColumnBuilder] Removed column:", id);
    toast.info("Coluna removida.");
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const updated = [...columns];
    if (direction === "up" && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
    } else if (direction === "down" && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
    }

    // Recalculate positions
    const reordered = updated.map((col, idx) => ({
      ...col,
      position: idx + 1,
    }));
    onChange(reordered);
  };

  const loadPreset = (presetType: "standard" | "launch" | "traffic") => {
    let presetCols: Omit<TemplateColumn, "id">[] = [];

    if (presetType === "standard") {
      presetCols = [
        { title: "Backlog", position: 1, color: "bg-slate-400" },
        { title: "A Fazer", position: 2, color: "bg-sky-500" },
        { title: "Em Andamento", position: 3, color: "bg-blue-500" },
        { title: "Revisão", position: 4, color: "bg-yellow-500" },
        { title: "Finalizado", position: 5, color: "bg-green-500", isFinalColumn: true },
      ];
    } else if (presetType === "launch") {
      presetCols = [
        { title: "Alinhamento", position: 1, color: "bg-slate-400" },
        { title: "Copy & Roteiros", position: 2, color: "bg-pink-500" },
        { title: "Design & LP", position: 3, color: "bg-purple-500" },
        { title: "Setup Técnico", position: 4, color: "bg-orange-500" },
        { title: "Tráfego Pago", position: 5, color: "bg-blue-500" },
        { title: "Finalizado", position: 6, color: "bg-green-500", isFinalColumn: true },
      ];
    } else if (presetType === "traffic") {
      presetCols = [
        { title: "A fazer", position: 1, color: "bg-slate-400" },
        { title: "Planejamento", position: 2, color: "bg-sky-500" },
        { title: "Criação", position: 3, color: "bg-indigo-500" },
        { title: "Revisão / Aprovação", position: 4, color: "bg-amber-500" },
        { title: "No Ar", position: 5, color: "bg-emerald-500" },
        { title: "Finalizado", position: 6, color: "bg-green-500", isFinalColumn: true },
      ];
    }

    const newCols = presetCols.map((col, idx) => ({
      ...col,
      id: `col-${presetType}-${idx}-${Date.now()}`,
    }));

    onChange(newCols);
    toast.success("Preset de colunas carregado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-foreground">Colunas do Projeto</h3>
          <p className="text-xs text-muted-foreground">
            Defina o fluxo Kanban que os projetos criados por este modelo herdarão.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPreset("standard")}
            className="h-7 px-2 text-[11px] gap-1"
          >
            <KanbanSquare className="h-3 w-3" /> Padrão
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPreset("traffic")}
            className="h-7 px-2 text-[11px] gap-1"
          >
            <KanbanSquare className="h-3 w-3" /> Tráfego
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPreset("launch")}
            className="h-7 px-2 text-[11px] gap-1"
          >
            <KanbanSquare className="h-3 w-3" /> Lançamentos
          </Button>
          <Button
            size="sm"
            onClick={handleAddColumn}
            className="gap-1 bg-primary text-primary-foreground text-xs h-8"
          >
            <Plus className="h-4.5 w-4.5" /> Adicionar Coluna
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {columns.map((column, index) => (
          <GlassCard
            key={column.id}
            className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-border/40 hover:border-border/80 transition-colors"
          >
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Order buttons */}
              <div className="flex flex-col gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === 0}
                  onClick={() => handleMove(index, "up")}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === columns.length - 1}
                  onClick={() => handleMove(index, "down")}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>

              {/* Dot color preview */}
              <div className={`h-4 w-4 rounded-full ${column.color}`} />

              {/* Title input */}
              <Input
                value={column.title}
                onChange={(e) => handleUpdateColumn(column.id, { title: e.target.value })}
                className="h-8 max-w-xs bg-background/30 border-border/50 text-sm focus-visible:ring-primary"
                placeholder="Título da coluna..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
              {/* Color picker preset */}
              <div className="flex items-center gap-1 bg-background/20 p-1.5 rounded-lg border border-border/40">
                <Palette className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.class}
                    onClick={() => handleUpdateColumn(column.id, { color: preset.class })}
                    className={`h-4.5 w-4.5 rounded-full border transition-all ${preset.class} ${
                      column.color === preset.class
                        ? "ring-1 ring-primary border-white scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    title={preset.name}
                  />
                ))}
              </div>

              {/* Final column toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id={`final-${column.id}`}
                  checked={!!column.isFinalColumn}
                  onCheckedChange={(checked) =>
                    handleUpdateColumn(column.id, { isFinalColumn: checked })
                  }
                />
                <Label
                  htmlFor={`final-${column.id}`}
                  className="text-xs text-muted-foreground cursor-pointer select-none"
                >
                  Coluna Finalizadora
                </Label>
              </div>

              {/* Remove Column */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleRemoveColumn(column.id)}
                disabled={columns.length <= 1}
                className="h-8 w-8 text-destructive border-border/50 hover:bg-destructive/15 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
