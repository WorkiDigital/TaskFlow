import { useState } from 'react';
import { Plus, Copy, Eye, Star, Trash2, FileText, ClipboardList, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FormTemplate, Variable } from '@/data/onboardingTypes';
import { FormBuilder } from './FormBuilder';
import { FormPreview } from './FormPreview';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormsTabProps {
  templates: FormTemplate[];
  variables: Variable[];
  onSave: (form: FormTemplate) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string, type: FormTemplate['type']) => void;
}

type ViewMode = 'list' | 'edit' | 'preview';

export function FormsTab({ templates, variables, onSave, onDuplicate, onDelete, onSetDefault }: FormsTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id ?? null);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<FormTemplate['type']>('briefing');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const contractualForms = templates.filter(t => t.type === 'contractual');
  const briefingForms = templates.filter(t => t.type === 'briefing');
  const selectedForm = templates.find(t => t.id === selectedId);

  const createNew = () => {
    const newForm: FormTemplate = {
      id: `form_${Date.now()}`,
      name: newName.trim() || `Novo ${newType === 'contractual' ? 'Formulário Contratual' : 'Briefing'}`,
      type: newType,
      fields: [],
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(newForm);
    setSelectedId(newForm.id);
    setViewMode('edit');
    setShowNewDialog(false);
    setNewName('');
    console.log('[FormBuilder] new template created:', newForm.id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[600px]">
      {/* Coluna esquerda: lista de formulários */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => setShowNewDialog(true)}
          variant="outline"
          className="gap-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary"
        >
          <Plus className="w-4 h-4" />
          Novo formulário
        </Button>

        {/* Seção Contratuais */}
        {contractualForms.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-2 font-semibold">Contratuais</p>
            <div className="space-y-1">
              {contractualForms.map(f => (
                <FormCard
                  key={f.id}
                  form={f}
                  selected={selectedId === f.id}
                  onSelect={() => { setSelectedId(f.id); setViewMode('edit'); }}
                  onDuplicate={() => onDuplicate(f.id)}
                  onDelete={() => setDeleteConfirmId(f.id)}
                  onSetDefault={() => onSetDefault(f.id, f.type)}
                  onPreview={() => { setSelectedId(f.id); setViewMode('preview'); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Seção Briefings */}
        {briefingForms.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-2 font-semibold">Briefing</p>
            <div className="space-y-1">
              {briefingForms.map(f => (
                <FormCard
                  key={f.id}
                  form={f}
                  selected={selectedId === f.id}
                  onSelect={() => { setSelectedId(f.id); setViewMode('edit'); }}
                  onDuplicate={() => onDuplicate(f.id)}
                  onDelete={() => setDeleteConfirmId(f.id)}
                  onSetDefault={() => onSetDefault(f.id, f.type)}
                  onPreview={() => { setSelectedId(f.id); setViewMode('preview'); }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coluna direita: editor ou preview */}
      <div className="glass-card p-5 flex flex-col">
        {!selectedForm ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
              <FileText className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Selecione um formulário para editar</p>
          </div>
        ) : (
          <>
            {/* Toolbar do editor */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{selectedForm.name}</span>
                {selectedForm.isDefault && (
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 border">Padrão</Badge>
                )}
                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground capitalize">
                  {selectedForm.type === 'contractual' ? 'Contratual' : 'Briefing'}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/form/${selectedForm.id}`);
                    toast.success('Link público copiado!');
                  }}
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Link2 className="w-3.5 h-3.5" /> Copiar Link
                </Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setViewMode('edit')}
                  className={cn('h-8 gap-1.5 text-xs', viewMode === 'edit' && 'bg-white/10 text-foreground')}
                >
                  <ClipboardList className="w-3.5 h-3.5" /> Editor
                </Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setViewMode('preview')}
                  className={cn('h-8 gap-1.5 text-xs', viewMode === 'preview' && 'bg-white/10 text-foreground')}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </Button>
              </div>
            </div>

            {/* Conteúdo */}
            {viewMode === 'edit' ? (
              <FormBuilder
                form={selectedForm}
                variables={variables}
                onSave={onSave}
              />
            ) : (
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <FormPreview form={selectedForm} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog: novo formulário */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="bg-popover border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Formulário</DialogTitle>
            <DialogDescription>Crie um novo modelo de formulário para o onboarding.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome do formulário</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ex: Briefing Personalizado"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                {([['contractual', 'Contratual', '📋'], ['briefing', 'Briefing', '📝']] as const).map(([val, label, icon]) => (
                  <button
                    key={val}
                    onClick={() => setNewType(val)}
                    className={cn(
                      'flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all',
                      newType === val
                        ? 'border-primary/40 bg-primary/10 text-foreground'
                        : 'border-border bg-white/3 text-muted-foreground hover:bg-white/5'
                    )}
                  >
                    <span>{icon}</span>
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
            <Button onClick={createNew}>Criar formulário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: confirmar exclusão */}
      <Dialog open={!!deleteConfirmId} onOpenChange={open => !open && setDeleteConfirmId(null)}>
        <DialogContent className="bg-popover border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir formulário?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O formulário e todos os seus campos serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) {
                  onDelete(deleteConfirmId);
                  if (selectedId === deleteConfirmId) setSelectedId(templates.find(t => t.id !== deleteConfirmId)?.id ?? null);
                  setDeleteConfirmId(null);
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

// ─── FormCard ─────────────────────────────────────────────────────────────────

interface FormCardProps {
  form: FormTemplate;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onPreview: () => void;
}

function FormCard({ form, selected, onSelect, onDuplicate, onDelete, onSetDefault, onPreview }: FormCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all group',
        selected ? 'bg-primary/15 border border-primary/25' : 'hover:bg-white/5 border border-transparent'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground truncate">{form.name}</p>
          {form.isDefault && <Star className="w-3 h-3 text-warning shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground">{form.fields.length} campos</p>
      </div>
      {/* Quick actions */}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <button onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(`${window.location.origin}/form/${form.id}`);
          toast.success('Link público copiado!');
        }} className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground" title="Copiar Link Público">
          <Link2 className="w-3 h-3" />
        </button>
        <button onClick={onPreview} className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground" title="Preview">
          <Eye className="w-3 h-3" />
        </button>
        <button onClick={onDuplicate} className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground">
          <Copy className="w-3 h-3" />
        </button>
        {!form.isDefault && (
          <button onClick={onSetDefault} className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-warning">
            <Star className="w-3 h-3" />
          </button>
        )}
        <button onClick={onDelete} className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
