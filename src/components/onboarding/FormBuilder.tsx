import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FormTemplate, FormField, FieldType } from '@/data/onboardingTypes';
import type { Variable } from '@/data/onboardingTypes';

const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Texto curto', icon: '✏️' },
  { type: 'textarea', label: 'Texto longo', icon: '📝' },
  { type: 'email', label: 'E-mail', icon: '📧' },
  { type: 'phone', label: 'Telefone', icon: '📱' },
  { type: 'cpf_cnpj', label: 'CPF / CNPJ', icon: '🪪' },
  { type: 'date', label: 'Data', icon: '📅' },
  { type: 'number', label: 'Número', icon: '🔢' },
  { type: 'currency', label: 'Valor monetário', icon: '💰' },
  { type: 'select', label: 'Seleção única', icon: '🔽' },
  { type: 'multiselect', label: 'Múltipla escolha', icon: '☑️' },
  { type: 'upload', label: 'Upload de arquivo', icon: '📎' },
  { type: 'url', label: 'Link / URL', icon: '🔗' },
];

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Texto', textarea: 'Texto longo', email: 'E-mail', phone: 'Telefone',
  cpf_cnpj: 'CPF/CNPJ', date: 'Data', number: 'Número', currency: 'Moeda',
  select: 'Seleção', multiselect: 'Múltipla', upload: 'Upload', url: 'URL',
};

interface FormBuilderProps {
  form: FormTemplate;
  variables: Variable[];
  onSave: (form: FormTemplate) => void;
}

function generateId() {
  return `field_${Math.random().toString(36).slice(2, 9)}`;
}

export function FormBuilder({ form, variables, onSave }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(form.fields);
  const [formName, setFormName] = useState(form.name);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = () => setIsDirty(true);

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: generateId(),
      type,
      label: FIELD_TYPE_LABELS[type],
      placeholder: '',
      required: false,
      helpText: '',
      variableKey: '',
    };
    if (type === 'select' || type === 'multiselect') {
      newField.options = ['Opção 1', 'Opção 2'];
    }
    setFields(prev => [...prev, newField]);
    setExpandedId(newField.id);
    markDirty();
    console.log('[FormBuilder] field added:', type);
  };

  const updateField = (id: string, patch: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
    markDirty();
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    if (expandedId === id) setExpandedId(null);
    markDirty();
    console.log('[FormBuilder] field removed:', id);
  };

  const moveField = (id: string, dir: 'up' | 'down') => {
    setFields(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (dir === 'up' && idx === 0) return prev;
      if (dir === 'down' && idx === prev.length - 1) return prev;
      const arr = [...prev];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      return arr;
    });
    markDirty();
  };

  const handleSave = () => {
    onSave({ ...form, name: formName, fields, updatedAt: new Date().toISOString() });
    setIsDirty(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Input
          value={formName}
          onChange={e => { setFormName(e.target.value); markDirty(); }}
          className="flex-1 font-semibold text-base bg-transparent border-transparent hover:border-border focus:border-primary h-auto py-1"
          placeholder="Nome do formulário"
        />
        <Button
          onClick={handleSave}
          disabled={!isDirty}
          size="sm"
          className={cn('gap-1.5 transition-all', isDirty ? 'bg-primary hover:bg-primary/90' : 'opacity-50')}
        >
          Salvar
        </Button>
      </div>

      {/* Contador */}
      <p className="text-xs text-muted-foreground mb-3">
        {fields.length} campo{fields.length !== 1 ? 's' : ''} ·{' '}
        {fields.filter(f => f.required).length} obrigatório(s)
      </p>

      {/* Lista de campos */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {fields.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground">Nenhum campo ainda</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Use o botão abaixo para adicionar</p>
          </div>
        )}

        {fields.map((field, idx) => (
          <FieldCard
            key={field.id}
            field={field}
            idx={idx}
            total={fields.length}
            expanded={expandedId === field.id}
            variables={variables}
            onToggleExpand={() => setExpandedId(expandedId === field.id ? null : field.id)}
            onUpdate={patch => updateField(field.id, patch)}
            onRemove={() => removeField(field.id)}
            onMove={dir => moveField(field.id, dir)}
          />
        ))}
      </div>

      {/* Botão adicionar campo */}
      <div className="mt-4 pt-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full gap-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5">
              <Plus className="w-4 h-4" />
              Adicionar campo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-popover border-border" align="start">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Tipo de campo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {FIELD_TYPES.map(ft => (
              <DropdownMenuItem
                key={ft.type}
                onClick={() => addField(ft.type)}
                className="gap-2 cursor-pointer hover:bg-white/5"
              >
                <span>{ft.icon}</span>
                <span className="text-sm">{ft.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── FieldCard ────────────────────────────────────────────────────────────────

interface FieldCardProps {
  field: FormField;
  idx: number;
  total: number;
  expanded: boolean;
  variables: Variable[];
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<FormField>) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
}

function FieldCard({ field, idx, total, expanded, variables, onToggleExpand, onUpdate, onRemove, onMove }: FieldCardProps) {
  return (
    <div className={cn(
      'rounded-xl border transition-all duration-200',
      expanded ? 'border-primary/30 bg-primary/5' : 'border-border bg-white/3 hover:border-white/10'
    )}>
      {/* Header do card */}
      <div
        className="flex items-center gap-2 p-3 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
        <span className="text-xs font-mono text-muted-foreground/50 w-4 shrink-0">{idx + 1}</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{field.label || '(sem nome)'}</p>
          {field.variableKey && (
            <p className="text-[10px] font-mono text-primary/60">{`{{${field.variableKey}}}`}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Badge variant="outline" className="text-[10px] px-1.5 border-white/10 text-muted-foreground">
            {FIELD_TYPE_LABELS[field.type]}
          </Badge>
          {field.required && (
            <Badge variant="outline" className="text-[10px] px-1.5 border-destructive/20 text-destructive bg-destructive/10">
              Obrig.
            </Badge>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost" size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            disabled={idx === 0}
            onClick={() => onMove('up')}
          >
            <ChevronUp className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost" size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            disabled={idx === total - 1}
            onClick={() => onMove('down')}
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost" size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Corpo expandido */}
      {expanded && (
        <div className="px-3 pb-4 space-y-3 border-t border-border/50 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Label *</Label>
              <Input
                value={field.label}
                onChange={e => onUpdate({ label: e.target.value })}
                placeholder="Ex: Nome completo"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Placeholder</Label>
              <Input
                value={field.placeholder}
                onChange={e => onUpdate({ placeholder: e.target.value })}
                placeholder="Ex: João da Silva"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Ajuda / Descrição</Label>
            <Input
              value={field.helpText}
              onChange={e => onUpdate({ helpText: e.target.value })}
              placeholder="Texto de ajuda opcional"
              className="h-8 text-sm"
            />
          </div>

          {/* Variável */}
          <div className="space-y-1">
            <Label className="text-xs">Vincular à variável</Label>
            <Select
              value={field.variableKey || '__none__'}
              onValueChange={v => onUpdate({ variableKey: v === '__none__' ? '' : v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Nenhuma variável" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="__none__">Nenhuma</SelectItem>
                {variables.map(v => (
                  <SelectItem key={v.id} value={v.key}>
                    {`{{${v.key}}}`} — {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opções para select/multiselect */}
          {(field.type === 'select' || field.type === 'multiselect') && (
            <div className="space-y-1.5">
              <Label className="text-xs">Opções</Label>
              <div className="space-y-1.5">
                {(field.options ?? []).map((opt, oi) => (
                  <div key={oi} className="flex gap-1.5">
                    <Input
                      value={opt}
                      onChange={e => {
                        const opts = [...(field.options ?? [])];
                        opts[oi] = e.target.value;
                        onUpdate({ options: opts });
                      }}
                      className="h-7 text-xs flex-1"
                    />
                    <Button
                      variant="ghost" size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => {
                        const opts = (field.options ?? []).filter((_, i) => i !== oi);
                        onUpdate({ options: opts });
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost" size="sm"
                  className="h-7 w-full text-xs gap-1 border border-dashed border-border hover:border-primary/40"
                  onClick={() => onUpdate({ options: [...(field.options ?? []), `Opção ${(field.options?.length ?? 0) + 1}`] })}
                >
                  <Plus className="w-3 h-3" /> Adicionar opção
                </Button>
              </div>
            </div>
          )}

          {/* Toggle obrigatório */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs font-medium">Campo obrigatório</p>
              <p className="text-[10px] text-muted-foreground">O cliente não poderá enviar sem preencher</p>
            </div>
            <Switch
              checked={field.required}
              onCheckedChange={v => onUpdate({ required: v })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
