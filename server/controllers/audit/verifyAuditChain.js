import { verifyAuditLogChain } from "../../services/auditLogger.js";
import { getUserWorkspaceRole } from "../role/checkPermissionHelper.js";
import { ApiResponse } from "../../utils/response/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ForbiddenError } from "../../utils/errors/appError.js";

/**
 * Endpoint to cryptographically verify the SHA-256 hash chain of a workspace's audit log.
 */
export const verifyAuditChain = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { workspaceId } = req.params;

  const { role, isOwner } = await getUserWorkspaceRole(userId, workspaceId);
  if (!isOwner && !['OWNER', 'ADMIN'].includes(role)) {
    throw new ForbiddenError("Only Workspace Owners or Admins can verify audit log cryptographic integrity.");
  }

  const verificationResult = await verifyAuditLogChain(workspaceId);

  return ApiResponse.success(res, {
    data: verificationResult,
    message: verificationResult.isValid
      ? "Audit log cryptographic SHA-256 hash chain is 100% verified and tamper-free."
      : `Audit log tampering detected at record ID: ${verificationResult.corruptedLogId || 'unknown'}`,
  });
});

export default verifyAuditChain;
