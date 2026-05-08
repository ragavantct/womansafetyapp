import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shield, Mail, Bell, Moon, User, Phone, Save } from "lucide-react";
import { RequireAuth } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: () => <RequireAuth><Settings /></RequireAuth> });

function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>({
    full_name: "",
    phone: "",
    auto_email: true,
    alarm_sound: true,
    dark_mode: false,
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data);
        document.documentElement.classList.toggle("dark", Boolean(data.dark_mode));
      }
      setLoading(false);
    });
  }, [user]);

  const updateProfile = (next: any) => {
    setProfile(next);
    if ("dark_mode" in next) {
      document.documentElement.classList.toggle("dark", Boolean(next.dark_mode));
    }
  };

  const onSave = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      ...profile,
      updated_at: new Date().toISOString()
    }).eq("id", user.id);

    if (error) toast.error(error.message); else {
      document.documentElement.classList.toggle("dark", Boolean(profile.dark_mode));
      toast.success("Settings updated");
    }
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading settings…</div>;

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display">Preferences</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and emergency trigger behaviors.</p>
      </div>

      <div className="grid gap-8">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Profile Information</h2>
          <div className="p-6 rounded-2xl border bg-card space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input value={profile.full_name} onChange={e => updateProfile({ ...profile, full_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card focus:outline-none focus:ring-2 focus:ring-emergency/40 transition" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input value={profile.phone} onChange={e => updateProfile({ ...profile, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card focus:outline-none focus:ring-2 focus:ring-emergency/40 transition" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-dashed">
              <Shield className="size-5 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Registered email: <span className="font-semibold text-foreground">{user?.email}</span></div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Safety Behaviors</h2>
          <div className="p-2 rounded-2xl border bg-card divide-y">
            <Toggle icon={Mail} title="Automatic Email Alerts" desc="Send SOS messages to contacts immediately"
              value={profile.auto_email} onChange={v => updateProfile({ ...profile, auto_email: v })} />
            <Toggle icon={Bell} title="Audible Emergency Siren" desc="Play loud alarm sound when SOS is triggered"
              value={profile.alarm_sound} onChange={v => updateProfile({ ...profile, alarm_sound: v })} />
            <Toggle icon={Moon} title="Dark Mode Interface" desc="Use darker color scheme for the application"
              value={profile.dark_mode} onChange={v => updateProfile({ ...profile, dark_mode: v })} />
          </div>
        </section>

        <div className="flex justify-end">
          <button onClick={onSave}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg">
            <Save className="size-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToggleProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ icon: Icon, title, desc, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 px-6">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-xl bg-muted grid place-items-center"><Icon className="size-5 text-muted-foreground" /></div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <button onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full relative transition-colors ${value ? "bg-emergency" : "bg-muted"}`}>
        <div className={`absolute top-1 size-4 rounded-full bg-white transition-all ${value ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
}
