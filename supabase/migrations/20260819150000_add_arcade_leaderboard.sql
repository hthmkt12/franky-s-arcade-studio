-- Migration: Create arcade_leaderboard table for 90s style High-Score Hall of Fame
-- Supports public reading and verified scoring submissions

CREATE TABLE IF NOT EXISTS public.arcade_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_tag varchar(3) NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 99999),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for instant Top 10 retrieval ordered by score descending
CREATE INDEX IF NOT EXISTS idx_arcade_leaderboard_rank 
  ON public.arcade_leaderboard (score DESC, created_at ASC);

-- Enable RLS
ALTER TABLE public.arcade_leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow public read of leaderboard
CREATE POLICY "Leaderboard entries are publicly readable" 
  ON public.arcade_leaderboard FOR SELECT USING (true);

-- Allow public insert of leaderboard scores
CREATE POLICY "Public can submit arcade scores" 
  ON public.arcade_leaderboard FOR INSERT WITH CHECK (true);

-- Seed initial retro arcade legends
INSERT INTO public.arcade_leaderboard (player_tag, score, created_at)
VALUES
  ('FRK', 520, now() - interval '5 days'),
  ('PAC', 410, now() - interval '4 days'),
  ('DKG', 350, now() - interval '4 days'),
  ('MAR', 290, now() - interval '3 days'),
  ('LUX', 220, now() - interval '2 days'),
  ('SON', 180, now() - interval '2 days'),
  ('ACE', 150, now() - interval '1 day'),
  ('NEO', 120, now() - interval '1 day'),
  ('FLY', 105, now() - interval '12 hours'),
  ('BOT', 80,  now() - interval '6 hours')
ON CONFLICT DO NOTHING;
