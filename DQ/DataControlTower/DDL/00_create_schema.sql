-- =============================================================================
-- DQ Store : Schema
-- Target   : Microsoft Fabric Lakehouse (schema-enabled), Spark SQL / Delta
-- Run from : Fabric notebook (%%sql cell) attached to the target Lakehouse
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS dq
COMMENT 'Central data quality store: rules, runs, record-level scores and summaries';
