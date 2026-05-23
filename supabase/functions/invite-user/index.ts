import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Tratamento de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Pega o token do header de autorização para verificar quem está chamando
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Não autorizado')
    }

    const { email, role, job_title, agency_role_id, full_name } = await req.json()

    if (!email) {
      throw new Error('E-mail é obrigatório')
    }

    // Usar o service_role_key para ter poderes administrativos
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar o agency_id do usuário que está convidando
    const { data: inviterData, error: inviterError } = await supabaseAdmin
      .from('users')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (inviterError || !inviterData) {
      throw new Error('Falha ao obter dados do convidador')
    }

    if (inviterData.role !== 'admin') {
      throw new Error('Apenas administradores podem convidar membros')
    }

    // Convida o usuário usando Supabase Auth Admin
    // Passamos os metadados para a trigger handle_new_user processar
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        agency_id: inviterData.agency_id,
        role: role || 'member',
        job_title: job_title || '',
        agency_role_id: agency_role_id || null,
        full_name: full_name || email.split('@')[0],
      }
    })

    if (inviteError) {
      throw inviteError
    }

    return new Response(
      JSON.stringify({ message: 'Convite enviado com sucesso', user: inviteData.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
