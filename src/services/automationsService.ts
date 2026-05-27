import { supabase } from "./supabase";
import { AutomationFlow } from "../data/mockAutomations";
import { getCurrentUserAgency } from "@/lib/auth";

export interface AutomationRun {
  id: string;
  agency_id: string;
  flow_id: string | null;
  client_id: string | null;
  contract_id: string | null;
  status: "running" | "awaiting_form" | "awaiting_signature" | "completed" | "failed" | "cancelled";
  current_step_index: number;
  context: Record<string, unknown>;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface AutomationStepLog {
  id: string;
  run_id: string;
  step_id: string;
  step_type: string;
  status: "pending" | "running" | "completed" | "skipped" | "failed";
  message: string | null;
  output: Record<string, unknown>;
  executed_at: string;
}

export const automationsService = {
  async getFlows() {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("automation_flows")
      .select("*, steps:automation_steps(*)")
      .eq("agency_id", agencyId);

    if (error) {
      console.error("Error fetching flows:", error);
      throw error;
    }

    // Convert to frontend shape
    return data.map((flow) => ({
      id: flow.id,
      name: flow.name,
      description: flow.description,
      mode: flow.mode,
      trigger: flow.trigger ?? undefined,
      status: flow.is_active ? "active" : "draft",
      createdAt: flow.created_at,
      updatedAt: flow.updated_at,
      steps: flow.steps
        .map((step: any) => ({
          id: step.id,
          type: step.type,
          name: step.name,
          description: step.description,
          order: step.step_order,
          enabled: step.enabled,
          isAutomatic: step.is_automatic,
          dependsOn: step.depends_on,
          config: step.config,
          configStatus: step.config_status,
        }))
        .sort((a: any, b: any) => a.order - b.order),
    })) as AutomationFlow[];
  },

  async saveFlow(flow: AutomationFlow) {
    // 1. Resolve agency_id — obrigatório, lança erro se não encontrar
    const { agencyId } = await getCurrentUserAgency();

    const { data: flowData, error: flowError } = await supabase
      .from("automation_flows")
      .upsert({
        id: flow.id.startsWith("mock") ? undefined : flow.id,
        agency_id: agencyId,
        name: flow.name,
        description: flow.description,
        mode: flow.mode,
        trigger: flow.trigger ?? null,
        is_active: flow.status === "active",
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (flowError) {
      console.error("Error saving flow:", flowError);
      throw flowError;
    }

    const realFlowId = flowData.id;

    // 2. Upsert Steps — inclui agency_id em cada step
    const stepsToUpsert = flow.steps.map((step) => ({
      id: step.id.startsWith("step_") ? undefined : step.id,
      agency_id: agencyId,
      flow_id: realFlowId,
      type: step.type,
      name: step.name,
      description: step.description,
      step_order: step.order,
      enabled: step.enabled,
      is_automatic: step.isAutomatic,
      depends_on: step.dependsOn || [],
      config: step.config || {},
      config_status: step.configStatus,
    }));

    const { error: stepsError } = await supabase.from("automation_steps").upsert(stepsToUpsert);

    if (stepsError) {
      console.error("Error saving steps:", stepsError);
      throw stepsError;
    }

    return realFlowId;
  },

  async triggerFlow(params: {
    trigger: string;
    clientId?: string;
    contractId?: string;
    context?: Record<string, unknown>;
  }) {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase.functions.invoke("automation-execute", {
      body: {
        action: "trigger",
        trigger: params.trigger,
        agencyId,
        clientId: params.clientId,
        contractId: params.contractId,
        context: params.context ?? {},
      },
    });
    if (error) throw error;
    return data as { status: string; runIds: string[]; logs: string[] };
  },

  async resumeFlow(runId: string, context?: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke("automation-execute", {
      body: { action: "resume", runId, context: context ?? {} },
    });
    if (error) throw error;
    return data as { status: string; runId: string; logs: string[] };
  },

  async sendColumnNotification(params: {
    agencyId: string;
    columnId: string;
    taskId?: string;
  }) {
    const { data, error } = await supabase.functions.invoke("automation-execute", {
      body: {
        action: "column_notification",
        agencyId: params.agencyId,
        columnId: params.columnId,
        taskId: params.taskId,
      },
    });
    if (error) throw error;
    return data as { status: string; logs: string[] };
  },

  async getRunsForClient(clientId: string): Promise<AutomationRun[]> {
    const { data, error } = await supabase
      .from("automation_runs")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AutomationRun[];
  },

  async getStepLogs(runId: string): Promise<AutomationStepLog[]> {
    const { data, error } = await supabase
      .from("automation_step_logs")
      .select("*")
      .eq("run_id", runId)
      .order("executed_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as AutomationStepLog[];
  },
};
