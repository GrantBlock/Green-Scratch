-- Concepts Vault: records and share tokens.
-- Every record type in packages/contract lives in one table; `data` is the record as JSON.
-- A few columns are copied out so they can be indexed and constrained.

CREATE TABLE records (
  type       TEXT    NOT NULL,
  id         TEXT    NOT NULL,
  number     TEXT,
  archived   INTEGER NOT NULL DEFAULT 0,
  version    INTEGER NOT NULL,
  created_at TEXT    NOT NULL,
  data       TEXT    NOT NULL CHECK (json_valid(data)),
  PRIMARY KEY (type, id)
) WITHOUT ROWID;

CREATE INDEX records_by_type_created ON records (type, created_at, id);
CREATE INDEX records_by_project ON records (type, json_extract(data, '$.projectId')) WHERE json_extract(data, '$.projectId') IS NOT NULL;
CREATE INDEX records_by_account ON records (type, json_extract(data, '$.accountId')) WHERE json_extract(data, '$.accountId') IS NOT NULL;
CREATE INDEX records_by_status  ON records (type, json_extract(data, '$.status'))    WHERE json_extract(data, '$.status') IS NOT NULL;

-- A Registry number can be issued once, ever. VOID numbers stay in this table, so they can never be reused.
CREATE UNIQUE INDEX registry_number_unique ON records (number) WHERE type = 'registry';

-- Customer links: only a hash of the token is stored.
CREATE TABLE share_tokens (
  hash    TEXT PRIMARY KEY,
  link_id TEXT NOT NULL
);
