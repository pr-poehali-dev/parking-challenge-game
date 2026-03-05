ALTER TABLE t_p25425030_parking_challenge_ga.players
  ADD COLUMN IF NOT EXISTS ya_id VARCHAR(64) NULL UNIQUE;

CREATE INDEX IF NOT EXISTS idx_players_ya_id 
  ON t_p25425030_parking_challenge_ga.players(ya_id)
  WHERE ya_id IS NOT NULL;