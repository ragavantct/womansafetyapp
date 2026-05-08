import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/reset-password")({ component: Reset });

function Reset() {
  const [pw, setPw] = useState(""); const nav = useNavigate();
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated"); nav({ to: "/dashboard" });
  };
  return <AuthShell title="Reset password" subtitle="Choose a new secure password">
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="New password" type="password" value={pw} onChange={setPw} />
      <button className="w-full py-3 rounded-xl bg-emergency text-emergency-foreground font-semibold">Update password</button>
    </form>
  </AuthShell>;
}
