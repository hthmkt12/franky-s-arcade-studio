import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff Sign In — Franky's" },
      { name: "description", content: "Franky's staff console sign in." },
      { property: "og:title", content: "Staff Sign In — Franky's" },
      { property: "og:description", content: "Franky's staff console sign in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("SIGNED IN");
        void navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("ACCOUNT CREATED — CHECK YOUR EMAIL IF CONFIRMATION IS ON");
      }
    } catch (err) {
      toast.error((err as Error).message.toUpperCase());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 checker-bg">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm border border-ink rounded-card bg-cream arcade-bevel p-5 flex flex-col gap-3"
        style={{ fontFamily: "var(--font-arcade)" }}
      >
        <h1 style={{ fontSize: 14, letterSpacing: 2 }}>STAFF CONSOLE</h1>
        <p className="text-muted" style={{ fontSize: 10, lineHeight: 1.8 }}>
          {mode === "signin" ? "INSERT CREDENTIALS" : "CREATE A STAFF ACCOUNT"}
        </p>

        <label style={{ fontSize: 9 }} htmlFor="email">
          EMAIL
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-pixel rounded-btn px-2 py-2 bg-cream"
          style={{ fontFamily: "VT323, monospace", fontSize: 18 }}
        />

        <label style={{ fontSize: 9 }} htmlFor="password">
          PASSWORD
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-pixel rounded-btn px-2 py-2 bg-cream"
          style={{ fontFamily: "VT323, monospace", fontSize: 18 }}
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-2 bg-buy text-cream py-3 rounded-btn border border-ink arcade-bevel disabled:opacity-50"
          style={{ fontSize: 11, letterSpacing: 2 }}
        >
          {busy ? "..." : mode === "signin" ? "SIGN IN" : "SIGN UP"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="border border-pixel rounded-btn py-2 arcade-bevel"
          style={{ fontSize: 9, letterSpacing: 1 }}
        >
          {mode === "signin" ? "NEED AN ACCOUNT?" : "HAVE AN ACCOUNT?"}
        </button>
      </form>
    </div>
  );
}
