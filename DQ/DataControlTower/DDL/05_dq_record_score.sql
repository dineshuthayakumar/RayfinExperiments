-- =============================================================================
-- dq.dq_record_score
-- Core table: DQ score (decimal) and DQ status (boolean) for each record.
-- Grain: one row per record per run
-- PK (logical): record_score_id = hash(run_id, table_id, record_key_hash)
-- FK (logical): run_id   -> dq.dq_run.run_id
--               table_id -> dq.dq_source_table.table_id
-- Partitioned by table_id, evaluation_date
-- =============================================================================

CREATE TABLE IF NOT EXISTS dq.dq_record_score (
    record_score_id   STRING        NOT NULL COMMENT 'PK. hash(run_id, table_id, record_key_hash)',
    run_id            STRING        NOT NULL COMMENT 'FK -> dq_run.run_id',
    table_id          INT           NOT NULL COMMENT 'FK -> dq_source_table.table_id. Partition column',
    record_key        STRING        NOT NULL COMMENT 'Business key as text / JSON',
    record_key_hash   STRING        NOT NULL COMMENT 'SHA2-256 of the business key columns',
    dq_score          DECIMAL(5,2)  NOT NULL COMMENT 'Weighted score 0-100',
    dq_status         BOOLEAN       NOT NULL COMMENT 'TRUE = pass (score >= threshold AND no critical failure)',
    rules_evaluated   INT           NOT NULL COMMENT 'Number of rules evaluated',
    rules_failed      INT           NOT NULL COMMENT 'Number of rules failed',
    critical_failure  BOOLEAN       NOT NULL COMMENT 'TRUE if any critical rule failed',
    is_current        BOOLEAN       NOT NULL COMMENT 'TRUE on the latest score for this record',
    evaluation_date   DATE          NOT NULL COMMENT 'Date of evaluation. Partition column',
    evaluated_ts      TIMESTAMP     NOT NULL COMMENT 'Timestamp of evaluation'
)
USING DELTA
PARTITIONED BY (table_id, evaluation_date)
COMMENT 'Record-level DQ score and status for every evaluated source record'
TBLPROPERTIES (
    'delta.parquet.vorder.enabled' = 'true'
);
