import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Plus, Trash2, FileText, Settings, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  variable: string;
}

const defaultContractFields: FormField[] = [
  { id: 'f1', label: 'Nome Completo', type: 'text', required: true, variable: '{{nome_cliente}}' },
  { id: 'f2', label: 'E-mail', type: 'email', required: true, variable: '{{email_cliente}}' },
  { id: 'f3', label: 'Telefone', type: 'phone', required: true, variable: '{{telefone_cliente}}' },
  { id: 'f4', label: 'CPF ou CNPJ', type: 'cpf_cnpj', required: true, variable: '{{cpf_cnpj_cliente}}' },
  { id: 'f5', label: 'Valor do Projeto', type: 'money', required: true, variable: '{{valor_projeto}}' }
];

const defaultBriefingFields: FormField[] = [
  { id: 'b1', label: 'Objetivo do Projeto', type: 'long_text', required: true, variable: '{{objetivo_projeto}}' },
  { id: 'b2', label: 'Público-alvo', type: 'long_text', required: true, variable: '{{publico_alvo}}' },
  { id: 'b3', label: 'Referências Visuais', type: 'file_upload', required: false, variable: '' },
];

const fieldTypes = [
  { value: 'text', label: 'Texto Curto' },
  { value: 'long_text', label: 'Texto Longo' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'cpf_cnpj', label: 'CPF/CNPJ' },
  { value: 'date', label: 'Data' },
  { value: 'number', label: 'Número' },
  { value: 'money', label: 'Valor Monetário' },
  { value: 'select', label: 'Seleção' },
  { value: 'file_upload', label: 'Upload de Arquivo' }
];

interface FormBuilderProps {
  mode: 'contract' | 'briefing';
  onSave: (fields: FormField[]) => void;
  onCancel: () => void;
}

export function FormBuilder({ mode, onSave, onCancel }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(
    mode === 'contract' ? defaultContractFields : defaultBriefingFields
  );

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const addField = () => {
    const newField: FormField = {
      id: `f_${Date.now()}`,
      label: 'Novo Campo',
      type: 'text',
      required: false,
      variable: ''
    };
    setFields([...fields, newField]);
    setEditingFieldId(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (editingFieldId === id) setEditingFieldId(null);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newFields = [...fields];
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
      setFields(newFields);
    } else if (direction === 'down' && index < fields.length - 1) {
      const newFields = [...fields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      setFields(newFields);
    }
  };

  const editingField = fields.find(f => f.id === editingFieldId);

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)] w-full">
      <div className="shrink-0 p-6 border-b border-white/5">
        <h2 className="text-xl font-semibold tracking-tight">
          {mode === 'contract' ? 'Formulário de Captação Contratual' : 'Formulário de Briefing'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Defina quais perguntas o cliente deverá responder nesta etapa.
        </p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Editor Panel */}
        <div className="flex-1 p-6 overflow-y-auto border-r border-white/5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" /> Campos do Formulário
            </Label>
            <Button onClick={addField} size="sm" className="gap-2 bg-white/10 hover:bg-white/20 text-foreground">
              <Plus className="w-4 h-4" /> Adicionar Campo
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div 
                key={field.id}
                className={cn(
                  "glass-panel p-3 border rounded-xl flex items-center gap-3 transition-colors",
                  editingFieldId === field.id ? "border-primary/50 bg-primary/5" : "border-white/5 hover:border-white/10"
                )}
                onClick={() => setEditingFieldId(field.id)}
              >
                <div className="flex flex-col gap-1 items-center">
                  <button onClick={(e) => { e.stopPropagation(); moveField(index, 'up') }} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">▲</button>
                  <button onClick={(e) => { e.stopPropagation(); moveField(index, 'down') }} disabled={index === fields.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">▼</button>
                </div>

                <div className="flex-1 min-w-0 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">{field.label}</span>
                    {field.required && <span className="text-red-400 text-xs">*</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground bg-black/20 px-1.5 py-0.5 rounded border border-white/5">
                      {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                    </span>
                    {field.variable && (
                      <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                        {field.variable}
                      </span>
                    )}
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="w-full lg:w-[320px] shrink-0 bg-black/20 p-6 flex flex-col border-r border-white/5 overflow-y-auto">
          <Label className="text-foreground font-medium flex items-center gap-2 mb-6">
            <Settings className="w-4 h-4" /> Propriedades do Campo
          </Label>

          {editingField ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Nome do Campo (Pergunta)</Label>
                <Input 
                  value={editingField.label}
                  onChange={(e) => updateField(editingField.id, { label: e.target.value })}
                  className="bg-black/40 border-white/10 h-8 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tipo de Resposta</Label>
                <Select 
                  value={editingField.type} 
                  onValueChange={(val) => updateField(editingField.id, { type: val })}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {fieldTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-2 border-y border-white/5">
                <Label className="text-xs font-normal text-muted-foreground cursor-pointer">Resposta Obrigatória</Label>
                <Switch 
                  checked={editingField.required} 
                  onCheckedChange={(c) => updateField(editingField.id, { required: c })} 
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs text-muted-foreground">Variável Dinâmica Associada</Label>
                <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed">
                  A resposta deste campo será salva nesta variável para você usar em contratos e mensagens de WhatsApp.
                </p>
                <Input 
                  value={editingField.variable}
                  onChange={(e) => updateField(editingField.id, { variable: e.target.value })}
                  placeholder="Ex: {{valor_projeto}}"
                  className="bg-black/40 border-white/10 h-8 text-sm font-mono text-emerald-400"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">Selecione um campo ao lado para editar suas propriedades.</p>
            </div>
          )}
        </div>

        {/* Live Preview Panel */}
        <div className="w-full lg:w-[350px] shrink-0 bg-[#f4f4f5] dark:bg-zinc-950 p-6 flex flex-col overflow-y-auto">
          <Label className="text-muted-foreground font-medium flex items-center gap-2 mb-6">
            <FileText className="w-4 h-4" /> Preview do Formulário
          </Label>
          
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-5 space-y-5">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-2">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {mode === 'contract' ? 'Dados do Projeto' : 'Briefing Inicial'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Preencha as informações abaixo.</p>
            </div>

            {fields.map(field => (
              <div key={field.id} className="space-y-1.5 opacity-80 pointer-events-none">
                <Label className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
                {field.type === 'long_text' ? (
                  <Textarea className="min-h-[60px] bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" placeholder="Sua resposta..." />
                ) : field.type === 'file_upload' ? (
                  <div className="h-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-xs text-zinc-400">
                    Clique para anexar arquivo
                  </div>
                ) : (
                  <Input className="h-8 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-xs" placeholder={field.type === 'email' ? 'exemplo@email.com' : 'Sua resposta...'} />
                )}
              </div>
            ))}

            <Button className="w-full mt-4 bg-primary text-primary-foreground pointer-events-none opacity-80">
              Enviar Formulário
            </Button>
          </div>
        </div>
      </div>

      <div className="shrink-0 p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => onSave(fields)}>
          Salvar Formulário
        </Button>
      </div>
    </div>
  );
}
