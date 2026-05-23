import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTemplateWorkspace } from '@/hooks/useTemplateWorkspace';
import { FolderSync, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TemplateActionConfigProps {
  initialConfig?: any;
  onSave: (config: any) => void;
  onCancel: () => void;
}

export function TemplateActionConfig({ initialConfig, onSave, onCancel }: TemplateActionConfigProps) {
  const { templates, isLoading } = useTemplateWorkspace();
  const [config, setConfig] = useState({
    templateId: '',
    projectMode: 'create_new',
    projectNamePattern: '{{nome_servico}} - {{nome_cliente}}',
    dateBase: 'contract_signed_at',
    assigneeMode: 'use_template',
    notifyInternalGroup: true,
    requireManualReview: false,
    ...initialConfig
  });

  const selectedTemplate = templates.find(t => t.id === config.templateId);

  const handleSave = () => {
    onSave(config);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando templates...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="shrink-0 p-6 border-b border-white/5 bg-black/20">
        <h2 className="text-xl font-semibold tracking-tight">Aplicar Template Operacional</h2>
        <p className="text-sm text-muted-foreground mt-1">Cria automaticamente projeto, tarefas e responsáveis baseados em um modelo.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Selecione o Template *</Label>
            <select
              value={config.templateId}
              onChange={(e) => setConfig({ ...config, templateId: e.target.value })}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10"
            >
              <option value="">-- Selecione um template ativo --</option>
              {templates.filter(t => t.status === 'active').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {selectedTemplate && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2">
                <FolderSync className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Resumo do Template Selecionado</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                <li>{selectedTemplate.columns.length} colunas serão criadas no Kanban</li>
                <li>{selectedTemplate.tasks.length} tarefas estruturadas</li>
                <li>Atribuição de responsáveis e prazos automáticos</li>
              </ul>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Modo do Projeto</Label>
            <select
              value={config.projectMode}
              onChange={(e) => setConfig({ ...config, projectMode: e.target.value })}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10"
            >
              <option value="create_new">Criar Novo Projeto</option>
              <option value="use_existing">Usar Projeto Existente (se houver)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Padrão de Nome do Projeto</Label>
            <Input 
              value={config.projectNamePattern}
              onChange={(e) => setConfig({ ...config, projectNamePattern: e.target.value })}
              placeholder="Ex: {{nome_servico}} - {{nome_cliente}}"
              className="bg-background/20"
            />
            <p className="text-[10px] text-muted-foreground">Use variáveis como {"{{nome_cliente}}"}</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/40">
          <h3 className="text-sm font-medium">Comportamento de Execução</h3>
          
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex h-5 items-center">
              <input
                type="checkbox"
                checked={config.notifyInternalGroup}
                onChange={(e) => setConfig({ ...config, notifyInternalGroup: e.target.checked })}
                className="w-4 h-4 rounded border-border/50 bg-black/20 text-primary focus:ring-primary focus:ring-offset-background"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">Notificar grupo interno</p>
              <p className="text-xs text-muted-foreground">Envia uma mensagem no grupo do WhatsApp da agência quando o projeto for criado.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex h-5 items-center">
              <input
                type="checkbox"
                checked={config.requireManualReview}
                onChange={(e) => setConfig({ ...config, requireManualReview: e.target.checked })}
                className="w-4 h-4 rounded border-border/50 bg-black/20 text-primary focus:ring-primary focus:ring-offset-background"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">Exigir revisão manual</p>
              <p className="text-xs text-muted-foreground">O projeto nasce pausado e o gestor precisa aprovar a criação antes de notificar clientes.</p>
            </div>
          </label>
        </div>
      </div>

      <div className="shrink-0 p-6 border-t border-white/5 bg-black/20 flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!config.templateId} className="bg-primary hover:bg-primary/90">
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}
