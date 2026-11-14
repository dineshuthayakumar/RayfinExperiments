-- =============================================================================
-- dq.dq_rule
-- DQ rules, each with a weight and a version.
-- Grain: one row per rule version
-- PK (logical): rule_id
-- FK (logical): table_id     -> dq.dq_source_table.table_id
--               dimension_id -> dq.dq_dimension.dimension_id
-- =============================================================================

CREATE TABLE IF NOT EXISTS dq.dq_rule (
    rule_id          INT            NOT NULL COMMENT 'PK. Surrogate id of the rule version',
    table_id         INT            NOT NULL COMMENT 'FK -> dq_source_table.table_id',
    dimension_id     INT            NOT NULL COMMENT 'FK -> dq_dimension.dimension_id',
    rule_name        STRING         NOT NULL COMMENT 'Readable rule name',
    column_name      STRING                  COMMENT 'Column the rule checks; NULL = row-level rule',
    rule_expression  STRING         NOT NULL COMMENT 'Spark SQL predicate; TRUE = pass',
    weight           DECIMAL(9,4)   NOT NULL COMMENT 'Share of the record score',
    severity         STRING         NOT NULL COMMENT 'Critical | High | Low',
    is_critical      BOOLEAN        NOT NULL COMMENT 'If failed, the record fails regardless of score',
    rule_version     INT            NOT NULL COMMENT 'Version number of the rule',
    effective_from   DATE           NOT NULL COMMENT 'First date this version applies',
    effective_to     DATE                    COMMENT 'Last date this version applies; NULL = open-ended',
    is_active        BOOLEAN        NOT NULL COMMENT 'Include this rule in DQ runs'
)
USING DELTA
COMMENT 'Configured DQ rules with weights and versions'
TBLPROPERTIES (
    'delta.parquet.vorder.enabled' = 'true'
);
