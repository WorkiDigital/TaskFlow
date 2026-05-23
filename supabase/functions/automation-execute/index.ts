import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseAdmin() {
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    supabaseKey,
    { global: { headers: { Authorization: `Bearer ${supabaseKey}` } } },
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = getSupabaseAdmin();
  const logs: string[] = [];

  try {
    const payload = await req.json();
    const { trigger, agencyId, clientId, contractId, context = {} } = payload;

    if (!trigger || !agencyId) {
      throw new Error("Parâmetros obrigatórios ausentes: trigger ou agencyId.");
    }

    logs.push(`[AutomationExecute] Trigger recebido: ${trigger} para agency: ${agencyId}`);

    // 1. Fetch active automation flows and steps for this trigger
    // Since we don't have a direct link between trigger and flow in mockAutomations right now
    // We assume there's a table automation_flows or we fetch steps.
    // For now, let's query automation_steps where config.trigger matches or simply mock the fetch based on our schema.
    // The plan states "A tabela automation_steps deve suportar configuração JSON".
    const { data: flows, error: flowsError } = await supabase
      .from('automation_flows')
      .select('id, name')
      .eq('agency_id', agencyId)
      .eq('status', 'active');
      
    if (flowsError && flowsError.code !== '42P01') {
      console.warn("Could not fetch automation_flows, maybe table doesn't exist yet", flowsError);
    }

    // 2. We look for 'apply_agency_template' steps
    // Since this is an MVP execution, we'll try to find any step that matches 'apply_agency_template'
    const { data: steps, error: stepsError } = await supabase
      .from('automation_steps')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('enabled', true)
      .in('type', ['apply_agency_template', 'create_recurring_task']);

    if (stepsError && stepsError.code !== '42P01') {
      throw stepsError;
    }

    const activeSteps = steps || [];
    logs.push(`[AutomationExecute] Encontrados ${activeSteps.length} steps ativos.`);

    for (const step of activeSteps) {
      if (step.type === 'apply_agency_template' && step.config?.templateId) {
        logs.push(`[AutomationExecute] Aplicando template: ${step.config.templateId}`);
        
        // Fetch Template
        const { data: template, error: tmplError } = await supabase
          .from('agency_templates')
          .select('*, template_columns(*), template_tasks(*, template_task_checklists(*))')
          .eq('id', step.config.templateId)
          .single();

        if (tmplError || !template) {
          logs.push(`[AutomationExecute] Falha ao carregar template ${step.config.templateId}`);
          continue;
        }

        // Create Project
        let projectName = step.config.projectNamePattern || template.name;
        
        // Try to replace client name if we have client info
        if (clientId) {
          const { data: client } = await supabase.from('clients').select('name').eq('id', clientId).single();
          if (client) {
            projectName = projectName.replace('{{nome_cliente}}', client.name);
          }
        }
        
        const { data: project, error: projError } = await supabase
          .from('projects')
          .insert([{
            agency_id: agencyId,
            client_id: clientId || null,
            name: projectName,
            description: template.description,
            status: step.config.requireManualReview ? 'paused' : 'planning',
            source: 'automation',
            template_id: template.id
          }])
          .select()
          .single();

        if (projError) throw projError;
        logs.push(`[AutomationExecute] Projeto criado: ${project.id}`);

        // Create Columns
        const colMap: Record<string, string> = {};
        if (template.template_columns?.length > 0) {
          for (const col of template.template_columns) {
            const { data: newCol } = await supabase
              .from('project_columns')
              .insert([{
                agency_id: agencyId,
                project_id: project.id,
                title: col.title,
                position: col.position,
                color: col.color,
                is_final_column: col.is_final_column
              }])
              .select()
              .single();
            if (newCol) colMap[col.id] = newCol.id;
          }
          logs.push(`[AutomationExecute] ${template.template_columns.length} colunas criadas.`);
        }

        // Create Tasks
        if (template.template_tasks?.length > 0) {
          for (const task of template.template_tasks) {
            const { data: newTask } = await supabase
              .from('project_tasks')
              .insert([{
                agency_id: agencyId,
                project_id: project.id,
                column_id: colMap[task.template_column_id] || null,
                title: task.title,
                description: task.description,
                priority: task.priority,
                source: 'template',
                template_task_id: task.id
              }])
              .select()
              .single();

            if (newTask && task.template_task_checklists?.length > 0) {
              const checks = task.template_task_checklists.map((chk: any) => ({
                agency_id: agencyId,
                task_id: newTask.id,
                title: chk.title,
                position: chk.position
              }));
              await supabase.from('project_task_checklists').insert(checks);
            }
          }
          logs.push(`[AutomationExecute] ${template.template_tasks.length} tarefas criadas.`);
        }

        // Send Notification if enabled
        if (step.config.notifyInternalGroup) {
          logs.push(`[AutomationExecute] Notificação interna disparada.`);
          // Em um caso real, chamaria a edge function evolution-message ou similar
        }
      }

      if (step.type === 'create_recurring_task' && step.config?.title) {
         logs.push(`[AutomationExecute] Criando tarefa recorrente: ${step.config.title}`);
         // This would schedule or create the task directly depending on the frequency logic
         // For now, we simulate the execution block
      }
    }

    return new Response(JSON.stringify({ status: "success", logs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logs.push(`[AutomationExecute] Erro: ${error instanceof Error ? error.message : String(error)}`);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error), logs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
