-- =============================================================================
-- Seed: dq.dq_dimension
-- Idempotent: MERGE inserts missing dimensions and refreshes descriptions.
-- =============================================================================

MERGE INTO dq.dq_dimension AS t
USING (
    SELECT * FROM VALUES
        (1, 'Completeness', 'Required values are present (not null / not blank)'),
        (2, 'Validity',     'Values conform to the expected format, type, range or domain'),
        (3, 'Uniqueness',   'No unwanted duplicates on the business key'),
        (4, 'Timeliness',   'Data is up to date and arrives within the expected window'),
        (5, 'Consistency',  'Values agree across columns, records and related tables'),
        (6, 'Accuracy',     'Values correctly reflect the real-world entity or reference source')
    AS v(dimension_id, dimension_name, description)
) AS s
ON t.dimension_id = s.dimension_id
WHEN MATCHED THEN UPDATE SET
    t.dimension_name = s.dimension_name,
    t.description    = s.description
WHEN NOT MATCHED THEN INSERT (dimension_id, dimension_name, description)
VALUES (s.dimension_id, s.dimension_name, s.description);
