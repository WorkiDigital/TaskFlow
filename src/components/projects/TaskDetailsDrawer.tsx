import { useState, useEffect } from "react";
import { ProjectTask, mockProjectColumns } from "@/data/mockProjects";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Save, Clock, MessageSquare, Paperclip, Send, Activity, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamMember } from "@/services/teamService";

interface TaskDetailsDrawerProps {
  task: ProjectTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (task: ProjectTask) => void;
  onMove: (task: ProjectTask, direction: "next" | "prev") => void;
  members: TeamMember[];
}

export function TaskDetailsDrawer({ task, open, onOpenChange, onUpdate, onMove, members }: TaskDetailsDrawerProps) {
  const [formData, setFormData] = useState<ProjectTask | null>(null);
  const [newComment, setNewComment] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");

  useEffect(() => {
    if (task) {
      setFormData({ ...task });
    } else {
      setFormData(null);
    }
  }, [task]);

  if (!formData) return null;

  const handleSave = () => {
    if (!formData.title.trim() || !formData.assignee.trim()) {
      toast.error("Título e Responsável são obrigatórios");
      return;
    }

    const changedFields = [];
    if (formData.title !== task?.title) changedFields.push("título");
    if (formData.assignee !== task?.assignee) changedFields.push("responsável");
    if (formData.status !== task?.status) changedFields.push("status");
    if (formData.priority !== task?.priority) changedFields.push("prioridade");
    if (formData.dueDate !== task?.dueDate) changedFields.push("prazo");
    if (formData.description !== task?.description) changedFields.push("descrição");

    let updatedFormData = { ...formData };
    if (changedFields.length > 0) {
      updatedFormData.activity = [
        {
          id: `a-edit-${Date.now()}`,
          description: `Você atualizou: ${changedFields.join(", ")}`,
          timestamp: new Date().toISOString()
        },
        ...(formData.activity || [])
      ];
    }

    onUpdate(updatedFormData);
    toast.success("Tarefa salva com sucesso!");
    onOpenChange(false);
  };

  const toggleChecklist = (id: string, checked: boolean) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        checklist: prev.checklist.map(c => c.id === id ? { ...c, done: checked } : c)
      };
    });
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        checklist: [
          ...(prev.checklist || []),
          {
            id: `chk-new-${Date.now()}`,
            title: newChecklistItem.trim(),
            done: false
          }
        ],
        activity: [
          {
            id: `a-chk-${Date.now()}`,
            description: `Você adicionou "${newChecklistItem.trim()}" ao checklist`,
            timestamp: new Date().toISOString()
          },
          ...(prev.activity || [])
        ]
      };
    });
    setNewChecklistItem("");
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: [
          ...(prev.comments || []),
          {
            id: `c-new-${Date.now()}`,
            author: "Você",
            content: newComment,
            timestamp: new Date().toISOString()
          }
        ],
        activity: [
          {
            id: `a-new-${Date.now()}`,
            description: "Você adicionou um comentário",
            timestamp: new Date().toISOString()
          },
          ...(prev.activity || [])
        ]
      }
    });
    setNewComment("");
  };

  const currentColumnIndex = mockProjectColumns.findIndex(c => c.status === formData.status);
  const canMovePrev = currentColumnIndex > 0;
  const canMoveNext = currentColumnIndex < mockProjectColumns.length - 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="glass-panel border-border sm:max-w-4xl w-[95vw] overflow-y-auto p-0">
        <div className="flex flex-col md:flex-row h-full">
          {/* Main Info Column */}
          <div className="flex-1 p-6 border-r border-white/5 space-y-6 overflow-y-auto no-scrollbar">
            <SheetHeader className="mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="uppercase text-[10px] tracking-wider text-muted-foreground bg-white/5">
                  {mockProjectColumns.find(c => c.status === formData.status)?.title || formData.status}
                </Badge>
                {formData.tags?.map(t => (
                  <Badge key={t} variant="secondary" className="text-[10px] bg-primary/20 text-primary-foreground">{t}</Badge>
                ))}
              </div>
              <SheetTitle>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="text-xl font-bold bg-transparent border-transparent px-0 h-auto focus-visible:ring-0 focus-visible:border-primary"
                />
              </SheetTitle>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-white/5 space-y-1">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Responsável</p>
                <Select value={formData.assignee} onValueChange={(v) => setFormData({ ...formData, assignee: v })}>
                  <SelectTrigger className="h-8 bg-background/50 border-white/10 text-xs">
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.full_name || m.email}>
                        {m.full_name || m.email}
                      </SelectItem>
                    ))}
                    {members.length === 0 && (
                      <SelectItem value="none" disabled>Sem membros</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Prazo</p>
                <Input 
                  type="date"
                  value={formData.dueDate || ""}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="h-8 py-1 text-xs bg-background/50 border-white/10"
                />
              </div>
              <div className="!mt-2">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v, columnId: mockProjectColumns.find(c => c.status === v)?.id || formData.columnId })}>
                  <SelectTrigger className="h-8 bg-background/50 border-white/10 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {mockProjectColumns.map(col => (
                      <SelectItem key={col.status} value={col.status}>{col.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="!mt-2">
                <p className="text-xs text-muted-foreground mb-1">Prioridade</p>
                <Select value={formData.priority} onValueChange={(v: any) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger className="h-8 bg-background/50 border-white/10 text-xs">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.customFields && Object.keys(formData.customFields).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2"><Paperclip className="w-4 h-4" /> Campos Personalizados</h4>
                <div className="grid grid-cols-2 gap-2 text-sm bg-black/10 p-3 rounded-lg border border-white/5">
                  {Object.entries(formData.customFields).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea 
                id="desc" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="bg-background/50 resize-none min-h-[100px]"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label>Checklist {formData.checklist?.length > 0 ? `(${Math.round((formData.checklist.filter(c => c.done).length / formData.checklist.length) * 100)}%)` : ""}</Label>
              </div>
              <div className="space-y-2 bg-black/10 rounded-lg p-3 border border-white/5">
                {formData.checklist?.map(item => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`chk-${item.id}`} 
                      checked={item.done} 
                      onCheckedChange={(c) => toggleChecklist(item.id, c === true)} 
                    />
                    <label 
                      htmlFor={`chk-${item.id}`} 
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${item.done ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {item.title}
                    </label>
                  </div>
                ))}
                
                <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                  <Input 
                    placeholder="Adicionar item ao checklist..." 
                    value={newChecklistItem}
                    onChange={e => setNewChecklistItem(e.target.value)}
                    className="h-7 text-xs bg-white/5 border-white/10"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={handleAddChecklistItem}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" /> Salvar Alterações
              </Button>
            </div>
          </div>

          {/* Activity / Comments Column */}
          <div className="w-full md:w-[400px] shrink-0 bg-black/20 p-6 flex flex-col h-[50vh] md:h-full border-t md:border-t-0 border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Comentários</h4>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2 mb-4">
              {formData.comments?.map(comment => (
                <div key={comment.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">{comment.author}</span>
                    <span className="text-muted-foreground">{new Date(comment.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg text-sm border border-white/5">
                    {comment.content}
                  </div>
                </div>
              ))}
              {formData.comments?.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum comentário.</p>
              )}

              <div className="pt-4 mt-4 border-t border-white/5">
                <h4 className="text-xs font-semibold flex items-center gap-2 mb-3 text-muted-foreground"><Activity className="w-3 h-3" /> Histórico</h4>
                <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                  {formData.activity?.map(log => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] text-xs text-muted-foreground">
                        {log.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-2 relative">
              <Textarea 
                placeholder="Escrever comentário..." 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="min-h-[80px] bg-background/50 border-white/10 resize-none pr-10 text-sm"
              />
              <Button size="icon" variant="ghost" className="absolute right-2 bottom-2 h-8 w-8 text-primary hover:text-primary hover:bg-primary/20" onClick={handleSendComment}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
