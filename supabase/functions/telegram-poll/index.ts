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

// ─── PERSISTENT REPLY KEYBOARD (always visible) ────────────────────

function getPersistentMenu() {
  return {
    keyboard: [
      [{ text: "📝 Register for Beta" }],
      [{ text: "📋 My Bookee" }, { text: "🏟️ Organize" }],
      [{ text: "🎲 Ballot" }, { text: "❓ Help" }],
      [{ text: "🚪 Logout" }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

function getInlineMainMenu() {
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

// ─── DATE HELPERS ───────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDate(dateStr: string): string {
  let d: Date | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    d = new Date(dateStr + "T00:00:00");
  } else if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(dateStr)) {
    const parts = dateStr.split(/[-\/]/);
    d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
  }
  if (!d || isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function parseDateInput(text: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const m = text.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  const m2 = text.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/i);
  if (m2) {
    const mi = MONTHS.findIndex(mo => mo.toLowerCase() === m2[2].toLowerCase());
    if (mi >= 0) return `${m2[3]}-${String(mi+1).padStart(2,"0")}-${m2[1].padStart(2,"0")}`;
  }
  return null;
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

async function getLinkedProfile(supabase: any, chatId: number) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, display_name, email")
    .eq("telegram_chat_id", chatId)
    .single();
  return profile || null;
}

function resolveUserId(profile: any, chatId: number): string {
  return profile ? profile.user_id : `tg_${chatId}`;
}

function resolveDisplayName(profile: any, username?: string): string {
  if (profile?.display_name) return profile.display_name;
  if (username) return username;
  return "Guest";
}

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
    await sendMessage(chatId, "📝 <b>Beta Registration</b>\n\nWhat's your name?", {
      inline_keyboard: [[{ text: "❌ Cancel", callback_data: "main_menu" }]],
    });
    return;
  }

  const { step, data } = state;

  switch (step) {
    case "beta_name":
      data.name = text;
      await setState(supabase, chatId, { flow: "beta", step: "beta_email", data });
      await sendMessage(chatId, "📧 What's your email address?", {
        inline_keyboard: [[{ text: "⬅️ Back", callback_data: "beta_back_name" }], [{ text: "❌ Cancel", callback_data: "main_menu" }]],
      });
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
          [{ text: "⬅️ Back", callback_data: "beta_back_email" }],
          [{ text: "❌ Cancel", callback_data: "main_menu" }],
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
          [{ text: "⬅️ Back", callback_data: "beta_back_size" }],
          [{ text: "❌ Cancel", callback_data: "main_menu" }],
        ],
      });
      break;

    default:
      await clearState(supabase, chatId);
      await sendMessage(chatId, "Something went wrong. Let's start over.", getPersistentMenu());
  }
}

async function handleBetaCallback(chatId: number, data: string, supabase: any) {
  const state = await getState(supabase, chatId);
  if (!state) return;

  if (data === "beta_back_name") {
    await setState(supabase, chatId, { flow: "beta", step: "beta_start", data: {} });
    await handleBetaFlow(chatId, "", supabase);
    return;
  }
  if (data === "beta_back_email") {
    state.step = "beta_name";
    await setState(supabase, chatId, state);
    await sendMessage(chatId, "📝 What's your name?", {
      inline_keyboard: [[{ text: "❌ Cancel", callback_data: "main_menu" }]],
    });
    return;
  }
  if (data === "beta_back_size") {
    state.step = "beta_role";
    await setState(supabase, chatId, state);
    await sendMessage(chatId, "🎯 What's your role?", {
      inline_keyboard: [
        [{ text: "🏟️ Organizer", callback_data: "beta_role_organizer" }],
        [{ text: "🏃 Player", callback_data: "beta_role_player" }],
        [{ text: "⬅️ Back", callback_data: "beta_back_email" }],
        [{ text: "❌ Cancel", callback_data: "main_menu" }],
      ],
    });
    return;
  }

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
        [{ text: "⬅️ Back", callback_data: "beta_back_size" }],
        [{ text: "❌ Cancel", callback_data: "main_menu" }],
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
        [{ text: "⬅️ Back", callback_data: "beta_back_size" }],
        [{ text: "❌ Cancel", callback_data: "main_menu" }],
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
      await sendMessage(chatId, "❌ Registration failed. Please try again.", getPersistentMenu());
    } else {
      await sendMessage(
        chatId,
        "✅ <b>You're registered for Beta!</b>\n\nThanks, " + state.data.name + "! We'll reach out to invite you for early testing.",
        getPersistentMenu()
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
      await sendMessage(chatId, "⚽ What sport/activity? (type freely, e.g. Badminton, Futsal, Yoga)", {
        inline_keyboard: [
          [{ text: "⬅️ Back", callback_data: "organize" }],
          [{ text: "❌ Cancel", callback_data: "main_menu" }],
        ],
      });
      break;

    case "org_sport":
      data.sport = text;
      await setState(supabase, chatId, { flow: "organize", step: "org_venue", data });
      await sendMessage(chatId, "📍 What's the venue/location? (type freely)", {
        inline_keyboard: [
          [{ text: "⬅️ Back", callback_data: "org_back_sport" }],
          [{ text: "❌ Cancel", callback_data: "main_menu" }],
        ],
      });
      break;

    case "org_venue":
      data.venue = text;
      await setState(supabase, chatId, { flow: "organize", step: "org_date", data });
      await sendMessage(chatId, "📅 What date?\n\nAccepted formats:\n• 26 Jan 2026\n• 26-01-2026\n• 2026-01-26", {
        inline_keyboard: [
          [{ text: "⬅️ Back", callback_data: "org_back_venue" }],
          [{ text: "❌ Cancel", callback_data: "main_menu" }],
        ],
      });
      break;

    case "org_date": {
      const parsed = parseDateInput(text);
      if (!parsed) {
        await sendMessage(chatId, "❌ Invalid date. Use formats like: 26 Jan 2026, 26-01-2026, or 2026-01-26");
        return;
      }
      data.date = parsed;
      await setState(supabase, chatId, { flow: "organize", step: "org_time", data });
      await sendMessage(chatId, "⏰ Session time label? (e.g. '7pm - 9pm')", {
        inline_keyboard: [
          [{ text: "⬅️ Back", callback_data: "org_back_date" }],
          [{ text: "❌ Cancel", callback_data: "main_menu" }],
        ],
      });
      break;
    }

    case "org_time":
      data.time_label = text;
      await setState(supabase, chatId, { flow: "organize", step: "org_slots", data });
      await sendMessage(chatId, "👥 How many slots/max players?", {
        inline_keyboard: [
          [{ text: "⬅️ Back", callback_data: "org_back_time" }],
          [{ text: "❌ Cancel", callback_data: "main_menu" }],
        ],
      });
      break;

    case "org_slots": {
      const slots = parseInt(text);
      if (isNaN(slots) || slots < 1) {
        await sendMessage(chatId, "❌ Please enter a valid number.");
        return;
      }
      data.max_slots = slots;
      await setState(supabase, chatId, { flow: "organize", step: "org_price", data });
      await sendMessage(chatId, "💰 Price per slot in SGD? (enter 0 for free)", {
        inline_keyboard: [
          [{ text: "⬅️ Back", callback_data: "org_back_slots" }],
          [{ text: "❌ Cancel", callback_data: "main_menu" }],
        ],
      });
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
              [{ text: "✅ Confirm — Create Activity", callback_data: "org_confirm" }],
              [{ text: "❌ Cancel", callback_data: "main_menu" }],
            ],
          }
        );
      } else {
        data.sessions = [{ time_label: data.time_label, max_slots: data.max_slots, price: data.price }];
        await setState(supabase, chatId, { flow: "organize", step: "org_confirm_review", data });
        await showOrganizeConfirmation(chatId, data);
      }
      break;
    }

    case "org_multi_time":
      data.time_label = text;
      await setState(supabase, chatId, { flow: "organize", step: "org_slots", data });
      await sendMessage(chatId, "👥 How many slots for this session?", {
        inline_keyboard: [
          [{ text: "⬅️ Back", callback_data: "org_add_session" }],
          [{ text: "❌ Cancel", callback_data: "main_menu" }],
        ],
      });
      break;

    case "org_multi_template": {
      const sessionBlocks = text.split(/session\s*\d+\s*:/i).filter(s => s.trim());
      if (sessionBlocks.length === 0) {
        await sendMessage(chatId, "❌ Could not parse sessions. Please follow the template format.");
        return;
      }
      data.sessions = data.sessions || [];
      for (const block of sessionBlocks) {
        const dateMatch = block.match(/date\s*:\s*(.+)/i);
        const timeMatch = block.match(/time\s*:\s*(.+)/i);
        const slotsMatch = block.match(/slots?\s*:\s*(\d+)/i);
        if (timeMatch && slotsMatch) {
          data.sessions.push({
            time_label: timeMatch[1].trim(),
            max_slots: parseInt(slotsMatch[1]),
            price: data.price || 0,
          });
          if (dateMatch) {
            const pd = parseDateInput(dateMatch[1].trim());
            if (pd) data.date = pd;
          }
        }
      }
      if (data.sessions.length === 0) {
        await sendMessage(chatId, "❌ Could not find any sessions. Please include Time and Slots for each session.");
        return;
      }
      await setState(supabase, chatId, { flow: "organize", step: "org_confirm_review", data });
      await showOrganizeConfirmation(chatId, data);
      break;
    }

    default:
      await clearState(supabase, chatId);
      await sendMessage(chatId, "Something went wrong. Let's start over.", getPersistentMenu());
  }
}

async function showOrganizeConfirmation(chatId: number, data: any) {
  let msg = "📋 <b>Activity Summary</b>\n\n";
  msg += `📝 <b>Title:</b> ${data.title}\n`;
  msg += `⚽ <b>Sport:</b> ${data.sport}\n`;
  msg += `📍 <b>Venue:</b> ${data.venue}\n`;
  msg += `📅 <b>Date:</b> ${formatDate(data.date)}\n\n`;

  if (data.sessions && data.sessions.length > 0) {
    msg += `<b>Sessions (${data.sessions.length}):</b>\n`;
    for (let i = 0; i < data.sessions.length; i++) {
      const s = data.sessions[i];
      const price = s.price > 0 ? `SGD $${(s.price / 100).toFixed(2)}` : "Free";
      msg += `  ${i+1}. ⏰ ${s.time_label} — 👥 ${s.max_slots} slots — ${price}\n`;
    }
  }

  msg += "\n<b>Please confirm:</b>";

  await sendMessage(chatId, msg, {
    inline_keyboard: [
      [{ text: "✅ Confirm", callback_data: "org_confirm" }],
      [{ text: "✏️ Edit", callback_data: "org_edit" }],
      [{ text: "❌ Cancel", callback_data: "main_menu" }],
    ],
  });
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
      status: "active",
      description: data.description || null,
    })
    .select("id")
    .single();

  if (actErr) {
    console.error("Activity creation error:", actErr);
    await clearState(supabase, chatId);
    await sendMessage(chatId, "❌ Failed to create activity. " + actErr.message, getPersistentMenu());
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

  let msg = `✅ <b>Activity Created!</b>\n\n`;
  msg += `🏟️ ${data.title}\n`;
  msg += `📍 ${data.venue}\n`;
  msg += `📅 ${formatDate(data.date)}\n`;
  msg += `⚽ ${data.sport}\n`;
  msg += `📊 ${data.sessions.length} session(s)\n\n`;
  msg += `🌐 Manage at: ${SITE_URL}`;

  await sendMessage(chatId, msg, getPersistentMenu());
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
    await sendMessage(chatId, "📝 What's the activity title? (type freely)", {
      inline_keyboard: [
        [{ text: "⬅️ Back", callback_data: "organize" }],
        [{ text: "❌ Cancel", callback_data: "main_menu" }],
      ],
    });
    return;
  }

  // Back buttons for organize flow
  if (cbData === "org_back_sport" && state) {
    state.step = "org_title";
    await setState(supabase, chatId, state);
    await sendMessage(chatId, "📝 What's the activity title?", {
      inline_keyboard: [[{ text: "⬅️ Back", callback_data: "organize" }], [{ text: "❌ Cancel", callback_data: "main_menu" }]],
    });
    return;
  }
  if (cbData === "org_back_venue" && state) {
    state.step = "org_sport";
    await setState(supabase, chatId, state);
    await sendMessage(chatId, "⚽ What sport/activity?", {
      inline_keyboard: [[{ text: "⬅️ Back", callback_data: "organize" }], [{ text: "❌ Cancel", callback_data: "main_menu" }]],
    });
    return;
  }
  if (cbData === "org_back_date" && state) {
    state.step = "org_venue";
    await setState(supabase, chatId, state);
    await sendMessage(chatId, "📍 What's the venue/location?", {
      inline_keyboard: [[{ text: "⬅️ Back", callback_data: "org_back_sport" }], [{ text: "❌ Cancel", callback_data: "main_menu" }]],
    });
    return;
  }
  if (cbData === "org_back_time" && state) {
    state.step = "org_date";
    await setState(supabase, chatId, state);
    await sendMessage(chatId, "📅 What date?", {
      inline_keyboard: [[{ text: "⬅️ Back", callback_data: "org_back_venue" }], [{ text: "❌ Cancel", callback_data: "main_menu" }]],
    });
    return;
  }
  if (cbData === "org_back_slots" && state) {
    state.step = "org_time";
    await setState(supabase, chatId, state);
    await sendMessage(chatId, "⏰ Session time label?", {
      inline_keyboard: [[{ text: "⬅️ Back", callback_data: "org_back_date" }], [{ text: "❌ Cancel", callback_data: "main_menu" }]],
    });
    return;
  }

  if (cbData === "org_edit" && state) {
    state.step = "org_title";
    await setState(supabase, chatId, state);
    await sendMessage(chatId, `📝 Current title: "${state.data.title}"\n\nType a new title or re-send the same:`, {
      inline_keyboard: [[{ text: "❌ Cancel", callback_data: "main_menu" }]],
    });
    return;
  }

  if (cbData === "org_confirm") {
    if (!state) return;
    await createActivity(chatId, state.data, supabase);
    return;
  }

  if (cbData === "org_add_session") {
    if (!state) return;
    await setState(supabase, chatId, { flow: "organize", step: "org_multi_time", data: state.data });
    await sendMessage(chatId, "⏰ Time label for the next session? (e.g. '9pm - 11pm')", {
      inline_keyboard: [
        [{ text: "❌ Cancel", callback_data: "main_menu" }],
      ],
    });
    return;
  }

  if (cbData === "org_multi_template") {
    if (!state) return;
    const template = `Session 1:\nDate: ${formatDate(state.data.date || "2026-01-26")}\nTime: 7pm - 9pm\nSlots: 6\n\nSession 2:\nDate: ${formatDate(state.data.date || "2026-01-26")}\nTime: 9pm - 11pm\nSlots: 12`;
    await setState(supabase, chatId, { flow: "organize", step: "org_multi_template", data: state.data });
    await sendMessage(
      chatId,
      "📋 <b>Multi-Session Template</b>\n\nCopy the template below, fill in details, and send:\n\n<code>" + template + "</code>",
      { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "main_menu" }]] }
    );
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
      msg += `• ${a.title} (${formatDate(a.date)}) — ${a.status}\n`;
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

// ─── BALLOT FLOW (uses separate ballots table) ──────────────────────

async function handleBallotCallback(chatId: number, cbData: string, supabase: any) {
  if (cbData === "ballot") {
    await sendMessage(chatId, "🎲 <b>Ballot</b>\n\nWhat would you like to do?", {
      inline_keyboard: [
        [{ text: "🆕 Create Ballot Session", callback_data: "ballot_create" }],
        [{ text: "📊 Manage Ballot Sessions", callback_data: "ballot_manage" }],
        [{ text: "⬅️ Back", callback_data: "main_menu" }],
      ],
    });
    return;
  }

  if (cbData === "ballot_create") {
    const profile = await getLinkedProfile(supabase, chatId);
    if (!profile) {
      await promptAccountLink(chatId, "create ballot sessions");
      return;
    }
    await setState(supabase, chatId, { flow: "ballot_create", step: "ballot_title", data: {} });
    await sendMessage(chatId, "🎲 <b>Create Ballot Group</b>\n\n📝 What's the activity name? (type freely)", {
      inline_keyboard: [[{ text: "❌ Cancel", callback_data: "main_menu" }]],
    });
    return;
  }

  if (cbData === "ballot_manage") {
    const profile = await getLinkedProfile(supabase, chatId);
    if (!profile) {
      await promptAccountLink(chatId, "manage ballot groups");
      return;
    }

    const { data: orgBallots } = await supabase
      .from("ballots")
      .select("id, activity_name, ballot_deadline, location")
      .eq("created_by", profile.user_id)
      .order("ballot_deadline", { ascending: true })
      .limit(10);

    let msg = "📊 <b>Manage Ballot Group</b>\n\n";
    const buttons: any[] = [];

    buttons.push([{ text: "🔗 Paste Ballot Link", callback_data: "ballot_paste" }]);

    if (orgBallots && orgBallots.length > 0) {
      msg += "<b>Your Ballot Groups:</b>\n\n";
      for (const b of orgBallots) {
        msg += `• ${b.activity_name} — ${formatDate(b.ballot_deadline)}\n`;
        buttons.push([{ text: `📊 ${b.activity_name}`, callback_data: `ballot_manage_view_${b.id}` }]);
      }
    } else {
      msg += "No ballot groups found. Create one or paste a link.";
    }

    buttons.push([{ text: "⬅️ Back", callback_data: "ballot" }]);
    await sendMessage(chatId, msg, { inline_keyboard: buttons });
    return;
  }

  if (cbData.startsWith("ballot_manage_view_")) {
    const ballotId = cbData.replace("ballot_manage_view_", "");
    const { data: ballot } = await supabase
      .from("ballots")
      .select("id, activity_name, location, ballot_deadline, sport, slots, created_by")
      .eq("id", ballotId)
      .single();

    if (!ballot) {
      await sendMessage(chatId, "Ballot not found.", getPersistentMenu());
      return;
    }

    const { data: participants } = await supabase
      .from("ballot_participants")
      .select("id, display_name, status, user_id, attempt_count")
      .eq("ballot_id", ballotId);

    let msg = `🎲 <b>${ballot.activity_name}</b>\n📍 ${ballot.location}\n📅 Deadline: ${formatDate(ballot.ballot_deadline)}\n⚽ ${ballot.sport}\n👥 ${ballot.slots} slots\n\n`;

    const totalParticipants = participants?.length || 0;
    msg += `<b>Participants:</b> ${totalParticipants}\n`;

    const profile = await getLinkedProfile(supabase, chatId);
    if (profile && ballot.created_by === profile.user_id && participants && participants.length > 0) {
      for (const p of participants) {
        const s = p.status === "selected" ? "✅" : p.status === "rejected" ? "❌" : "⏳";
        const attempts = p.attempt_count > 1 ? ` (×${p.attempt_count})` : "";
        msg += `${s} ${p.display_name || "Anonymous"}${attempts}\n`;
      }
    }

    msg += `\n🌐 Full controls: ${SITE_URL}`;

    await sendMessage(chatId, msg, {
      inline_keyboard: [
        [{ text: "🔄 Refresh", callback_data: `ballot_manage_view_${ballotId}` }],
        [{ text: "⬅️ Back", callback_data: "ballot_manage" }],
      ],
    });
    return;
  }

  if (cbData === "ballot_paste") {
    await setState(supabase, chatId, { flow: "ballot_paste", step: "awaiting_link", data: {} });
    await sendMessage(chatId, "🔗 Paste the ballot ID or link:", {
      inline_keyboard: [[{ text: "❌ Cancel", callback_data: "ballot_manage" }]],
    });
    return;
  }

  // Player ballot view
  if (cbData.startsWith("ballot_view_")) {
    const ballotId = cbData.replace("ballot_view_", "");
    const { data: ballot } = await supabase
      .from("ballots")
      .select("id, activity_name, location, ballot_deadline, sport, slots")
      .eq("id", ballotId)
      .single();

    if (!ballot) {
      await sendMessage(chatId, "Ballot not found.", getPersistentMenu());
      return;
    }

    const { data: participants } = await supabase
      .from("ballot_participants")
      .select("id, status, user_id, telegram_username")
      .eq("ballot_id", ballotId);

    let msg = `🎲 <b>${ballot.activity_name}</b>\n📍 ${ballot.location}\n📅 Deadline: ${formatDate(ballot.ballot_deadline)}\n⚽ ${ballot.sport}\n👥 ${participants?.length || 0}/${ballot.slots} joined\n`;

    const profile = await getLinkedProfile(supabase, chatId);
    let isJoined = false;
    let participantId: string | null = null;

    if (participants) {
      for (const p of participants) {
        if (profile && p.user_id === profile.user_id) {
          isJoined = true;
          participantId = p.id;
          const status = p.status === "selected" ? "✅ Selected" : p.status === "rejected" ? "❌ Rejected" : "⏳ Pending";
          msg += `\n<b>Your status:</b> ${status}`;
          break;
        } else if (!profile && p.telegram_username === `tg_${chatId}`) {
          isJoined = true;
          participantId = p.id;
          msg += `\n<b>Your status:</b> ⏳ Pending`;
          break;
        }
      }
    }

    const buttons: any[] = [];
    if (isJoined) {
      buttons.push([{ text: "🔄 Check Status", callback_data: `ballot_view_${ballotId}` }]);
      buttons.push([{ text: "🚪 Leave Ballot", callback_data: `ballot_leave_${participantId}` }]);
    } else {
      buttons.push([{ text: "✋ Join Ballot", callback_data: `ballot_join_${ballotId}` }]);
    }
    buttons.push([{ text: "⬅️ Back", callback_data: "my_bookee" }]);

    await sendMessage(chatId, msg, { inline_keyboard: buttons });
    return;
  }

  // Join ballot (tracks attempt_count for repeated ballots)
  if (cbData.startsWith("ballot_join_")) {
    const ballotId = cbData.replace("ballot_join_", "");
    const profile = await getLinkedProfile(supabase, chatId);
    const displayName = resolveDisplayName(profile);

    // Check if already joined
    let existingQuery = supabase
      .from("ballot_participants")
      .select("id, attempt_count")
      .eq("ballot_id", ballotId)
      .limit(1);

    if (profile) {
      existingQuery = existingQuery.eq("user_id", profile.user_id);
    } else {
      existingQuery = existingQuery.eq("telegram_username", `tg_${chatId}`);
    }

    const { data: existing } = await existingQuery.single();
    if (existing) {
      // Increment attempt_count for repeated ballot participation
      await supabase
        .from("ballot_participants")
        .update({ attempt_count: existing.attempt_count + 1, last_attempt_at: new Date().toISOString() })
        .eq("id", existing.id);

      await sendMessage(chatId, `✅ Ballot attempt recorded! (Attempt #${existing.attempt_count + 1})`, {
        inline_keyboard: [[{ text: "📋 My Bookee", callback_data: "my_bookee" }]],
      });
      return;
    }

    const participantData: any = {
      ballot_id: ballotId,
      display_name: displayName,
      status: "pending",
      attempt_count: 1,
    };
    if (profile) {
      participantData.user_id = profile.user_id;
    } else {
      participantData.telegram_username = `tg_${chatId}`;
    }

    const { error } = await supabase.from("ballot_participants").insert(participantData);

    if (error) {
      await sendMessage(chatId, "❌ Failed to join: " + error.message, getPersistentMenu());
      return;
    }

    const guestNote = profile ? "" : "\n\n💡 Link your account to manage across platforms.";
    await sendMessage(
      chatId,
      `✅ <b>You have joined this ballot!</b> (Attempt #1)${guestNote}`,
      {
        inline_keyboard: [
          [{ text: "📋 My Bookee", callback_data: "my_bookee" }],
          [{ text: "⬅️ Main Menu", callback_data: "main_menu" }],
        ],
      }
    );
    return;
  }

  // Leave ballot
  if (cbData.startsWith("ballot_leave_")) {
    const participantId = cbData.replace("ballot_leave_", "");

    const { error } = await supabase
      .from("ballot_participants")
      .delete()
      .eq("id", participantId);

    if (error) {
      await sendMessage(chatId, "❌ Failed to leave: " + error.message, getPersistentMenu());
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

  // Confirm create ballot
  if (cbData === "ballot_confirm_create") {
    const state = await getState(supabase, chatId);
    if (!state) return;
    await createBallot(chatId, state.data, supabase);
    return;
  }
}

async function createBallot(chatId: number, data: any, supabase: any) {
  const profile = await getLinkedProfile(supabase, chatId);
  if (!profile) {
    await clearState(supabase, chatId);
    await promptAccountLink(chatId, "create ballot groups");
    return;
  }

  const { data: ballot, error } = await supabase
    .from("ballots")
    .insert({
      activity_name: data.title,
      sport: data.sport,
      location: data.venue,
      ballot_deadline: data.date,
      slots: data.slots,
      created_by: profile.user_id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Ballot creation error:", error);
    await clearState(supabase, chatId);
    await sendMessage(chatId, "❌ Failed to create ballot. " + error.message, getPersistentMenu());
    return;
  }

  await clearState(supabase, chatId);

  let msg = `✅ <b>Ballot Group Created!</b>\n\n`;
  msg += `🎲 ${data.title}\n`;
  msg += `📍 ${data.venue}\n`;
  msg += `📅 Deadline: ${formatDate(data.date)}\n`;
  msg += `⚽ ${data.sport}\n`;
  msg += `👥 ${data.slots} slots\n\n`;
  msg += `🆔 Ballot ID: <code>${ballot.id}</code>\n`;
  msg += `Share this ID so others can join!`;

  await sendMessage(chatId, msg, getPersistentMenu());
}

async function handleBallotText(chatId: number, text: string, supabase: any) {
  const state = await getState(supabase, chatId);
  if (!state) return;

  if (state.flow === "ballot_create") {
    const { step, data } = state;

    switch (step) {
      case "ballot_title":
        data.title = text;
        await setState(supabase, chatId, { flow: "ballot_create", step: "ballot_sport", data });
        await sendMessage(chatId, "⚽ What sport? (type freely, e.g. Badminton, Futsal)", {
          inline_keyboard: [
            [{ text: "⬅️ Back", callback_data: "ballot_create" }],
            [{ text: "❌ Cancel", callback_data: "main_menu" }],
          ],
        });
        break;

      case "ballot_sport":
        data.sport = text;
        await setState(supabase, chatId, { flow: "ballot_create", step: "ballot_venue", data });
        await sendMessage(chatId, "📍 Location? (type freely)", {
          inline_keyboard: [
            [{ text: "⬅️ Back", callback_data: "ballot_back_sport" }],
            [{ text: "❌ Cancel", callback_data: "main_menu" }],
          ],
        });
        break;

      case "ballot_venue":
        data.venue = text;
        await setState(supabase, chatId, { flow: "ballot_create", step: "ballot_date", data });
        await sendMessage(chatId, "📅 Deadline date?\n\nAccepted: 31 Dec 2026, 31-12-2026, 2026-12-31", {
          inline_keyboard: [
            [{ text: "⬅️ Back", callback_data: "ballot_back_venue" }],
            [{ text: "❌ Cancel", callback_data: "main_menu" }],
          ],
        });
        break;

      case "ballot_date": {
        const parsed = parseDateInput(text);
        if (!parsed) {
          await sendMessage(chatId, "❌ Invalid date. Use: 31 Dec 2026, 31-12-2026, or 2026-12-31");
          return;
        }
        data.date = parsed;
        await setState(supabase, chatId, { flow: "ballot_create", step: "ballot_slots", data });
        await sendMessage(chatId, "👥 How many slots?", {
          inline_keyboard: [
            [{ text: "⬅️ Back", callback_data: "ballot_back_date" }],
            [{ text: "❌ Cancel", callback_data: "main_menu" }],
          ],
        });
        break;
      }

      case "ballot_slots": {
        const slots = parseInt(text);
        if (isNaN(slots) || slots < 1) {
          await sendMessage(chatId, "❌ Please enter a valid number.");
          return;
        }
        data.slots = slots;
        await setState(supabase, chatId, { flow: "ballot_create", step: "ballot_confirm", data });
        let msg = "📋 <b>Ballot Group Summary</b>\n\n";
        msg += `📝 ${data.title}\n⚽ ${data.sport}\n📍 ${data.venue}\n📅 ${formatDate(data.date)}\n👥 ${slots} slots\n\n<b>Confirm?</b>`;
        await sendMessage(chatId, msg, {
          inline_keyboard: [
            [{ text: "✅ Confirm", callback_data: "ballot_confirm_create" }],
            [{ text: "✏️ Edit", callback_data: "ballot_create" }],
            [{ text: "❌ Cancel", callback_data: "main_menu" }],
          ],
        });
        break;
      }

      default:
        break;
    }
    return;
  }

  // Paste ballot link flow
  if (state.flow === "ballot_paste" && state.step === "awaiting_link") {
    let ballotId = text.trim();
    // Try to extract UUID from link
    const urlMatch = text.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (urlMatch) ballotId = urlMatch[1];

    const { data: ballot } = await supabase
      .from("ballots")
      .select("id, activity_name, location, ballot_deadline, sport, slots, created_by")
      .eq("id", ballotId)
      .single();

    await clearState(supabase, chatId);

    if (!ballot) {
      await sendMessage(chatId, "❌ Could not find that ballot. Check the ID and try again.", {
        inline_keyboard: [[{ text: "⬅️ Back", callback_data: "ballot_manage" }]],
      });
      return;
    }

    const profile = await getLinkedProfile(supabase, chatId);
    if (profile && ballot.created_by === profile.user_id) {
      await handleBallotCallback(chatId, `ballot_manage_view_${ballot.id}`, supabase);
    } else {
      await handleBallotCallback(chatId, `ballot_view_${ballot.id}`, supabase);
    }
    return;
  }
}

async function handleBallotSportCallback(chatId: number, cbData: string, supabase: any) {
  const state = await getState(supabase, chatId);
  if (!state) return;

  if (cbData === "ballot_back_sport") {
    state.step = "ballot_title";
    await setState(supabase, chatId, state);
    await sendMessage(chatId, "📝 What's the activity name?", {
      inline_keyboard: [[{ text: "❌ Cancel", callback_data: "main_menu" }]],
    });
    return;
  }
  if (cbData === "ballot_back_venue") {
    state.step = "ballot_sport";
    await setState(supabase, chatId, state);
    await sendMessage(chatId, "⚽ What sport?", {
      inline_keyboard: [[{ text: "⬅️ Back", callback_data: "ballot_create" }], [{ text: "❌ Cancel", callback_data: "main_menu" }]],
    });
    return;
  }
  if (cbData === "ballot_back_date") {
    state.step = "ballot_venue";
    await setState(supabase, chatId, state);
    await sendMessage(chatId, "📍 Location?", {
      inline_keyboard: [[{ text: "⬅️ Back", callback_data: "ballot_back_sport" }], [{ text: "❌ Cancel", callback_data: "main_menu" }]],
    });
    return;
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
      .eq("status", "active")
      .order("date", { ascending: true })
      .limit(8);

    // Also fetch ballots
    const { data: ballots } = await supabase
      .from("ballots")
      .select("id, activity_name, sport, location, ballot_deadline")
      .order("ballot_deadline", { ascending: true })
      .limit(5);

    const buttons: any[] = [];
    let msg = "🔍 <b>Available Activities</b>\n\n";

    if (activities && activities.length > 0) {
      for (const a of activities) {
        msg += `🏟️ <b>${a.title}</b>\n📍 ${a.venue} | 📅 ${formatDate(a.date)}\n⚽ ${a.sport}\n\n`;
        buttons.push([{ text: `🏟️ ${a.title}`, callback_data: `join_${a.id}` }]);
      }
    }

    if (ballots && ballots.length > 0) {
      msg += "<b>Open Ballots:</b>\n\n";
      for (const b of ballots) {
        msg += `🎲 <b>${b.activity_name}</b>\n📍 ${b.location} | 📅 ${formatDate(b.ballot_deadline)}\n\n`;
        buttons.push([{ text: `🎲 ${b.activity_name}`, callback_data: `ballot_view_${b.id}` }]);
      }
    }

    if (buttons.length === 0) {
      msg = "No activities available right now.";
    }

    buttons.push([{ text: "⬅️ Back", callback_data: "my_bookee" }]);
    await sendMessage(chatId, msg, { inline_keyboard: buttons });
    return;
  }

  if (cbData === "my_reservations") {
    const profile = await getLinkedProfile(supabase, chatId);
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

  if (cbData === "my_ballot_status") {
    const profile = await getLinkedProfile(supabase, chatId);

    let myParticipations: any[] = [];
    if (profile) {
      const { data } = await supabase
        .from("ballot_participants")
        .select("id, ballot_id, status")
        .eq("user_id", profile.user_id);
      myParticipations = data || [];
    } else {
      const { data } = await supabase
        .from("ballot_participants")
        .select("id, ballot_id, status")
        .eq("telegram_username", `tg_${chatId}`);
      myParticipations = data || [];
    }

    if (myParticipations.length === 0) {
      await sendMessage(chatId, "No ballot entries found.", {
        inline_keyboard: [
          [{ text: "🔍 Explore", callback_data: "explore" }],
          [{ text: "⬅️ Back", callback_data: "my_bookee" }],
        ],
      });
      return;
    }

    const ballotIds = [...new Set(myParticipations.map((p: any) => p.ballot_id))];
    const { data: ballots } = await supabase
      .from("ballots")
      .select("id, activity_name, ballot_deadline")
      .in("id", ballotIds);

    let msg = "🎲 <b>My Ballot Status</b>\n\n";
    const buttons: any[] = [];

    if (ballots && ballots.length > 0) {
      for (const b of ballots) {
        const part = myParticipations.find((p: any) => p.ballot_id === b.id);
        const status = part?.status === "selected" ? "✅" : part?.status === "rejected" ? "❌" : "⏳";
        msg += `${status} ${b.activity_name} — ${formatDate(b.ballot_deadline)}\n`;
        buttons.push([{ text: `🎲 ${b.activity_name}`, callback_data: `ballot_view_${b.id}` }]);
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
      await sendMessage(chatId, "❌ Cancel failed: " + error.message, getPersistentMenu());
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

  // Join activity (non-ballot)
  if (cbData.startsWith("join_")) {
    const activityId = cbData.replace("join_", "");
    const { data: activity } = await supabase
      .from("activities")
      .select("title, venue, date, sport")
      .eq("id", activityId)
      .single();

    if (!activity) {
      await sendMessage(chatId, "Activity not found.", getPersistentMenu());
      return;
    }

    const { data: sessions } = await supabase
      .from("activity_sessions")
      .select("id, time_label, price, max_slots, filled_slots")
      .eq("activity_id", activityId);

    let msg = `🏟️ <b>${activity.title}</b>\n📍 ${activity.venue}\n📅 ${formatDate(activity.date)}\n⚽ ${activity.sport}\n\n`;
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

  // Book a session
  if (cbData.startsWith("book_session_")) {
    const sessionId = cbData.replace("book_session_", "");
    const profile = await getLinkedProfile(supabase, chatId);

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
      await sendMessage(chatId, "❌ Booking failed: " + error.message, getPersistentMenu());
      return;
    }

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
    "• <b>Ballot</b> — Create or join ballot groups\n" +
    "• <b>Logout</b> — Disconnect your Telegram account\n\n" +
    "🔗 <b>Account Linking:</b>\n" +
    "Guest users can join activities and ballots. Link your email account for full access.\n\n" +
    "⏰ Reservations expire after 3 hours if not confirmed.\n\n" +
    `🌐 Web app: ${SITE_URL}\n` +
    "📧 Support: yjqbenjaminbusiness@gmail.com",
    { inline_keyboard: [[{ text: "⬅️ Back", callback_data: "main_menu" }]] }
  );
}

// ─── LOGOUT ─────────────────────────────────────────────────────────

async function handleLogout(chatId: number, supabase: any) {
  const profile = await getLinkedProfile(supabase, chatId);
  if (!profile) {
    await sendMessage(chatId, "You're not linked to any account.", getPersistentMenu());
    return;
  }

  await supabase
    .from("profiles")
    .update({ telegram_chat_id: null })
    .eq("telegram_chat_id", chatId);

  await clearState(supabase, chatId);
  await sendMessage(
    chatId,
    "🚪 <b>Logged out</b>\n\nYour Telegram is no longer linked to your Bookee account. You can still use guest mode.\n\nTo re-link, use Organize or My Bookee.",
    getPersistentMenu()
  );
}

// ─── MAIN HANDLERS ──────────────────────────────────────────────────

async function handleMessage(chatId: number, text: string, supabase: any, username?: string) {
  const state = await getState(supabase, chatId);

  // Handle persistent keyboard text buttons
  const trimmed = text.trim();
  if (trimmed === "📝 Register for Beta") {
    await handleBetaFlow(chatId, "", supabase);
    return;
  }
  if (trimmed === "📋 My Bookee") {
    await handleMyBookeeCallback(chatId, "my_bookee", supabase);
    return;
  }
  if (trimmed === "🏟️ Organize") {
    await handleCallback(chatId, "organize", supabase);
    return;
  }
  if (trimmed === "🎲 Ballot") {
    await handleCallback(chatId, "ballot", supabase);
    return;
  }
  if (trimmed === "❓ Help") {
    await handleHelp(chatId);
    return;
  }
  if (trimmed === "🚪 Logout") {
    await handleLogout(chatId, supabase);
    return;
  }

  // Handle conversation state
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

  // /start commands
  if (text === "/start" || text === "/start ") {
    await sendMessage(
      chatId,
      "🏃 <b>Welcome to Bookee!</b>\n\nFind, book, and organize sports activities.\n\nUse the menu below or choose an option:",
      getPersistentMenu()
    );
    return;
  }

  if (text.startsWith("/start linked")) {
    const profile = await getLinkedProfile(supabase, chatId);
    if (profile) {
      await sendMessage(
        chatId,
        `✅ <b>Account linked!</b>\n\nWelcome, ${profile.display_name || profile.email}! Your Telegram is now connected to your Bookee account.`,
        getPersistentMenu()
      );
    } else {
      await sendMessage(
        chatId,
        "⚠️ Account linking not complete. Please try logging in again.",
        getPersistentMenu()
      );
    }
    return;
  }

  // Any unrecognized text → show persistent menu
  await sendMessage(chatId, "Use the menu below to get started:", getPersistentMenu());
}

async function handleCallback(chatId: number, data: string, supabase: any) {
  if (data === "main_menu") {
    await clearState(supabase, chatId);
    await sendMessage(
      chatId,
      "🏃 <b>Bookee</b>\n\nWhat would you like to do?",
      getPersistentMenu()
    );
    return;
  }

  if (data.startsWith("beta_")) {
    await handleBetaCallback(chatId, data, supabase);
    return;
  }

  if (data === "organize" || data.startsWith("org_") || data.startsWith("manage_")) {
    await handleOrganizeCallback(chatId, data, supabase);
    return;
  }

  if (data === "ballot" || data.startsWith("ballot_")) {
    // Check for back navigation callbacks first
    if (data === "ballot_back_sport" || data === "ballot_back_venue" || data === "ballot_back_date") {
      await handleBallotSportCallback(chatId, data, supabase);
      return;
    }
    await handleBallotCallback(chatId, data, supabase);
    return;
  }

  if (data === "my_bookee" || data === "explore" || data === "my_reservations" || data === "my_ballot_status" || data.startsWith("cancel_booking_") || data.startsWith("join_") || data.startsWith("book_session_")) {
    await handleMyBookeeCallback(chatId, data, supabase);
    return;
  }

  if (data === "help") {
    await handleHelp(chatId);
    return;
  }
}

// ─── HTTP ENTRY POINT ───────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let totalProcessed = 0;

  const { data: botState, error: stateErr } = await supabase
    .from("telegram_bot_state")
    .select("update_offset")
    .eq("id", 1)
    .single();

  if (stateErr) {
    return new Response(JSON.stringify({ error: stateErr.message }), { status: 500, headers: corsHeaders });
  }

  let currentOffset = botState.update_offset;

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

    const apiData = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: apiData }), { status: 502, headers: corsHeaders });
    }

    const updates = apiData.result ?? [];
    if (updates.length === 0) continue;

    for (const update of updates) {
      try {
        if (update.callback_query) {
          const cb = update.callback_query;
          const chatId = cb.message?.chat?.id;
          const data = cb.data;
          if (chatId && data) {
            await answerCallback(cb.id);
            await handleCallback(chatId, data, supabase);
          }
        } else if (update.message) {
          const msg = update.message;
          const chatId = msg.chat?.id;
          const text = msg.text || "";
          const username = msg.from?.username;
          if (chatId && text) {
            await handleMessage(chatId, text, supabase, username);
          }
        }
      } catch (err) {
        console.error("Error processing update:", err);
      }
    }

    // Store messages
    const rows = updates
      .filter((u: any) => u.message)
      .map((u: any) => ({
        update_id: u.update_id,
        chat_id: u.message.chat.id,
        text: u.message.text ?? null,
        raw_update: u,
      }));

    if (rows.length > 0) {
      await supabase
        .from("telegram_messages")
        .upsert(rows, { onConflict: "update_id" });
    }

    totalProcessed += updates.length;

    const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
    await supabase
      .from("telegram_bot_state")
      .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
      .eq("id", 1);

    currentOffset = newOffset;
  }

  return new Response(
    JSON.stringify({ ok: true, processed: totalProcessed, finalOffset: currentOffset }),
    { headers: corsHeaders }
  );
});
