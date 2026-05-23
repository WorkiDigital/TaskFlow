import { supabase } from './supabase';

export interface PublicAgencySettings {
  id?: string;
  name: string;
  evolution_api_url?: string;
  is_autentique_configured: boolean;
  is_evolution_configured: boolean;
}

async function invokeSettings<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('agency-settings', { body });

  if (error) {
    throw new Error(error.message);
  }

  const maybeError = data as { error?: string } | null;
  if (maybeError?.error) {
    throw new Error(maybeError.error);
  }

  return data as T;
}

export const settingsService = {
  async getSettings(): Promise<PublicAgencySettings> {
    return invokeSettings<PublicAgencySettings>({ action: 'get_public' });
  },

  async updateAutentiqueToken(token: string): Promise<PublicAgencySettings> {
    return invokeSettings<PublicAgencySettings>({
      action: 'update_autentique_token',
      token,
    });
  },

  async updateEvolutionConfig(url: string, apiKey: string): Promise<PublicAgencySettings> {
    return invokeSettings<PublicAgencySettings>({
      action: 'update_evolution_config',
      url,
      apiKey,
    });
  },
};
