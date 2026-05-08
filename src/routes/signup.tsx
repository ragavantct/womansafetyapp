import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/signup")({ component: Signup });

function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState("");
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

    if (pw.length < 6) {
      showMessage("Password must be at least 6 characters.", "error");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pw,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
          data: { full_name: name.trim() },
        },
      });

      if (error) {
        console.error("Signup Error:", error);
        showMessage(error.message, "error");
        return;
      }

      if (data.session) {
        showMessage("Account created successfully. Welcome.");
        nav({ to: "/dashboard" });
      } else {
        showMessage("Account created successfully. Please check your email to confirm your account.");
        nav({ to: "/login" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed. Please try again.";
      console.error("Signup Error:", error);
      showMessage(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Start protecting yourself in under a minute">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Full name" value={name} onChange={setName} />
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={pw} onChange={setPw} />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emergency text-emergency-foreground font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create account"}
        </button>
        <p className="text-sm text-center text-muted-foreground">
          Have an account? <Link to="/login" className="text-emergency font-semibold hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
