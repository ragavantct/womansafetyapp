import * as React from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Shield, LayoutDashboard, Users, MapPin, Mail, History, Settings, LogOut, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/location", label: "Live Location", icon: MapPin },
  { to: "/alert", label: "Email Alert", icon: Mail },
  { to: "/history", label: "Alert History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const nav2 = useNavigate();
  const { signOut, user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background" style={{ backgroundColor: "var(--background)" }}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-sidebar text-sidebar-foreground transform transition-transform lg:translate-x-0 lg:static",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 px-6 py-6 border-b border-sidebar-border">
          <div className="size-9 rounded-xl bg-emergency grid place-items-center">
            <Shield className="size-5 text-emergency-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-lg">Safety Reach</div>
            <div className="text-xs text-sidebar-foreground/60">SOS Alerts</div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "hover:bg-sidebar-accent text-sidebar-foreground/80",
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60 mb-2 truncate">{user?.email}</div>
          <button
            onClick={async () => {
              await signOut();
              nav2({ to: "/" });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/50 lg:hidden" />}

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b shadow-sm" style={{ backgroundColor: "var(--card)" }}>
          <button onClick={() => setOpen(true)} className="shrink-0 p-2 rounded-lg hover:bg-accent">
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex items-center gap-2">
            <Shield className="size-5 shrink-0 text-emergency" />
            <span className="font-display font-bold truncate">Safety Reach</span>
          </div>
          <div className="w-9" />
        </header>
        <main className="flex-1 min-w-0 overflow-auto overflow-x-hidden bg-background" style={{ backgroundColor: "var(--background)" }}>{children}</main>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const nav2 = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav2({ to: "/login" });
  }, [loading, nav2, user]);

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>;
  if (!user) return null;
  return <AppShell>{children}</AppShell>;
}
