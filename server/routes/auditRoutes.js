import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getAuditLogs,
    getEntityHistory,
    rollbackEntity,
    deleteAuditLogs
} from "../controllers/audit/auditController.js";

const router = express.Router();

router.use(protect);

router.get("/workspace/:workspaceId", getAuditLogs);
router.get("/entity/:entityType/:entityId", getEntityHistory);
router.post("/rollback", rollbackEntity);
router.delete("/workspace/:workspaceId", deleteAuditLogs);

export default router;
