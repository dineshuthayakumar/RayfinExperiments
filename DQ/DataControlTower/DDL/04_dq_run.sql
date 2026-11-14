-- =============================================================================
-- dq.dq_run
-- Audit of each DQ run, linked to the Fabric pipeline / notebook run.
-- Grain: one row per table per run
-- PK (logical): run_id
-- FK (logical): table_id -> dq.dq_source_table.table_id
-- =============================================================================

CREATE TABLE IF NOT EXISTS dq.dq_run (
    run_id             STRING     NOT NULL COMMENT 'PK. GUID of the DQ run',
    table_id           INT        NOT NULL COMMENT 'FK -> dq_source_table.table_id',
    pipeline_name      STRING              COMMENT 'Fabric pipeline or notebook name',
    pipeline_run_id    STRING              COMMENT 'Fabric pipeline / notebook run id',
    run_start_ts       TIMESTAMP  NOT NULL COMMENT 'Run start time',
    run_end_ts         TIMESTAMP           COMMENT 'Run end time; NULL while running',
    run_status         STRING     NOT NULL COMMENT 'Running | Succeeded | Failed',
    records_evaluated  BIGINT              COMMENT 'Number of records evaluated'
)
USING DELTA
COMMENT 'Audit log of DQ runs'
TBLPROPERTIES (
    'delta.parquet.vorder.enabled' = 'true'
);
