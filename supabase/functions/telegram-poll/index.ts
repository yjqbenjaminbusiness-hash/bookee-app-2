import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY")!;

  const body: any = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;

  await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function getMainMenu() {
  return {
    inline_keyboard: [
      [{ text: "🔍 Explore Activities", callback_data: "explore" }],
      [{ text: "📋 My Bookee", callback_data: "my_bookee" }],
      [{ text: "🏟️ Organize", callback_data: "organize" }],
      [{ text: "❓ Help", callback_data: "help" }],
    ],
  };
}

async function handleMessage(chatId: number, text: string, supabase: any) {
  if (text === "/start") {
    await sendMessage(
      chatId,
      "🏃 <b>Welcome to Bookee!</b>\n\nFind and book sports activities near you.\n\nWhat would you like to do?",
      getMainMenu()
    );
    return;
  }
  // Default: show menu
  await sendMessage(chatId, "Choose an option:", getMainMenu());
}

async function handleCallback(chatId: number, data: string, supabase: any) {
  switch (data) {
    case "explore": {
      const { data: activities } = await supabase
        .from("activities")
        .select("id, title, sport, venue, date, status")
        .eq("status", "published")
        .order("date", { ascending: true })
        .limit(5);

      if (!activities || activities.length === 0) {
        await sendMessage(chatId, "No activities available right now. Check back soon!", getMainMenu());
        return;
      }

      let msg = "🔍 <b>Available Activities</b>\n\n";
      const buttons: any[] = [];
      for (const a of activities) {
        msg += `🏟️ <b>${a.title}</b>\n📍 ${a.venue} | 📅 ${a.date}\n⚽ ${a.sport}\n\n`;
        buttons.push([{ text: `Join: ${a.title}`, callback_data: `join_${a.id}` }]);
      }
      buttons.push([{ text: "⬅️ Back", callback_data: "main_menu" }]);
      await sendMessage(chatId, msg, { inline_keyboard: buttons });
      break;
    }
    case "my_bookee": {
      // Check if user has a linked profile via telegram_chat_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, user_id")
        .eq("telegram_chat_id", chatId)
        .single();

      if (!profile) {
        await sendMessage(
          chatId,
          "You haven't linked your Bookee account yet.\n\nVisit the app to link your Telegram in Settings.",
          { inline_keyboard: [[{ text: "⬅️ Back", callback_data: "main_menu" }]] }
        );
        return;
      }

      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, player_name, payment_status, reservation_status, session_id")
        .eq("user_id", profile.user_id)
        .order("created_at", { ascending: false })
        .limit(5);

      let msg = `📋 <b>My Bookee</b>\nHi ${profile.display_name}!\n\n`;
      if (!bookings || bookings.length === 0) {
        msg += "No bookings yet. Explore activities to get started!";
      } else {
        for (const b of bookings) {
          const status = b.reservation_status === "confirmed" ? "✅" : "⏳";
          const payment = b.payment_status === "paid" ? "💰 Paid" : "💳 Pending";
          msg += `${status} ${b.player_name} — ${payment}\n`;
        }
      }
      await sendMessage(chatId, msg, {
        inline_keyboard: [
          [{ text: "🔍 Explore Activities", callback_data: "explore" }],
          [{ text: "⬅️ Back", callback_data: "main_menu" }],
        ],
      });
      break;
    }
    case "organize": {
      await sendMessage(
        chatId,
        "🏟️ <b>Organize Activities</b>\n\nVisit the Bookee web app to create and manage your activities.\n\nOrganizer subscription: SGD $3.99/month (first month free!)",
        { inline_keyboard: [[{ text: "⬅️ Back", callback_data: "main_menu" }]] }
      );
      break;
    }
    case "help": {
      await sendMessage(
        chatId,
        "❓ <b>Help</b>\n\n• /start — Show main menu\n• Explore — Browse available activities\n• My Bookee — View your bookings\n• Organize — Host your own activities\n\nNeed support? Email support@bookee.app",
        { inline_keyboard: [[{ text: "⬅️ Back", callback_data: "main_menu" }]] }
      );
      break;
    }
    case "main_menu": {
      await sendMessage(chatId, "What would you like to do?", getMainMenu());
      break;
    }
    default: {
      // Handle join_<activity_id>
      if (data.startsWith("join_")) {
        const activityId = data.replace("join_", "");
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
          msg += "<b>Available Sessions:</b>\n\n";
          for (const s of sessions) {
            const available = s.max_slots - s.filled_slots;
            msg += `⏰ ${s.time_label} — SGD $${(s.price / 100).toFixed(2)} (${available} slots left)\n`;
            if (available > 0) {
              buttons.push([{ text: `Book: ${s.time_label} — $${(s.price / 100).toFixed(2)}`, callback_data: `book_${s.id}` }]);
            }
          }
        }

        buttons.push([{ text: "⬅️ Back to Activities", callback_data: "explore" }]);
        await sendMessage(chatId, msg, { inline_keyboard: buttons });
        return;
      }

      // Handle book_<session_id> — trigger payment
      if (data.startsWith("book_")) {
        const sessionId = data.replace("book_", "");
        const { data: session } = await supabase
          .from("activity_sessions")
          .select("id, time_label, price, activity_id")
          .eq("id", sessionId)
          .single();

        if (!session) {
          await sendMessage(chatId, "Session not found.", getMainMenu());
          return;
        }

        const { data: activity } = await supabase
          .from("activities")
          .select("title, organizer_id")
          .eq("id", session.activity_id)
          .single();

        const { data: orgProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", activity?.organizer_id)
          .single();

        const price = (session.price / 100).toFixed(2);
        const platformFee = (session.price * 0.02 / 100).toFixed(2);
        const total = ((session.price + session.price * 0.02) / 100).toFixed(2);

        await sendMessage(
          chatId,
          `💳 <b>Payment Required</b>\n\n` +
          `Activity: <b>${activity?.title || "Activity"}</b>\n` +
          `Session: ${session.time_label}\n` +
          `Organizer: ${orgProfile?.display_name || "Organizer"}\n\n` +
          `Amount: SGD $${price}\n` +
          `Platform fee: SGD $${platformFee}\n` +
          `<b>Total: SGD $${total}</b>\n\n` +
          `Choose your payment method:`,
          {
            inline_keyboard: [
              [{ text: "📱 PayNow (Recommended)", callback_data: `paynow_${sessionId}` }],
              [{ text: "💳 Other Payment Methods", callback_data: `card_${sessionId}` }],
              [{ text: "⬅️ Back", callback_data: `join_${session.activity_id}` }],
            ],
          }
        );
        return;
      }

      // PayNow flow
      if (data.startsWith("paynow_")) {
        await sendMessage(
          chatId,
          "📱 <b>PayNow Payment</b>\n\n" +
          "Scan the QR code using your banking app to pay.\n\n" +
          "🔒 Payments are processed via a MAS-regulated payment provider.\n\n" +
          "<i>Open the Bookee app to view the PayNow QR code and complete payment.</i>",
          {
            inline_keyboard: [
              [{ text: "✅ I Have Paid", callback_data: `paid_check_${data.replace("paynow_", "")}` }],
              [{ text: "⬅️ Back", callback_data: "main_menu" }],
            ],
          }
        );
        return;
      }

      // Card payment redirect
      if (data.startsWith("card_")) {
        await sendMessage(
          chatId,
          "💳 <b>Card Payment</b>\n\nPlease complete your payment through the Bookee web app.\n\n<i>Note: Card payments may incur higher processing fees.</i>",
          {
            inline_keyboard: [
              [{ text: "⬅️ Back", callback_data: "main_menu" }],
            ],
          }
        );
        return;
      }

      // Payment confirmation check
      if (data.startsWith("paid_check_")) {
        await sendMessage(
          chatId,
          "⏳ <b>Waiting for payment confirmation...</b>\n\nWe're checking your payment status. This may take a moment.",
          {
            inline_keyboard: [
              [{ text: "🔄 Check Again", callback_data: data }],
              [{ text: "⬅️ Back to Menu", callback_data: "main_menu" }],
            ],
          }
        );
        return;
      }

      await sendMessage(chatId, "Choose an option:", getMainMenu());
    }
  }
}

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
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offset: currentOffset,
        timeout,
        allowed_updates: ["message", "callback_query"],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data }), { status: 502 });
    }

    const updates = data.result ?? [];
    if (updates.length === 0) continue;

    // Process each update
    for (const update of updates) {
      try {
        if (update.message) {
          const chatId = update.message.chat.id;
          const text = update.message.text || "";
          await handleMessage(chatId, text, supabase);

          // Store message
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

          // Answer callback to remove loading state
          await fetch(`${GATEWAY_URL}/answerCallbackQuery`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": TELEGRAM_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ callback_query_id: update.callback_query.id }),
          });
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
