import { TemplateChecklistItem } from "@/data/templateTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowUp, ArrowDown, ClipboardList } from "lucide-react";
import { useState } from "react";

interface TemplateChecklistBuilderProps {
  items: TemplateChecklistItem[];
  onChange: (items: TemplateChecklistItem[]) => void;
}

export function TemplateChecklistBuilder({ items, onChange }: TemplateChecklistBuilderProps) {
  const [newTitle, setNewTitle] = useState("");

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: TemplateChecklistItem = {
      id: `chk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: newTitle.trim(),
    };

    onChange([...items, newItem]);
    setNewTitle("");
  };

  const handleUpdateItem = (id: string, title: string) => {
    onChange(items.map((item) => (item.id === id ? { ...item, title } : item)));
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const updated = [...items];
    if (direction === "up" && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
    } else if (direction === "down" && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
    }
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        <span>Subtarefas / Checklist ({items.length})</span>
      </div>

      {/* Input row */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Adicionar item de checklist..."
          className="h-8 text-xs bg-background/20"
        />
        <Button
          type="submit"
          size="sm"
          className="h-8 text-xs bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30"
        >
          <Plus className="h-3 w-3 mr-1" />
          Adicionar
        </Button>
      </form>

      {/* Checklist items list */}
      {items.length > 0 ? (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-2 bg-background/20 border border-border/30 rounded-lg p-1.5"
            >
              {/* Move arrows */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMove(index, "up")}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="h-2.5 w-2.5" />
                </button>
                <button
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => handleMove(index, "down")}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Title input */}
              <Input
                value={item.title}
                onChange={(e) => handleUpdateItem(item.id, e.target.value)}
                className="h-7 text-xs bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
              />

              {/* Remove */}
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                title="Excluir item"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground italic">
          Nenhum item de checklist configurado.
        </p>
      )}
    </div>
  );
}
