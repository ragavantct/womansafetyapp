import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Mail, MapPin, Send, History, CheckCircle, ShieldAlert } from "lucide-react";
import { RequireAuth } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getLocation, sendEmailAlert } from "@/lib/sos";
import { toast } from "sonner";

export const Route = createFileRoute("/alert")({ component: () => <RequireAuth><AlertPage /></RequireAuth> });

function AlertPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("emergency_contacts").select("*").eq("user_id", user.id).then(({ data }) => {
      setContacts(data ?? []);
    });
  }, [user]);

  const onSend = async () => {
    if (contacts.length === 0) return toast.error("Add at least one emergency contact first");
    setLoading(true);
    try {
      const coords = await getLocation();
      const result = await sendEmailAlert({ message: "SOS Alert: I need assistance immediately.", coords });
      toast.success(`Alert email sent to ${result.count} contact${result.count > 1 ? "s" : ""}`);
    } catch (e: any) {
      toast.error(e.message === "User denied Geolocation" ? "Please allow location permission and try again" : e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-fade-in overflow-x-hidden">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Email Alert</h1>
        <p className="text-sm text-muted-foreground mt-1">Directly notify your trusted contacts without sounding the siren.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 sm:p-8 rounded-3xl border bg-card relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Mail className="size-32" /></div>
            <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2"><ShieldAlert className="size-5 shrink-0 text-emergency" /> Emergency Message</h2>
            <div className="p-4 rounded-xl bg-muted/50 font-medium text-foreground border border-dashed mb-6 italic">
              "I am in danger. Please help me. Here is my live location: [Map Link]"
            </div>
            <button onClick={onSend} disabled={loading || contacts.length === 0}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-emergency text-emergency-foreground font-bold text-base sm:text-lg hover:opacity-90 transition-all shadow-xl disabled:opacity-50">
              {loading ? "Sending…" : <><Send className="size-5" /> Send SOS Email Now</>}
            </button>
            {contacts.length === 0 && (
              <p className="mt-4 text-center text-sm text-destructive font-medium">You need to add emergency contacts to use this feature.</p>
            )}
          </div>

          <div className="p-5 sm:p-6 rounded-2xl border bg-card">
            <h3 className="font-bold mb-4 flex items-center gap-2"><MapPin className="size-4 text-emergency" /> Included in the email:</h3>
            <ul className="space-y-3">
              {[
                "Your exact GPS coordinates",
                "Google Maps navigation link",
                "Personalized emergency message",
                "Timestamp of the alert"
              ].map(t => (
                <li key={t} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle className="size-4 shrink-0 text-safe" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl border bg-card">
            <h3 className="font-bold mb-4 flex items-center gap-2"><History className="size-4 text-emergency" /> Recent Recipients</h3>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts found.</p>
            ) : (
              <div className="space-y-3">
                {contacts.map(c => (
                  <div key={c.email} className="min-w-0 flex items-center gap-3">
                    <div className="size-8 shrink-0 rounded-full bg-secondary grid place-items-center text-xs font-bold text-emergency">{c.name[0]}</div>
                    <div className="min-w-0 text-sm truncate">{c.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
