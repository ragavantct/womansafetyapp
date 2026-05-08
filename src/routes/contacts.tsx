import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, User, Phone, Mail, Trash2, Edit2, Shield, X } from "lucide-react";
import { RequireAuth } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contacts")({ component: () => <RequireAuth><Contacts /></RequireAuth> });

function Contacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fetchContacts = async () => {
    if (!user) return;
    const { data } = await supabase.from("emergency_contacts").select("*").eq("user_id", user.id).order("created_at");
    setContacts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, [user]);

  const onSave = async (payload: any) => {
    if (!user) return;
    const { error } = editing
      ? await supabase.from("emergency_contacts").update(payload).eq("id", editing.id)
      : await supabase.from("emergency_contacts").insert({ ...payload, user_id: user.id });

    if (error) return toast.error(error.message);
    toast.success(editing ? "Contact updated" : "Contact added");
    setOpen(false); setEditing(null); fetchContacts();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Contact removed"); fetchContacts(); }
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Emergency Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">Your trusted circle who will be notified in emergencies.</p>
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emergency text-emergency-foreground font-semibold hover:opacity-90 transition-opacity shadow-sm">
          <Plus className="size-4" /> Add Contact
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-muted-foreground">Loading contacts…</div> : contacts.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-12 text-center">
          <div className="size-12 rounded-full bg-muted grid place-items-center mx-auto mb-4"><Shield className="size-6 text-muted-foreground" /></div>
          <h3 className="font-semibold text-lg">No contacts yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Add at least one person you trust to receive SOS alerts.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {contacts.map((c) => (
            <div key={c.id} className="p-5 rounded-2xl border bg-card flex items-center justify-between group hover:border-emergency/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-secondary grid place-items-center font-bold text-emergency">{c.name[0].toUpperCase()}</div>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Phone className="size-3" /> {c.phone}</span>
                    <span className="flex items-center gap-1.5"><Mail className="size-3" /> {c.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(c); setOpen(true); }} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"><Edit2 className="size-4" /></button>
                <button onClick={() => onDelete(c.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && <ContactModal contact={editing} onSave={onSave} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ContactModal({ contact, onSave, onClose }: any) {
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [rel, setRel] = useState(contact?.relationship ?? "");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-card rounded-3xl border shadow-2xl p-8 animate-float">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-display">{contact ? "Edit Contact" : "Add Emergency Contact"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent"><X className="size-5" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave({ name, phone, email, relationship: rel }); }} className="space-y-4">
          <Input label="Full Name" value={name} onChange={setName} icon={User} placeholder="Jane Doe" />
          <Input label="Phone Number" value={phone} onChange={setPhone} icon={Phone} placeholder="+1 (555) 000-0000" />
          <Input label="Email Address" type="email" value={email} onChange={setEmail} icon={Mail} placeholder="jane@example.com" />
          <Input label="Relationship" value={rel} onChange={setRel} icon={Shield} placeholder="Friend, Mother, Sister…" required={false} />
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border font-semibold hover:bg-accent transition-colors">Cancel</button>
            <button className="flex-1 py-3 rounded-xl bg-emergency text-emergency-foreground font-semibold hover:opacity-90 transition-opacity">Save Contact</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, icon: Icon, value, onChange, type = "text", placeholder, required = true }: any) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card focus:outline-none focus:ring-2 focus:ring-emergency/40 transition" />
      </div>
    </div>
  );
}
