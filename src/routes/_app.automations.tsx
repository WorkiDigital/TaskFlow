import { createFileRoute } from "@tanstack/react-router";
import { Plus, Workflow, Settings2, Play, Clock, MoreVertical, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockAutomationFlows, AutomationFlow } from "@/data/mockAutomations";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { AutomationBuilder } from "@/components/automations/AutomationBuilder";
import { automationsService } from "@/services/automationsService";

export const Route = createFileRoute("/_app/automations")({
  component: AutomationsPage,
});

function AutomationsPage() {
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingFlow, setEditingFlow] = useState<AutomationFlow | null>(null);

  const fetchFlows = async () => {
    try {
      setIsLoading(true);
      const data = await automationsService.getFlows();
      setFlows(data);
    } catch (error) {
      console.error("Failed to fetch flows", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const handleSaveFlow = async (updatedFlow: AutomationFlow) => {
    console.log('[Automations] Saving flow to Supabase...', updatedFlow);
    try {
      await automationsService.saveFlow(updatedFlow);
      await fetchFlows(); // Refresh list after saving
      setEditingFlow(null);
    } catch (error) {
      console.error("Failed to save flow", error);
      alert("Erro ao salvar fluxo no banco de dados.");
    }
  };

  if (editingFlow) {
    return (
      <div className="absolute inset-0 z-50 bg-[var(--color-background)]">
        <AutomationBuilder 
          flow={editingFlow} 
          onSave={handleSaveFlow} 
          onClose={() => setEditingFlow(null)} 
        />
      </div>
    );
  }

  const activeFlows = flows.filter(f => f.status === 'active').length;
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Automações</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monte fluxos personalizados para onboarding, contratos, briefing e WhatsApp
          </p>
        </div>
        <Button 
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          onClick={() => setEditingFlow(mockAutomationFlows[0])} // Use mock to create a new one until we build a flow generator
        >
          <Plus className="w-4 h-4" />
          Novo fluxo
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex flex-col gap-1 border-white/5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Power className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Fluxos ativos</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">{activeFlows}</p>
        </div>
        
        <div className="glass-card p-4 flex flex-col gap-1 border-white/5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Settings2 className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Etapas config.</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {flows.reduce((acc, flow) => acc + flow.steps.length, 0)}
          </p>
        </div>
        
        <div className="glass-card p-4 flex flex-col gap-1 border-white/5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Play className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Execuções simuladas</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">14</p>
        </div>
        
        <div className="glass-card p-4 flex flex-col gap-1 border-white/5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Última edição</span>
          </div>
          <p className="text-2xl font-semibold text-foreground text-sm flex items-center h-full">Hoje, 14:30</p>
        </div>
      </div>

      {/* Flows List */}
      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-medium">Meus Fluxos {isLoading && <span className="text-muted-foreground text-sm">(Carregando...)</span>}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map(flow => (
            <button 
              key={flow.id} 
              onClick={() => setEditingFlow(flow)}
              className="glass-card p-5 flex flex-col border border-white/5 hover:border-white/10 transition-colors group text-left relative"
            >
              <div className="flex items-start justify-between mb-4 w-full">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <Workflow className="w-5 h-5 text-primary" />
                </div>
                <div className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10">
                  <MoreVertical className="w-4 h-4" />
                </div>
              </div>
              
              <h4 className="font-semibold text-foreground mb-1">{flow.name}</h4>
              <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                Modo: {flow.mode.replace('_', ' ')} com {flow.steps.length} etapas.
              </p>
              
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5 w-full">
                <Badge variant="outline" className={cn(
                  "text-[10px] uppercase font-semibold border-transparent",
                  flow.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                  flow.status === 'paused' ? 'bg-yellow-500/10 text-yellow-500' :
                  'bg-white/10 text-muted-foreground'
                )}>
                  {flow.status}
                </Badge>
                
                <span className="text-[10px] text-muted-foreground">
                  Modificado: {new Date(flow.updatedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </button>
          ))}
          
          {/* Create new card */}
          <button 
            onClick={() => setEditingFlow(mockAutomationFlows[0])}
            className="glass-card p-5 flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all gap-3 min-h-[200px] text-muted-foreground hover:text-foreground"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium">Criar novo fluxo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
