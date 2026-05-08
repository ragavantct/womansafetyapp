import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, RefreshCw, Copy, Share2 } from "lucide-react";
import { RequireAuth } from "@/components/app/AppShell";
import { getLocation, type Coords } from "@/lib/sos";
import { toast } from "sonner";

export const Route = createFileRoute("/location")({ component: () => <RequireAuth><LocationPage /></RequireAuth> });

function LocationPage() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLoc = async () => {
    setLoading(true);
    try { setCoords(await getLocation()); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchLoc(); }, []);

  const share = async () => {
    if (!coords) return;
    if (navigator.share) {
      try { await navigator.share({ title: "My location", text: "I'm here:", url: coords.url }); } catch {}
    } else {
      navigator.clipboard.writeText(coords.url); toast.success("Link copied");
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold font-display">Live Location</h1>
      <p className="text-muted-foreground mt-1">Your current GPS coordinates and map preview.</p>

      <div className="mt-8 rounded-3xl border overflow-hidden bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="aspect-video bg-muted relative">
          {coords ? (
            <iframe
              title="Map"
              className="absolute inset-0 w-full h-full"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.005},${coords.lat - 0.003},${coords.lng + 0.005},${coords.lat + 0.003}&layer=mapnik&marker=${coords.lat},${coords.lng}`}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              {loading ? "Locating you…" : "No location yet"}
            </div>
          )}
        </div>
        <div className="p-5 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-start gap-3">
            <MapPin className="size-5 text-emergency mt-0.5" />
            <div>
              <div className="font-semibold">{coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "—"}</div>
              <a href={coords?.url} target="_blank" rel="noopener" className="text-sm text-emergency hover:underline truncate block max-w-xs">
                {coords?.url ?? ""}
              </a>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={fetchLoc} className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-background hover:bg-accent">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={() => { if (coords) { navigator.clipboard.writeText(coords.url); toast.success("Copied"); } }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-background hover:bg-accent">
              <Copy className="size-4" /> Copy link
            </button>
            <button onClick={share} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emergency text-emergency-foreground font-semibold hover:opacity-90">
              <Share2 className="size-4" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
