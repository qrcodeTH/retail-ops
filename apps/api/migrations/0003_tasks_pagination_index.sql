-- Keyset pagination queries "WHERE store_id = $1 AND id < $2 ORDER BY id DESC LIMIT n".
-- A composite index lets Postgres walk straight to the page instead of collecting every row of the store and sorting.
CREATE INDEX tasks_store_id_id_idx ON tasks (store_id, id DESC);
DROP INDEX tasks_store_id_idx;  -- superseded: the composite index covers store_id-only lookups too
