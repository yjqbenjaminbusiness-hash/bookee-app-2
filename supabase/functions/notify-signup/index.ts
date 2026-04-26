import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Validate caller via JWT
  const authHeader = req.headers.get('Authorization') || ''
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  // Idempotency: only send once per user
  const { data: profile } = await admin
    .from('profiles')
    .select('email, display_name, welcome_email_sent_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.email) {
    return new Response(JSON.stringify({ status: 'no_email' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (profile.welcome_email_sent_at) {
    return new Response(JSON.stringify({ status: 'already_sent' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Stamp first to prevent races, even if email send fails (retry logic later if needed)
  await admin
    .from('profiles')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('user_id', user.id)

  const sendInvokeHeaders = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
  }

  const { error } = await admin.functions.invoke('send-transactional-email', {
    headers: sendInvokeHeaders,
    body: {
      templateName: 'welcome',
      recipientEmail: profile.email,
      idempotencyKey: `welcome-${user.id}`,
      templateData: {
        name: profile.display_name || undefined,
      },
    },
  })

  if (error) {
    console.error('notify-signup welcome failed', error)
    return new Response(JSON.stringify({ status: 'send_failed', error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ status: 'queued' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})