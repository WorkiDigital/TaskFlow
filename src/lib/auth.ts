import { supabase } from "@/services/supabase";

export async function getCurrentUserAgency(): Promise<{ userId: string; agencyId: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data, error } = await supabase
    .from("users")
    .select("agency_id")
    .eq("id", user.id)
    .single();
  if (error || !data?.agency_id) throw new Error("Agência não encontrada");
  return { userId: user.id, agencyId: data.agency_id };
}
