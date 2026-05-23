import { AlertCircle, AlertTriangle, Lightbulb, XCircle, ChevronDown, ChevronUp, Wand2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import type { AgentInsight, InsightCategory, InsightPriority } from '@/services/agentService';

const priorityTone: Record<InsightPriority, 'danger' | 'warning' | 'info' | 'neutral'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

const priorityLabel: Record<InsightPriority, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
};

const categoryIcon: Record<InsightCategory, React.ElementType> = {
  gap: AlertCircle,
  issue: XCircle,
  opportunity: Lightbulb,
  warning: AlertTriangle,
};

const categoryColor: Record<InsightCategory, string> = {
  gap: 'text-warning',
  issue: 'text-destructive',
  opportunity: 'text-success',
  warning: 'text-info',
};

interface AgentInsightCardProps {
  insight: AgentInsight;
  onDismiss: (id: string) => void;
  onSuggestActions: (insight: AgentInsight) => void;
  isLoadingSuggestions?: boolean;
}

export function AgentInsightCard({
  insight,
  onDismiss,
  onSuggestActions,
  isLoadingSuggestions,
}: AgentInsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = categoryIcon[insight.category];

  return (
    <div className="glass-card p-4 transition-all duration-200 hover:border-white/15">
      <div className="flex items-start gap-3">
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', categoryColor[insight.category])} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge tone={priorityTone[insight.priority]}>
              {priorityLabel[insight.priority]}
            </StatusBadge>
          </div>

          <p className="text-sm font-medium text-foreground leading-snug">{insight.title}</p>

          {expanded && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {insight.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3 mr-1" />Menos</>
              ) : (
                <><ChevronDown className="h-3 w-3 mr-1" />Detalhes</>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => onSuggestActions(insight)}
              disabled={isLoadingSuggestions}
            >
              <Wand2 className="h-3 w-3 mr-1" />
              Sugerir ações
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive ml-auto"
              onClick={() => onDismiss(insight.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
