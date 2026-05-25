import { useState, useEffect } from "react";
import { Play, Pause, Square, Plus, Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  TimeEntry,
  startTaskTimer,
  pauseTaskTimer,
  resumeTaskTimer,
  stopTaskTimer,
  getTaskTimeEntries,
  createManualTimeEntry,
  getActiveTaskTimer,
} from "@/services/projectsService";
import { Input } from "@/components/ui/input";

interface TaskTimerPanelProps {
  taskId: string;
  projectId: string;
}

export function TaskTimerPanel({ taskId, projectId }: TaskTimerPanelProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualTime, setManualTime] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [activeTimerRes, allEntries] = await Promise.all([
          getActiveTaskTimer(),
          getTaskTimeEntries(taskId),
        ]);
        if (!active) return;
        setEntries(allEntries);
        // Ensure active timer matches current task
        if (activeTimerRes && activeTimerRes.task_id === taskId) {
          setActiveTimer(activeTimerRes);
        } else {
          setActiveTimer(null);
        }
      } catch (err) {
        console.error("Erro ao carregar timers:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [taskId]);

  // Tick the timer visually
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeTimer) {
      const updateDisplay = () => {
        let sec = activeTimer.duration_seconds || 0;
        if (activeTimer.status === "running" && activeTimer.started_at) {
          const startedAt = new Date(activeTimer.started_at);
          sec += Math.floor((new Date().getTime() - startedAt.getTime()) / 1000);
        }
        setDisplaySeconds(sec);
      };
      updateDisplay();
      if (activeTimer.status === "running") {
        interval = setInterval(updateDisplay, 1000);
      }
    } else {
      setDisplaySeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const handleToggleTimer = async () => {
    try {
      if (!activeTimer) {
        // Start
        const res = await startTaskTimer(taskId, projectId);
        setActiveTimer(res);
        setEntries((prev) => [res, ...prev]);
        toast.success("Timer iniciado!");
      } else if (activeTimer.status === "running") {
        // Pause
        const res = await pauseTaskTimer(activeTimer.id);
        setActiveTimer(res);
        updateEntryInState(res);
        toast.success("Timer pausado.");
      } else if (activeTimer.status === "paused") {
        // Resume
        const res = await resumeTaskTimer(activeTimer.id);
        setActiveTimer(res);
        updateEntryInState(res);
        toast.success("Timer retomado.");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro no timer");
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    try {
      const res = await stopTaskTimer(activeTimer.id);
      setActiveTimer(null);
      updateEntryInState(res);
      toast.success("Timer finalizado!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao parar timer");
    }
  };

  const handleSaveManual = async () => {
    // manualTime expects format HH:MM
    const parts = manualTime.split(":");
    if (parts.length !== 2) {
      toast.error("Use o formato HH:MM");
      return;
    }
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) {
      toast.error("Valor inválido");
      return;
    }
    const totalSecs = h * 3600 + m * 60;
    if (totalSecs <= 0) return;

    try {
      const res = await createManualTimeEntry(taskId, projectId, totalSecs, manualNote);
      // We don't have the user join data from this return, so we fetch all again to update history properly
      const allEntries = await getTaskTimeEntries(taskId);
      setEntries(allEntries);
      setIsManualOpen(false);
      setManualTime("");
      setManualNote("");
      toast.success("Tempo registrado!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao registrar tempo");
    }
  };

  const updateEntryInState = (updated: TimeEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
  };

  const formatTime = (sec: number) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Calculate total time for this task across all entries
  const totalSeconds =
    entries.reduce((acc, entry) => {
      if (entry.id === activeTimer?.id) return acc; // We'll add the active displaySeconds instead
      return acc + (entry.duration_seconds || 0);
    }, 0) + (activeTimer ? displaySeconds : 0);

  if (loading) {
    return (
      <div className="text-center p-4 text-xs text-muted-foreground animate-pulse">
        Carregando tempo...
      </div>
    );
  }

  return (
    <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" /> Controle de Tempo
        </h4>
        <span className="text-xs font-medium text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
          Total: {formatTime(totalSeconds)}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-4 bg-white/5 border border-white/10 rounded-xl items-center text-center">
        <div className="font-mono text-3xl font-bold tracking-wider text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]">
          {formatTime(displaySeconds)}
        </div>

        <div className="flex gap-2 w-full justify-center">
          <Button
            onClick={handleToggleTimer}
            variant={activeTimer?.status === "running" ? "secondary" : "default"}
            className="flex-1 max-w-[120px] min-h-[44px]"
          >
            {activeTimer?.status === "running" ? (
              <>
                <Pause className="w-4 h-4 mr-2" /> Pausar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> {activeTimer ? "Retomar" : "Iniciar"}
              </>
            )}
          </Button>

          {activeTimer && (
            <Button
              onClick={handleStopTimer}
              variant="destructive"
              className="flex-1 max-w-[120px] min-h-[44px]"
            >
              <Square className="w-4 h-4 mr-2" /> Parar
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-white/5">
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Histórico</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setIsManualOpen(!isManualOpen)}
          >
            <Plus className="w-3 h-3 mr-1" /> Manual
          </Button>
        </div>

        {isManualOpen && (
          <div className="bg-black/30 p-3 rounded-lg border border-white/5 space-y-2 mb-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="HH:MM"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="h-9 text-xs bg-white/5 text-center"
                />
              </div>
              <div className="flex-[2]">
                <Input
                  placeholder="Nota (opcional)"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="h-9 text-xs bg-white/5"
                />
              </div>
            </div>
            <Button size="sm" onClick={handleSaveManual} className="w-full h-8">
              Salvar Registro
            </Button>
          </div>
        )}

        <div className="space-y-2 max-h-[150px] overflow-y-auto no-scrollbar pr-1">
          {entries
            .filter((e) => e.status === "ended" || e.mode === "manual")
            .map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-xs"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {entry.users?.full_name || entry.users?.email || "Usuário"}
                  </span>
                  {entry.note ? (
                    <span className="text-muted-foreground truncate max-w-[120px]">
                      {entry.note}
                    </span>
                  ) : (
                    <span className="text-muted-foreground opacity-50 capitalize">
                      {entry.mode}
                    </span>
                  )}
                </div>
                <span className="font-mono font-medium">{formatTime(entry.duration_seconds)}</span>
              </div>
            ))}
          {entries.filter((e) => e.status === "ended" || e.mode === "manual").length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2 italic">
              Nenhum registro finalizado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
