-- Добавляем friend_code в players (уникальный 6-символьный код)
ALTER TABLE t_p25425030_parking_challenge_ga.players
  ADD COLUMN IF NOT EXISTS friend_code VARCHAR(16) UNIQUE;

-- Генерируем коды для существующих игроков
UPDATE t_p25425030_parking_challenge_ga.players
SET friend_code = UPPER(SUBSTR(MD5(id::text || COALESCE(ya_id,'') || COALESCE(anon_id,'')), 1, 6))
WHERE friend_code IS NULL;
