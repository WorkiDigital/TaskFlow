import { useState } from 'react';
import { useTemplateWorkspace } from '@/hooks/useTemplateWorkspace';
import { templateCategories, roleOptions } from '@/data/mockAgencyTemplates';
import { AgencyTemplate, TemplateCategory, TemplateStatus } from '@/data/templateTypes';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MetricCard } from '@/components/ui/MetricCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Layers,
  Plus,
  Search,
  Trash2,
  Copy,
  Play,
  Edit3,
  TrendingUp,
  Instagram,
  Rocket,
  Palette,
  Globe,
  Video,
  UserCheck,
  Users,
  Sliders,
  ChevronRight,
  FileCode2,
  Settings2,
  RefreshCw,
  FolderSync
} from 'lucide-react';
import { TemplateEditor } from './TemplateEditor';
import { TemplateApplySimulation } from './TemplateApplySimulation';
import { mockAgencyTemplates } from '@/data/mockAgencyTemplates';
import { toast } from 'sonner';

// Helper to get category icon
export function getCategoryIcon(cat: TemplateCategory) {
  switch (cat) {
    case 'paid_traffic': return TrendingUp;
    case 'social_media': return Instagram;
    case 'launch': return Rocket;
    case 'branding': return Palette;
    case 'web_design': return Globe;
    case 'creatives': return Video;
    case 'onboarding': return UserCheck;
    case 'consulting': return Users;
    default: return Sliders;
  }
}

export function AgencyTemplatesManager() {
  const {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    isLoading
  } = useTemplateWorkspace();

  const [activeView, setActiveView] = useState<'list' | 'edit' | 'simulate'>('list');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TemplateStatus | 'all'>('all');

  // Metrics calculation
  const totalTemplates = templates.length;
  const activeAutomations = templates.filter(t => t.automation.enabled && t.status === 'active').length;
  const linkedContracts = templates.filter(t => t.linkedContractTitle).length;
  const totalTasks = templates.reduce((acc, t) => acc + t.tasks.length, 0);

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleEdit = (id: string) => {
    console.log('[AgencyTemplates] Navigating to edit template:', id);
    setSelectedTemplateId(id);
    setActiveView('edit');
  };

  const handleCreateNew = () => {
    console.log('[AgencyTemplates] Opening empty template editor');
    setSelectedTemplateId(null);
    setActiveView('edit');
  };

  const handleSimulate = (id: string) => {
    console.log('[AgencyTemplates] Running simulation for template:', id);
    setSelectedTemplateId(id);
    setActiveView('simulate');
  };

  const handleImportGallery = async () => {
    // Check which templates from mockAgencyTemplates are missing and import them
    let importedCount = 0;
    
    // We must use a for...of loop to await the async calls properly
    for (const mockT of mockAgencyTemplates) {
      const exists = templates.some(t => t.name === mockT.name);
      if (!exists) {
        try {
          await createTemplate({
            name: mockT.name,
            description: mockT.description,
            category: mockT.category,
            status: mockT.status,
            columns: mockT.columns,
            tasks: mockT.tasks,
            automation: mockT.automation,
            linkedContractTitle: mockT.linkedContractTitle
          });
          importedCount++;
        } catch (e: any) {
          console.error(`Falha ao importar ${mockT.name}`, e);
          toast.error(`Erro no ${mockT.name}: ${e?.message || JSON.stringify(e)}`);
        }
      }
    }

    if (importedCount > 0) {
      toast.success(`${importedCount} modelos importados da galeria com sucesso!`);
    } else {
      toast.info('Nenhum novo modelo para importar ou todos já existem.');
    }
  };

  const handleResetGallery = () => {
    // Reset localstorage templates to defaults
    try {
      localStorage.setItem('taskflow_templates', JSON.stringify(mockAgencyTemplates));
      window.location.reload();
      toast.success('Modelos restaurados para o padrão de fábrica!');
    } catch (e) {
      toast.error('Erro ao resetar galeria');
    }
  };

  if (activeView === 'edit') {
    return (
      <TemplateEditor
        templateId={selectedTemplateId}
        onBack={() => setActiveView('list')}
      />
    );
  }

  if (activeView === 'simulate') {
    return (
      <TemplateApplySimulation
        templateId={selectedTemplateId}
        onBack={() => setActiveView('list')}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p>Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Templates de Agência</h2>
          <p className="text-sm text-muted-foreground">
            Crie modelos operacionais e crie projetos + tarefas automaticamente após a assinatura dos contratos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleImportGallery} className="gap-2">
            <FolderSync className="h-4 w-4" />
            Importar Galeria
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetGallery} className="gap-2 text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            Restaurar Padrão
          </Button>
          <Button size="sm" onClick={handleCreateNew} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[var(--shadow-glow)]">
            <Plus className="h-4 w-4" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Modelos de Projeto"
          value={totalTemplates}
          icon={Layers}
          tint="primary"
        />
        <MetricCard
          label="Tarefas Padronizadas"
          value={totalTasks}
          icon={FileCode2}
          tint="accent"
        />
        <MetricCard
          label="Automações Ativas"
          value={activeAutomations}
          icon={FolderSync}
          tint="success"
        />
        <MetricCard
          label="Contratos Vinculados"
          value={linkedContracts}
          icon={Settings2}
          tint="warning"
        />
      </div>

      {/* Filters Toolbar */}
      <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar modelos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
            className="rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todas Categorias</option>
            {templateCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as TemplateStatus | 'all')}
            className="rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos Status</option>
            <option value="active">Ativo</option>
            <option value="draft">Rascunho</option>
            <option value="paused">Pausado</option>
          </select>
        </div>
      </GlassCard>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const CatIcon = getCategoryIcon(template.category);
            const categoryData = templateCategories.find(c => c.value === template.category);
            const statusTone = template.status === 'active' ? 'success' : template.status === 'draft' ? 'neutral' : 'warning';
            const statusLabel = template.status === 'active' ? 'Ativo' : template.status === 'draft' ? 'Rascunho' : 'Pausado';

            return (
              <GlassCard key={template.id} hover className="flex flex-col justify-between h-full group relative">
                <div>
                  {/* Category & Status Badges */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryData?.color || 'text-muted-foreground bg-muted/10 border-border'}`}>
                      <CatIcon className="h-3 w-3" />
                      {categoryData?.label || 'Outro'}
                    </span>
                    <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{template.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{template.description}</p>

                  {/* Template Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-2 py-3 border-y border-border/50 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Fluxo Kanbans</span>
                      <span className="font-semibold text-foreground">{template.columns.length} Colunas</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Estrutura</span>
                      <span className="font-semibold text-foreground">{template.tasks.length} Tarefas</span>
                    </div>
                  </div>

                  {/* Linked Contract or Trigger summary */}
                  <div className="mt-4 text-xs">
                    {template.automation.enabled ? (
                      <div className="flex items-center gap-1.5 text-primary">
                        <FolderSync className="h-3.5 w-3.5" />
                        <span>Autocriação ativa no contrato assinado</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <span>Criação apenas manual</span>
                      </div>
                    )}
                    {template.linkedContractTitle && (
                      <p className="mt-1 text-[11px] text-muted-foreground/80 truncate">
                        Vínculo: <strong className="text-foreground/90">{template.linkedContractTitle}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(template.id)} title="Editar" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => duplicateTemplate(template.id)} title="Duplicar" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => deleteTemplate(template.id)} title="Excluir" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button size="sm" onClick={() => handleSimulate(template.id)} className="h-8 gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
                    <Play className="h-3 w-3 fill-current" />
                    Simular
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="Nenhum template encontrado"
          description="Nenhum modelo de projeto atende aos filtros atuais ou nenhum modelo foi criado."
          actionLabel="Criar Novo Template"
          onAction={handleCreateNew}
        />
      )}
    </div>
  );
}
