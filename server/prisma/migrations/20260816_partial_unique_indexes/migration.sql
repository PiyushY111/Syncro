-- Partial unique index migration for soft-deleted tables
CREATE UNIQUE INDEX IF NOT EXISTS user_email_active_unique
  ON "User" (email) WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS workspace_slug_active_unique
  ON "Workspace" (slug) WHERE "deletedAt" IS NULL;
