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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Validate authorized user token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header ausente')
    }
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Não autorizado')
    }

    const { email, role, department, job_title } = await req.json()

    if (!email) {
      throw new Error('E-mail é obrigatório')
    }

    // Use service role to inspect/manipulate tables without policies constraints if needed,
    // or to write as system.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get inviter user details and agency_id
    const { data: inviterData, error: inviterError } = await supabaseAdmin
      .from('users')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (inviterError || !inviterData) {
      throw new Error('Falha ao obter dados do convidador')
    }

    // Check if inviter is owner or admin
    if (inviterData.role !== 'owner' && inviterData.role !== 'admin') {
      throw new Error('Apenas donos ou administradores podem convidar membros')
    }

    // Generate invite token and expiration
    const inviteToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // expires in 7 days

    // Create the team invite row
    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from('team_invites')
      .insert({
        agency_id: inviterData.agency_id,
        email: email.trim().toLowerCase(),
        role: role || 'team',
        department: department || null,
        job_title: job_title || null,
        invited_by: user.id,
        status: 'pending',
        token: inviteToken,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (inviteError) {
      throw inviteError
    }

    // Return the invite token and a invite link.
    // In production, an email would be dispatched here.
    return new Response(
      JSON.stringify({ 
        message: 'Convite criado com sucesso', 
        invite: inviteData,
        inviteToken: inviteToken
      }),
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
