import { supabase } from './supabase';
import type { OnboardingWorkspaceState } from '@/data/onboardingTypes';

type OnboardingWorkspaceRow = {
  id: string;
  state: OnboardingWorkspaceState;
  updated_at: string;
};

export type OnboardingRunLog = {
  id: string;
  run_id: string;
  step_id: string;
  step_name: string;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

async function invoke<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(functionName, { body });

  if (error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      const payload = await context.json().catch(() => null) as { error?: string; message?: string } | null;
      throw new Error(payload?.error ?? payload?.message ?? error.message);
    }

    throw new Error(error.message);
  }

  const maybeError = data as { error?: string } | null;
  if (maybeError?.error) throw new Error(maybeError.error);

  return data as T;
}

export const onboardingService = {
  async getWorkspace(): Promise<OnboardingWorkspaceState | null> {
    const { data, error } = await supabase
      .from('onboarding_workspace')
      .select('id, state, updated_at')
      .eq('id', 'default')
      .maybeSingle<OnboardingWorkspaceRow>();

    if (error) throw error;
    return data?.state ?? null;
  },

  async saveWorkspace(state: OnboardingWorkspaceState): Promise<void> {
    const { error } = await supabase
      .from('onboarding_workspace')
      .upsert({
        id: 'default',
        state,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  },

  async startRun(clientId: string) {
    return invoke<{ runId: string; status: string; logs: OnboardingRunLog[] }>('onboarding-execute', {
      action: 'start',
      clientId,
      appOrigin: window.location.origin,
    });
  },

  async submitPublicForm(input: {
    formId: string;
    clientId: string | null;
    payload: Record<string, unknown>;
  }) {
    return invoke<{ runId: string | null; status: string; logs: OnboardingRunLog[] }>('onboarding-execute', {
      action: 'form_submitted',
      ...input,
    });
  },

  async getLatestRuns(limit = 10) {
    const { data, error } = await supabase
      .from('onboarding_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },
};
