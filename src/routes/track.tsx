import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { arcadeAudio } from "@/lib/audio/arcade-audio";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Order — Franky's" },
      { name: "description", content: "Check your handmade cap order status and tracking info." },
    ],
  }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) {
      toast.error("PLEASE ENTER BOTH ORDER NUMBER AND EMAIL");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    arcadeAudio.playBeep(520, "square", 0.08);

    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: orderNumber.trim(), email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "ORDER NOT FOUND");
      }

      arcadeAudio.playVictory();
      toast.success("ORDER FOUND! RETRIEVING RECEIPT…");
      void navigate({
        to: "/checkout/success/$id",
        params: { id: data.id },
        search: { token: data.token },
      });
    } catch (err) {
      arcadeAudio.playBeep(180, "sawtooth", 0.2);
      setErrorMessage((err as Error).message.toUpperCase());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-4 py-12"
      style={{ fontFamily: "var(--font-arcade)" }}
    >
      <div className="max-w-md w-full border border-ink rounded-card bg-cream p-6 md:p-8 arcade-bevel flex flex-col gap-6">
        <div className="text-center border-b border-ink pb-4">
          <h1 style={{ fontSize: 16, letterSpacing: 2, margin: 0 }}>★ TRACK YOUR ORDER ★</h1>
          <p className="text-muted mt-1" style={{ fontSize: 9, letterSpacing: 1 }}>
            ENTER DETAILS AS RECORDED AT CHECKOUT
          </p>
        </div>

        {errorMessage && (
          <div
            className="border border-red-500 bg-red-50 text-red-600 p-3 rounded-btn text-center"
            style={{ fontSize: 9 }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="order-number" style={{ fontSize: 9, letterSpacing: 1 }}>
              ORDER NUMBER
            </label>
            <input
              id="order-number"
              type="text"
              placeholder="FRA-XXXX-XXXX"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              required
              className="border border-pixel rounded-btn px-3 py-2 bg-cream text-base"
              style={{ fontFamily: "VT323, monospace" }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="customer-email" style={{ fontSize: 9, letterSpacing: 1 }}>
              EMAIL ADDRESS
            </label>
            <input
              id="customer-email"
              type="email"
              placeholder="player1@arcade.shop"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-pixel rounded-btn px-3 py-2 bg-cream text-base"
              style={{ fontFamily: "VT323, monospace" }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-buy text-cream py-3 rounded-btn border border-ink arcade-bevel disabled:opacity-50 mt-2"
            style={{ fontSize: 11, letterSpacing: 2 }}
          >
            {isLoading ? "SEARCHING RADAR…" : "LOOKUP RECEIPT →"}
          </button>
        </form>

        <div
          className="text-center border-t border-pixel pt-3 text-muted"
          style={{ fontSize: 8, letterSpacing: 1 }}
        >
          NEED ASSISTANCE? EMAIL SUPPORT@FRANKYS.SHOP
        </div>
      </div>
    </div>
  );
}
