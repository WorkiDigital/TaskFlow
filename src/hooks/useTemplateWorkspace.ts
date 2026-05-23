import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  getTemplates, 
  createTemplate as apiCreateTemplate,
  updateTemplate as apiUpdateTemplate,
  deleteTemplate as apiDeleteTemplate,
  duplicateTemplate as apiDuplicateTemplate
} from '@/services/templatesService';
import { supabase } from '@/services/supabase';

// Helper to map backend data to frontend types (or just expose backend types if possible)
// For now we will keep the hook interface similar but backed by Supabase.

export function useTemplateWorkspace() {
  const queryClient = useQueryClient();

  const { data: rawTemplates = [], isLoading } = useQuery({
    queryKey: ['agency_templates'],
    queryFn: getTemplates
  });

  // Map backend format to frontend format for compatibility while we transition
  const templates = rawTemplates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description || '',
    category: t.category,
    status: t.status,
    linkedContractTitle: t.linked_contract_template_id, // we might need a join for title
    lastEditedAt: t.updated_at,
    automation: {
      enabled: false, // TODO: map from automation config
      trigger: t.date_base,
      createProject: true,
      createTasks: true,
      assignUsers: true,
      notifyInternalGroup: true,
      requireManualReview: false,
    },
    columns: (t.template_columns || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      position: c.position,
      color: c.color,
      isFinalColumn: c.is_final_column
    })).sort((a: any, b: any) => a.position - b.position),
    tasks: (t.template_tasks || []).map((tk: any) => ({
      id: tk.id,
      title: tk.title,
      description: tk.description || '',
      columnId: tk.template_column_id,
      priority: tk.priority,
      assigneeRule: tk.assignee_rule || { type: 'manual' },
      relativeDueDate: tk.relative_due_date || { amount: 0, unit: 'days', direction: 'after', base: 'contract_signed_at' },
      checklist: (tk.template_task_checklists || []).map((chk: any) => ({
        id: chk.id,
        title: chk.title,
        position: chk.position
      })).sort((a: any, b: any) => a.position - b.position),
      dependencies: tk.dependencies || [],
      tags: tk.tags || [],
      isClientVisible: tk.visibility === 'client_visible'
    }))
  }));

  const createMutation = useMutation({
    mutationFn: async (template: any) => {
      const newTemplate = await apiCreateTemplate({
        name: template.name,
        description: template.description,
        category: template.category,
        status: template.status,
      });

      const colMap: Record<string, string> = {};
      if (template.columns?.length > 0) {
        for (const col of template.columns) {
          const { data, error } = await supabase.from('template_columns').insert([{
             agency_id: newTemplate.agency_id,
             template_id: newTemplate.id,
             title: col.title,
             position: col.position,
             color: col.color,
             is_final_column: col.isFinalColumn
          }]).select().single();
          if (error) throw error;
          if (data) colMap[col.id] = data.id;
        }
      }

      if (template.tasks?.length > 0) {
        for (const task of template.tasks) {
          const { data, error } = await supabase.from('template_tasks').insert([{
            agency_id: newTemplate.agency_id,
            template_id: newTemplate.id,
            template_column_id: colMap[task.columnId],
            title: task.title,
            description: task.description,
            priority: task.priority,
            assignee_rule: task.assigneeRule,
            relative_due_date: task.relativeDueDate,
            dependencies: task.dependencies,
            tags: task.tags,
            visibility: task.isClientVisible ? 'client_visible' : 'internal'
          }]).select().single();
          if (error) throw error;

          if (data && task.checklist?.length > 0) {
            const checks = task.checklist.map((chk: any) => ({
              agency_id: newTemplate.agency_id,
              template_task_id: data.id,
              title: chk.title
            }));
            const { error: checkError } = await supabase.from('template_task_checklists').insert(checks);
            if (checkError) throw checkError;
          }
        }
      }
      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency_templates'] });
      toast.success('Modelo criado com sucesso!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string, patch: any }) => {
      await apiUpdateTemplate(id, {
        name: patch.name,
        description: patch.description,
        category: patch.category,
        status: patch.status,
      });

      // Clear existing tree (cascades to tasks and checklists)
      await supabase.from('template_columns').delete().eq('template_id', id);
      
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('agency_id')
        .eq('id', authUser.user.id)
        .single();
      const agencyId = userData?.agency_id;

      const colMap: Record<string, string> = {};
      if (patch.columns?.length > 0) {
        for (const col of patch.columns) {
          const { data } = await supabase.from('template_columns').insert([{
             agency_id: agencyId,
             template_id: id,
             title: col.title,
             position: col.position,
             color: col.color,
             is_final_column: col.isFinalColumn
          }]).select().single();
          if (data) colMap[col.id] = data.id;
        }
      }

      if (patch.tasks?.length > 0) {
        for (const task of patch.tasks) {
          const { data } = await supabase.from('template_tasks').insert([{
            agency_id: agencyId,
            template_id: id,
            template_column_id: colMap[task.columnId] || null,
            title: task.title,
            description: task.description,
            priority: task.priority,
            assignee_rule: task.assigneeRule,
            relative_due_date: task.relativeDueDate,
            dependencies: task.dependencies,
            tags: task.tags,
            visibility: task.isClientVisible ? 'client_visible' : 'internal'
          }]).select().single();

          if (data && task.checklist?.length > 0) {
            const checks = task.checklist.map((chk: any) => ({
              agency_id: agencyId,
              template_task_id: data.id,
              title: chk.title
            }));
            await supabase.from('template_task_checklists').insert(checks);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency_templates'] });
      toast.success('Modelo atualizado com sucesso!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: apiDeleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency_templates'] });
      toast.success('Modelo excluído com sucesso!');
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: apiDuplicateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency_templates'] });
      toast.success('Modelo duplicado com sucesso!');
    }
  });

  // Granular DB operations
  const addColumnMutation = useMutation({
    mutationFn: async ({ templateId, column }: any) => {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('agency_id')
        .eq('id', authUser.user.id)
        .single();
      const { data, error } = await supabase.from('template_columns').insert([{
        agency_id: userData?.agency_id,
        template_id: templateId,
        title: column.title,
        position: column.position,
        color: column.color,
        is_final_column: column.isFinalColumn
      }]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agency_templates'] })
  });

  const addTaskMutation = useMutation({
    mutationFn: async ({ templateId, task }: any) => {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('agency_id')
        .eq('id', authUser.user.id)
        .single();
      const { data, error } = await supabase.from('template_tasks').insert([{
        agency_id: userData?.agency_id,
        template_id: templateId,
        template_column_id: task.columnId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignee_rule: task.assigneeRule,
        relative_due_date: task.relativeDueDate,
        dependencies: task.dependencies,
        tags: task.tags,
        visibility: task.isClientVisible ? 'client_visible' : 'internal'
      }]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agency_templates'] })
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, patch }: any) => {
      const dbPatch: any = {};
      if (patch.title) dbPatch.title = patch.title;
      if (patch.description) dbPatch.description = patch.description;
      if (patch.columnId) dbPatch.template_column_id = patch.columnId;
      if (patch.priority) dbPatch.priority = patch.priority;
      if (patch.assigneeRule) dbPatch.assignee_rule = patch.assigneeRule;
      if (patch.relativeDueDate) dbPatch.relative_due_date = patch.relativeDueDate;
      if (patch.dependencies) dbPatch.dependencies = patch.dependencies;
      
      const { error } = await supabase.from('template_tasks').update(dbPatch).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agency_templates'] })
  });

  const addChecklistMutation = useMutation({
    mutationFn: async ({ taskId, title }: any) => {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('agency_id')
        .eq('id', authUser.user.id)
        .single();
      const { error } = await supabase.from('template_task_checklists').insert([{
        agency_id: userData?.agency_id,
        template_task_id: taskId,
        title
      }]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agency_templates'] })
  });

  // Interface wrappers
  return {
    templates,
    isLoading,
    createTemplate: (template: any) => createMutation.mutateAsync(template),
    updateTemplate: (id: string, patch: any) => updateMutation.mutateAsync({ id, patch }),
    deleteTemplate: (id: string) => deleteMutation.mutateAsync(id),
    duplicateTemplate: (id: string) => duplicateMutation.mutateAsync(id),
    
    // Columns
    addColumn: (templateId: string, column: any) => addColumnMutation.mutateAsync({ templateId, column }),
    updateColumn: (templateId: string, columnId: string, patch: any) => { /* TODO: hook to DB */ },
    removeColumn: async (templateId: string, columnId: string) => {
      await supabase.from('template_columns').delete().eq('id', columnId);
      queryClient.invalidateQueries({ queryKey: ['agency_templates'] });
    },
    reorderColumn: (templateId: string, columnId: string, direction: 'up' | 'down') => { /* TODO: hook to DB */ },
    
    // Tasks
    addTask: (templateId: string, task: any) => addTaskMutation.mutateAsync({ templateId, task }),
    updateTask: (templateId: string, taskId: string, patch: any) => updateTaskMutation.mutateAsync({ taskId, patch }),
    removeTask: async (templateId: string, taskId: string) => {
      await supabase.from('template_tasks').delete().eq('id', taskId);
      queryClient.invalidateQueries({ queryKey: ['agency_templates'] });
    },
    
    // Checklist
    addChecklistItem: (templateId: string, taskId: string, title: string) => addChecklistMutation.mutateAsync({ taskId, title }),
    removeChecklistItem: async (templateId: string, taskId: string, itemId: string) => {
      await supabase.from('template_task_checklists').delete().eq('id', itemId);
      queryClient.invalidateQueries({ queryKey: ['agency_templates'] });
    }
  };
}
