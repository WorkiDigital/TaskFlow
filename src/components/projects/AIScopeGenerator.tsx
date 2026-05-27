import { useState } from "react";
import { ProjectTask } from "@/data/mockProjects";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { agentService } from "@/services/agentService";

interface AIScopeGeneratorProps {
  projectId: string;
  onApplyTasks: (tasks: ProjectTask[]) => void;
}

export function AIScopeGenerator({ projectId, onApplyTasks }: AIScopeGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<ProjectTask[] | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setGeneratedResult(null);

    try {
      const result = await agentService.suggestActions("projects");
      const tasks: ProjectTask[] = result.actions.slice(0, 8).map((action, i) => ({
        id: `ai-${i}-${Date.now()}`,
        projectId,
        columnId: "col-1",
        status: "backlog",
        title: action.title,
        description: action.description ?? `Gerado por IA a partir do escopo: "${prompt.slice(0, 80)}"`,
        assignee: "",
        dueDate: new Date(Date.now() + 86400000 * (i + 2)).toISOString().split("T")[0],
        priority: i === 0 ? "high" : "medium",
        checklist: action.preview_items.slice(0, 4).map((item, j) => ({
          id: `ai-c-${i}-${j}`,
          title: item,
          done: false,
        })),
        tags: ["IA"],
        comments: [],
        activity: [],
      }));

      if (tasks.length === 0) throw new Error("Nenhuma tarefa sugerida.");
      setGeneratedResult(tasks);
      toast.success("Escopo gerado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar escopo. Verifique se o Agente de IA está configurado em Configurações.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedResult) {
      onApplyTasks(generatedResult);
      setGeneratedResult(null);
      setPrompt("");
      setOpen(false);
      toast.success("Tarefas adicionadas ao Kanban!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 bg-gradient-to-r from-primary/20 to-accent/20 border-primary/50 text-primary hover:bg-primary/30"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Gerar com IA</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-primary/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gerador de Escopo com IA
          </DialogTitle>
          <DialogDescription>
            Descreva o objetivo do projeto e a IA criará automaticamente todas as tarefas,
            checklists e etapas.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4">
          {!generatedResult ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Ex: Criar estrutura para lançamento de infoproduto em 30 dias..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-black/20 resize-none h-24 border-white/10"
                disabled={loading}
              />
              <Button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando estrutura...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Gerar Escopo
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-black/20 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 border border-white/5 no-scrollbar">
                {generatedResult.map((task) => (
                  <div key={task.id} className="text-sm flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 mt-1 text-primary shrink-0" />
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.checklist.length} itens no checklist
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedResult(null)}
                  className="flex-1"
                >
                  Descartar
                </Button>
                <Button
                  onClick={handleApply}
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                >
                  Aplicar ao Projeto
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
