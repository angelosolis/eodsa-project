-- One-time backfill for existing events after flat pricing rollout.
-- Safe and additive: only fills when new values are NULL or 0.
--
-- Mapping rules:
-- - solo_price         <- solo_1_fee
-- - duet_price         <- duo_trio_fee_per_dancer
-- - group_price        <- group_fee_per_dancer
-- - registration_fee   <- registration_fee_per_dancer
-- - discount fields remain default unless explicitly configured

UPDATE events
SET
  solo_price = CASE
    WHEN COALESCE(solo_price, 0) = 0 THEN COALESCE(solo_1_fee, 0)
    ELSE solo_price
  END,
  duet_price = CASE
    WHEN COALESCE(duet_price, 0) = 0 THEN COALESCE(duo_trio_fee_per_dancer, 0)
    ELSE duet_price
  END,
  group_price = CASE
    WHEN COALESCE(group_price, 0) = 0 THEN COALESCE(group_fee_per_dancer, 0)
    ELSE group_price
  END,
  registration_fee = CASE
    WHEN COALESCE(registration_fee, 0) = 0 THEN COALESCE(registration_fee_per_dancer, 0)
    ELSE registration_fee
  END,
  discount_enabled = COALESCE(discount_enabled, FALSE),
  discount_min_entries = COALESCE(discount_min_entries, 0),
  discount_amount = COALESCE(discount_amount, 0);

-- Optional: inspect what still needs manual attention after backfill
-- SELECT id, name, solo_price, duet_price, group_price, registration_fee
-- FROM events
-- WHERE COALESCE(solo_price, 0) = 0
--    OR COALESCE(duet_price, 0) = 0
--    OR COALESCE(group_price, 0) = 0;
