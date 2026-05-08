import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const showMessage = (message: string, type: "success" | "error" = "success") => {
    if (type === "error") toast.error(message);
    else toast.success(message);
    window.alert(message);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pw,
      });

      if (error) {
        console.error("Login Error:", error);
        showMessage(error.message, "error");
        return;
      }

      showMessage("Sign in successful. Welcome back.");
      nav({ to: "/dashboard" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed. Please try again.";
      console.error("Login Error:", error);
      showMessage(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!email.trim()) {
      showMessage("Enter your email first.", "error");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) showMessage(error.message, "error");
      else showMessage("Reset link sent. Please check your email.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send reset link.";
      showMessage(message, "error");
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to access your safety dashboard">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={pw} onChange={setPw} />
        <button type="button" onClick={reset} className="text-xs text-emergency hover:underline">
          Forgot password?
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emergency text-emergency-foreground font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-sm text-center text-muted-foreground">
          No account? <Link to="/signup" className="text-emergency font-semibold hover:underline">Sign up</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 overflow-x-hidden">
      <div className="hidden lg:flex flex-col justify-between p-12 text-white" style={{ background: "var(--gradient-hero)" }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-emergency grid place-items-center"><Shield className="size-5" /></div>
          <span className="font-display font-bold text-lg">Safety Reach</span>
        </Link>
        <div>
          <h2 className="text-4xl font-bold font-display leading-tight">Your safety,<br />one tap away.</h2>
          <p className="mt-3 text-white/70 max-w-sm">Send instant alerts with your live location to trusted contacts whenever you feel unsafe.</p>
        </div>
        <div className="text-xs text-white/50">© Safety Reach</div>
      </div>
      <div className="flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-sm animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold font-display">{title}</h1>
          <p className="mt-2 text-muted-foreground text-sm">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, type = "text", value, onChange, required = true }: { label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={label.toLowerCase().replace(/\s+/g, "_")}
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1.5 w-full px-4 py-2.5 rounded-xl border bg-card focus:outline-none focus:ring-2 focus:ring-emergency/40 focus:border-emergency transition"
      />
    </label>
  );
}
