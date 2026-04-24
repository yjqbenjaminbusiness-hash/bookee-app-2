import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://bookee-app.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Validate caller (must be authenticated user, the organizer)
  const authHeader = req.headers.get('Authorization') || ''
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let announcementId: string
  try {
    const body = await req.json()
    announcementId = body.announcementId || body.announcement_id
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!announcementId) {
    return new Response(JSON.stringify({ error: 'announcementId is required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const sendInvokeHeaders = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
  }

  // Look up announcement + activity
  const { data: announcement, error: annErr } = await admin
    .from('announcements')
    .select('id, message, organizer_id, activity_id, activities(id, title, organizer_id)')
    .eq('id', announcementId)
    .maybeSingle()

  if (annErr || !announcement) {
    return new Response(JSON.stringify({ error: 'Announcement not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Authorize: caller must be the organizer
  const activity = (announcement as any).activities
  if (!activity || activity.organizer_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Find all confirmed bookings on any session of this activity
  const { data: sessions } = await admin
    .from('activity_sessions')
    .select('id')
    .eq('activity_id', activity.id)

  const sessionIds = (sessions || []).map((s: any) => s.id)
  if (sessionIds.length === 0) {
    return new Response(JSON.stringify({ success: true, sent: 0 }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: bookings } = await admin
    .from('bookings')
    .select('user_id, player_name')
    .in('session_id', sessionIds)
    .neq('reservation_status', 'cancelled')

  // Dedupe by user_id (a user may have multiple sessions)
  const byUser = new Map<string, { player_name: string }>()
  for (const b of bookings || []) {
    if (!b.user_id) continue
    if (!byUser.has(b.user_id)) byUser.set(b.user_id, { player_name: b.player_name })
  }

  if (byUser.size === 0) {
    return new Response(JSON.stringify({ success: true, sent: 0 }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Resolve emails via profiles
  const userIds = Array.from(byUser.keys())
  const { data: profiles } = await admin
    .from('profiles')
    .select('user_id, email, display_name')
    .in('user_id', userIds)

  let sent = 0
  for (const p of profiles || []) {
    if (!p.email) continue
    const meta = byUser.get(p.user_id)!
    const idempotencyKey = `activity-update-${announcementId}-${p.user_id}`
    const { error: invokeErr } = await admin.functions.invoke('send-transactional-email', {
      headers: sendInvokeHeaders,
      body: {
        templateName: 'activity-update',
        recipientEmail: p.email,
        idempotencyKey,
        templateData: {
          recipientName: p.display_name || meta.player_name,
          activityTitle: activity.title,
          message: announcement.message,
          activityUrl: `${SITE_URL}/player/events/${activity.id}`,
        },
      },
    })
    if (!invokeErr) sent++
    else console.error('notify-activity-update invoke failed', invokeErr, { user_id: p.user_id })
  }

  return new Response(JSON.stringify({ success: true, sent, total: byUser.size }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})