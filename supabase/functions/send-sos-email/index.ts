const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Contact = {
  name: string;
  email: string;
  phone?: string | null;
  relationship?: string | null;
};

type Coords = {
  lat: number;
  lng: number;
  url: string;
};

type RequestBody = {
  message?: string;
  coords?: Coords | null;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("ALERT_FROM_EMAIL") ?? "Suraksha SOS <onboarding@resend.dev>";

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Supabase function secrets are missing." }, 500);
    }

    if (!resendApiKey) {
      return json({ error: "RESEND_API_KEY is missing. Add it in Supabase Edge Function secrets." }, 500);
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return json({ error: "Not authenticated." }, 401);
    }

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: authorization,
        apikey: serviceRoleKey,
      },
    });

    if (!userResponse.ok) {
      return json({ error: "Invalid or expired session." }, 401);
    }

    const user = await userResponse.json();
    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const message = body.message?.trim() || "I am in danger. Please help me.";
    const coords = body.coords ?? null;
    const locationUrl = coords?.url ?? null;

    const contactsResponse = await fetch(
      `${supabaseUrl}/rest/v1/emergency_contacts?user_id=eq.${user.id}&select=name,email,phone,relationship`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      },
    );

    if (!contactsResponse.ok) {
      return json({ error: "Could not load emergency contacts." }, 500);
    }

    const contacts = (await contactsResponse.json()) as Contact[];
    const recipients = contacts.map((contact) => contact.email).filter(Boolean);

    if (recipients.length === 0) {
      return json({ error: "Add at least one emergency contact first." }, 400);
    }

    const sentAt = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const subject = `SOS Alert from ${user.email ?? "Suraksha user"}`;
    const locationText = locationUrl ? `Location: ${locationUrl}` : "Location: Not available";
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="color: #dc2626;">SOS Emergency Alert</h2>
        <p><strong>Message:</strong> ${escapeHtml(message)}</p>
        <p><strong>User email:</strong> ${escapeHtml(user.email ?? "Unknown")}</p>
        <p><strong>Time:</strong> ${escapeHtml(sentAt)}</p>
        ${
          locationUrl
            ? `<p><strong>Live location:</strong> <a href="${escapeAttribute(locationUrl)}">${escapeHtml(locationUrl)}</a></p>`
            : "<p><strong>Live location:</strong> Not available</p>"
        }
        ${
          coords
            ? `<p><strong>Coordinates:</strong> ${coords.lat}, ${coords.lng}</p>`
            : ""
        }
        <p>Please contact this person immediately and take necessary action.</p>
      </div>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients,
        subject,
        html,
        text: [
          "SOS Emergency Alert",
          `Message: ${message}`,
          `User email: ${user.email ?? "Unknown"}`,
          `Time: ${sentAt}`,
          locationText,
          coords ? `Coordinates: ${coords.lat}, ${coords.lng}` : "",
          "Please contact this person immediately and take necessary action.",
        ].filter(Boolean).join("\n"),
      }),
    });

    const emailResult = await emailResponse.json().catch(() => ({}));
    const status = emailResponse.ok ? "sent" : "failed";

    await fetch(`${supabaseUrl}/rest/v1/alerts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: user.id,
        message,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        location_url: locationUrl,
        recipients,
        status,
      }),
    });

    if (!emailResponse.ok) {
      const resendMessage = emailResult?.message ?? "Email provider failed to send the alert.";
      return json({ error: resendMessage }, 502);
    }

    return json({ count: recipients.length, recipients });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected email alert error.";
    console.error(error);
    return json({ error: message }, 500);
  }
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
