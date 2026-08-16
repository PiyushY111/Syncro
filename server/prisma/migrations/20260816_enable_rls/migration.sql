-- Enable Row Level Security on multi-tenant tables for defense in depth
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Channel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Meeting" ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies reading app.current_workspace_id session setting
DROP POLICY IF EXISTS project_tenant_isolation_policy ON "Project";
CREATE POLICY project_tenant_isolation_policy ON "Project"
  USING ("workspaceId"::text = NULLIF(current_setting('app.current_workspace_id', true), ''));

DROP POLICY IF EXISTS channel_tenant_isolation_policy ON "Channel";
CREATE POLICY channel_tenant_isolation_policy ON "Channel"
  USING ("workspaceId"::text = NULLIF(current_setting('app.current_workspace_id', true), ''));

DROP POLICY IF EXISTS meeting_tenant_isolation_policy ON "Meeting";
CREATE POLICY meeting_tenant_isolation_policy ON "Meeting"
  USING ("workspaceId"::text = NULLIF(current_setting('app.current_workspace_id', true), ''));
