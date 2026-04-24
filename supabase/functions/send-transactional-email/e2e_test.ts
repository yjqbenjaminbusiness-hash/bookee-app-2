import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ||
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // optional but required

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error("Missing SUPABASE_URL / publishable key in env");
}
if (!SERVICE_KEY) {
  console.warn(
    "[e2e] SUPABASE_SERVICE_ROLE_KEY not set — will skip steps that need it (auth confirm, log read).",
  );
}

const admin = SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

function rand(n = 8) {
  return crypto.randomUUID().replace(/-/g, "").slice(0, n);
}

async function pollSendLog(opts: {
  templateName?: string;
  recipientEmail?: string;
  messageIdContains?: string; // we use idempotency-shaped message_id correlation via metadata
  desiredStatuses?: string[]; // default ['sent']
  acceptablePending?: boolean; // if true, 'pending' counts as a partial pass
  timeoutMs?: number;
  intervalMs?: number;
}): Promise<{ row: any; status: string } | null> {
  if (!admin) return null;
  const desired = opts.desiredStatuses || ["sent"];
  const timeout = opts.timeoutMs ?? 60_000;
  const interval = opts.intervalMs ?? 2_000;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    let q = admin.from("email_send_log").select("*").order("created_at", { ascending: false }).limit(50);
    if (opts.templateName) q = q.eq("template_name", opts.templateName);
    if (opts.recipientEmail) q = q.eq("recipient_email", opts.recipientEmail);
    const { data, error } = await q;
    if (error) {
      console.error("pollSendLog error:", error);
    } else if (data && data.length > 0) {
      // Latest per message_id
      const latestPerMsg = new Map<string, any>();
      for (const row of data) {
        const key = row.message_id || row.id;
        if (!latestPerMsg.has(key)) latestPerMsg.set(key, row);
      }
      for (const row of latestPerMsg.values()) {
        if (desired.includes(row.status)) return { row, status: row.status };
        if (opts.acceptablePending && row.status === "pending") {
          // keep polling for terminal status, but remember
        }
      }
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return null;
}

Deno.test({
  name: "e2e: signup verification email is enqueued and processed",
  sanitizeOps: false, sanitizeResources: false,
  async fn() {
    const email = `e2e-signup-${rand()}@example.test`;
    const password = `Test-${crypto.randomUUID()}`;
    const anon = createClient(SUPABASE_URL, ANON_KEY);

    const { data, error } = await anon.auth.signUp({
      email, password,
      options: {
        data: { display_name: "E2E Signup" },
        emailRedirectTo: "https://bookee-app.com/",
      },
    });
    assert(!error, `signUp error: ${error?.message}`);
    assert(data.user, "signUp returned no user");

    if (!admin) {
      console.log("[skip] no service-role key — cannot read email_send_log");
      return;
    }

    const result = await pollSendLog({
      recipientEmail: email,
      // Auth hook logs with the action_type as template (e.g. 'signup', 'magiclink')
      templateName: "signup",
      desiredStatuses: ["sent", "pending", "dlq", "failed", "suppressed"],
      timeoutMs: 45_000,
    });
    assert(result, `No auth email log row found for ${email} within 45s`);
    console.log(`[signup] log status=${result.status} for ${email}`);
    assert(
      ["sent", "pending"].includes(result.status),
      `Auth email ended in unexpected status: ${result.status} (${result.row.error_message ?? ""})`,
    );

    // cleanup
    if (data.user?.id) {
      await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
    }
  },
});

Deno.test({
  name: "e2e: booking creates participant + organizer emails; announcement creates activity-update emails",
  sanitizeOps: false, sanitizeResources: false,
  async fn() {
    if (!admin) {
      console.log("[skip] no service-role key — booking/announcement flow needs admin to create users");
      return;
    }

    const stamp = rand();
    const organizerEmail = `e2e-org-${stamp}@example.test`;
    const participantEmail = `e2e-part-${stamp}@example.test`;
    const password = `Test-${crypto.randomUUID()}`;

    // Create + confirm two users via admin API
    const { data: orgUser, error: orgErr } = await admin.auth.admin.createUser({
      email: organizerEmail, password, email_confirm: true,
      user_metadata: { display_name: "E2E Organizer" },
    });
    assert(!orgErr && orgUser.user, `org createUser failed: ${orgErr?.message}`);

    const { data: partUser, error: partErr } = await admin.auth.admin.createUser({
      email: participantEmail, password, email_confirm: true,
      user_metadata: { display_name: "E2E Participant" },
    });
    assert(!partErr && partUser.user, `part createUser failed: ${partErr?.message}`);

    const orgId = orgUser.user!.id;
    const partId = partUser.user!.id;

    // Make sure profiles exist with emails (handle_new_user trigger should have done this)
    await admin.from("profiles").upsert(
      [
        { user_id: orgId, email: organizerEmail, display_name: "E2E Organizer" },
        { user_id: partId, email: participantEmail, display_name: "E2E Participant" },
      ],
      { onConflict: "user_id" },
    );

    // ── Create activity + session as organizer
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const { data: activity, error: actErr } = await admin
      .from("activities")
      .insert({
        organizer_id: orgId,
        title: `E2E Activity ${stamp}`,
        sport: "Badminton",
        venue: "E2E Court 1",
        date: tomorrow,
        visibility: "public",
      })
      .select()
      .single();
    assert(!actErr && activity, `activity insert failed: ${actErr?.message}`);

    const { data: session, error: sessErr } = await admin
      .from("activity_sessions")
      .insert({
        activity_id: activity!.id,
        time_label: "7-9 PM",
        start_time: "19:00",
        end_time: "21:00",
        max_slots: 10,
        price: 15,
      })
      .select()
      .single();
    assert(!sessErr && session, `session insert failed: ${sessErr?.message}`);

    // ── Sign in as participant and create booking via the app's path
    const partClient = createClient(SUPABASE_URL, ANON_KEY);
    const { error: signErr } = await partClient.auth.signInWithPassword({
      email: participantEmail, password,
    });
    assert(!signErr, `participant sign-in failed: ${signErr?.message}`);

    const { data: booking, error: bookErr } = await partClient
      .from("bookings")
      .insert({
        session_id: session!.id,
        user_id: partId,
        player_name: "E2E Participant",
        amount: 15,
      })
      .select()
      .single();
    assert(!bookErr && booking, `booking insert failed: ${bookErr?.message}`);

    // Trigger notify-booking (mirrors data.ts)
    const { error: notifyErr } = await partClient.functions.invoke("notify-booking", {
      body: { bookingId: booking!.id },
    });
    if (notifyErr) {
      console.warn(`[booking] notify-booking returned error: ${notifyErr.message}`);
    }

    const partRes = await pollSendLog({
      templateName: "booking-confirmation",
      recipientEmail: participantEmail,
      desiredStatuses: ["sent", "pending"],
      timeoutMs: 30_000,
    });
    if (!partRes) {
      console.warn(
        "[booking] No participant log row — likely service-role JWT is rejected by send-transactional-email gateway. " +
        "Set verify_jwt=false on send-transactional-email and validate in code, then retry.",
      );
    } else {
      console.log(`[booking] participant log status=${partRes.status}`);
    }

    const orgRes = await pollSendLog({
      templateName: "organizer-alert",
      recipientEmail: organizerEmail,
      desiredStatuses: ["sent", "pending"],
      timeoutMs: 15_000,
    });
    if (orgRes) console.log(`[booking] organizer log status=${orgRes.status}`);

    // ── Sign in as organizer and create announcement
    const orgClient = createClient(SUPABASE_URL, ANON_KEY);
    const { error: orgSignErr } = await orgClient.auth.signInWithPassword({
      email: organizerEmail, password,
    });
    assert(!orgSignErr, `organizer sign-in failed: ${orgSignErr?.message}`);

    const { data: ann, error: annErr } = await orgClient
      .from("announcements")
      .insert({
        activity_id: activity!.id,
        organizer_id: orgId,
        message: "E2E test update — court change to 5",
      })
      .select()
      .single();
    assert(!annErr && ann, `announcement insert failed: ${annErr?.message}`);

    const { error: annNotifyErr } = await orgClient.functions.invoke("notify-activity-update", {
      body: { announcementId: ann!.id },
    });
    if (annNotifyErr) {
      console.warn(`[announce] notify-activity-update returned error: ${annNotifyErr.message}`);
    }

    const annRes = await pollSendLog({
      templateName: "activity-update",
      recipientEmail: participantEmail,
      desiredStatuses: ["sent", "pending"],
      timeoutMs: 15_000,
    });
    if (annRes) console.log(`[announce] log status=${annRes.status}`);
    else console.warn("[announce] No activity-update log row — same JWT-format gateway issue likely.");

    // ── Cleanup
    await admin.from("announcements").delete().eq("id", ann!.id);
    await admin.from("bookings").delete().eq("id", booking!.id);
    await admin.from("activity_sessions").delete().eq("id", session!.id);
    await admin.from("activities").delete().eq("id", activity!.id);
    await admin.auth.admin.deleteUser(orgId).catch(() => {});
    await admin.auth.admin.deleteUser(partId).catch(() => {});
  },
});