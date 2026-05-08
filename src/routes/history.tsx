import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { History as HistoryIcon, MapPin, CheckCircle, Clock } from "lucide-react";
import { RequireAuth } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const Route = createFileRoute("/history")({ component: () => <RequireAuth><History /></RequireAuth> });

function History() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setItems(data ?? []);
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-fade-in overflow-x-hidden">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Alert History</h1>
        <p className="text-sm text-muted-foreground mt-1">Timeline of all SOS signals sent from this account.</p>
      </div>

      {loading ? <div className="text-center py-12 text-muted-foreground">Loading history…</div> : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-12 text-center">
          <div className="size-12 rounded-full bg-muted grid place-items-center mx-auto mb-4"><HistoryIcon className="size-6 text-muted-foreground" /></div>
          <h3 className="font-semibold text-lg">No alert history</h3>
          <p className="text-sm text-muted-foreground mt-1">You haven't triggered any emergency alerts yet.</p>
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-4 sm:before:left-6 before:w-px before:bg-border">
          {items.map((item) => (
            <div key={item.id} className="relative pl-9 sm:pl-14">
              <div className="absolute left-2 sm:left-4 top-1 size-4 rounded-full bg-emergency border-4 border-background ring-4 ring-emergency/10" />
              <div className="p-4 sm:p-5 rounded-2xl border bg-card hover:border-emergency/30 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-3.5" /> {format(new Date(item.created_at), "MMM d, h:mm a")}</div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-safe/10 text-safe text-xs font-bold uppercase tracking-wider"><CheckCircle className="size-3" /> {item.status}</div>
                </div>
                <p className="font-medium text-foreground mb-4">"{item.message}"</p>
                <div className="grid sm:grid-cols-2 gap-4 min-w-0">
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <MapPin className="size-4 shrink-0" />
                    {item.latitude ? <a href={item.location_url} target="_blank" rel="noreferrer" className="text-emergency hover:underline">View location on map</a> : "Location not available"}
                  </div>
                  <div className="min-w-0 text-sm text-muted-foreground break-words">Sent to: {item.recipients.join(", ")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
