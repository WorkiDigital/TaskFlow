import { supabase } from "./supabase";
import { getCurrentUserAgency } from "@/lib/auth";
import { getLocalActiveWorkspaceId } from "./workspaceService";

export interface CreateProjectInput {
  name: string;
  description?: string;
  client_id?: string;
  space_id?: string;
  status?: string;
  source?: string;
  template_id?: string;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export async function getProjectSpaces() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("project_spaces")
    .select("*")
    .eq("workspace_id", getLocalActiveWorkspaceId())
    .order("name");

  if (error) throw error;
  return data;
}

export async function getProjects() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      project_columns (*),
      project_tasks (
        *,
        project_task_checklists (*)
      )
    `,
    )
    .eq("workspace_id", getLocalActiveWorkspaceId())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProjectById(projectId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      project_spaces (name),
      project_columns (*),
      project_tasks (
        *,
        project_task_checklists (*)
      )
    `,
    )
    .eq("id", projectId)
    .single();

  if (error) throw error;
  return data;
}

export async function createProject(input: CreateProjectInput) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data: userData } = await supabase
    .from("users")
    .select("agency_id")
    .eq("id", user.user.id)
    .single();

  if (!userData?.agency_id) throw new Error("User has no agency_id");

  const { data, error } = await supabase
    .from("projects")
    .insert([
      {
        agency_id: userData.agency_id,
        workspace_id: getLocalActiveWorkspaceId(),
        client_id: input.client_id,
        space_id: input.space_id,
        name: input.name,
        description: input.description,
        status: input.status || "planning",
        source: input.source || "manual",
        template_id: input.template_id,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  const { data, error } = await supabase
    .from("projects")
    .update(input)
    .eq("id", projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Column types ────────────────────────────────────────────────────────────

export interface ColumnAutomationConfig {
  notify_assignee: boolean;
  notify_whatsapp_client: boolean;
  mark_project_done: boolean;
}

export interface DbProjectColumn {
  id: string;
  project_id: string;
  agency_id: string;
  title: string;
  position: number;
  color: string | null;
  icon: string | null;
  is_final_column: boolean;
  automation_config: ColumnAutomationConfig;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_COLUMNS: Omit<DbProjectColumn, "id" | "project_id" | "agency_id" | "created_at" | "updated_at">[] = [
  { title: "Backlog",             position: 0, color: "#6b7280", icon: "📋", is_final_column: false, automation_config: { notify_assignee: false, notify_whatsapp_client: false, mark_project_done: false } },
  { title: "Para fazer",          position: 1, color: "#94a3b8", icon: "✅", is_final_column: false, automation_config: { notify_assignee: false, notify_whatsapp_client: false, mark_project_done: false } },
  { title: "Em andamento",        position: 2, color: "#3b82f6", icon: "🔄", is_final_column: false, automation_config: { notify_assignee: true,  notify_whatsapp_client: false, mark_project_done: false } },
  { title: "Em revisão",          position: 3, color: "#eab308", icon: "👀", is_final_column: false, automation_config: { notify_assignee: true,  notify_whatsapp_client: false, mark_project_done: false } },
  { title: "Aguardando cliente",  position: 4, color: "#f97316", icon: "⏳", is_final_column: false, automation_config: { notify_assignee: false, notify_whatsapp_client: true,  mark_project_done: false } },
  { title: "Aprovado",            position: 5, color: "#10b981", icon: "🎉", is_final_column: false, automation_config: { notify_assignee: false, notify_whatsapp_client: false, mark_project_done: false } },
  { title: "Finalizado",          position: 6, color: "#22c55e", icon: "🏁", is_final_column: true,  automation_config: { notify_assignee: false, notify_whatsapp_client: false, mark_project_done: true  } },
];

// ── Column CRUD ──────────────────────────────────────────────────────────────

export interface CreateProjectColumnInput {
  project_id: string;
  title: string;
  position: number;
  color?: string;
  icon?: string;
  is_final_column?: boolean;
  automation_config?: ColumnAutomationConfig;
}

export async function createProjectColumn(input: CreateProjectColumnInput): Promise<DbProjectColumn> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data: userData } = await supabase
    .from("users")
    .select("agency_id")
    .eq("id", user.user.id)
    .single();

  const { data, error } = await supabase
    .from("project_columns")
    .insert([{ agency_id: userData!.agency_id, workspace_id: getLocalActiveWorkspaceId(), ...input }])
    .select()
    .single();

  if (error) throw error;
  return data as DbProjectColumn;
}

export async function seedDefaultColumns(projectId: string): Promise<DbProjectColumn[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");
  const { data: userData } = await supabase.from("users").select("agency_id").eq("id", user.user.id).single();

  const workspaceId = getLocalActiveWorkspaceId();

  const { data, error } = await supabase
    .from("project_columns")
    .insert(DEFAULT_COLUMNS.map((c) => ({ ...c, project_id: projectId, agency_id: userData!.agency_id, workspace_id: workspaceId })))
    .select();

  if (error) throw error;
  return (data ?? []) as DbProjectColumn[];
}

export async function updateProjectColumn(
  columnId: string,
  input: Partial<Omit<DbProjectColumn, "id" | "project_id" | "agency_id" | "created_at" | "updated_at">>,
): Promise<DbProjectColumn> {
  const { data, error } = await supabase
    .from("project_columns")
    .update(input)
    .eq("id", columnId)
    .select()
    .single();

  if (error) throw error;
  return data as DbProjectColumn;
}

export async function deleteProjectColumn(columnId: string): Promise<void> {
  const { error } = await supabase.from("project_columns").delete().eq("id", columnId);
  if (error) throw error;
}

export interface CreateProjectTaskInput {
  project_id: string;
  column_id?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: string;
  due_date?: string;
  position?: number;
  source?: string;
  template_task_id?: string;
}

export async function createProjectTask(input: CreateProjectTaskInput) {
  const { data: user } = await supabase.auth.getUser();
  const { data: userData } = await supabase
    .from("users")
    .select("agency_id")
    .eq("id", user.user!.id)
    .single();

  const { data, error } = await supabase
    .from("project_tasks")
    .insert([
      {
        agency_id: userData!.agency_id,
        workspace_id: getLocalActiveWorkspaceId(),
        ...input,
        status: input.status ?? (input.column_id ? "active" : "backlog"),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProjectTask(taskId: string, input: Partial<CreateProjectTaskInput>) {
  const { data, error } = await supabase
    .from("project_tasks")
    .update(input)
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function moveProjectTask(taskId: string, targetColumnId: string, position: number) {
  return updateProjectTask(taskId, { column_id: targetColumnId, position });
}

export async function deleteProjectTask(taskId: string) {
  const { error } = await supabase.from("project_tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export interface CreateProjectActivityInput {
  project_id: string;
  task_id?: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function getProjectActivities(projectId: string) {
  const { data, error } = await supabase
    .from("project_activities")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function createProjectActivity(input: CreateProjectActivityInput) {
  const { agencyId } = await getCurrentUserAgency();

  const { data, error } = await supabase
    .from("project_activities")
    .insert([{ agency_id: agencyId, workspace_id: getLocalActiveWorkspaceId(), ...input }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface CreateProjectFromTemplateInput {
  template_id: string;
  client_id?: string;
  name: string;
}

export async function createProjectFromTemplate(_input: CreateProjectFromTemplateInput) {
  console.log(
    "[ProjectsService] createProjectFromTemplate NOT IMPLEMENTED ON FRONTEND. Should be run on Edge Function.",
  );
  return null;
}

export async function createProjectSpace(name: string, color?: string) {
  const { agencyId } = await getCurrentUserAgency();
  const { data, error } = await supabase
    .from("project_spaces")
    .insert([{ agency_id: agencyId, workspace_id: getLocalActiveWorkspaceId(), name, color: color ?? "bg-blue-500" }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProjectSpace(id: string) {
  const { error } = await supabase.from("project_spaces").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function updateProjectSpace(id: string, name: string) {
  const { data, error } = await supabase
    .from("project_spaces")
    .update({ name })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Project Docs ─────────────────────────────────────────────────────────────

export async function getProjectDocs(projectId: string) {
  const { data, error } = await supabase
    .from("project_docs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createProjectDoc(projectId: string, title: string, content: string) {
  const { agencyId, userId } = await getCurrentUserAgency();
  const { data, error } = await supabase
    .from("project_docs")
    .insert([{ agency_id: agencyId, workspace_id: getLocalActiveWorkspaceId(), project_id: projectId, title, content, created_by: userId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProjectDoc(
  docId: string,
  fields: { title?: string; content?: string },
) {
  const { data, error } = await supabase
    .from("project_docs")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", docId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProjectDoc(docId: string) {
  const { error } = await supabase.from("project_docs").delete().eq("id", docId);
  if (error) throw error;
}

// ─── Project Files ────────────────────────────────────────────────────────────

export async function getProjectFiles(projectId: string) {
  const { data, error } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createProjectFile(
  projectId: string,
  name: string,
  size: string,
  url: string,
) {
  const { agencyId, userId } = await getCurrentUserAgency();
  const { data, error } = await supabase
    .from("project_files")
    .insert([{ agency_id: agencyId, workspace_id: getLocalActiveWorkspaceId(), project_id: projectId, name, url, size, uploaded_by: userId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProjectFile(fileId: string) {
  const { error } = await supabase.from("project_files").delete().eq("id", fileId);
  if (error) throw error;
}

// ─── Project Time Tracking ──────────────────────────────────────────────────

export interface TimeEntry {
  id: string;
  agency_id: string;
  project_id: string;
  task_id: string;
  user_id: string;
  mode: "manual" | "timer";
  status: "running" | "paused" | "ended";
  started_at: string | null;
  paused_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  note: string | null;
  created_at: string;
  users?: { full_name?: string; email?: string };
}

export async function getActiveTaskTimer() {
  const { agencyId, userId } = await getCurrentUserAgency();
  const { data, error } = await supabase
    .from("project_time_entries")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("user_id", userId)
    .in("status", ["running", "paused"])
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error; // ignore no rows
  return data as TimeEntry | null;
}

export async function startTaskTimer(taskId: string, projectId: string) {
  const { agencyId, userId } = await getCurrentUserAgency();
  const active = await getActiveTaskTimer();
  if (active && active.task_id !== taskId) {
    throw new Error("Você já tem um timer ativo em outra tarefa.");
  }
  if (active && active.status === "paused") {
    return resumeTaskTimer(active.id);
  }
  if (active && active.status === "running") {
    return active;
  }
  const { data, error } = await supabase
    .from("project_time_entries")
    .insert([
      {
        agency_id: agencyId,
        workspace_id: getLocalActiveWorkspaceId(),
        project_id: projectId,
        task_id: taskId,
        user_id: userId,
        mode: "timer",
        status: "running",
        started_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data as TimeEntry;
}

export async function pauseTaskTimer(timerId: string) {
  const { data: timer, error: fetchErr } = await supabase
    .from("project_time_entries")
    .select("*")
    .eq("id", timerId)
    .single();
  if (fetchErr || !timer || timer.status !== "running") return timer as TimeEntry;

  const now = new Date();
  const startedAt = timer.started_at ? new Date(timer.started_at) : now;
  const diffSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
  const newDuration = (timer.duration_seconds || 0) + diffSeconds;

  const { data, error } = await supabase
    .from("project_time_entries")
    .update({
      status: "paused",
      paused_at: now.toISOString(),
      duration_seconds: newDuration,
      started_at: null,
    })
    .eq("id", timerId)
    .select()
    .single();
  if (error) throw error;
  return data as TimeEntry;
}

export async function resumeTaskTimer(timerId: string) {
  const now = new Date();
  const { data, error } = await supabase
    .from("project_time_entries")
    .update({
      status: "running",
      started_at: now.toISOString(),
      paused_at: null,
    })
    .eq("id", timerId)
    .select()
    .single();
  if (error) throw error;
  return data as TimeEntry;
}

export async function stopTaskTimer(timerId: string) {
  const { data: timer, error: fetchErr } = await supabase
    .from("project_time_entries")
    .select("*")
    .eq("id", timerId)
    .single();
  if (fetchErr || !timer || timer.status === "ended") return timer as TimeEntry;

  const now = new Date();
  let newDuration = timer.duration_seconds || 0;
  if (timer.status === "running" && timer.started_at) {
    const startedAt = new Date(timer.started_at);
    newDuration += Math.floor((now.getTime() - startedAt.getTime()) / 1000);
  }

  const { data, error } = await supabase
    .from("project_time_entries")
    .update({
      status: "ended",
      ended_at: now.toISOString(),
      duration_seconds: newDuration,
      started_at: null,
      paused_at: null,
    })
    .eq("id", timerId)
    .select()
    .single();
  if (error) throw error;

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };
  await createProjectActivity({
    project_id: data.project_id,
    task_id: data.task_id,
    type: "time",
    message: `registrou tempo (${formatTime(newDuration)})`,
  });

  return data as TimeEntry;
}

export async function getTaskTimeEntries(taskId: string) {
  const { data, error } = await supabase
    .from("project_time_entries")
    .select("*, users:user_id(email, full_name)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });
  // If table doesn't exist yet, it'll error with PGRST204 or 42P01. Return empty array to not break UI.
  if (error && (error.code === "42P01" || error.code === "22P02")) return [];
  if (error) throw error;
  return data as TimeEntry[];
}

export async function getTaskTimeSummary(taskId: string) {
  const entries = await getTaskTimeEntries(taskId);
  let total = 0;
  for (const entry of entries) {
    total += entry.duration_seconds || 0;
    if (entry.status === "running" && entry.started_at) {
      const startedAt = new Date(entry.started_at);
      total += Math.floor((new Date().getTime() - startedAt.getTime()) / 1000);
    }
  }
  return total;
}

export async function createManualTimeEntry(
  taskId: string,
  projectId: string,
  durationSeconds: number,
  note?: string,
) {
  const { agencyId, userId } = await getCurrentUserAgency();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("project_time_entries")
    .insert([
      {
        agency_id: agencyId,
        workspace_id: getLocalActiveWorkspaceId(),
        project_id: projectId,
        task_id: taskId,
        user_id: userId,
        mode: "manual",
        status: "ended",
        duration_seconds: durationSeconds,
        note,
        started_at: null,
        ended_at: now,
      },
    ])
    .select()
    .single();
  if (error) throw error;

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };
  await createProjectActivity({
    project_id: projectId,
    task_id: taskId,
    type: "time",
    message: `adicionou tempo manual (${formatTime(durationSeconds)})`,
  });

  return data as TimeEntry;
}

// ─── Project Space Aggregators (Visão da Pasta) ──────────────────────────

export async function getSpaceOverview(spaceId: string) {
  const { agencyId } = await getCurrentUserAgency();

  // Get space details
  const { data: space, error: spaceErr } = await supabase
    .from("project_spaces")
    .select("*")
    .eq("id", spaceId)
    .eq("agency_id", agencyId)
    .single();

  if (spaceErr) throw spaceErr;

  // Get projects in this space, with their tasks
  const { data: projects, error: projectsErr } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      status,
      project_tasks (
        id,
        status,
        due_date
      )
    `,
    )
    .eq("space_id", spaceId)
    .eq("agency_id", agencyId);

  if (projectsErr) throw projectsErr;

  // Calculate metrics
  let totalTasks = 0;
  let inProgressTasks = 0;
  let overdueTasks = 0;
  let completedTasks = 0;

  const now = new Date();

  projects?.forEach((p) => {
    p.project_tasks?.forEach((t: any) => {
      totalTasks++;
      if (t.status === "in_progress") {
        inProgressTasks++;
      }
      if (t.status === "done") {
        completedTasks++;
      }
      if (t.due_date && new Date(t.due_date) < now && t.status !== "done") {
        overdueTasks++;
      }
    });
  });

  // Calculate time sum
  let totalTimeSeconds = 0;
  if (projects && projects.length > 0) {
    const projectIds = projects.map((p) => p.id);
    try {
      const { data: timeEntries, error: timeErr } = await supabase
        .from("project_time_entries")
        .select("duration_seconds, status, started_at")
        .in("project_id", projectIds);

      if (!timeErr && timeEntries) {
        timeEntries.forEach((entry) => {
          totalTimeSeconds += entry.duration_seconds || 0;
          if (entry.status === "running" && entry.started_at) {
            const startedAt = new Date(entry.started_at);
            totalTimeSeconds += Math.floor((new Date().getTime() - startedAt.getTime()) / 1000);
          }
        });
      }
    } catch (e) {
      console.warn("Could not fetch time entries for space:", e);
    }
  }

  return {
    space: {
      id: space.id,
      name: space.name,
      color: space.color ?? "bg-blue-500",
      description: space.description,
    },
    projects: projects || [],
    projectsCount: projects?.length || 0,
    metrics: {
      totalTasks,
      inProgressTasks,
      overdueTasks,
      completedTasks,
      totalTimeSeconds,
    },
  };
}

export async function getSpaceTasks(spaceId: string) {
  const { agencyId } = await getCurrentUserAgency();

  // Get all projects in the space
  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      project_tasks (
        *,
        project_task_checklists (*)
      )
    `,
    )
    .eq("space_id", spaceId)
    .eq("agency_id", agencyId);

  if (error) throw error;

  // Flatten tasks and add project name/info
  const tasks: any[] = [];
  projects?.forEach((p) => {
    if (p.project_tasks) {
      p.project_tasks.forEach((t: any) => {
        tasks.push({
          ...t,
          projectName: p.name,
        });
      });
    }
  });

  return tasks;
}

export async function getSpaceActivities(spaceId: string) {
  const { agencyId } = await getCurrentUserAgency();

  // Get projects in this space
  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("id")
    .eq("space_id", spaceId)
    .eq("agency_id", agencyId);

  if (pErr) throw pErr;
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  const { data, error } = await supabase
    .from("project_activities")
    .select("*")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export async function getSpaceTimeSummary(spaceId: string) {
  const { agencyId } = await getCurrentUserAgency();

  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("id")
    .eq("space_id", spaceId)
    .eq("agency_id", agencyId);

  if (pErr) throw pErr;
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  const { data, error } = await supabase
    .from("project_time_entries")
    .select(
      "*, project:projects!project_id(name), task:project_tasks!task_id(title), users:user_id(email, full_name)",
    )
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });

  if (error && (error.code === "42P01" || error.code === "22P02")) return [];
  if (error) throw error;
  return data ?? [];
}

export async function getSpaceFiles(spaceId: string) {
  const { agencyId } = await getCurrentUserAgency();

  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("id")
    .eq("space_id", spaceId)
    .eq("agency_id", agencyId);

  if (pErr) throw pErr;
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  const { data, error } = await supabase
    .from("project_files")
    .select("*, project:projects!project_id(name)")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
