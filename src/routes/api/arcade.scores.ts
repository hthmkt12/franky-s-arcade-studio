// GET /api/arcade/scores  → returns Top 10 Leaderboard
// POST /api/arcade/scores → submits verified score with 3-char initials

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit.server";

const ScoreSubmissionSchema = z.object({
  playerTag: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{1,3}$/, "Initials must be 1-3 alphanumeric characters"),
  score: z.number().int().min(1).max(99999),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/arcade/scores")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const { data, error } = await supabase
          // arcade_leaderboard is not yet in generated Supabase types.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("arcade_leaderboard" as any)
          .select("id, player_tag, score, created_at")
          .order("score", { ascending: false })
          .limit(10);

        if (error) {
          console.error("[api/arcade/scores] get error", error);
          return json({ code: "fetch_failed", message: "Could not retrieve leaderboard scores" }, 500);
        }

        return json(data ?? []);
      },

      POST: async ({ request }: { request: Request }) => {
        const clientIp = getClientIp(request);
        const rl = checkRateLimit(clientIp, {
          prefix: "arcade_scores",
          windowMs: 60 * 1000,
          maxRequests: 5, // max 5 score submissions per minute per IP
        });

        if (!rl.success) {
          return json(
            { code: "rate_limited", message: `Too many submissions. Please wait ${rl.resetInSeconds}s.` },
            429,
          );
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ code: "invalid_json", message: "Body must be JSON" }, 400);
        }

        const parsed = ScoreSubmissionSchema.safeParse(raw);
        if (!parsed.success) {
          return json(
            { code: "invalid_body", message: parsed.error.issues[0]?.message ?? "Invalid payload" },
            400,
          );
        }

        const { playerTag, score } = parsed.data;
        const normalizedTag = playerTag.padEnd(3, "_").slice(0, 3).toUpperCase();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          // arcade_leaderboard is not yet in generated Supabase types.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("arcade_leaderboard" as any)
          .insert({
            player_tag: normalizedTag,
            score,
          })
          .select("id, player_tag, score, created_at")
          .single();

        if (error) {
          console.error("[api/arcade/scores] insert error", error);
          return json({ code: "save_failed", message: "Could not save high score" }, 500);
        }

        // Determine unlocked tier reward
        let rewardCode: string | null = null;
        let discountPercent = 0;

        if (score >= 200) {
          rewardCode = "CHAMP20";
          discountPercent = 20;
        } else if (score >= 100) {
          rewardCode = "RUNNER15";
          discountPercent = 15;
        }

        return json({
          success: true,
          entry: data,
          rewardCode,
          discountPercent,
        });
      },
    },
  },
});
