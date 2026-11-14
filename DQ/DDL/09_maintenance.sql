-- =============================================================================
-- Maintenance (schedule separately; not part of table creation)
-- Z-Order the large tables on record_key_hash to speed up joins back to source,
-- and VACUUM to remove files outside the retention window.
-- =============================================================================

OPTIMIZE dq.dq_record_score ZORDER BY (record_key_hash);
OPTIMIZE dq.dq_rule_result  ZORDER BY (record_key_hash, rule_id);

-- Default retention is 7 days (168 hours).
VACUUM dq.dq_record_score RETAIN 168 HOURS;
VACUUM dq.dq_rule_result  RETAIN 168 HOURS;

-- Optional data retention for dq_rule_result (for example, keep 90 days):
-- DELETE FROM dq.dq_rule_result WHERE evaluation_date < date_sub(current_date(), 90);
