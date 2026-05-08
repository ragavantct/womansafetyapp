import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Siren, MapPin, Mail, Users, Bell, History, ShieldCheck } from "lucide-react";
import { RequireAuth } from "@/components/app/AppShell";
import { getLocation, sendEmailAlert, playAlarm } from "@/lib/sos";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({ component: () => <RequireAuth><Dashboard /></RequireAuth> });

function Dashboard() {
  const { user } = useAuth();
  const [emergency, setEmergency] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).single().then(({ data }) => setName(data?.full_name ?? ""));
  }, [user]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { triggerSOS(); setCountdown(null); return; }
    const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const triggerSOS = async () => {
    if (sending) return;
    setSending(true);
    setEmergency(true);
    try {
      const coords = await getLocation();
      const { count } = await sendEmailAlert({ message: "I am in danger. Please help me.", coords });
      playAlarm();
      toast.success(`Alert sent to ${count} contact${count > 1 ? "s" : ""}`);
    } catch (e: any) {
      toast.error(e.message === "User denied Geolocation" ? "Please allow location permission and try SOS again" : e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-full p-5 sm:p-6 lg:p-10 max-w-6xl mx-auto animate-fade-in bg-background">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back{name ? `, ${name.split(" ")[0]}` : ""}</p>
          <h1 className="text-3xl lg:text-4xl font-bold font-display mt-1">Safety Dashboard</h1>
        </div>
        <StatusPill emergency={emergency} onReset={() => setEmergency(false)} />
      </div>

      <div
        className="rounded-3xl border p-7 sm:p-8 lg:p-12 grid place-items-center text-center"
        style={{ backgroundColor: "var(--card)", boxShadow: "var(--shadow-card)" }}
      >
        {countdown === null ? (
          <>
            <button onClick={triggerSOS} disabled={sending} aria-label="Send SOS"
              className="size-44 lg:size-56 rounded-full grid place-items-center text-white font-bold font-display text-2xl tracking-wider animate-pulse-glow hover:scale-105 active:scale-95 transition-transform disabled:opacity-70 disabled:hover:scale-100"
              style={{ background: "var(--gradient-emergency)" }}>
              <div className="flex flex-col items-center gap-2">
                <Siren className="size-12" />
                {sending ? "SENDING..." : "SOS"}
              </div>
            </button>
            <p className="mt-6 text-muted-foreground max-w-md">Tap once for emergency. Sends your live location and an email alert to your trusted contacts immediately.</p>
          </>
        ) : (
          <>
            <div className="size-44 lg:size-56 rounded-full grid place-items-center bg-emergency/10 border-4 border-emergency animate-pulse-glow">
              <div className="text-7xl font-bold font-display text-emergency">{countdown}</div>
            </div>
            <p className="mt-6 text-lg font-semibold">Sending alert in {countdown}s…</p>
            <button onClick={() => { setCountdown(null); toast("Alert cancelled"); }}
              className="mt-3 px-6 py-2.5 rounded-xl bg-secondary font-semibold hover:bg-accent">Cancel emergency</button>
          </>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <ActionCard to="/location" icon={MapPin} title="Share Location" desc="Get a live Google Maps link" />
        <ActionCard to="/alert" icon={Mail} title="Send Email Alert" desc="Notify trusted contacts" />
        <ActionCard to="/contacts" icon={Users} title="Emergency Contact" desc="Reach your circle" />
        <ActionCard onClick={() => { playAlarm(6000); toast("Alarm sounding"); }} icon={Bell} title="Emergency Alarm" desc="Loud audible siren" />
        <ActionCard to="/history" icon={History} title="View Alert History" desc="Past alerts & timeline" />
        <ActionCard to="/contacts" icon={ShieldCheck} title="Trusted Contacts" desc="Manage your circle" />
      </div>
    </div>
  );
}

function StatusPill({ emergency, onReset }: { emergency: boolean; onReset: () => void }) {
  return emergency ? (
    <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 rounded-full bg-emergency text-emergency-foreground text-sm font-semibold animate-pulse">
      <span className="size-2 rounded-full bg-white" /> Emergency Active — tap to mark safe
    </button>
  ) : (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-safe text-safe-foreground text-sm font-semibold shadow-sm">
      <span className="size-2 rounded-full bg-white" /> You are Safe
    </div>
  );
}

function ActionCard({ to, onClick, icon: Icon, title, desc }: any) {
  const cls = "group block w-full p-5 rounded-2xl border hover:border-emergency/40 hover:shadow-md transition-all text-left";
  const inner = (
    <>
      <div className="size-11 rounded-xl bg-emergency/10 grid place-items-center mb-3 group-hover:bg-emergency group-hover:text-emergency-foreground transition-colors">
        <Icon className="size-5 text-emergency group-hover:text-emergency-foreground" />
      </div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground">{desc}</div>
    </>
  );
  const style = { backgroundColor: "var(--card)" };
  return to ? <Link to={to} style={style} className={cls}>{inner}</Link> : <button onClick={onClick} style={style} className={cls}>{inner}</button>;
}
