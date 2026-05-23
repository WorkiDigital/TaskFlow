import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AgencyTemplate, TemplateColumn, TemplateTask, TemplateAutomation } from '@/data/templateTypes';
import { mockAgencyTemplates } from '@/data/mockAgencyTemplates';

const LS_KEY = 'taskflow_templates';

function loadTemplates(): AgencyTemplate[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AgencyTemplate[];
      if (parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('[TemplateWorkspace] Failed to parse templates from localStorage:', e);
  }
  
  // Save initial mock data
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(mockAgencyTemplates));
  } catch (e) {
    console.error('[TemplateWorkspace] Failed to save initial templates to localStorage:', e);
  }
  return mockAgencyTemplates;
}

function saveTemplates(templates: AgencyTemplate[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('[TemplateWorkspace] Failed to save templates to localStorage:', e);
  }
}

export function useTemplateWorkspace() {
  const [templates, setTemplates] = useState<AgencyTemplate[]>(loadTemplates);

  useEffect(() => {
    // Sync loaded state initially
    console.log('[TemplateWorkspace] Initialized templates workspace with', templates.length, 'templates');
  }, [templates.length]);

  const updateTemplatesState = useCallback((newTemplates: AgencyTemplate[] | ((prev: AgencyTemplate[]) => AgencyTemplate[])) => {
    setTemplates(prev => {
      const next = typeof newTemplates === 'function' ? newTemplates(prev) : newTemplates;
      saveTemplates(next);
      return next;
    });
  }, []);

  const createTemplate = useCallback((template: Omit<AgencyTemplate, 'id' | 'lastEditedAt'>) => {
    const newTemplate: AgencyTemplate = {
      ...template,
      id: `tmpl-${Date.now()}`,
      lastEditedAt: new Date().toISOString()
    };
    
    updateTemplatesState(prev => [...prev, newTemplate]);
    console.log('[TemplateWorkspace] Template created:', newTemplate.id, newTemplate.name);
    toast.success('Modelo criado com sucesso!');
    return newTemplate.id;
  }, [updateTemplatesState]);

  const updateTemplate = useCallback((id: string, patch: Partial<Omit<AgencyTemplate, 'id' | 'lastEditedAt'>>) => {
    updateTemplatesState(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, ...patch, lastEditedAt: new Date().toISOString() }
          : t
      )
    );
    console.log('[TemplateWorkspace] Template updated:', id, patch);
  }, [updateTemplatesState]);

  const deleteTemplate = useCallback((id: string) => {
    updateTemplatesState(prev => prev.filter(t => t.id !== id));
    console.log('[TemplateWorkspace] Template deleted:', id);
    toast.success('Modelo excluído com sucesso!');
  }, [updateTemplatesState]);

  const duplicateTemplate = useCallback((id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) {
      toast.error('Modelo não encontrado');
      return;
    }

    const copy: AgencyTemplate = {
      ...template,
      id: `tmpl-${Date.now()}`,
      name: `${template.name} (Cópia)`,
      lastEditedAt: new Date().toISOString(),
      status: 'draft',
      // Deep copy tasks
      tasks: template.tasks.map(task => ({
        ...task,
        id: `task-${Math.random().toString(36).substr(2, 9)}`,
        checklist: task.checklist.map(chk => ({ ...chk, id: `chk-${Math.random().toString(36).substr(2, 9)}` })),
        dependencies: [] // Reset dependencies in duplicated template tasks to avoid id conflicts
      }))
    };

    updateTemplatesState(prev => [...prev, copy]);
    console.log('[TemplateWorkspace] Template duplicated:', id, '->', copy.id);
    toast.success('Modelo duplicado com sucesso!');
  }, [templates, updateTemplatesState]);

  // COLUMN OPERATIONS
  const addColumn = useCallback((templateId: string, column: Omit<TemplateColumn, 'id'>) => {
    const newCol: TemplateColumn = {
      ...column,
      id: `col-${Math.random().toString(36).substr(2, 9)}`
    };

    updateTemplatesState(prev =>
      prev.map(t => {
        if (t.id !== templateId) return t;
        const columns = [...t.columns, newCol].map((col, index) => ({
          ...col,
          position: index + 1
        }));
        return {
          ...t,
          columns,
          lastEditedAt: new Date().toISOString()
        };
      })
    );
    console.log('[TemplateWorkspace] Column added to template:', templateId, newCol);
  }, [updateTemplatesState]);

  const updateColumn = useCallback((templateId: string, columnId: string, patch: Partial<TemplateColumn>) => {
    updateTemplatesState(prev =>
      prev.map(t => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          columns: t.columns.map(col =>
            col.id === columnId ? { ...col, ...patch } : col
          ),
          lastEditedAt: new Date().toISOString()
        };
      })
    );
    console.log('[TemplateWorkspace] Column updated in template:', templateId, columnId, patch);
  }, [updateTemplatesState]);

  const removeColumn = useCallback((templateId: string, columnId: string) => {
    updateTemplatesState(prev =>
      prev.map(t => {
        if (t.id !== templateId) return t;
        const columns = t.columns
          .filter(col => col.id !== columnId)
          .map((col, idx) => ({ ...col, position: idx + 1 }));
        
        // Also remove or re-assign tasks in this column
        const tasks = t.tasks.filter(task => task.columnId !== columnId);
        
        return {
          ...t,
          columns,
          tasks,
          lastEditedAt: new Date().toISOString()
        };
      })
    );
    console.log('[TemplateWorkspace] Column removed from template:', templateId, columnId);
  }, [updateTemplatesState]);

  const reorderColumn = useCallback((templateId: string, columnId: string, direction: 'up' | 'down') => {
    updateTemplatesState(prev =>
      prev.map(t => {
        if (t.id !== templateId) return t;
        const columns = [...t.columns].sort((a, b) => a.position - b.position);
        const idx = columns.findIndex(col => col.id === columnId);
        if (idx === -1) return t;

        if (direction === 'up' && idx > 0) {
          const temp = columns[idx].position;
          columns[idx].position = columns[idx - 1].position;
          columns[idx - 1].position = temp;
        } else if (direction === 'down' && idx < columns.length - 1) {
          const temp = columns[idx].position;
          columns[idx].position = columns[idx + 1].position;
          columns[idx + 1].position = temp;
        }

        return {
          ...t,
          columns: columns.sort((a, b) => a.position - b.position),
          lastEditedAt: new Date().toISOString()
        };
      })
    );
  }, [updateTemplatesState]);

  // TASK OPERATIONS
  const addTask = useCallback((templateId: string, task: Omit<TemplateTask, 'id'>) => {
    const newTask: TemplateTask = {
      ...task,
      id: `task-${Math.random().toString(36).substr(2, 9)}`
    };

    updateTemplatesState(prev =>
      prev.map(t => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          tasks: [...t.tasks, newTask],
          lastEditedAt: new Date().toISOString()
        };
      })
    );
    console.log('[TemplateWorkspace] Task added to template:', templateId, newTask);
    toast.success('Tarefa criada!');
  }, [updateTemplatesState]);

  const updateTask = useCallback((templateId: string, taskId: string, patch: Partial<TemplateTask>) => {
    updateTemplatesState(prev =>
      prev.map(t => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          tasks: t.tasks.map(task =>
            task.id === taskId ? { ...task, ...patch } : task
          ),
          lastEditedAt: new Date().toISOString()
        };
      })
    );
    console.log('[TemplateWorkspace] Task updated in template:', templateId, taskId, patch);
  }, [updateTemplatesState]);

  const removeTask = useCallback((templateId: string, taskId: string) => {
    updateTemplatesState(prev =>
      prev.map(t => {
        if (t.id !== templateId) return t;
        // Also remove dependencies on this task
        const tasks = t.tasks
          .filter(task => task.id !== taskId)
          .map(task => ({
            ...task,
            dependencies: task.dependencies.filter(depId => depId !== taskId)
          }));
        
        return {
          ...t,
          tasks,
          lastEditedAt: new Date().toISOString()
        };
      })
    );
    console.log('[TemplateWorkspace] Task removed from template:', templateId, taskId);
    toast.success('Tarefa excluída');
  }, [updateTemplatesState]);

  // CHECKLIST OPERATIONS
  const addChecklistItem = useCallback((templateId: string, taskId: string, title: string) => {
    const newChk = {
      id: `chk-${Math.random().toString(36).substr(2, 9)}`,
      title
    };

    updateTemplatesState(prev =>
      prev.map(t => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          tasks: t.tasks.map(task => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              checklist: [...task.checklist, newChk]
            };
          }),
          lastEditedAt: new Date().toISOString()
        };
      })
    );
  }, [updateTemplatesState]);

  const removeChecklistItem = useCallback((templateId: string, taskId: string, itemId: string) => {
    updateTemplatesState(prev =>
      prev.map(t => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          tasks: t.tasks.map(task => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              checklist: task.checklist.filter(c => c.id !== itemId)
            };
          }),
          lastEditedAt: new Date().toISOString()
        };
      })
    );
  }, [updateTemplatesState]);

  return {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    
    // Columns
    addColumn,
    updateColumn,
    removeColumn,
    reorderColumn,
    
    // Tasks
    addTask,
    updateTask,
    removeTask,
    
    // Checklist
    addChecklistItem,
    removeChecklistItem
  };
}
