-- =============================================================================
-- dq.dq_dimension
-- Reference list of DQ dimensions.
-- Grain: one row per dimension
-- PK (logical): dimension_id
-- =============================================================================

CREATE TABLE IF NOT EXISTS dq.dq_dimension (
    dimension_id    INT     NOT NULL COMMENT 'PK. Surrogate id of the dimension',
    dimension_name  STRING  NOT NULL COMMENT 'Completeness, Validity, Uniqueness, Timeliness, Consistency, Accuracy',
    description     STRING           COMMENT 'What the dimension measures'
)
USING DELTA
COMMENT 'Reference list of data quality dimensions'
TBLPROPERTIES (
    'delta.parquet.vorder.enabled' = 'true'
);
