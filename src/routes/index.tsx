import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Siren, MapPin, Mail, Bell, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="container mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
        <div className="min-w-0 flex items-center gap-2">
          <div className="size-9 rounded-xl bg-emergency grid place-items-center">
            <Shield className="size-5 text-emergency-foreground" />
          </div>
          <span className="font-display font-bold text-lg truncate">Safety Reach</span>
        </div>
        <Link to="/login" className="shrink-0 text-sm font-medium hover:text-emergency transition-colors">Sign in</Link>
      </header>

      <section className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-14 sm:pb-24 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emergency/10 text-emergency text-xs font-semibold mb-6">
            <span className="size-1.5 rounded-full bg-emergency animate-pulse" /> Always‑on protection
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
            Safety Reach<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-emergency)" }}>Web App</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-md">
            Instant SOS alerts with live GPS location and email security system. Help is one tap away.
          </p>
          <div className="mt-8 grid sm:flex sm:flex-wrap gap-3">
            <Link to="/signup" className="justify-center inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg">
              Get Started <ArrowRight className="size-4" />
            </Link>
            <Link to="/login" className="justify-center inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emergency text-emergency-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg">
              <Siren className="size-4" /> Send SOS
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-6 max-w-md">
            {[
              { n: "< 3s", l: "Alert time" },
              { n: "GPS", l: "Live location" },
              { n: "24/7", l: "Always on" },
            ].map(s => (
              <div key={s.l}>
                <div className="text-xl sm:text-2xl font-bold font-display">{s.n}</div>
                <div className="text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Illustration */}
        <div className="relative h-[360px] sm:h-[480px] flex items-center justify-center overflow-hidden rounded-[32px] sm:rounded-[40px]">
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          <div className="absolute -top-6 -right-6 size-32 rounded-full bg-emergency/30 blur-3xl" />
          <div className="absolute -bottom-6 -left-6 size-40 rounded-full bg-emergency/40 blur-3xl" />
          <div className="relative animate-float">
            <div className="size-44 sm:size-56 rounded-full grid place-items-center animate-pulse-glow"
              style={{ background: "var(--gradient-emergency)" }}>
              <Siren className="size-20 sm:size-24 text-white" strokeWidth={2} />
            </div>
          </div>
          <div className="absolute top-5 left-4 sm:top-10 sm:left-6 bg-card/95 backdrop-blur rounded-2xl px-3 sm:px-4 py-3 shadow-xl flex items-center gap-3">
            <MapPin className="size-5 text-emergency" />
            <div>
              <div className="text-xs text-muted-foreground">Live location</div>
              <div className="text-sm font-semibold">Sharing now</div>
            </div>
          </div>
          <div className="absolute bottom-5 right-4 sm:bottom-10 sm:right-6 bg-card/95 backdrop-blur rounded-2xl px-3 sm:px-4 py-3 shadow-xl flex items-center gap-3">
            <Mail className="size-5 text-safe" />
            <div>
              <div className="text-xs text-muted-foreground">Email alert</div>
              <div className="text-sm font-semibold">Sent to 4 contacts</div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 grid md:grid-cols-3 gap-6">
        {[
          { i: Siren, t: "One‑tap SOS", d: "Large animated SOS button with countdown and cancel option." },
          { i: MapPin, t: "Live GPS sharing", d: "Auto‑generated Google Maps link sent with every alert." },
          { i: Bell, t: "Trusted contacts", d: "Notify your circle by email the moment something feels off." },
        ].map(({ i: Icon, t, d }) => (
          <div key={t} className="p-6 rounded-2xl bg-card border" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="size-11 rounded-xl bg-emergency/10 grid place-items-center mb-4">
              <Icon className="size-5 text-emergency" />
            </div>
            <h3 className="font-bold text-lg mb-1">{t}</h3>
            <p className="text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
