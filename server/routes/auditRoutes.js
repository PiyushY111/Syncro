import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getAuditLogs,
    getEntityHistory,
    rollbackEntity,
    deleteAuditLogs,
    verifyAuditChain,
} from "../controllers/audit/auditController.js";

const router = express.Router();

router.use(protect);

router.get("/workspace/:workspaceId", getAuditLogs);
router.get("/workspace/:workspaceId/verify", verifyAuditChain);
router.get("/entity/:entityType/:entityId", getEntityHistory);
router.post("/rollback", rollbackEntity);
router.delete("/workspace/:workspaceId", deleteAuditLogs);

export default router;
