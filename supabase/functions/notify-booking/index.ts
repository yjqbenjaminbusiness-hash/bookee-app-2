import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://bookee-app.com'

function fmtDate(d?: string | null): string | undefined {
  if (!d) return undefined
  try {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch { return d }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Validate caller (must be the participant who just booked)
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

  let bookingId: string
  let event: 'created' | 'updated' | 'cancelled' = 'created'
  try {
    const body = await req.json()
    bookingId = body.bookingId || body.booking_id
    if (body.event === 'updated' || body.event === 'cancelled') {
      event = body.event
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!bookingId) {
    return new Response(JSON.stringify({ error: 'bookingId is required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const sendInvokeHeaders = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
  }

  const { data: booking, error: bookingErr } = await admin
    .from('bookings')
    .select('id, user_id, player_name, amount, session_id')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingErr || !booking) {
    return new Response(JSON.stringify({ error: 'Booking not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Authorize: caller must be the booking owner
  if (booking.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: session } = await admin
    .from('activity_sessions')
    .select('id, time_label, start_time, end_time, filled_slots, max_slots, activity_id')
    .eq('id', booking.session_id)
    .maybeSingle()

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: activity } = await admin
    .from('activities')
    .select('id, title, venue, date, organizer_id')
    .eq('id', session.activity_id)
    .maybeSingle()

  if (!activity) {
    return new Response(JSON.stringify({ error: 'Activity not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: participantProfile } = await admin
    .from('profiles')
    .select('email, display_name')
    .eq('user_id', booking.user_id)
    .maybeSingle()

  const { data: organizerProfile } = await admin
    .from('profiles')
    .select('email, display_name')
    .eq('user_id', activity.organizer_id)
    .maybeSingle()

  const dateStr = fmtDate(activity.date)
  const timeStr =
    session.start_time && session.end_time
      ? `${session.start_time} – ${session.end_time}`
      : session.time_label || undefined
  const amount =
    booking.amount && Number(booking.amount) > 0
      ? `$${Number(booking.amount).toFixed(2)}`
      : 'Free'

  const results: Record<string, any> = {}

  // Choose template + idempotency suffix based on event
  const eventLabel =
    event === 'updated' ? 'updated'
    : event === 'cancelled' ? 'cancelled'
    : 'confirmed'

  const participantTemplate =
    event === 'created' ? 'booking-confirmation' : 'activity-update'
  const participantSubjectPrefix =
    event === 'updated' ? 'Booking Updated'
    : event === 'cancelled' ? 'Booking Cancelled'
    : 'Booking Confirmed'
  const participantMessage =
    event === 'updated' ? 'Your booking details were updated.'
    : event === 'cancelled' ? 'Your booking was cancelled. We hope to see you next time!'
    : 'Your spot has been confirmed!'

  // 1) Participant email
  if (participantProfile?.email) {
    const { error } = await admin.functions.invoke('send-transactional-email', {
      headers: sendInvokeHeaders,
      body: {
        templateName: participantTemplate,
        recipientEmail: participantProfile.email,
        idempotencyKey: `booking-${eventLabel}-${bookingId}`,
        templateData: event === 'created' ? {
          playerName: participantProfile.display_name || booking.player_name,
          activityTitle: activity.title,
          date: dateStr,
          time: timeStr,
          venue: activity.venue,
          amount,
          bookingId,
        } : {
          recipientName: participantProfile.display_name || booking.player_name,
          activityTitle: activity.title,
          subjectPrefix: participantSubjectPrefix,
          message: participantMessage,
          date: dateStr,
          time: timeStr,
          venue: activity.venue,
          ctaUrl: `${SITE_URL}/player/bookings`,
          ctaLabel: 'View My Bookings',
        },
      },
    })
    results.participant = error ? `failed: ${error.message}` : 'queued'
    if (error) console.error('notify-booking participant failed', error)
  } else {
    results.participant = 'no_email'
  }

  // 2) Organizer alert
  if (organizerProfile?.email && activity.organizer_id !== booking.user_id) {
    const orgIdempotency = `organizer-alert-${eventLabel}-${bookingId}`
    const { error } = await admin.functions.invoke('send-transactional-email', {
      headers: sendInvokeHeaders,
      body: {
        templateName: 'organizer-alert',
        recipientEmail: organizerProfile.email,
        idempotencyKey: orgIdempotency,
        templateData: {
          organizerName: organizerProfile.display_name,
          activityTitle: activity.title,
          participantName: participantProfile?.display_name || booking.player_name,
          date: dateStr,
          time: timeStr,
          filledSlots: session.filled_slots,
          maxSlots: session.max_slots,
          manageUrl: `${SITE_URL}/organizer/events/${activity.id}`,
          eventType: eventLabel,
        },
      },
    })
    results.organizer = error ? `failed: ${error.message}` : 'queued'
    if (error) console.error('notify-booking organizer failed', error)
  } else {
    results.organizer = activity.organizer_id === booking.user_id ? 'skipped_self' : 'no_email'
  }

  return new Response(JSON.stringify({ success: true, ...results }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})