import { useState } from "react";
import { ProjectTask, TaskStatus } from "@/data/mockProjects";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface CalendarViewProps {
  tasks: ProjectTask[];
  onTaskClick: (task: ProjectTask) => void;
  onAddTask?: (dateStr: string) => void;
}

export function CalendarView({ tasks, onTaskClick, onAddTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Get day of week of 1st day of month (0 = Sun, 1 = Mon, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();

  const days = [];
  
  // Previous month fill
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: prevMonthTotalDays - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    days.push({
      day: i,
      month,
      year,
      isCurrentMonth: true,
    });
  }

  // Next month fill to align to a perfect 7-column grid
  const remaining = 42 - days.length; // 6 weeks * 7 days
  for (let i = 1; i <= remaining; i++) {
    days.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  // Group into weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getTasksForDate = (day: number, m: number, y: number) => {
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      const [ty, tm, td] = t.dueDate.split('-').map(Number);
      return td === day && (tm - 1) === m && ty === y;
    });
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const today = new Date();
  const isTodayDate = (day: number, m: number, y: number) => {
    return today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
  };

  return (
    <div className="glass-card flex flex-col h-full bg-black/20 border-white/5 rounded-xl overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold min-w-[150px]">
            {monthNames[month]} {year}
          </h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={handlePrevMonth} 
              className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground transition-colors"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleToday}
              className="px-3 py-1 text-xs font-medium hover:bg-white/10 rounded-md transition-colors"
            >
              Hoje
            </button>
            <button 
              onClick={handleNextMonth} 
              className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground transition-colors"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] min-h-[500px]">
        {/* Days of week */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground border-b border-r border-white/5 last:border-r-0">
            {day}
          </div>
        ))}
        
        {/* Days */}
        {weeks.map((week, wIdx) => (
          week.map((cell, dIdx) => {
            const dayTasks = getTasksForDate(cell.day, cell.month, cell.year);
            const isToday = isTodayDate(cell.day, cell.month, cell.year);
            const dateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;

            return (
              <div 
                key={`${wIdx}-${dIdx}`} 
                className={cn(
                  "border-b border-r border-white/5 p-1.5 min-h-[100px] flex flex-col gap-1 relative group",
                  dIdx === 6 ? "border-r-0" : "",
                  wIdx === weeks.length - 1 ? "border-b-0" : "",
                  !cell.isCurrentMonth ? "bg-black/20 opacity-40" : "hover:bg-white/[0.02]"
                )}
              >
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    isToday ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
                  )}>
                    {cell.day}
                  </span>
                  
                  {onAddTask && (
                    <button
                      onClick={() => onAddTask(dateStr)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                      title="Adicionar tarefa neste dia"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar max-h-[85px]">
                  {dayTasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="text-[10px] p-1 rounded-md bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 truncate font-medium transition-all"
                      title={`${task.title} (${task.assignee})`}
                    >
                      <div className="flex items-center gap-1">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          task.priority === 'urgent' ? 'bg-red-500' :
                          task.priority === 'high' ? 'bg-orange-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        )} />
                        <span className="truncate">{task.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
}
