-- =============================================================================
-- dq.dq_rule_result
-- Which rules each record passed or failed. Can store failures only.
-- Grain: one row per record per rule per run
-- Key (logical): run_id, table_id, record_key_hash, rule_id
-- FK (logical): run_id   -> dq.dq_run.run_id
--               table_id -> dq.dq_source_table.table_id
--               rule_id  -> dq.dq_rule.rule_id
--               (run_id, table_id, record_key_hash) -> dq.dq_record_score
-- Partitioned by table_id, evaluation_date
-- =============================================================================

CREATE TABLE IF NOT EXISTS dq.dq_rule_result (
    run_id            STRING        NOT NULL COMMENT 'FK -> dq_run.run_id',
    table_id          INT           NOT NULL COMMENT 'FK -> dq_source_table.table_id. Partition column',
    record_key_hash   STRING        NOT NULL COMMENT 'FK -> dq_record_score.record_key_hash',
    rule_id           INT           NOT NULL COMMENT 'FK -> dq_rule.rule_id',
    is_passed         BOOLEAN       NOT NULL COMMENT 'TRUE = rule passed',
    rule_score        DECIMAL(9,4)           COMMENT 'Weighted contribution of this rule to the record score',
    failed_value      STRING                 COMMENT 'Value that failed the rule',
    failure_reason    STRING                 COMMENT 'Why the rule failed',
    evaluation_date   DATE          NOT NULL COMMENT 'Date of evaluation. Partition column'
)
USING DELTA
PARTITIONED BY (table_id, evaluation_date)
COMMENT 'Rule-level results explaining each record score'
TBLPROPERTIES (
    'delta.parquet.vorder.enabled' = 'true'
);
