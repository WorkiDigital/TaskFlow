import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface RecurringTaskActionConfigProps {
  initialConfig?: any;
  onSave: (config: any) => void;
  onCancel: () => void;
}

export function RecurringTaskActionConfig({ initialConfig, onSave, onCancel }: RecurringTaskActionConfigProps) {
  const [config, setConfig] = useState({
    title: '',
    projectId: '', // Usually dynamic or selected globally
    columnId: '',
    assigneeId: '',
    priority: 'medium',
    frequency: 'weekly',
    weekday: 'monday',
    startDate: '',
    ...initialConfig
  });

  const handleSave = () => {
    onSave(config);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="shrink-0 p-6 border-b border-white/5 bg-black/20">
        <h2 className="text-xl font-semibold tracking-tight">Criar Tarefa Recorrente</h2>
        <p className="text-sm text-muted-foreground mt-1">Configura a criação automática de uma tarefa em intervalos definidos.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título da Tarefa *</Label>
            <Input 
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Ex: Revisar campanhas ativas"
              className="bg-background/20"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <select
                value={config.priority}
                onChange={(e) => setConfig({ ...config, priority: e.target.value })}
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Frequência</Label>
              <select
                value={config.frequency}
                onChange={(e) => setConfig({ ...config, frequency: e.target.value })}
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10"
              >
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quinzenal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
          </div>

          {config.frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Dia da Semana</Label>
              <select
                value={config.weekday}
                onChange={(e) => setConfig({ ...config, weekday: e.target.value })}
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10"
              >
                <option value="monday">Segunda-feira</option>
                <option value="tuesday">Terça-feira</option>
                <option value="wednesday">Quarta-feira</option>
                <option value="thursday">Quinta-feira</option>
                <option value="friday">Sexta-feira</option>
                <option value="saturday">Sábado</option>
                <option value="sunday">Domingo</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 p-6 border-t border-white/5 bg-black/20 flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!config.title} className="bg-primary hover:bg-primary/90">
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}
