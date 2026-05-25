import { useState, useEffect } from "react";
import { useTemplateWorkspace } from "@/hooks/useTemplateWorkspace";
import { AgencyTemplate, TemplateCategory, TemplateStatus } from "@/data/templateTypes";
import { templateCategories } from "@/data/mockAgencyTemplates";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TemplateColumnBuilder } from "./TemplateColumnBuilder";
import { TemplateTaskBuilder } from "./TemplateTaskBuilder";
import { TemplateAutomationSettings } from "./TemplateAutomationSettings";
import { TemplatePreview } from "./TemplatePreview";
import {
  ChevronLeft,
  Save,
  X,
  Info,
  Settings,
  KanbanSquare,
  ListTodo,
  Zap,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface TemplateEditorProps {
  templateId: string | null;
  onBack: () => void;
}

const DEFAULT_TEMPLATE = {
  name: "",
  description: "",
  category: "paid_traffic" as TemplateCategory,
  status: "draft" as TemplateStatus,
  columns: [
    { id: "col-default-1", title: "A fazer", position: 1, color: "bg-slate-400" },
    { id: "col-default-2", title: "Em andamento", position: 2, color: "bg-blue-500" },
    {
      id: "col-default-3",
      title: "Finalizado",
      position: 3,
      color: "bg-green-500",
      isFinalColumn: true,
    },
  ],
  tasks: [],
  automation: {
    enabled: false,
    trigger: "manual" as const,
    createProject: true,
    createTasks: true,
    assignUsers: false,
    notifyInternalGroup: false,
    requireManualReview: true,
  },
};

export function TemplateEditor({ templateId, onBack }: TemplateEditorProps) {
  const { templates, createTemplate, updateTemplate } = useTemplateWorkspace();
  const [currentTemplate, setCurrentTemplate] =
    useState<Omit<AgencyTemplate, "id" | "lastEditedAt">>(DEFAULT_TEMPLATE);

  // Load template if editing
  useEffect(() => {
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        console.log("[TemplateEditor] Loaded template for editing:", templateId, template.name);
        setCurrentTemplate({
          name: template.name,
          description: template.description,
          category: template.category,
          status: template.status,
          columns: template.columns,
          tasks: template.tasks,
          automation: template.automation,
          linkedContractTitle: template.linkedContractTitle,
        });
      }
    }
  }, [templateId, templates]);

  const updateLocal = (key: string, value: any) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    if (!currentTemplate.name.trim()) {
      toast.error("O nome do modelo é obrigatório.");
      return;
    }

    if (currentTemplate.columns.length === 0) {
      toast.error("O modelo precisa ter pelo menos uma coluna.");
      return;
    }

    if (templateId) {
      updateTemplate(templateId, currentTemplate);
      toast.success("Modelo atualizado com sucesso!");
    } else {
      createTemplate(currentTemplate);
    }
    onBack();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {templateId ? `Editar: ${currentTemplate.name}` : "Criar Novo Template"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure metadados, colunas, tarefas e automações vinculadas.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5 text-xs h-9">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="gap-1.5 bg-primary text-primary-foreground text-xs h-9 shadow-[var(--shadow-glow)]"
          >
            <Save className="h-4 w-4" />
            Salvar Modelo
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <Tabs defaultValue="geral" className="w-full space-y-6">
        {/* Navigation Tabs bar */}
        <TabsList className="bg-background/40 border border-border/40 p-1 w-full justify-start overflow-x-auto flex-nowrap md:w-auto h-10">
          <TabsTrigger value="geral" className="gap-1.5 text-xs">
            <Info className="h-3.5 w-3.5" /> Geral
          </TabsTrigger>
          <TabsTrigger value="colunas" className="gap-1.5 text-xs">
            <KanbanSquare className="h-3.5 w-3.5" /> Colunas
          </TabsTrigger>
          <TabsTrigger value="tarefas" className="gap-1.5 text-xs">
            <ListTodo className="h-3.5 w-3.5" /> Tarefas ({currentTemplate.tasks.length})
          </TabsTrigger>
          <TabsTrigger value="automacao" className="gap-1.5 text-xs">
            <Zap className="h-3.5 w-3.5" /> Automação
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1.5 text-xs">
            <Eye className="h-3.5 w-3.5" /> Preview Projeto
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GENERAL */}
        <TabsContent value="geral" className="space-y-4">
          <GlassCard className="p-6 border border-border/40 space-y-4">
            <h3 className="text-sm font-semibold border-b border-border/30 pb-2 text-foreground">
              Informações Gerais
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tmpl-name" className="text-xs">
                  Nome do Template *
                </Label>
                <Input
                  id="tmpl-name"
                  value={currentTemplate.name}
                  onChange={(e) => updateLocal("name", e.target.value)}
                  placeholder="Ex: Gestão de Tráfego Mensal Premium"
                  className="bg-background/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tmpl-category" className="text-xs">
                    Categoria
                  </Label>
                  <select
                    id="tmpl-category"
                    value={currentTemplate.category}
                    onChange={(e) => updateLocal("category", e.target.value as TemplateCategory)}
                    className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10"
                  >
                    {templateCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tmpl-status" className="text-xs">
                    Status do Template
                  </Label>
                  <select
                    id="tmpl-status"
                    value={currentTemplate.status}
                    onChange={(e) => updateLocal("status", e.target.value as TemplateStatus)}
                    className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10"
                  >
                    <option value="active">Ativo (Pronto para Automação)</option>
                    <option value="draft">Rascunho (Não aciona gatilhos)</option>
                    <option value="paused">Pausado (Temporariamente suspenso)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tmpl-desc" className="text-xs">
                Descrição Operacional
              </Label>
              <Textarea
                id="tmpl-desc"
                value={currentTemplate.description}
                onChange={(e) => updateLocal("description", e.target.value)}
                placeholder="Descreva o propósito deste fluxo e em quais tipos de contrato ele é recomendado."
                className="bg-background/20 min-h-[6rem] resize-y"
              />
            </div>
          </GlassCard>
        </TabsContent>

        {/* TAB 2: COLUMNS */}
        <TabsContent value="colunas">
          <GlassCard className="p-6 border border-border/40">
            <TemplateColumnBuilder
              columns={currentTemplate.columns}
              onChange={(columns) => updateLocal("columns", columns)}
            />
          </GlassCard>
        </TabsContent>

        {/* TAB 3: TASKS */}
        <TabsContent value="tarefas">
          <GlassCard className="p-6 border border-border/40">
            <TemplateTaskBuilder
              tasks={currentTemplate.tasks}
              columns={currentTemplate.columns}
              onChange={(tasks) => updateLocal("tasks", tasks)}
            />
          </GlassCard>
        </TabsContent>

        {/* TAB 4: AUTOMATION */}
        <TabsContent value="automacao">
          <GlassCard className="p-6 border border-border/40">
            <TemplateAutomationSettings
              automation={currentTemplate.automation}
              onChange={(automation) => updateLocal("automation", automation)}
              linkedContractTitle={currentTemplate.linkedContractTitle}
              onLinkedContractChange={(title) => updateLocal("linkedContractTitle", title)}
            />
          </GlassCard>
        </TabsContent>

        {/* TAB 5: PREVIEW */}
        <TabsContent value="preview">
          <TemplatePreview
            name={currentTemplate.name}
            columns={currentTemplate.columns}
            tasks={currentTemplate.tasks}
            automationEnabled={currentTemplate.automation.enabled}
            linkedContractTitle={currentTemplate.linkedContractTitle}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
