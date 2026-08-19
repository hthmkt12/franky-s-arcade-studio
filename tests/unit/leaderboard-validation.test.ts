import { describe, expect, it } from "vitest";
import { z } from "zod";

const ScoreSubmissionSchema = z.object({
  playerTag: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{1,3}$/, "Initials must be 1-3 alphanumeric characters"),
  score: z.number().int().min(1).max(99999),
});

function calculateDiscount(promoCode?: string): number {
  if (!promoCode) return 0;
  const code = promoCode.toUpperCase();
  if (code === "COIN10" || code === "KONAMI") return 0.1;
  if (code === "RUNNER15") return 0.15;
  if (code === "CHAMP20") return 0.2;
  return 0;
}

describe("Arcade Leaderboard & Rewards validation", () => {
  it("validates valid 1-3 alphanumeric player tags", () => {
    expect(ScoreSubmissionSchema.safeParse({ playerTag: "FRK", score: 500 }).success).toBe(true);
    expect(ScoreSubmissionSchema.safeParse({ playerTag: "A", score: 10 }).success).toBe(true);
    expect(ScoreSubmissionSchema.safeParse({ playerTag: "1UP", score: 250 }).success).toBe(true);
    expect(ScoreSubmissionSchema.safeParse({ playerTag: "99", score: 99 }).success).toBe(true);
  });

  it("rejects invalid player tags (symbols, spaces, >3 chars, empty)", () => {
    expect(ScoreSubmissionSchema.safeParse({ playerTag: "TOOLONG", score: 500 }).success).toBe(false);
    expect(ScoreSubmissionSchema.safeParse({ playerTag: "F@", score: 500 }).success).toBe(false);
    expect(ScoreSubmissionSchema.safeParse({ playerTag: "", score: 500 }).success).toBe(false);
    expect(ScoreSubmissionSchema.safeParse({ playerTag: "   ", score: 500 }).success).toBe(false);
  });

  it("rejects invalid scores (negative, 0, >99999)", () => {
    expect(ScoreSubmissionSchema.safeParse({ playerTag: "FRK", score: -10 }).success).toBe(false);
    expect(ScoreSubmissionSchema.safeParse({ playerTag: "FRK", score: 0 }).success).toBe(false);
    expect(ScoreSubmissionSchema.safeParse({ playerTag: "FRK", score: 100000 }).success).toBe(false);
  });

  it("applies accurate tiered promo discounts including CHAMP20", () => {
    expect(calculateDiscount("COIN10")).toBe(0.1);
    expect(calculateDiscount("KONAMI")).toBe(0.1);
    expect(calculateDiscount("RUNNER15")).toBe(0.15);
    expect(calculateDiscount("CHAMP20")).toBe(0.2);
    expect(calculateDiscount("INVALID")).toBe(0);
  });
});
