-- =============================================================================
-- dq.dq_table_summary
-- Totals per run, for Power BI dashboards.
-- Grain: one row per run
-- PK (logical): run_id (also FK -> dq.dq_run.run_id)
-- FK (logical): table_id -> dq.dq_source_table.table_id
-- =============================================================================

CREATE TABLE IF NOT EXISTS dq.dq_table_summary (
    run_id          STRING        NOT NULL COMMENT 'PK, FK -> dq_run.run_id',
    table_id        INT           NOT NULL COMMENT 'FK -> dq_source_table.table_id',
    total_records   BIGINT        NOT NULL COMMENT 'Records evaluated in the run',
    passed_records  BIGINT        NOT NULL COMMENT 'Records with dq_status = TRUE',
    failed_records  BIGINT        NOT NULL COMMENT 'Records with dq_status = FALSE',
    avg_dq_score    DECIMAL(5,2)           COMMENT 'Average dq_score across records',
    pass_rate_pct   DECIMAL(5,2)           COMMENT 'passed_records / total_records * 100',
    summary_ts      TIMESTAMP     NOT NULL COMMENT 'When the summary was written'
)
USING DELTA
COMMENT 'Per-run DQ summary for reporting'
TBLPROPERTIES (
    'delta.parquet.vorder.enabled' = 'true'
);
