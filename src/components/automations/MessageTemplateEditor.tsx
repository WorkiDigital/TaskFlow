import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Smartphone, Type, Smile, Italic, Bold, List, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";

const availableVariables = [
  { key: "{{nome_cliente}}", label: "Nome do Cliente", mock: "João Silva" },
  { key: "{{empresa_cliente}}", label: "Empresa", mock: "Acme Corp" },
  { key: "{{nome_projeto}}", label: "Nome do Projeto", mock: "Lançamento Web" },
  { key: "{{nome_agencia}}", label: "Agência", mock: "Agência Prime" },
  { key: "{{link_google_drive}}", label: "Link do Drive", mock: "https://drive.google.com/..." },
  { key: "{{link_formulario_briefing}}", label: "Link do Briefing", mock: "https://forms.app/briefing/123" }
];

interface MessageTemplateEditorProps {
  initialMessage: string;
  onSave: (message: string) => void;
  onCancel: () => void;
}

export function MessageTemplateEditor({ initialMessage, onSave, onCancel }: MessageTemplateEditorProps) {
  const [message, setMessage] = useState(initialMessage);

  // Mention State (Phase 7)
  const [mentionsEnabled, setMentionsEnabled] = useState(false);
  const [mentionClient, setMentionClient] = useState(true);
  const [mentionAgency, setMentionAgency] = useState(false);
  const [mentionAll, setMentionAll] = useState(false);
  const [textBeforeMention, setTextBeforeMention] = useState("Responsáveis marcados:");
  const [textAfterMention, setTextAfterMention] = useState("");

  const insertVariable = (variableKey: string) => {
    setMessage(prev => prev + variableKey);
    // Em um cenário real, inserir na posição do cursor
  };

  const insertFormat = (format: string) => {
    setMessage(prev => prev + format);
  };

  // Replace variables with mock data for the preview
  const generatePreview = (text: string) => {
    let previewText = text;
    availableVariables.forEach(v => {
      previewText = previewText.split(v.key).join(v.mock);
    });
    
    // Simulate WhatsApp basic markdown formatting
    // Bold: *text*
    previewText = previewText.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    // Italic: _text_
    previewText = previewText.replace(/_(.*?)_/g, '<em>$1</em>');
    // Strikethrough: ~text~
    previewText = previewText.replace(/~(.*?)~/g, '<del>$1</del>');

    // Add Mentions Preview if enabled
    if (mentionsEnabled && (mentionClient || mentionAgency || mentionAll)) {
      let mentionsStr = [];
      if (mentionAll) mentionsStr.push("@todos");
      else {
        if (mentionClient) mentionsStr.push("@cliente");
        if (mentionAgency) mentionsStr.push("@gestor");
      }
      
      const mentionBlock = `\n\n${textBeforeMention ? textBeforeMention + ' ' : ''}<span class="text-blue-400">${mentionsStr.join(' ')}</span>${textAfterMention ? ' ' + textAfterMention : ''}`;
      previewText += mentionBlock;
    }

    return previewText;
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)] w-full">
      <div className="shrink-0 p-6 border-b border-white/5">
        <h2 className="text-xl font-semibold tracking-tight">Editar Mensagem</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure o texto que será enviado automaticamente no WhatsApp.</p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Editor Panel */}
        <div className="flex-1 p-6 overflow-y-auto border-r border-white/5 flex flex-col gap-6">
          <div className="space-y-3">
            <Label className="text-muted-foreground font-medium flex items-center gap-2">
              <Type className="w-4 h-4" /> Variáveis Dinâmicas
            </Label>
            <div className="flex flex-wrap gap-2 p-3 glass-panel rounded-xl border border-white/5">
              {availableVariables.map(v => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white/5 hover:bg-primary/20 hover:text-primary-foreground border border-white/10 rounded-md transition-colors"
                >
                  {v.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">Clique para inserir no final do texto.</p>
          </div>

          <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-medium">Conteúdo da Mensagem</Label>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-md border border-white/5">
                <button onClick={() => insertFormat('*negrito*')} className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground" title="Negrito"><Bold className="w-3.5 h-3.5" /></button>
                <button onClick={() => insertFormat('_itálico_')} className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground" title="Itálico"><Italic className="w-3.5 h-3.5" /></button>
                <button onClick={() => insertFormat('\n- ')} className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground" title="Lista"><List className="w-3.5 h-3.5" /></button>
                <button onClick={() => insertFormat(' 😊')} className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground" title="Emoji"><Smile className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <Textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 resize-none bg-black/20 border-white/10 focus-visible:ring-primary font-mono text-sm leading-relaxed p-4 h-full min-h-[200px]"
              placeholder="Olá {{nome_cliente}}! Seja bem-vindo..."
            />
          </div>

          {/* Phase 7: Mentions Configuration */}
          <div className="glass-panel p-4 border border-white/5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2 text-foreground font-medium"><AtSign className="w-4 h-4" /> Ativar Menções</Label>
                <p className="text-xs text-muted-foreground mt-1">Marque participantes no grupo usando o @</p>
              </div>
              <Switch checked={mentionsEnabled} onCheckedChange={setMentionsEnabled} />
            </div>

            {mentionsEnabled && (
              <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Quem deve ser mencionado?</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="mentionClient" checked={mentionClient} onCheckedChange={(c) => setMentionClient(!!c)} disabled={mentionAll} />
                      <Label htmlFor="mentionClient" className="text-sm font-normal cursor-pointer">Cliente principal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="mentionAgency" checked={mentionAgency} onCheckedChange={(c) => setMentionAgency(!!c)} disabled={mentionAll} />
                      <Label htmlFor="mentionAgency" className="text-sm font-normal cursor-pointer">Gestores da agência</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="mentionAll" checked={mentionAll} onCheckedChange={(c) => {
                        setMentionAll(!!c);
                        if(c) { setMentionClient(false); setMentionAgency(false); }
                      }} />
                      <Label htmlFor="mentionAll" className="text-sm font-normal cursor-pointer">Mencionar @todos os participantes</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Texto antes da menção</Label>
                    <input 
                      className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      value={textBeforeMention}
                      onChange={(e) => setTextBeforeMention(e.target.value)}
                      placeholder="Ex: Responsáveis:"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Texto depois da menção</Label>
                    <input 
                      className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      value={textAfterMention}
                      onChange={(e) => setTextAfterMention(e.target.value)}
                      placeholder="Ex: por favor verifiquem."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-full lg:w-[400px] shrink-0 bg-black/40 p-6 flex flex-col">
          <Label className="text-muted-foreground font-medium flex items-center gap-2 mb-6">
            <Smartphone className="w-4 h-4" /> Simulação no WhatsApp
          </Label>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* WhatsApp Chat Bubble Mock */}
            <div className="w-full max-w-[320px] bg-[#0b141a] rounded-[24px] border border-white/5 overflow-hidden shadow-2xl relative">
              {/* Header Mock */}
              <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                  <span className="text-[10px] text-primary-foreground font-bold">AP</span>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-slate-200">Grupo do Projeto</h5>
                  <p className="text-[10px] text-slate-400">Você, João Silva, Gestor...</p>
                </div>
              </div>
              
              {/* Chat Background Mock */}
              <div className="bg-[#0b141a] p-4 min-h-[300px] flex flex-col relative z-0">
                {/* Chat Background Pattern (Simulated) */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                
                {message ? (
                  <div className="bg-[#202c33] text-[#e9edef] text-[13px] rounded-lg rounded-tl-none p-3 shadow-sm relative z-10 w-fit max-w-[90%] self-start whitespace-pre-wrap leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: generatePreview(message) }} />
                    <div className="text-[10px] text-[#8696a0] mt-1.5 text-right w-full block">Agora</div>
                  </div>
                ) : (
                  <div className="m-auto text-center">
                    <Badge variant="outline" className="bg-white/5 text-muted-foreground border-transparent">
                      A mensagem aparecerá aqui
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => {
          // Payload futuro sugerido para a Evolution API:
          const futurePayload = {
            enabled: true,
            action: 'send_text_with_mentions',
            message: message,
            mentions: mentionsEnabled ? {
              mentionClient,
              mentionAgency,
              mentionAll,
              textBefore: textBeforeMention,
              textAfter: textAfterMention
            } : null
          };
          console.log('[MessageTemplateEditor] Future Payload Prepared:', futurePayload);
          onSave(message);
        }}>
          Salvar Mensagem
        </Button>
      </div>
    </div>
  );
}
