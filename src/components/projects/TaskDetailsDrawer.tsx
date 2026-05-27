import { useState, useEffect, useRef } from "react";
import { ProjectTask, mockProjectColumns } from "@/data/mockProjects";
import {
  updateProjectTask,
  getTaskComments,
  createTaskComment,
  deleteTaskComment,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  getSubtasks,
  createSubtask,
  updateSubtask,
  type TaskComment,
  type DbProjectTask,
  type DbProjectColumn,
} from "@/services/projectsService";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Save,
  MessageSquare,
  Paperclip,
  Send,
  Activity,
  Circle,
  CheckCircle2,
  GitBranch,
  Trash2,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamMember } from "@/services/teamService";
import { TaskTimerPanel } from "./TaskTimerPanel";

interface TaskDetailsDrawerProps {
  task: ProjectTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (task: ProjectTask) => void;
  onMove: (task: ProjectTask, direction: "next" | "prev") => void;
  members: TeamMember[];
  columns?: DbProjectColumn[];
}

function isDbId(id: string) {
  return id && !id.startsWith("t-") && !id.startsWith("chk-new-");
}

export function TaskDetailsDrawer({
  task,
  open,
  onOpenChange,
  onUpdate,
  onMove,
  members,
  columns,
}: TaskDetailsDrawerProps) {
  const [formData, setFormData] = useState<ProjectTask | null>(null);
  const [newComment, setNewComment] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const [dbComments, setDbComments] = useState<TaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const [subtasks, setSubtasks] = useState<DbProjectTask[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  const activeCols = columns && columns.length > 0 ? columns : mockProjectColumns;

  useEffect(() => {
    if (task) {
      setFormData({ ...task });
    } else {
      setFormData(null);
      setDbComments([]);
      setSubtasks([]);
    }
  }, [task]);

  useEffect(() => {
    if (!task || !open) return;
    if (!isDbId(task.id)) return;

    setLoadingComments(true);
    getTaskComments(task.id)
      .then(setDbComments)
      .catch((e) => console.error("[Drawer] comments:", e))
      .finally(() => setLoadingComments(false));

    setLoadingSubtasks(true);
    getSubtasks(task.id)
      .then(setSubtasks)
      .catch((e) => console.error("[Drawer] subtasks:", e))
      .finally(() => setLoadingSubtasks(false));
  }, [task, open]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dbComments]);

  if (!formData) return null;

  const isDb = isDbId(formData.id);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (isDb) {
      const assigneeMember = members.find(
        (m) => (m.full_name || m.email) === formData.assignee,
      );
      // Resolve column_id from selected status
      const matchedCol = activeCols.find(
        (c) => ("status" in c ? c.status === formData.status : c.id === formData.columnId),
      );
      try {
        await updateProjectTask(formData.id, {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          due_date: formData.dueDate || undefined,
          assignee_id: assigneeMember?.id,
          column_id: matchedCol?.id,
        });
      } catch (err) {
        console.error("[TaskDetailsDrawer] Erro ao salvar:", err);
        toast.error("Erro ao salvar no banco. Alterações aplicadas localmente.");
      }
    }

    onUpdate(formData);
    toast.success("Tarefa salva com sucesso!");
    onOpenChange(false);
  };

  // ── Checklist ──────────────────────────────────────────────────────────────

  const toggleChecklist = async (id: string, checked: boolean) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        checklist: prev.checklist.map((c) => (c.id === id ? { ...c, done: checked } : c)),
      };
    });
    if (isDb && isDbId(id)) {
      try {
        await updateChecklistItem(id, { is_done: checked });
      } catch (e) {
        console.error("[Drawer] toggleChecklist:", e);
      }
    }
  };

  const handleAddChecklistItem = async () => {
    const title = newChecklistItem.trim();
    if (!title) return;
    setNewChecklistItem("");

    if (isDb) {
      try {
        const item = await createChecklistItem(formData.id, title);
        setFormData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            checklist: [...(prev.checklist || []), { id: item.id, title: item.title, done: item.is_done }],
          };
        });
        return;
      } catch (e) {
        console.error("[Drawer] createChecklistItem:", e);
      }
    }

    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        checklist: [
          ...(prev.checklist || []),
          { id: `chk-new-${Date.now()}`, title, done: false },
        ],
      };
    });
  };

  const handleDeleteChecklistItem = async (id: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, checklist: prev.checklist.filter((c) => c.id !== id) };
    });
    if (isDb && isDbId(id)) {
      try {
        await deleteChecklistItem(id);
      } catch (e) {
        console.error("[Drawer] deleteChecklistItem:", e);
      }
    }
  };

  // ── Comments ───────────────────────────────────────────────────────────────

  const handleSendComment = async () => {
    const content = newComment.trim();
    if (!content) return;
    setNewComment("");

    if (isDb) {
      setSendingComment(true);
      try {
        const comment = await createTaskComment(formData.id, formData.projectId, content);
        setDbComments((prev) => [...prev, comment]);
      } catch (e) {
        console.error("[Drawer] createTaskComment:", e);
        toast.error("Erro ao enviar comentário.");
      } finally {
        setSendingComment(false);
      }
      return;
    }

    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: [
          ...(prev.comments || []),
          {
            id: `c-new-${Date.now()}`,
            author: "Você",
            content,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    setDbComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      await deleteTaskComment(commentId);
    } catch (e) {
      console.error("[Drawer] deleteTaskComment:", e);
    }
  };

  // ── Subtasks ───────────────────────────────────────────────────────────────

  const handleAddSubtask = async () => {
    const title = newSubtaskTitle.trim();
    if (!title || !isDb) return;
    setNewSubtaskTitle("");
    setAddingSubtask(true);
    try {
      const sub = await createSubtask(formData.id, {
        title,
        project_id: formData.projectId,
      });
      setSubtasks((prev) => [...prev, sub]);
    } catch (e) {
      console.error("[Drawer] createSubtask:", e);
      toast.error("Erro ao criar subtarefa.");
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (sub: DbProjectTask) => {
    const newCompletedAt = sub.completed_at ? null : new Date().toISOString();
    setSubtasks((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, completed_at: newCompletedAt } : s)),
    );
    try {
      await updateSubtask(sub.id, { completed_at: newCompletedAt });
    } catch (e) {
      console.error("[Drawer] toggleSubtask:", e);
    }
  };

  // ── Column/status helpers ──────────────────────────────────────────────────

  const currentColLabel = (() => {
    if (columns && columns.length > 0) {
      return columns.find((c) => c.id === formData.columnId)?.title ?? formData.status;
    }
    return mockProjectColumns.find((c) => c.status === formData.status)?.title ?? formData.status;
  })();

  const completedSubtasks = subtasks.filter((s) => s.completed_at).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="glass-panel border-border sm:max-w-4xl w-[95vw] overflow-y-auto p-0">
        <div className="flex flex-col md:flex-row h-full">

          {/* ── Left column: main info ── */}
          <div className="flex-1 p-6 border-r border-white/5 space-y-6 overflow-y-auto no-scrollbar">
            <SheetHeader className="mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="uppercase text-[10px] tracking-wider text-muted-foreground bg-white/5"
                >
                  {currentColLabel}
                </Badge>
                {formData.tags?.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="text-[10px] bg-primary/20 text-primary-foreground"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
              <SheetTitle>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-xl font-bold bg-transparent border-transparent px-0 h-auto focus-visible:ring-0 focus-visible:border-primary"
                />
              </SheetTitle>
            </SheetHeader>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-white/5 space-y-1">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Responsável</p>
                <Select
                  value={formData.assignee}
                  onValueChange={(v) => setFormData({ ...formData, assignee: v })}
                >
                  <SelectTrigger className="h-8 bg-background/50 border-white/10 text-xs">
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.full_name || m.email}>
                        {m.full_name || m.email}
                      </SelectItem>
                    ))}
                    {members.length === 0 && (
                      <SelectItem value="none" disabled>
                        Sem membros
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Prazo</p>
                <Input
                  type="date"
                  value={formData.dueDate || ""}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="h-8 py-1 text-xs bg-background/50 border-white/10"
                />
              </div>
              <div className="!mt-2">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Select
                  value={
                    columns && columns.length > 0
                      ? (formData.columnId || "")
                      : formData.status
                  }
                  onValueChange={(v) => {
                    if (columns && columns.length > 0) {
                      const col = columns.find((c) => c.id === v);
                      setFormData({ ...formData, columnId: v, status: (col as any)?.status ?? formData.status });
                    } else {
                      const col = mockProjectColumns.find((c) => c.status === v);
                      setFormData({ ...formData, status: v as any, columnId: col?.id || formData.columnId });
                    }
                  }}
                >
                  <SelectTrigger className="h-8 bg-background/50 border-white/10 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {columns && columns.length > 0
                      ? columns.map((col) => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.title}
                          </SelectItem>
                        ))
                      : mockProjectColumns.map((col) => (
                          <SelectItem key={col.status} value={col.status}>
                            {col.title}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="!mt-2">
                <p className="text-xs text-muted-foreground mb-1">Prioridade</p>
                <Select
                  value={formData.priority}
                  onValueChange={(v: any) => setFormData({ ...formData, priority: v })}
                >
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

            {/* Custom fields */}
            {formData.customFields && Object.keys(formData.customFields).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Campos Personalizados
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm bg-black/10 p-3 rounded-lg border border-white/5">
                  {Object.entries(formData.customFields).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-xs text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}:
                      </span>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea
                id="desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-background/50 resize-none min-h-[100px]"
              />
            </div>

            {/* Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label>
                  Checklist{" "}
                  {formData.checklist?.length > 0
                    ? `(${Math.round(
                        (formData.checklist.filter((c) => c.done).length /
                          formData.checklist.length) *
                          100,
                      )}%)`
                    : ""}
                </Label>
              </div>
              <div className="space-y-1 bg-black/10 rounded-lg p-3 border border-white/5">
                {formData.checklist?.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <Checkbox
                      id={`chk-${item.id}`}
                      checked={item.done}
                      onCheckedChange={(c) => toggleChecklist(item.id, c === true)}
                    />
                    <label
                      htmlFor={`chk-${item.id}`}
                      className={`text-sm font-medium leading-none flex-1 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        item.done ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {item.title}
                    </label>
                    <button
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      aria-label="Remover item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                  <Input
                    placeholder="Adicionar item ao checklist..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    className="h-7 text-xs bg-white/5 border-white/10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2 shrink-0"
                    onClick={handleAddChecklistItem}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>

            {/* Subtasks — only for root tasks, not for subtasks themselves */}
            {!formData.parentTaskId && <div className="space-y-3 pt-2">
              <Label className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5" />
                Subtarefas
                {subtasks.length > 0 && (
                  <span className="text-[10px] bg-white/5 text-muted-foreground px-1.5 py-0.5 rounded-full">
                    {completedSubtasks}/{subtasks.length}
                  </span>
                )}
              </Label>
              <div className="space-y-1.5 bg-black/10 rounded-lg p-3 border border-white/5">
                {loadingSubtasks ? (
                  <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" /> Carregando...
                  </p>
                ) : (
                  subtasks.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2 group">
                      <button
                        onClick={() => handleToggleSubtask(sub)}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={sub.completed_at ? "Marcar como pendente" : "Marcar como concluída"}
                      >
                        {sub.completed_at ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Circle className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span
                        className={`text-sm flex-1 ${
                          sub.completed_at ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {sub.title}
                      </span>
                    </div>
                  ))
                )}
                {!loadingSubtasks && subtasks.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 italic">
                    {isDb ? "Nenhuma subtarefa." : "Salve a tarefa primeiro para criar subtarefas."}
                  </p>
                )}
                {isDb && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                    <Input
                      placeholder="Nova subtarefa..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="h-7 text-xs bg-white/5 border-white/10"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubtask();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2 shrink-0"
                      onClick={handleAddSubtask}
                      disabled={addingSubtask}
                    >
                      {addingSubtask ? <Loader2 className="w-3 h-3 animate-spin" /> : "Adicionar"}
                    </Button>
                  </div>
                )}
              </div>
            </div>}

            {/* Save */}
            <div className="pt-4 flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" /> Salvar Alterações
              </Button>
            </div>
          </div>

          {/* ── Right column: timer + comments ── */}
          <div className="w-full md:w-[400px] shrink-0 bg-black/20 p-6 flex flex-col h-[50vh] md:h-full border-t md:border-t-0 border-white/5">
            {formData.id && isDb && (
              <div className="mb-6">
                <TaskTimerPanel taskId={formData.id} projectId={formData.projectId} />
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Comentários
                {dbComments.length > 0 && (
                  <span className="text-xs text-muted-foreground bg-white/5 px-1.5 rounded-full">
                    {dbComments.length}
                  </span>
                )}
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 mb-4">
              {loadingComments ? (
                <p className="text-xs text-muted-foreground italic flex items-center gap-1.5 py-4">
                  <Loader2 className="w-3 h-3 animate-spin" /> Carregando comentários...
                </p>
              ) : dbComments.length > 0 ? (
                dbComments.map((comment) => (
                  <div key={comment.id} className="space-y-1 group">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="w-4 h-4">
                          <AvatarFallback className="text-[8px] bg-primary/20">
                            {(comment.user?.full_name || comment.user?.email || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">
                          {comment.user?.full_name || comment.user?.email || "Usuário"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {new Date(comment.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          aria-label="Excluir comentário"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-lg text-sm border border-white/5">
                      {comment.content}
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* fallback para comentários locais (mock tasks) */}
                  {(formData.comments || []).map((comment) => (
                    <div key={comment.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold">{comment.author}</span>
                        <span className="text-muted-foreground">
                          {new Date(comment.timestamp).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg text-sm border border-white/5">
                        {comment.content}
                      </div>
                    </div>
                  ))}
                  {(formData.comments || []).length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-4">
                      Nenhum comentário ainda.
                    </p>
                  )}
                </>
              )}

              {/* Activity log */}
              {formData.activity && formData.activity.length > 0 && (
                <div className="pt-4 mt-4 border-t border-white/5">
                  <h4 className="text-xs font-semibold flex items-center gap-2 mb-3 text-muted-foreground">
                    <Activity className="w-3 h-3" /> Histórico
                  </h4>
                  <div className="space-y-2">
                    {formData.activity.map((log) => (
                      <p key={log.id} className="text-xs text-muted-foreground pl-2 border-l border-white/10">
                        {log.description}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment input */}
            <div className="mt-auto pt-2 relative">
              <Textarea
                placeholder="Escrever comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] bg-background/50 border-white/10 resize-none pr-10 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 bottom-2 h-8 w-8 text-primary hover:text-primary hover:bg-primary/20"
                onClick={handleSendComment}
                disabled={sendingComment}
                aria-label="Enviar comentário"
              >
                {sendingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
