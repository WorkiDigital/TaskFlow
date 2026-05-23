import { useState, useRef } from 'react';
import { ChevronDown, Eye, EyeOff, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OnboardingMessage, Variable } from '@/data/onboardingTypes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const EMOJIS = ['😊', '🎉', '🚀', '✅', '📋', '📝', '💬', '🔔', '🏁', '✍️', '📄', '💡', '🌟', '👋', '🙌', '💎', '⚡', '📊', '🔗', '📎'];

interface MessagesTabProps {
  messages: OnboardingMessage[];
  variables: Variable[];
  onUpdate: (id: string, body: string) => void;
}

export function MessagesTab({ messages, variables, onUpdate }: MessagesTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(messages[0]?.id ?? null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          {messages.length} mensagem{messages.length !== 1 ? 's' : ''} configurável{messages.length !== 1 ? 's' : ''}
        </p>
        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
          Formatação WhatsApp
        </Badge>
      </div>

      {messages.map(msg => (
        <MessageCard
          key={msg.id}
          message={msg}
          variables={variables}
          expanded={expandedId === msg.id}
          onToggle={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
          onUpdate={body => onUpdate(msg.id, body)}
        />
      ))}
    </div>
  );
}

// ─── MessageCard ──────────────────────────────────────────────────────────────

interface MessageCardProps {
  message: OnboardingMessage;
  variables: Variable[];
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (body: string) => void;
}

function MessageCard({ message, variables, expanded, onToggle, onUpdate }: MessageCardProps) {
  const [body, setBody] = useState(message.body);
  const [showPreview, setShowPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (v: string) => {
    setBody(v);
    setIsDirty(true);
  };

  const handleSave = () => {
    onUpdate(body);
    setIsDirty(false);
    toast.success('Mensagem salva');
  };

  const insertVariable = (key: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const token = `{{${key}}}`;
    const next = body.slice(0, start) + token + body.slice(end);
    handleChange(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const next = body.slice(0, start) + emoji + body.slice(start);
    handleChange(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // Renderiza preview com variáveis mockadas e formatação básica
  const renderPreview = (text: string): string => {
    let result = text;
    variables.forEach(v => {
      result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.mockValue || `[${v.label}]`);
    });
    return result;
  };

  // Formata texto estilo WhatsApp para preview HTML
  const formatWhatsApp = (text: string): string => {
    return text
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className={cn(
      'glass-card transition-all duration-200',
      expanded ? 'border-white/10' : 'border-white/5'
    )}>
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={onToggle}
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg shrink-0">
          {message.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{message.name}</p>
          <p className="text-xs text-muted-foreground truncate">{message.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <Badge className="text-[10px] bg-warning/10 text-warning border-warning/20 border">Não salvo</Badge>
          )}
          <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {/* Body expandido */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Inserir variável */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs border-border hover:border-primary/50 hover:bg-primary/5">
                  <Hash className="w-3 h-3" />
                  Variável
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover border-border w-64 max-h-72 overflow-y-auto" align="start">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Inserir variável</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {variables.map(v => (
                  <DropdownMenuItem
                    key={v.id}
                    onClick={() => insertVariable(v.key)}
                    className="flex items-center gap-2 cursor-pointer hover:bg-white/5"
                  >
                    <code className="text-[10px] font-mono text-primary">{`{{${v.key}}}`}</code>
                    <span className="text-xs text-muted-foreground truncate">{v.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Emoji picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs border-border hover:border-primary/50">
                  😊 Emoji
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover border-border" align="start">
                <div className="grid grid-cols-5 gap-1 p-2">
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => insertEmoji(e)}
                      className="text-xl hover:bg-white/10 rounded-lg p-1 transition-colors"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Formatação */}
            <div className="flex gap-1">
              {[['*', 'B', 'font-bold'], ['_', 'I', 'italic']].map(([wrap, label, cls]) => (
                <Button
                  key={label}
                  variant="outline" size="sm"
                  className={cn('h-7 w-7 p-0 text-xs border-border hover:border-primary/50', cls)}
                  onClick={() => {
                    const el = textareaRef.current;
                    if (!el) return;
                    const s = el.selectionStart, e = el.selectionEnd;
                    const sel = body.slice(s, e);
                    const wrapped = sel ? `${wrap}${sel}${wrap}` : `${wrap}${wrap}`;
                    const next = body.slice(0, s) + wrapped + body.slice(e);
                    handleChange(next);
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Toggle preview */}
            <Button
              variant="ghost" size="sm"
              className="h-7 gap-1.5 text-xs ml-auto"
              onClick={() => setShowPreview(p => !p)}
            >
              {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showPreview ? 'Ocultar preview' : 'Mostrar preview'}
            </Button>
          </div>

          {/* Editor + preview */}
          <div className={cn('grid gap-3', showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1')}>
            {/* Textarea */}
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Editor</p>
              <textarea
                ref={textareaRef}
                value={body}
                onChange={e => handleChange(e.target.value)}
                rows={8}
                className="w-full rounded-xl border border-border bg-input/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono"
                placeholder="Digite a mensagem..."
              />
              <p className="text-[10px] text-muted-foreground">
                Use <code className="bg-white/10 px-1 rounded">*texto*</code> para negrito e{' '}
                <code className="bg-white/10 px-1 rounded">_texto_</code> para itálico
              </p>
            </div>

            {/* Preview WhatsApp */}
            {showPreview && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Preview (dados mockados)</p>
                <div className="rounded-xl border border-border bg-[oklch(0.14_0.02_145/0.3)] p-4 min-h-[180px]">
                  {/* Bolha de mensagem */}
                  <div className="bg-[oklch(0.32_0.06_140/0.6)] rounded-xl rounded-tl-none p-3 max-w-[90%]">
                    <p
                      className="text-sm text-foreground leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: formatWhatsApp(renderPreview(body)) }}
                    />
                    <p className="text-[10px] text-right text-muted-foreground mt-2">14:30 ✓✓</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={!isDirty}
              size="sm"
              className={cn('gap-1.5', isDirty ? 'bg-primary hover:bg-primary/90' : 'opacity-50')}
            >
              Salvar mensagem
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
