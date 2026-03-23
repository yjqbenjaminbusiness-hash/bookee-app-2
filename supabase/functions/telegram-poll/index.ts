import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;
const SITE_URL = "https://bookee-app.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── TELEGRAM HELPERS ───────────────────────────────────────────────

function getHeaders() {
  return {
    Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")!}`,
    "X-Connection-Api-Key": Deno.env.get("TELEGRAM_API_KEY")!,
    "Content-Type": "application/json",
  };
}

async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  const body: any = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;
  await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
}

async function answerCallback(callbackQueryId: string) {
  await fetch(`${GATEWAY_URL}/answerCallbackQuery`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  });
}

// ─── MENUS ──────────────────────────────────────────────────────────

function getMainMenu() {
  return {
    inline_keyboard: [
      [{ text: "📝 Register for Beta", callback_data: "beta_start" }],
      [{ text: "📋 My Bookee", callback_data: "my_bookee" }],
      [{ text: "🏟️ Organize", callback_data: "organize" }],
      [{ text: "🎲 Ballot", callback_data: "ballot" }],
      [{ text: "❓ Help", callback_data: "help" }],
    ],
  };
}

// ─── CONVERSATION STATE ─────────────────────────────────────────────

async function getStates(supabase: any): Promise<Record<string, any>> {
  const { data } = await supabase
    .from("telegram_bot_state")
    .select("conversation_states")
    .eq("id", 1)
    .single();
  return data?.conversation_states || {};
}

async function setState(supabase: any, chatId: number, state: any) {
  const states = await getStates(supabase);
  states[String(chatId)] = state;
  await supabase
    .from("telegram_bot_state")
    .update({ conversation_states: states })
    .eq("id", 1);
}

async function clearState(supabase: any, chatId: number) {
  const states = await getStates(supabase);
  delete states[String(chatId)];
  await supabase
    .from("telegram_bot_state")
    .update({ conversation_states: states })
    .eq("id", 1);
}

async function getState(supabase: any, chatId: number): Promise<any | null> {
  const states = await getStates(supabase);
  return states[String(chatId)] || null;
}

// ─── USER IDENTITY ──────────────────────────────────────────────────

// Returns linked profile or null. Does NOT create guest records.
async function getLinkedProfile(supabase: any, chatId: number) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, display_name, email")
    .eq("telegram_chat_id", chatId)
    .single();
  return profile || null;
}

// Resolve user for read operations: linked profile user_id, or fallback to telegram chatId string
function resolveUserId(profile: any, chatId: number): string {
  return profile ? profile.user_id : `tg_${chatId}`;
}

function resolveDisplayName(profile: any, username?: string): string {
  if (profile?.display_name) return profile.display_name;
  if (username) return username;
  return "Guest";
}

// Prompt user to link their account — directs to login page with telegram linking
async function promptAccountLink(chatId: number, action: string) {
  const loginUrl = `${SITE_URL}/login?telegram_chat_id=${chatId}&return=telegram`;
  await sendMessage(
    chatId,
    `🔗 <b>Link your account to ${action}</b>\n\n` +
    `Log in or sign up to link your Telegram account:\n\n` +
    `🌐 <a href="${loginUrl}">Click here to log in</a>`,
    { inline_keyboard: [[{ text: "⬅️ Main Menu", callback_data: "main_menu" }]] }
  );
}

// ─── BETA REGISTRATION FLOW ────────────────────────────────────────

async function handleBetaFlow(chatId: number, text: string, supabase: any) {
  const state = await getState(supabase, chatId);

  if (!state || state.step === "beta_start") {
    await setState(supabase, chatId, { flow: "beta", step: "beta_name", data: {} });
    await sendMessage(chatId, "📝 <b>Beta Registration</b>\n\nWhat's your name?");
    return;
  }

  const { step, data } = state;

  switch (step) {
    case "beta_name":
      data.name = text;
      await setState(supabase, chatId, { flow: "beta", step: "beta_email", data });
      await sendMessage(chatId, "📧 What's your email address?");
      break;

    case "beta_email":
      if (!text.includes("@")) {
        await sendMessage(chatId, "❌ Please enter a valid email address.");
        return;
      }
      data.email = text;
      await setState(supabase, chatId, { flow: "beta", step: "beta_role", data });
      await sendMessage(chatId, "🎯 What's your role?", {
        inline_keyboard: [
          [{ text: "🏟️ Organizer", callback_data: "beta_role_organizer" }],
          [{ text: "🏃 Player", callback_data: "beta_role_player" }],
        ],
      });
      break;

    case "beta_size":
      data.activity_size = text;
      await setState(supabase, chatId, { flow: "beta", step: "beta_freq", data });
      await sendMessage(chatId, "📅 How often do you organize/play per month?", {
        inline_keyboard: [
          [{ text: "1–2 times", callback_data: "beta_freq_1-2" }],
          [{ text: "3–5 times", callback_data: "beta_freq_3-5" }],
          [{ text: "6–10 times", callback_data: "beta_freq_6-10" }],
          [{ text: "10+ times", callback_data: "beta_freq_10+" }],
        ],
      });
      break;

    default:
      await clearState(supabase, chatId);
      await sendMessage(chatId, "Something went wrong. Let's start over.", getMainMenu());
  }
}

async function handleBetaCallback(chatId: number, data: string, supabase: any) {
  const state = await getState(supabase, chatId);
  if (!state) return;

  if (data.startsWith("beta_role_")) {
    const role = data.replace("beta_role_", "");
    state.data.role = role;
    await setState(supabase, chatId, { flow: "beta", step: "beta_size", data: state.data });
    await sendMessage(chatId, "👥 What's your typical group size?", {
      inline_keyboard: [
        [{ text: "5–10", callback_data: "beta_size_5-10" }],
        [{ text: "10–20", callback_data: "beta_size_10-20" }],
        [{ text: "20–50", callback_data: "beta_size_20-50" }],
        [{ text: "50+", callback_data: "beta_size_50+" }],
      ],
    });
    return;
  }

  if (data.startsWith("beta_size_")) {
    const size = data.replace("beta_size_", "");
    state.data.activity_size = size;
    await setState(supabase, chatId, { flow: "beta", step: "beta_freq", data: state.data });
    await sendMessage(chatId, "📅 How often do you organize/play per month?", {
      inline_keyboard: [
        [{ text: "1–2 times", callback_data: "beta_freq_1-2" }],
        [{ text: "3–5 times", callback_data: "beta_freq_3-5" }],
        [{ text: "6–10 times", callback_data: "beta_freq_6-10" }],
        [{ text: "10+ times", callback_data: "beta_freq_10+" }],
      ],
    });
    return;
  }

  if (data.startsWith("beta_freq_")) {
    const freq = data.replace("beta_freq_", "");
    state.data.organize_frequency = freq;

    const { error } = await supabase.from("beta_registrations").insert({
      name: state.data.name,
      email: state.data.email,
      role: state.data.role,
      activity_size: state.data.activity_size,
      organize_frequency: freq,
      consent: true,
    });

    await clearState(supabase, chatId);

    if (error) {
      console.error("Beta registration error:", error);
      await sendMessage(chatId, "❌ Registration failed. Please try again.", getMainMenu());
    } else {
      await sendMessage(
        chatId,
        "✅ <b>You're registered for Beta!</b>\n\nThanks, " + state.data.name + "! We'll reach out to invite you for early testing.",
        getMainMenu()
      );
    }
    return;
  }
}

// ─── ORGANIZE FLOW ─────────────────────────────────────────────────

async function handleOrganizeFlow(chatId: number, text: string, supabase: any) {
  const state = await getState(supabase, chatId);
  if (!state) return;

  const { step, data } = state;

  switch (step) {
    case "org_title":
      data.title = text;
      await setState(supabase, chatId, { flow: "organize", step: "org_sport", data });
      await sendMessage(chatId, "⚽ What sport/activity?", {
        inline_keyboard: [
          [{ text: "⚽ Football", callback_data: "org_sport_Football" }],
          [{ text: "🏀 Basketball", callback_data: "org_sport_Basketball" }],
          [{ text: "🏸 Badminton", callback_data: "org_sport_Badminton" }],
          [{ text: "🎾 Tennis", callback_data: "org_sport_Tennis" }],
        ],
      });
      break;

    case "org_venue":
      data.venue = text;
      await setState(supabase, chatId, { flow: "organize", step: "org_date", data });
      await sendMessage(chatId, "📅 What date? (YYYY-MM-DD format)");
      break;

    case "org_date":
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        await sendMessage(chatId, "❌ Please use YYYY-MM-DD format (e.g. 2026-04-15)");
        return;
      }
      data.date = text;
      await setState(supabase, chatId, { flow: "organize", step: "org_time", data });
      await sendMessage(chatId, "⏰ Session time label? (e.g. '7pm - 9pm')");
      break;

    case "org_time":
      data.time_label = text;
      await setState(supabase, chatId, { flow: "organize", step: "org_slots", data });
      await sendMessage(chatId, "👥 How many slots/max players?");
      break;

    case "org_slots": {
      const slots = parseInt(text);
      if (isNaN(slots) || slots < 1) {
        await sendMessage(chatId, "❌ Please enter a valid number.");
        return;
      }
      data.max_slots = slots;
      await setState(supabase, chatId, { flow: "organize", step: "org_price", data });
      await sendMessage(chatId, "💰 Price per slot in SGD? (enter 0 for free)");
      break;
    }

    case "org_price": {
      const price = parseFloat(text);
      if (isNaN(price) || price < 0) {
        await sendMessage(chatId, "❌ Please enter a valid price.");
        return;
      }
      data.price = Math.round(price * 100);
      
      if (data.type === "multi") {
        data.sessions = data.sessions || [];
        data.sessions.push({
          time_label: data.time_label,
          max_slots: data.max_slots,
          price: data.price,
        });
        const sessionCount = data.sessions.length;
        await setState(supabase, chatId, { flow: "organize", step: "org_more_sessions", data });
        await sendMessage(
          chatId,
          `✅ Session ${sessionCount} added: ${data.time_label}\n\nAdd another session?`,
          {
            inline_keyboard: [
              [{ text: "➕ Add Another Session", callback_data: "org_add_session" }],
              [{ text: "✅ Done — Create Activity", callback_data: "org_create" }],
            ],
          }
        );
      } else {
        data.sessions = [{ time_label: data.time_label, max_slots: data.max_slots, price: data.price }];
        await createActivity(chatId, data, supabase);
      }
      break;
    }

    case "org_multi_time":
      data.time_label = text;
      await setState(supabase, chatId, { flow: "organize", step: "org_slots", data });
      await sendMessage(chatId, "👥 How many slots for this session?");
      break;

    default:
      await clearState(supabase, chatId);
      await sendMessage(chatId, "Something went wrong. Let's start over.", getMainMenu());
  }
}

async function createActivity(chatId: number, data: any, supabase: any) {
  const profile = await getLinkedProfile(supabase, chatId);

  if (!profile) {
    await clearState(supabase, chatId);
    await promptAccountLink(chatId, "organize activities");
    return;
  }

  const { data: activity, error: actErr } = await supabase
    .from("activities")
    .insert({
      title: data.title,
      sport: data.sport,
      venue: data.venue,
      date: data.date,
      organizer_id: profile.user_id,
      status: data.is_ballot ? "ballot" : "active",
      description: data.description || null,
    })
    .select("id")
    .single();

  if (actErr) {
    console.error("Activity creation error:", actErr);
    await clearState(supabase, chatId);
    await sendMessage(chatId, "❌ Failed to create activity. " + actErr.message, getMainMenu());
    return;
  }

  for (const session of data.sessions) {
    const { error: sessErr } = await supabase.from("activity_sessions").insert({
      activity_id: activity.id,
      time_label: session.time_label,
      max_slots: session.max_slots,
      price: session.price,
    });
    if (sessErr) console.error("Session creation error:", sessErr);
  }

  await clearState(supabase, chatId);

  const typeLabel = data.is_ballot ? "Ballot Group" : "Activity";
  await sendMessage(
    chatId,
    `✅ <b>${typeLabel} Created!</b>\n\n` +
    `🏟️ ${data.title}\n` +
    `📍 ${data.venue}\n` +
    `📅 ${data.date}\n` +
    `⚽ ${data.sport}\n` +
    `📊 ${data.sessions.length} session(s)\n\n` +
    `Manage at: ${SITE_URL}`,
    getMainMenu()
  );
}

async function handleOrganizeCallback(chatId: number, cbData: string, supabase: any) {
  const state = await getState(supabase, chatId);

  if (cbData === "organize") {
    const profile = await getLinkedProfile(supabase, chatId);
    if (!profile) {
      await promptAccountLink(chatId, "organize activities");
      return;
    }
    await sendMessage(chatId, "🏟️ <b>Organize</b>\n\nWhat would you like to do?", {
      inline_keyboard: [
        [{ text: "📋 Single Session", callback_data: "org_single" }],
        [{ text: "📋 Multi-Session", callback_data: "org_multi" }],
        [{ text: "📊 Manage Sessions", callback_data: "org_manage" }],
        [{ text: "⬅️ Back", callback_data: "main_menu" }],
      ],
    });
    return;
  }

  if (cbData === "org_single" || cbData === "org_multi") {
    const type = cbData === "org_single" ? "single" : "multi";
    await setState(supabase, chatId, { flow: "organize", step: "org_title", data: { type } });
    await sendMessage(chatId, "📝 What's the activity title?");
    return;
  }

  if (cbData.startsWith("org_sport_")) {
    if (!state) return;
    state.data.sport = cbData.replace("org_sport_", "");
    await setState(supabase, chatId, { flow: "organize", step: "org_venue", data: state.data });
    await sendMessage(chatId, "📍 What's the venue?");
    return;
  }

  if (cbData === "org_add_session") {
    if (!state) return;
    await setState(supabase, chatId, { flow: "organize", step: "org_multi_time", data: state.data });
    await sendMessage(chatId, "⏰ Time label for the next session? (e.g. '9pm - 11pm')");
    return;
  }

  if (cbData === "org_create") {
    if (!state) return;
    await createActivity(chatId, state.data, supabase);
    return;
  }

  // ─── Manage Sessions ───
  if (cbData === "org_manage") {
    const profile = await getLinkedProfile(supabase, chatId);
    if (!profile) {
      await promptAccountLink(chatId, "manage sessions");
      return;
    }
    const { data: activities } = await supabase
      .from("activities")
      .select("id, title, date, sport, status")
      .eq("organizer_id", profile.user_id)
      .order("date", { ascending: false })
      .limit(10);

    if (!activities || activities.length === 0) {
      await sendMessage(chatId, "No activities found. Create one first!", {
        inline_keyboard: [[{ text: "⬅️ Back", callback_data: "organize" }]],
      });
      return;
    }

    let msg = "📊 <b>Your Activities</b>\n\n";
    const buttons: any[] = [];
    for (const a of activities) {
      msg += `• ${a.title} (${a.date}) — ${a.status}\n`;
      buttons.push([{ text: `📊 ${a.title}`, callback_data: `manage_${a.id}` }]);
    }
    buttons.push([{ text: "⬅️ Back", callback_data: "organize" }]);
    await sendMessage(chatId, msg, { inline_keyboard: buttons });
    return;
  }

  if (cbData.startsWith("manage_")) {
    const activityId = cbData.replace("manage_", "");
    const { data: sessions } = await supabase
      .from("activity_sessions")
      .select("id, time_label, max_slots, filled_slots, price")
      .eq("activity_id", activityId);

    if (!sessions || sessions.length === 0) {
      await sendMessage(chatId, "No sessions found for this activity.", {
        inline_keyboard: [[{ text: "⬅️ Back", callback_data: "org_manage" }]],
      });
      return;
    }

    let msg = "📊 <b>Session Overview</b>\n\n";
    for (const s of sessions) {
      const avail = s.max_slots - s.filled_slots;
      msg += `⏰ ${s.time_label}\n`;
      msg += `👥 ${s.filled_slots}/${s.max_slots} (${avail} available)\n`;
      msg += `💰 SGD $${(s.price / 100).toFixed(2)}\n\n`;
    }

    // Get bookings (privacy: only organizer sees this)
    const sessionIds = sessions.map((s: any) => s.id);
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, player_name, payment_status, reservation_status, session_id")
      .in("session_id", sessionIds);

    if (bookings && bookings.length > 0) {
      const confirmed = bookings.filter((b: any) => b.reservation_status === "confirmed").length;
      const pending = bookings.filter((b: any) => b.reservation_status === "pending").length;
      const paid = bookings.filter((b: any) => b.payment_status === "paid").length;
      const unpaid = bookings.filter((b: any) => b.payment_status !== "paid").length;

      msg += `<b>Registrations:</b> ${bookings.length} total\n`;
      msg += `✅ Confirmed: ${confirmed} | ⏳ Pending: ${pending}\n`;
      msg += `💰 Paid: ${paid} | 💳 Unpaid: ${unpaid}\n`;
    }

    msg += `\n🌐 Full controls: ${SITE_URL}`;

    await sendMessage(chatId, msg, {
      inline_keyboard: [[{ text: "⬅️ Back", callback_data: "org_manage" }]],
    });
    return;
  }
}

// ─── BALLOT FLOW ────────────────────────────────────────────────────

async function handleBallotCallback(chatId: number, cbData: string, supabase: any) {
  if (cbData === "ballot") {
    await sendMessage(chatId, "🎲 <b>Ballot</b>\n\nWhat would you like to do?", {
      inline_keyboard: [
        [{ text: "🆕 Create Ballot Group", callback_data: "ballot_create" }],
        [{ text: "📊 Manage Ballot Group", callback_data: "ballot_manage" }],
        [{ text: "⬅️ Back", callback_data: "main_menu" }],
      ],
    });
    return;
  }

  // ─── Create Ballot Group ───
  if (cbData === "ballot_create") {
    const profile = await getLinkedProfile(supabase, chatId);
    if (!profile) {
      await promptAccountLink(chatId, "create ballot groups");
      return;
    }
    await setState(supabase, chatId, { flow: "ballot_create", step: "ballot_title", data: { is_ballot: true } });
    await sendMessage(chatId, "🎲 <b>Create Ballot Group</b>\n\n📝 What's the activity name?");
    return;
  }

  // ─── Manage Ballot Group ───
  if (cbData === "ballot_manage") {
    const profile = await getLinkedProfile(supabase, chatId);
    if (!profile) {
      await promptAccountLink(chatId, "manage ballot groups");
      return;
    }

    // Show organizer's ballots + paste link option
    const { data: orgBallots } = await supabase
      .from("activities")
      .select("id, title, date, venue")
      .eq("organizer_id", profile.user_id)
      .eq("status", "ballot")
      .order("date", { ascending: true })
      .limit(10);

    let msg = "📊 <b>Manage Ballot Group</b>\n\n";
    const buttons: any[] = [];

    buttons.push([{ text: "🔗 Paste Ballot Link", callback_data: "ballot_paste" }]);

    if (orgBallots && orgBallots.length > 0) {
      msg += "<b>Your Ballot Groups:</b>\n\n";
      for (const b of orgBallots) {
        msg += `• ${b.title} — ${b.date}\n`;
        buttons.push([{ text: `📊 ${b.title}`, callback_data: `ballot_manage_view_${b.id}` }]);
      }
    } else {
      msg += "No ballot groups found. Create one or paste a link.";
    }

    buttons.push([{ text: "⬅️ Back", callback_data: "ballot" }]);
    await sendMessage(chatId, msg, { inline_keyboard: buttons });
    return;
  }

  // ─── Manage a specific ballot (organizer view with full participant list) ───
  if (cbData.startsWith("ballot_manage_view_")) {
    const activityId = cbData.replace("ballot_manage_view_", "");
    const { data: activity } = await supabase
      .from("activities")
      .select("id, title, venue, date, sport, organizer_id")
      .eq("id", activityId)
      .single();

    if (!activity) {
      await sendMessage(chatId, "Ballot not found.", getMainMenu());
      return;
    }

    const { data: sessions } = await supabase
      .from("activity_sessions")
      .select("id, time_label, max_slots, filled_slots")
      .eq("activity_id", activityId);

    let msg = `🎲 <b>${activity.title}</b>\n📍 ${activity.venue}\n📅 ${activity.date}\n\n`;

    if (sessions) {
      for (const s of sessions) {
        msg += `⏰ ${s.time_label} — ${s.filled_slots}/${s.max_slots} joined\n`;
      }
    }

    // Organizer can see full participant list (privacy: only organizer)
    const profile = await getLinkedProfile(supabase, chatId);
    if (profile && activity.organizer_id === profile.user_id && sessions) {
      const sessionIds = sessions.map((s: any) => s.id);
      const { data: bookings } = await supabase
        .from("bookings")
        .select("player_name, reservation_status, payment_status")
        .in("session_id", sessionIds)
        .neq("reservation_status", "cancelled");

      if (bookings && bookings.length > 0) {
        msg += "\n<b>Participants:</b>\n";
        for (const b of bookings) {
          const s = b.reservation_status === "confirmed" ? "✅" : "⏳";
          msg += `${s} ${b.player_name}\n`;
        }
      }
    }

    msg += `\n🌐 Full controls: ${SITE_URL}`;

    await sendMessage(chatId, msg, {
      inline_keyboard: [
        [{ text: "🔄 Refresh", callback_data: `ballot_manage_view_${activityId}` }],
        [{ text: "⬅️ Back", callback_data: "ballot_manage" }],
      ],
    });
    return;
  }

  if (cbData === "ballot_paste") {
    await setState(supabase, chatId, { flow: "ballot_paste", step: "awaiting_link", data: {} });
    await sendMessage(chatId, "🔗 Paste the ballot/activity link:");
    return;
  }

  // ─── Player ballot view (privacy: no player list shown) ───
  if (cbData.startsWith("ballot_view_")) {
    const activityId = cbData.replace("ballot_view_", "");
    const { data: activity } = await supabase
      .from("activities")
      .select("id, title, venue, date, sport")
      .eq("id", activityId)
      .single();

    if (!activity) {
      await sendMessage(chatId, "Ballot not found.", getMainMenu());
      return;
    }

    const { data: sessions } = await supabase
      .from("activity_sessions")
      .select("id, time_label, max_slots, filled_slots")
      .eq("activity_id", activityId);

    let msg = `🎲 <b>${activity.title}</b>\n📍 ${activity.venue}\n📅 ${activity.date}\n\n`;

    if (sessions) {
      for (const s of sessions) {
        msg += `⏰ ${s.time_label} — ${s.filled_slots}/${s.max_slots} joined\n`;
      }
    }

    // Check user's participation (works for both linked and guest users)
    const profile = await getLinkedProfile(supabase, chatId);
    const userId = resolveUserId(profile, chatId);
    let isJoined = false;
    let userBookingId: string | null = null;

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map((s: any) => s.id);
      
      // Try by user_id first, then by player_username (guest tg_ identifier)
      let bookingQuery = supabase
        .from("bookings")
        .select("id, reservation_status")
        .in("session_id", sessionIds)
        .neq("reservation_status", "cancelled")
        .limit(1);

      if (profile) {
        bookingQuery = bookingQuery.eq("user_id", profile.user_id);
      } else {
        bookingQuery = bookingQuery.eq("player_username", `tg_${chatId}`);
      }

      const { data: booking } = await bookingQuery.single();

      if (booking) {
        isJoined = true;
        userBookingId = booking.id;
        const status = booking.reservation_status === "confirmed" ? "✅ Confirmed" : "⏳ Pending";
        msg += `\n<b>Your status:</b> ${status}`;
      }
    }

    const buttons: any[] = [];
    if (isJoined) {
      buttons.push([{ text: "🔄 Check Status", callback_data: `ballot_view_${activityId}` }]);
      buttons.push([{ text: "🚪 Leave Ballot", callback_data: `ballot_leave_${userBookingId}` }]);
    } else if (sessions && sessions.length > 0) {
      buttons.push([{ text: "✋ Join Ballot", callback_data: `ballot_join_${sessions[0].id}` }]);
    }
    buttons.push([{ text: "⬅️ Back", callback_data: "my_bookee" }]);

    await sendMessage(chatId, msg, { inline_keyboard: buttons });
    return;
  }

  // ─── Join ballot (supports guest mode) ───
  if (cbData.startsWith("ballot_join_")) {
    const sessionId = cbData.replace("ballot_join_", "");
    const profile = await getLinkedProfile(supabase, chatId);
    const userId = resolveUserId(profile, chatId);

    // Check if already joined
    let existingQuery = supabase
      .from("bookings")
      .select("id")
      .eq("session_id", sessionId)
      .neq("reservation_status", "cancelled")
      .limit(1);

    if (profile) {
      existingQuery = existingQuery.eq("user_id", profile.user_id);
    } else {
      existingQuery = existingQuery.eq("player_username", `tg_${chatId}`);
    }

    const { data: existing } = await existingQuery.single();

    if (existing) {
      await sendMessage(chatId, "You've already joined this ballot!", {
        inline_keyboard: [[{ text: "⬅️ Back", callback_data: "my_bookee" }]],
      });
      return;
    }

    const reservedUntil = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const displayName = resolveDisplayName(profile);
    
    const bookingData: any = {
      session_id: sessionId,
      player_name: displayName,
      player_username: profile ? null : `tg_${chatId}`,
      reservation_status: "pending",
      payment_status: "unpaid",
      reserved_until: reservedUntil,
    };
    if (profile) bookingData.user_id = profile.user_id;

    const { error } = await supabase.from("bookings").insert(bookingData);

    // Update filled_slots
    const { data: sess } = await supabase
      .from("activity_sessions")
      .select("filled_slots")
      .eq("id", sessionId)
      .single();
    if (sess) {
      await supabase
        .from("activity_sessions")
        .update({ filled_slots: sess.filled_slots + 1 })
        .eq("id", sessionId);
    }

    if (error) {
      await sendMessage(chatId, "❌ Failed to join: " + error.message, getMainMenu());
      return;
    }

    const guestNote = profile ? "" : "\n\n💡 Link your account in Settings to manage bookings across platforms.";
    await sendMessage(
      chatId,
      `✅ <b>You have joined this ballot!</b>\n\n⏰ Your slot is reserved for 3 hours. Please confirm before expiry.${guestNote}`,
      {
        inline_keyboard: [
          [{ text: "📋 My Bookee", callback_data: "my_bookee" }],
          [{ text: "⬅️ Main Menu", callback_data: "main_menu" }],
        ],
      }
    );
    return;
  }

  // ─── Leave ballot ───
  if (cbData.startsWith("ballot_leave_")) {
    const bookingId = cbData.replace("ballot_leave_", "");
    
    const { data: booking } = await supabase
      .from("bookings")
      .select("session_id")
      .eq("id", bookingId)
      .single();

    const { error } = await supabase
      .from("bookings")
      .update({ reservation_status: "cancelled" })
      .eq("id", bookingId);

    if (booking) {
      const { data: sess } = await supabase
        .from("activity_sessions")
        .select("filled_slots")
        .eq("id", booking.session_id)
        .single();
      if (sess && sess.filled_slots > 0) {
        await supabase
          .from("activity_sessions")
          .update({ filled_slots: sess.filled_slots - 1 })
          .eq("id", booking.session_id);
      }
    }

    if (error) {
      await sendMessage(chatId, "❌ Failed to leave: " + error.message, getMainMenu());
      return;
    }

    await sendMessage(chatId, "👋 You've left this ballot.", {
      inline_keyboard: [
        [{ text: "📋 My Bookee", callback_data: "my_bookee" }],
        [{ text: "⬅️ Main Menu", callback_data: "main_menu" }],
      ],
    });
    return;
  }
}

async function handleBallotText(chatId: number, text: string, supabase: any) {
  const state = await getState(supabase, chatId);
  if (!state) return;

  // Ballot create flow
  if (state.flow === "ballot_create") {
    const { step, data } = state;

    switch (step) {
      case "ballot_title":
        data.title = text;
        await setState(supabase, chatId, { flow: "ballot_create", step: "ballot_sport", data });
        await sendMessage(chatId, "⚽ What sport?", {
          inline_keyboard: [
            [{ text: "⚽ Football", callback_data: "bsport_Football" }],
            [{ text: "🏀 Basketball", callback_data: "bsport_Basketball" }],
            [{ text: "🏸 Badminton", callback_data: "bsport_Badminton" }],
            [{ text: "🎾 Tennis", callback_data: "bsport_Tennis" }],
          ],
        });
        break;

      case "ballot_venue":
        data.venue = text;
        await setState(supabase, chatId, { flow: "ballot_create", step: "ballot_date", data });
        await sendMessage(chatId, "📅 Deadline date? (YYYY-MM-DD, e.g. 2026-12-31)");
        break;

      case "ballot_date":
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
          await sendMessage(chatId, "❌ Please use YYYY-MM-DD format.");
          return;
        }
        data.date = text;
        await setState(supabase, chatId, { flow: "ballot_create", step: "ballot_slots", data });
        await sendMessage(chatId, "👥 How many slots?");
        break;

      case "ballot_slots": {
        const slots = parseInt(text);
        if (isNaN(slots) || slots < 1) {
          await sendMessage(chatId, "❌ Please enter a valid number.");
          return;
        }
        data.sessions = [{ time_label: "Ballot", max_slots: slots, price: 0 }];
        await createActivity(chatId, data, supabase);
        break;
      }

      default:
        break;
    }
    return;
  }

  // Paste ballot link flow
  if (state.flow === "ballot_paste" && state.step === "awaiting_link") {
    let activityId = text.trim();
    const urlMatch = text.match(/events\/([a-f0-9-]+)/i) || text.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (urlMatch) activityId = urlMatch[1];

    const { data: activity } = await supabase
      .from("activities")
      .select("id, title, venue, date, sport, status, organizer_id")
      .eq("id", activityId)
      .single();

    await clearState(supabase, chatId);

    if (!activity) {
      await sendMessage(chatId, "❌ Could not find that activity. Check the link and try again.", {
        inline_keyboard: [[{ text: "⬅️ Back", callback_data: "ballot_manage" }]],
      });
      return;
    }

    // Show organizer manage view if they own it, otherwise player view
    const profile = await getLinkedProfile(supabase, chatId);
    if (profile && activity.organizer_id === profile.user_id) {
      await handleBallotCallback(chatId, `ballot_manage_view_${activity.id}`, supabase);
    } else {
      await handleBallotCallback(chatId, `ballot_view_${activity.id}`, supabase);
    }
    return;
  }
}

// Ballot sport callback
async function handleBallotSportCallback(chatId: number, cbData: string, supabase: any) {
  if (cbData.startsWith("bsport_")) {
    const state = await getState(supabase, chatId);
    if (!state) return;
    state.data.sport = cbData.replace("bsport_", "");
    await setState(supabase, chatId, { flow: "ballot_create", step: "ballot_venue", data: state.data });
    await sendMessage(chatId, "📍 Location?");
  }
}

// ─── MY BOOKEE ──────────────────────────────────────────────────────

async function handleMyBookeeCallback(chatId: number, cbData: string, supabase: any) {
  if (cbData === "my_bookee") {
    await sendMessage(chatId, "📋 <b>My Bookee</b>", {
      inline_keyboard: [
        [{ text: "🔍 Explore Activities", callback_data: "explore" }],
        [{ text: "📋 My Reservations", callback_data: "my_reservations" }],
        [{ text: "🎲 Ballot Status", callback_data: "my_ballot_status" }],
        [{ text: "⬅️ Back", callback_data: "main_menu" }],
      ],
    });
    return;
  }

  if (cbData === "explore") {
    const { data: activities } = await supabase
      .from("activities")
      .select("id, title, sport, venue, date, status")
      .in("status", ["active", "ballot"])
      .order("date", { ascending: true })
      .limit(8);

    if (!activities || activities.length === 0) {
      await sendMessage(chatId, "No activities available right now.", {
        inline_keyboard: [[{ text: "⬅️ Back", callback_data: "my_bookee" }]],
      });
      return;
    }

    let msg = "🔍 <b>Available Activities</b>\n\n";
    const buttons: any[] = [];
    for (const a of activities) {
      const tag = a.status === "ballot" ? "🎲" : "🏟️";
      msg += `${tag} <b>${a.title}</b>\n📍 ${a.venue} | 📅 ${a.date}\n⚽ ${a.sport}\n\n`;
      const action = a.status === "ballot" ? "ballot_view" : "join";
      buttons.push([{ text: `${tag} ${a.title}`, callback_data: `${action}_${a.id}` }]);
    }
    buttons.push([{ text: "⬅️ Back", callback_data: "my_bookee" }]);
    await sendMessage(chatId, msg, { inline_keyboard: buttons });
    return;
  }

  if (cbData === "my_reservations") {
    const profile = await getLinkedProfile(supabase, chatId);
    
    // Support both linked and guest users
    let bookings: any[] = [];
    if (profile) {
      const { data } = await supabase
        .from("bookings")
        .select("id, player_name, payment_status, reservation_status, session_id, reserved_until")
        .eq("user_id", profile.user_id)
        .neq("reservation_status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(10);
      bookings = data || [];
    } else {
      // Guest: lookup by player_username
      const { data } = await supabase
        .from("bookings")
        .select("id, player_name, payment_status, reservation_status, session_id, reserved_until")
        .eq("player_username", `tg_${chatId}`)
        .neq("reservation_status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(10);
      bookings = data || [];
    }

    if (bookings.length === 0) {
      await sendMessage(chatId, "No reservations yet. Explore activities to get started!", {
        inline_keyboard: [
          [{ text: "🔍 Explore", callback_data: "explore" }],
          [{ text: "⬅️ Back", callback_data: "my_bookee" }],
        ],
      });
      return;
    }

    let msg = "📋 <b>My Reservations</b>\n\n";
    const buttons: any[] = [];

    for (const b of bookings) {
      const rStatus = b.reservation_status === "confirmed" ? "✅" : "⏳";
      const pStatus = b.payment_status === "paid" ? "💰 Paid" : "💳 Pending";
      msg += `${rStatus} ${b.player_name} — ${pStatus}\n`;

      if (b.reserved_until) {
        const expiry = new Date(b.reserved_until);
        if (expiry > new Date()) {
          const hoursLeft = Math.round((expiry.getTime() - Date.now()) / (60 * 60 * 1000) * 10) / 10;
          msg += `⏰ Reserved for ${hoursLeft}h\n`;
        }
      }
      msg += "\n";

      if (b.reservation_status !== "cancelled") {
        buttons.push([{ text: `❌ Cancel: ${b.player_name}`, callback_data: `cancel_booking_${b.id}` }]);
      }
    }

    buttons.push([{ text: "⬅️ Back", callback_data: "my_bookee" }]);
    await sendMessage(chatId, msg, { inline_keyboard: buttons });
    return;
  }

  // ─── Ballot Status (works for guest + linked) ───
  if (cbData === "my_ballot_status") {
    const profile = await getLinkedProfile(supabase, chatId);
    
    let myBookings: any[] = [];
    if (profile) {
      const { data } = await supabase
        .from("bookings")
        .select("id, session_id, reservation_status")
        .eq("user_id", profile.user_id)
        .neq("reservation_status", "cancelled");
      myBookings = data || [];
    } else {
      const { data } = await supabase
        .from("bookings")
        .select("id, session_id, reservation_status")
        .eq("player_username", `tg_${chatId}`)
        .neq("reservation_status", "cancelled");
      myBookings = data || [];
    }

    if (myBookings.length === 0) {
      await sendMessage(chatId, "No ballot entries found.", {
        inline_keyboard: [
          [{ text: "🔍 Explore", callback_data: "explore" }],
          [{ text: "⬅️ Back", callback_data: "my_bookee" }],
        ],
      });
      return;
    }

    const sessionIds = myBookings.map((b: any) => b.session_id);
    const { data: sessions } = await supabase
      .from("activity_sessions")
      .select("id, activity_id")
      .in("id", sessionIds);

    if (!sessions || sessions.length === 0) {
      await sendMessage(chatId, "No ballot data found.", {
        inline_keyboard: [[{ text: "⬅️ Back", callback_data: "my_bookee" }]],
      });
      return;
    }

    const activityIds = [...new Set(sessions.map((s: any) => s.activity_id))];
    const { data: ballotActivities } = await supabase
      .from("activities")
      .select("id, title, date")
      .in("id", activityIds)
      .eq("status", "ballot");

    let msg = "🎲 <b>My Ballot Status</b>\n\n";
    const buttons: any[] = [];

    if (ballotActivities && ballotActivities.length > 0) {
      for (const ba of ballotActivities) {
        const booking = myBookings.find((b: any) => {
          const sess = sessions.find((s: any) => s.id === b.session_id && s.activity_id === ba.id);
          return !!sess;
        });
        const status = booking?.reservation_status === "confirmed" ? "✅" : "⏳";
        msg += `${status} ${ba.title} — ${ba.date}\n`;
        buttons.push([{ text: `🎲 ${ba.title}`, callback_data: `ballot_view_${ba.id}` }]);
      }
    } else {
      msg += "No active ballots.";
    }

    buttons.push([{ text: "⬅️ Back", callback_data: "my_bookee" }]);
    await sendMessage(chatId, msg, { inline_keyboard: buttons });
    return;
  }

  if (cbData.startsWith("cancel_booking_")) {
    const bookingId = cbData.replace("cancel_booking_", "");

    const { data: booking } = await supabase
      .from("bookings")
      .select("session_id")
      .eq("id", bookingId)
      .single();

    const { error } = await supabase
      .from("bookings")
      .update({ reservation_status: "cancelled" })
      .eq("id", bookingId);

    if (booking) {
      const { data: sess } = await supabase
        .from("activity_sessions")
        .select("filled_slots")
        .eq("id", booking.session_id)
        .single();
      if (sess && sess.filled_slots > 0) {
        await supabase
          .from("activity_sessions")
          .update({ filled_slots: sess.filled_slots - 1 })
          .eq("id", booking.session_id);
      }
    }

    if (error) {
      await sendMessage(chatId, "❌ Cancel failed: " + error.message, getMainMenu());
      return;
    }

    await sendMessage(chatId, "✅ Booking cancelled.", {
      inline_keyboard: [
        [{ text: "📋 My Reservations", callback_data: "my_reservations" }],
        [{ text: "⬅️ Main Menu", callback_data: "main_menu" }],
      ],
    });
    return;
  }

  // ─── Join activity (non-ballot, supports guest) ───
  if (cbData.startsWith("join_")) {
    const activityId = cbData.replace("join_", "");
    const { data: activity } = await supabase
      .from("activities")
      .select("title, venue, date, sport")
      .eq("id", activityId)
      .single();

    if (!activity) {
      await sendMessage(chatId, "Activity not found.", getMainMenu());
      return;
    }

    const { data: sessions } = await supabase
      .from("activity_sessions")
      .select("id, time_label, price, max_slots, filled_slots")
      .eq("activity_id", activityId);

    let msg = `🏟️ <b>${activity.title}</b>\n📍 ${activity.venue}\n📅 ${activity.date}\n⚽ ${activity.sport}\n\n`;
    const buttons: any[] = [];

    if (sessions && sessions.length > 0) {
      msg += "<b>Sessions:</b>\n\n";
      for (const s of sessions) {
        const available = s.max_slots - s.filled_slots;
        const price = s.price > 0 ? `SGD $${(s.price / 100).toFixed(2)}` : "Free";
        msg += `⏰ ${s.time_label} — ${price} (${available} left)\n`;
        if (available > 0) {
          buttons.push([{ text: `✋ Join: ${s.time_label}`, callback_data: `book_session_${s.id}` }]);
        }
      }
    }

    buttons.push([{ text: "⬅️ Back", callback_data: "explore" }]);
    await sendMessage(chatId, msg, { inline_keyboard: buttons });
    return;
  }

  // ─── Book a session (supports guest) ───
  if (cbData.startsWith("book_session_")) {
    const sessionId = cbData.replace("book_session_", "");
    const profile = await getLinkedProfile(supabase, chatId);

    // Check existing booking
    let existingQuery = supabase
      .from("bookings")
      .select("id")
      .eq("session_id", sessionId)
      .neq("reservation_status", "cancelled")
      .limit(1);

    if (profile) {
      existingQuery = existingQuery.eq("user_id", profile.user_id);
    } else {
      existingQuery = existingQuery.eq("player_username", `tg_${chatId}`);
    }

    const { data: existing } = await existingQuery.single();

    if (existing) {
      await sendMessage(chatId, "You've already booked this session!", {
        inline_keyboard: [[{ text: "📋 My Reservations", callback_data: "my_reservations" }]],
      });
      return;
    }

    const reservedUntil = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const displayName = resolveDisplayName(profile);

    const bookingData: any = {
      session_id: sessionId,
      player_name: displayName,
      player_username: profile ? null : `tg_${chatId}`,
      reservation_status: "pending",
      payment_status: "unpaid",
      reserved_until: reservedUntil,
    };
    if (profile) bookingData.user_id = profile.user_id;

    const { error } = await supabase.from("bookings").insert(bookingData);

    if (error) {
      await sendMessage(chatId, "❌ Booking failed: " + error.message, getMainMenu());
      return;
    }

    // Increment filled_slots
    const { data: sess } = await supabase
      .from("activity_sessions")
      .select("filled_slots")
      .eq("id", sessionId)
      .single();
    if (sess) {
      await supabase
        .from("activity_sessions")
        .update({ filled_slots: sess.filled_slots + 1 })
        .eq("id", sessionId);
    }

    const guestNote = profile ? "" : "\n\n💡 Link your account in Settings to manage across platforms.";
    await sendMessage(
      chatId,
      `✅ <b>Booked!</b>\n\n⏰ Your slot is reserved for 3 hours. Please confirm before expiry.\n\n🌐 ${SITE_URL}${guestNote}`,
      {
        inline_keyboard: [
          [{ text: "📋 My Reservations", callback_data: "my_reservations" }],
          [{ text: "⬅️ Main Menu", callback_data: "main_menu" }],
        ],
      }
    );
    return;
  }
}

// ─── HELP ───────────────────────────────────────────────────────────

async function handleHelp(chatId: number) {
  await sendMessage(
    chatId,
    "❓ <b>Help</b>\n\n" +
    "• <b>Register for Beta</b> — Sign up for early access\n" +
    "• <b>My Bookee</b> — Explore activities, view reservations\n" +
    "• <b>Organize</b> — Create & manage activities (requires account)\n" +
    "• <b>Ballot</b> — Create or join ballot groups\n\n" +
    "🔗 <b>Account Linking:</b>\n" +
    "Guest users can join activities and ballots. Link your email account in Settings for full access.\n\n" +
    "⏰ Reservations expire after 3 hours if not confirmed.\n\n" +
    `🌐 Web app: ${SITE_URL}\n` +
    "📧 Support: yjqbenjaminbusiness@gmail.com",
    { inline_keyboard: [[{ text: "⬅️ Back", callback_data: "main_menu" }]] }
  );
}

// ─── MAIN HANDLERS ──────────────────────────────────────────────────

async function handleMessage(chatId: number, text: string, supabase: any, username?: string) {
  const state = await getState(supabase, chatId);

  if (state) {
    if (state.flow === "beta") {
      await handleBetaFlow(chatId, text, supabase);
      return;
    }
    if (state.flow === "organize") {
      await handleOrganizeFlow(chatId, text, supabase);
      return;
    }
    if (state.flow === "ballot_create" || state.flow === "ballot_paste") {
      await handleBallotText(chatId, text, supabase);
      return;
    }
  }

  if (text === "/start") {
    await sendMessage(
      chatId,
      "🏃 <b>Welcome to Bookee!</b>\n\nFind, book, and organize sports activities.\n\nWhat would you like to do?",
      getMainMenu()
    );
    return;
  }

  await sendMessage(chatId, "Choose an option:", getMainMenu());
}

async function handleCallback(chatId: number, data: string, supabase: any) {
  if (data === "main_menu") {
    await clearState(supabase, chatId);
    await sendMessage(chatId, "What would you like to do?", getMainMenu());
    return;
  }

  // Beta
  if (data === "beta_start") {
    await handleBetaFlow(chatId, "", supabase);
    return;
  }
  if (data.startsWith("beta_")) {
    await handleBetaCallback(chatId, data, supabase);
    return;
  }

  // Organize
  if (data === "organize" || data.startsWith("org_") || data.startsWith("manage_")) {
    await handleOrganizeCallback(chatId, data, supabase);
    return;
  }

  // Ballot
  if (data === "ballot" || data.startsWith("ballot_")) {
    await handleBallotCallback(chatId, data, supabase);
    return;
  }
  if (data.startsWith("bsport_")) {
    await handleBallotSportCallback(chatId, data, supabase);
    return;
  }

  // My Bookee and all sub-flows
  if (data === "my_bookee" || data === "explore" || data === "my_reservations" ||
      data === "my_ballot_status" ||
      data.startsWith("cancel_booking_") || data.startsWith("join_") ||
      data.startsWith("book_session_")) {
    await handleMyBookeeCallback(chatId, data, supabase);
    return;
  }

  // Help
  if (data === "help") {
    await handleHelp(chatId);
    return;
  }

  await sendMessage(chatId, "Choose an option:", getMainMenu());
}

// ─── SERVER ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
  if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let totalProcessed = 0;
  let currentOffset: number;

  const { data: state, error: stateErr } = await supabase
    .from("telegram_bot_state")
    .select("update_offset")
    .eq("id", 1)
    .single();

  if (stateErr) {
    return new Response(JSON.stringify({ error: stateErr.message }), { status: 500 });
  }

  currentOffset = state.update_offset;

  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = MAX_RUNTIME_MS - elapsed;
    if (remainingMs < MIN_REMAINING_MS) break;

    const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        offset: currentOffset,
        timeout,
        allowed_updates: ["message", "callback_query"],
      }),
    });

    const respData = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: respData }), { status: 502 });
    }

    const updates = respData.result ?? [];
    if (updates.length === 0) continue;

    for (const update of updates) {
      try {
        if (update.message) {
          const chatId = update.message.chat.id;
          const text = update.message.text || "";
          const username = update.message.from?.username;
          await handleMessage(chatId, text, supabase, username);

          await supabase.from("telegram_messages").upsert({
            update_id: update.update_id,
            chat_id: chatId,
            text,
            raw_update: update,
          }, { onConflict: "update_id" });
        }

        if (update.callback_query) {
          const chatId = update.callback_query.message.chat.id;
          const callbackData = update.callback_query.data;
          await handleCallback(chatId, callbackData, supabase);
          await answerCallback(update.callback_query.id);
        }

        totalProcessed++;
      } catch (e) {
        console.error("Error processing update:", e);
      }
    }

    const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
    await supabase
      .from("telegram_bot_state")
      .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
      .eq("id", 1);

    currentOffset = newOffset;
  }

  return new Response(JSON.stringify({ ok: true, processed: totalProcessed, finalOffset: currentOffset }));
});
