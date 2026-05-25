import { supabase } from "./supabase";
import {
  AgencyTemplate,
  TemplateColumn,
  TemplateTask,
  TemplateChecklistItem,
} from "../data/templateTypes";

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category: string;
  status?: string;
  linkedContractTitle?: string;
}

export type UpdateTemplateInput = Partial<CreateTemplateInput>;

export async function getTemplates() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  // get agency_id from users table
  const { data: userData } = await supabase
    .from("users")
    .select("agency_id")
    .eq("id", user.user.id)
    .single();

  if (!userData?.agency_id) throw new Error("User has no agency_id");

  const { data, error } = await supabase
    .from("agency_templates")
    .select(
      `
      *,
      template_columns (*),
      template_tasks (
        *,
        template_task_checklists (*)
      )
    `,
    )
    .eq("agency_id", userData.agency_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTemplateById(templateId: string) {
  const { data, error } = await supabase
    .from("agency_templates")
    .select(
      `
      *,
      template_columns (*),
      template_tasks (
        *,
        template_task_checklists (*)
      )
    `,
    )
    .eq("id", templateId)
    .single();

  if (error) throw error;
  return data;
}

export async function createTemplate(input: CreateTemplateInput) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data: userData } = await supabase
    .from("users")
    .select("agency_id")
    .eq("id", user.user.id)
    .single();

  if (!userData?.agency_id) throw new Error("User has no agency_id");

  const { data, error } = await supabase
    .from("agency_templates")
    .insert([
      {
        agency_id: userData.agency_id,
        name: input.name,
        description: input.description,
        category: input.category,
        status: input.status || "draft",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTemplate(templateId: string, input: UpdateTemplateInput) {
  const { data, error } = await supabase
    .from("agency_templates")
    .update(input)
    .eq("id", templateId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function archiveTemplate(templateId: string) {
  return updateTemplate(templateId, { status: "archived" });
}

export async function deleteTemplate(templateId: string) {
  const { error } = await supabase.from("agency_templates").delete().eq("id", templateId);

  if (error) throw error;
  return true;
}

export async function duplicateTemplate(templateId: string) {
  // Deep clone a template:
  // 1. Fetch full template
  const template = await getTemplateById(templateId);
  if (!template) throw new Error("Template not found");

  // 2. Create new template
  const newTemplate = await createTemplate({
    name: `${template.name} (Copy)`,
    description: template.description,
    category: template.category,
    status: "draft",
  });

  // 3. Clone columns
  const columnMapping: Record<string, string> = {};
  if (template.template_columns?.length > 0) {
    const columnsToInsert = template.template_columns.map((c: any) => ({
      agency_id: newTemplate.agency_id,
      template_id: newTemplate.id,
      title: c.title,
      position: c.position,
      color: c.color,
      is_final_column: c.is_final_column,
    }));

    const { data: newColumns, error: colError } = await supabase
      .from("template_columns")
      .insert(columnsToInsert)
      .select();

    if (colError) throw colError;

    // Map old id to new id
    template.template_columns.forEach((oldC: any, index: number) => {
      columnMapping[oldC.id] = newColumns[index].id;
    });
  }

  // 4. Clone tasks and checklists
  if (template.template_tasks?.length > 0) {
    for (const oldT of template.template_tasks) {
      const { data: newTask, error: taskError } = await supabase
        .from("template_tasks")
        .insert([
          {
            agency_id: newTemplate.agency_id,
            template_id: newTemplate.id,
            template_column_id: columnMapping[oldT.template_column_id] || null,
            title: oldT.title,
            description: oldT.description,
            priority: oldT.priority,
            assignee_rule: oldT.assignee_rule,
            relative_due_date: oldT.relative_due_date,
            dependencies: oldT.dependencies,
            tags: oldT.tags,
            visibility: oldT.visibility,
            position: oldT.position,
          },
        ])
        .select()
        .single();

      if (taskError) throw taskError;

      // Clone checklists
      if (oldT.template_task_checklists?.length > 0) {
        const checklistsToInsert = oldT.template_task_checklists.map((cl: any) => ({
          agency_id: newTemplate.agency_id,
          template_task_id: newTask.id,
          title: cl.title,
          position: cl.position,
        }));

        await supabase.from("template_task_checklists").insert(checklistsToInsert);
      }
    }
  }

  return newTemplate;
}

export interface TemplatePreviewContext {
  contractSignedAt?: string;
  projectStartDate?: string;
  briefingCompletedAt?: string;
}

export async function getTemplatePreview(templateId: string, context: TemplatePreviewContext) {
  // Fetch template and resolve dynamic dates locally for preview purposes
  const template = await getTemplateById(templateId);
  return {
    template,
    simulatedDates: true,
  };
}

export interface TemplateApplyContext {
  clientId: string;
  projectMode: "create_new" | "use_existing";
  projectId?: string;
  projectNamePattern?: string;
}

export async function simulateTemplateApplication(
  templateId: string,
  context: TemplateApplyContext,
) {
  // Return logs and metrics of what WOULD happen
  const template = await getTemplateById(templateId);
  return {
    logs: [
      `[AutomationSimulation] Template encontrado: ${template.name}`,
      `[AutomationSimulation] ${template.template_columns?.length || 0} colunas serão criadas`,
      `[AutomationSimulation] ${template.template_tasks?.length || 0} tarefas serão criadas`,
    ],
    willCreateProject: context.projectMode === "create_new",
  };
}
