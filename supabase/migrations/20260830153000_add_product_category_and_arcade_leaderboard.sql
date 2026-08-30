-- Migration: 20260830153000_add_product_category_and_arcade_leaderboard.sql
-- Description: Adds category column to products table and creates arcade_leaderboard table.

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'caps';

CREATE TABLE IF NOT EXISTS public.arcade_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_tag VARCHAR(3) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 99999),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arcade_leaderboard_score_desc ON public.arcade_leaderboard (score DESC, created_at ASC);

-- Enable RLS
ALTER TABLE public.arcade_leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow public read access to leaderboard
CREATE POLICY "Leaderboard is publicly readable"
  ON public.arcade_leaderboard
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow service role / authenticated to insert scores
CREATE POLICY "Scores insertable via service role"
  ON public.arcade_leaderboard
  FOR INSERT
  TO service_role, authenticated
  WITH CHECK (true);
