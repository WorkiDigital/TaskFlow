import { supabase } from "./supabase";
import { getCurrentUserAgency } from "@/lib/auth";
import type { Service, ServiceDeliverable } from "@/data/preOnboardingTypes";

export const agencyServicesService = {
  async getServices(): Promise<Service[]> {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Service[];
  },

  async createService(service: Partial<Service>): Promise<Service> {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("services")
      .insert({ ...service, agency_id: agencyId })
      .select()
      .single();

    if (error) throw error;
    return data as Service;
  },

  async updateService(id: string, updates: Partial<Service>): Promise<Service> {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", id)
      .eq("agency_id", agencyId)
      .select()
      .single();

    if (error) throw error;
    return data as Service;
  },

  async deleteService(id: string): Promise<void> {
    const { agencyId } = await getCurrentUserAgency();
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("agency_id", agencyId);

    if (error) throw error;
  },

  async getDeliverables(serviceId: string): Promise<ServiceDeliverable[]> {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("service_deliverables")
      .select("*")
      .eq("service_id", serviceId)
      .eq("agency_id", agencyId)
      .order("position", { ascending: true });

    if (error) throw error;
    return data as ServiceDeliverable[];
  },

  async saveDeliverable(deliverable: Partial<ServiceDeliverable>): Promise<ServiceDeliverable> {
    const { agencyId } = await getCurrentUserAgency();
    
    if (deliverable.id) {
      const { data, error } = await supabase
        .from("service_deliverables")
        .update(deliverable)
        .eq("id", deliverable.id)
        .eq("agency_id", agencyId)
        .select()
        .single();
      if (error) throw error;
      return data as ServiceDeliverable;
    } else {
      const { data, error } = await supabase
        .from("service_deliverables")
        .insert({ ...deliverable, agency_id: agencyId })
        .select()
        .single();
      if (error) throw error;
      return data as ServiceDeliverable;
    }
  },

  async deleteDeliverable(id: string): Promise<void> {
    const { agencyId } = await getCurrentUserAgency();
    const { error } = await supabase
      .from("service_deliverables")
      .delete()
      .eq("id", id)
      .eq("agency_id", agencyId);

    if (error) throw error;
  }
};
