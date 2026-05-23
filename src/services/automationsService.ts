import { supabase } from './supabase';
import { AutomationFlow } from '../data/mockAutomations';

export const automationsService = {
  async getFlows() {
    const { data, error } = await supabase
      .from('automation_flows')
      .select('*, steps:automation_steps(*)');
      
    if (error) {
      console.error('Error fetching flows:', error);
      throw error;
    }
    
    // Convert to frontend shape
    return data.map(flow => ({
      id: flow.id,
      name: flow.name,
      description: flow.description,
      mode: flow.mode,
      status: flow.is_active ? 'active' : 'draft',
      createdAt: flow.created_at,
      updatedAt: flow.updated_at,
      steps: flow.steps.map((step: any) => ({
        id: step.id,
        type: step.type,
        name: step.name,
        description: step.description,
        order: step.step_order,
        enabled: step.enabled,
        isAutomatic: step.is_automatic,
        dependsOn: step.depends_on,
        config: step.config,
        configStatus: step.config_status
      })).sort((a: any, b: any) => a.order - b.order)
    })) as AutomationFlow[];
  },

  async saveFlow(flow: AutomationFlow) {
    // 1. Upsert Flow
    const { data: flowData, error: flowError } = await supabase
      .from('automation_flows')
      .upsert({
        id: flow.id.startsWith('mock') ? undefined : flow.id, // if it's a mock, let DB generate UUID
        name: flow.name,
        description: flow.description,
        mode: flow.mode,
        is_active: flow.status === 'active',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (flowError) {
      console.error('Error saving flow:', flowError);
      throw flowError;
    }

    const realFlowId = flowData.id;

    // 2. Upsert Steps
    const stepsToUpsert = flow.steps.map(step => ({
      id: step.id.startsWith('step_') ? undefined : step.id,
      flow_id: realFlowId,
      type: step.type,
      name: step.name,
      description: step.description,
      step_order: step.order,
      enabled: step.enabled,
      is_automatic: step.isAutomatic,
      depends_on: step.dependsOn || [],
      config: step.config || {},
      config_status: step.configStatus
    }));

    const { error: stepsError } = await supabase
      .from('automation_steps')
      .upsert(stepsToUpsert);

    if (stepsError) {
      console.error('Error saving steps:', stepsError);
      throw stepsError;
    }

    return realFlowId;
  }
};
