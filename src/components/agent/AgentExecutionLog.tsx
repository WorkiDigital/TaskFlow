import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AgentExecutionLog as LogEntry } from "@/services/agentService";

const eventColor: Record<string, string> = {
  analyze_completed: "text-success",
  execute_completed: "text-success",
  action_suggested: "text-primary",
  action_approved: "text-info",
  analyze_failed: "text-destructive",
  execute_failed: "text-destructive",
  execute_started: "text-muted-foreground",
  analyze_started: "text-muted-foreground",
  action_dismissed: "text-muted-foreground",
};

const eventLabel: Record<string, string> = {
  analyze_started: "Análise iniciada",
  analyze_completed: "Análise concluída",
  analyze_failed: "Falha na análise",
  action_suggested: "Ação sugerida",
  action_approved: "Ação aprovada",
  action_dismissed: "Ação descartada",
  execute_started: "Execução iniciada",
  execute_completed: "Execução concluída",
  execute_failed: "Falha na execução",
};

interface AgentExecutionLogProps {
  logs: LogEntry[];
  isLoading?: boolean;
}

export function AgentExecutionLog({ logs, isLoading }: AgentExecutionLogProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs text-muted-foreground">Carregando logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
        <p className="text-xs text-muted-foreground/60">
          Os logs aparecerão aqui após análises e execuções
        </p>
      </div>
    );
  }

  const displayed = expanded ? logs : logs.slice(0, 5);

  return (
    <div className="space-y-1">
      {displayed.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div
            className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 shrink-0 opacity-70"
            style={{ color: "inherit" }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  eventColor[log.event_type] ?? "text-muted-foreground",
                )}
              >
                {eventLabel[log.event_type] ?? log.event_type}
              </span>
              <span className="text-xs text-muted-foreground/50 ml-auto shrink-0">
                {new Date(log.created_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.message}</p>
          </div>
        </div>
      ))}

      {logs.length > 5 && (
        <button
          className="w-full flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Ver todos ({logs.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}
