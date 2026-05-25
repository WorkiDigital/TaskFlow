import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Database,
  Plus,
  Search,
  Trash2,
  Edit2,
  AlertCircle,
  Type,
  User,
  Briefcase,
  FileText,
  Smartphone,
} from "lucide-react";

export interface SystemVariable {
  id: string;
  key: string;
  name: string;
  source: "client" | "agency" | "project" | "contract" | "form" | "whatsapp" | "manual";
  mockValue: string;
  inUse: boolean;
  isSystem: boolean;
}

const defaultVariables: SystemVariable[] = [
  {
    id: "v1",
    key: "{{nome_cliente}}",
    name: "Nome do Cliente",
    source: "client",
    mockValue: "João Silva",
    inUse: true,
    isSystem: true,
  },
  {
    id: "v2",
    key: "{{empresa_cliente}}",
    name: "Empresa",
    source: "client",
    mockValue: "Acme Corp",
    inUse: true,
    isSystem: true,
  },
  {
    id: "v3",
    key: "{{email_cliente}}",
    name: "E-mail do Cliente",
    source: "client",
    mockValue: "joao@acme.com",
    inUse: false,
    isSystem: true,
  },
  {
    id: "v4",
    key: "{{telefone_cliente}}",
    name: "Telefone do Cliente",
    source: "client",
    mockValue: "5511999999999",
    inUse: false,
    isSystem: true,
  },
  {
    id: "v5",
    key: "{{nome_agencia}}",
    name: "Nome da Agência",
    source: "agency",
    mockValue: "Agência Prime",
    inUse: true,
    isSystem: true,
  },
  {
    id: "v6",
    key: "{{nome_projeto}}",
    name: "Nome do Projeto",
    source: "project",
    mockValue: "Lançamento Web 3.0",
    inUse: true,
    isSystem: true,
  },
  {
    id: "v7",
    key: "{{valor_projeto}}",
    name: "Valor do Projeto",
    source: "project",
    mockValue: "R$ 15.000,00",
    inUse: false,
    isSystem: true,
  },
  {
    id: "v8",
    key: "{{link_formulario_contrato}}",
    name: "Link Form Contrato",
    source: "form",
    mockValue: "https://forms.app/contrato/123",
    inUse: true,
    isSystem: true,
  },
  {
    id: "v9",
    key: "{{link_google_drive}}",
    name: "Link do Drive",
    source: "project",
    mockValue: "https://drive.google.com/folders/xyz",
    inUse: true,
    isSystem: true,
  },
];

const sourceIcons = {
  client: <User className="w-3 h-3" />,
  agency: <Briefcase className="w-3 h-3" />,
  project: <Database className="w-3 h-3" />,
  contract: <FileText className="w-3 h-3" />,
  form: <Type className="w-3 h-3" />,
  whatsapp: <Smartphone className="w-3 h-3" />,
  manual: <Edit2 className="w-3 h-3" />,
};

const sourceLabels = {
  client: "Cliente",
  agency: "Agência",
  project: "Projeto",
  contract: "Contrato",
  form: "Formulário",
  whatsapp: "WhatsApp",
  manual: "Manual",
};

interface VariableManagerProps {
  onClose: () => void;
}

export function VariableManager({ onClose }: VariableManagerProps) {
  const [variables, setVariables] = useState<SystemVariable[]>(defaultVariables);
  const [search, setSearch] = useState("");
  const [editingVar, setEditingVar] = useState<SystemVariable | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filteredVars = variables.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.key.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSaveVariable = () => {
    if (!editingVar) return;

    // Auto-format key to ensure it has {{ }}
    let formattedKey = editingVar.key.trim();
    if (!formattedKey.startsWith("{{")) formattedKey = "{{" + formattedKey;
    if (!formattedKey.endsWith("}}")) formattedKey = formattedKey + "}}";

    const updatedVar = { ...editingVar, key: formattedKey };

    if (isCreating) {
      setVariables([...variables, { ...updatedVar, id: `v_custom_${Date.now()}` }]);
    } else {
      setVariables(variables.map((v) => (v.id === updatedVar.id ? updatedVar : v)));
    }

    setEditingVar(null);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
  };

  const startCreate = () => {
    setEditingVar({
      id: "",
      key: "{{nova_variavel}}",
      name: "Nova Variável",
      source: "manual",
      mockValue: "Valor de Teste",
      inUse: false,
      isSystem: false,
    });
    setIsCreating(true);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)] w-full">
      <div className="shrink-0 p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Gerenciador de Variáveis</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e edite as variáveis dinâmicas usadas nas mensagens e formulários.
          </p>
        </div>
        <Button
          onClick={startCreate}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4" /> Nova Variável
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* List Panel */}
        <div className="flex-1 p-6 overflow-y-auto border-r border-white/5 flex flex-col gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar variáveis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-black/20 border-white/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {filteredVars.map((v) => (
              <div
                key={v.id}
                className="glass-panel p-4 border border-white/5 hover:border-white/10 rounded-xl transition-all cursor-pointer flex flex-col gap-3 group"
                onClick={() => {
                  setEditingVar(v);
                  setIsCreating(false);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-sm text-foreground">{v.name}</span>
                    <code className="text-[11px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded w-fit">
                      {v.key}
                    </code>
                  </div>
                  {!v.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(v.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    {sourceIcons[v.source]}
                    <span className="uppercase tracking-wider">{sourceLabels[v.source]}</span>
                  </div>

                  {v.inUse ? (
                    <Badge
                      variant="outline"
                      className="text-[9px] bg-primary/10 text-primary border-transparent h-4 px-1.5"
                    >
                      Em Uso
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[9px] bg-white/5 text-muted-foreground border-transparent h-4 px-1.5"
                    >
                      Livre
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {filteredVars.length === 0 && (
              <div className="col-span-full py-10 text-center text-muted-foreground flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 opacity-20" />
                <p className="text-sm">Nenhuma variável encontrada.</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Panel */}
        <div className="w-full lg:w-[380px] shrink-0 bg-black/20 p-6 flex flex-col border-r border-white/5 overflow-y-auto">
          {editingVar ? (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2">
              <Label className="text-foreground font-medium flex items-center gap-2 mb-6">
                <Database className="w-4 h-4" />
                {isCreating ? "Criar Nova Variável" : "Editar Variável"}
              </Label>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Nome Amigável</Label>
                  <Input
                    value={editingVar.name}
                    onChange={(e) => setEditingVar({ ...editingVar, name: e.target.value })}
                    className="bg-black/40 border-white/10"
                    placeholder="Ex: CPF do Cliente"
                    disabled={editingVar.isSystem}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Chave Técnica (Usada no texto)
                  </Label>
                  <Input
                    value={editingVar.key}
                    onChange={(e) => setEditingVar({ ...editingVar, key: e.target.value })}
                    className="bg-black/40 border-white/10 font-mono text-emerald-400"
                    placeholder="{{minha_variavel}}"
                    disabled={editingVar.isSystem}
                  />
                  {editingVar.isSystem && (
                    <p className="text-[10px] text-yellow-500/80 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Variáveis do sistema não podem ter
                      nome/chave alterados.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Valor Fictício (Para preview)
                  </Label>
                  <Input
                    value={editingVar.mockValue}
                    onChange={(e) => setEditingVar({ ...editingVar, mockValue: e.target.value })}
                    className="bg-black/40 border-white/10"
                    placeholder="Ex: 123.456.789-00"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Este valor será usado apenas para simular a visão das mensagens e contratos no
                    Builder.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Origem do Dado</Label>
                  <Select
                    value={editingVar.source}
                    onValueChange={(val: any) => setEditingVar({ ...editingVar, source: val })}
                    disabled={editingVar.isSystem}
                  >
                    <SelectTrigger className="bg-black/40 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="client">Ficha do Cliente</SelectItem>
                      <SelectItem value="agency">Dados da Agência</SelectItem>
                      <SelectItem value="project">Dados do Projeto</SelectItem>
                      <SelectItem value="form">Resposta de Formulário</SelectItem>
                      <SelectItem value="manual">Entrada Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-auto pt-6 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingVar(null);
                    setIsCreating(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleSaveVariable}
                >
                  Salvar Alterações
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground">
                <Type className="w-6 h-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                Selecione uma variável na lista ou crie uma nova para visualizar suas propriedades.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 p-6 border-t border-white/5 bg-black/20 flex justify-end">
        <Button variant="outline" onClick={onClose} className="border-white/10 hover:bg-white/5">
          Fechar Gerenciador
        </Button>
      </div>
    </div>
  );
}
