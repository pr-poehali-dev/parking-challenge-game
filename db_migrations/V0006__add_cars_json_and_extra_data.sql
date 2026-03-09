ALTER TABLE t_p25425030_parking_challenge_ga.players
  ADD COLUMN IF NOT EXISTS cars_json TEXT NULL,
  ADD COLUMN IF NOT EXISTS extra_data TEXT NULL;