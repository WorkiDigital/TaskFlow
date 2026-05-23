import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      throw new Error('Token do convite é obrigatório')
    }

    // 1. Validate the invite token
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('team_invites')
      .select('*, agencies(name)')
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      throw new Error('Convite inválido ou não encontrado')
    }

    if (invite.status !== 'pending') {
      throw new Error(`Este convite já foi ${invite.status === 'accepted' ? 'aceito' : invite.status}`)
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      // Mark as expired in db if needed
      await supabaseAdmin
        .from('team_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id)
      throw new Error('Este convite expirou')
    }

    // GET Request: Just validation
    if (req.method === 'GET') {
      return new Response(
        JSON.stringify({ 
          valid: true,
          email: invite.email,
          role: invite.role,
          department: invite.department,
          job_title: invite.job_title,
          agencyName: invite.agencies?.name ?? 'Sua Agência'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // POST Request: Accept and bind currently authenticated user
    if (req.method === 'POST') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        throw new Error('Autenticação necessária para aceitar convite por POST')
      }
      const userToken = authHeader.replace('Bearer ', '')

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      )

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(userToken)
      if (userError || !user) {
        throw new Error('Usuário autenticado inválido')
      }

      // Update the invite status
      const { error: updateInviteError } = await supabaseAdmin
        .from('team_invites')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invite.id)

      if (updateInviteError) throw updateInviteError

      // Update the user profile in public.users
      const { data: updatedUser, error: updateUserError } = await supabaseAdmin
        .from('users')
        .update({
          agency_id: invite.agency_id,
          role: invite.role,
          department: invite.department,
          job_title: invite.job_title,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updateUserError) throw updateUserError

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Convite aceito com sucesso',
          user: updatedUser
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    throw new Error('Método HTTP não suportado')
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
