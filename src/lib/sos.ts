import emailjs from "@emailjs/browser";
import { supabase } from "@/integrations/supabase/client";

export interface Coords {
  lat: number;
  lng: number;
  url: string;
}

export const getLocation = (): Promise<Coords> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        resolve({
          lat,
          lng,
          url: `https://www.google.com/maps?q=${lat},${lng}`
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
};

export const sendEmailAlert = async ({ message, coords }: { message: string; coords: Coords | null }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: contacts, error: contactsError } = await supabase
    .from("emergency_contacts")
    .select("name,email,phone,relationship")
    .eq("user_id", user.id);

  if (contactsError) throw contactsError;
  if (!contacts || contacts.length === 0) throw new Error("No emergency contacts found");

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("EmailJS environment variables are missing");
  }

  const locationUrl = coords?.url ?? "Location not available";
  const fullMessage = coords?.url
    ? `${message}\n\nLive location: ${coords.url}\nCoordinates: ${coords.lat}, ${coords.lng}`
    : `${message}\n\nLive location: Not available. Location permission may be blocked.`;
  const sentAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const recipients = contacts.map((contact: any) => contact.email).filter(Boolean);
  if (recipients.length === 0) throw new Error("Emergency contacts need valid email addresses");

  try {
    const results = await Promise.all(
      contacts.map((contact: any) =>
        emailjs.send(
          serviceId,
          templateId,
          {
            name: contact.name,
            time: sentAt,
            to_name: contact.name,
            to_email: contact.email,
            email: contact.email,
            recipient_email: contact.email,
            reply_to: user.email ?? "",
            user_email: user.email ?? "",
            from_name: "Safety Reach SOS",
            message: fullMessage,
            sos_message: message,
            live_location: locationUrl,
            map_link: locationUrl,
            location_url: locationUrl,
            latitude: coords?.lat ?? "Not available",
            longitude: coords?.lng ?? "Not available",
            sent_at: sentAt,
          },
          { publicKey },
        ),
      ),
    );

    const failed = results.find((result: any) => result.status && result.status !== 200);
    if (failed) {
      throw new Error(failed.text || "EmailJS did not accept one of the emails");
    }

    await supabase.from("alerts").insert({
      user_id: user.id,
      message: fullMessage,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      location_url: coords?.url ?? null,
      recipients,
      status: "sent",
    });

    return { count: recipients.length, recipients };
  } catch (error) {
    await supabase.from("alerts").insert({
      user_id: user.id,
      message: fullMessage,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      location_url: coords?.url ?? null,
      recipients,
      status: "failed",
    });

    const err = error as any;
    throw new Error(err?.text || err?.message || "EmailJS failed to send SOS email");
  }
};

export const playAlarm = (duration: number = 0) => {
  const audio = new Audio("https://actions.google.com/google_assistant/ambience/industrial_alarm.ogg");
  audio.loop = true;
  audio.play();
  if (duration > 0) setTimeout(() => audio.pause(), duration);
  return audio;
};
