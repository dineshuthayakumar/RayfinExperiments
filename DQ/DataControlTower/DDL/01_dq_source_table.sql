-- =============================================================================
-- dq.dq_source_table
-- Registry of the tables that get DQ checks.
-- Grain: one row per source table
-- PK (logical): table_id
-- =============================================================================

CREATE TABLE IF NOT EXISTS dq.dq_source_table (
    table_id              INT            NOT NULL COMMENT 'PK. Surrogate id of the source table',
    workspace_name        STRING         NOT NULL COMMENT 'Fabric workspace that holds the source table',
    lakehouse_name        STRING         NOT NULL COMMENT 'Lakehouse that holds the source table',
    schema_name           STRING         NOT NULL COMMENT 'Schema of the source table',
    table_name            STRING         NOT NULL COMMENT 'Name of the source table',
    layer                 STRING         NOT NULL COMMENT 'bronze | silver | gold',
    business_key_columns  STRING         NOT NULL COMMENT 'Comma-separated business key columns, e.g. customer_id,region',
    pass_threshold        DECIMAL(5,2)   NOT NULL COMMENT 'Minimum dq_score for a record to pass, e.g. 80.00',
    is_active             BOOLEAN        NOT NULL COMMENT 'Include this table in DQ runs',
    created_ts            TIMESTAMP      NOT NULL COMMENT 'When the table was registered'
)
USING DELTA
COMMENT 'Registry of source tables evaluated by the DQ framework'
TBLPROPERTIES (
    'delta.parquet.vorder.enabled' = 'true'
);
