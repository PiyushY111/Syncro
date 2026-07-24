import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getRoleMatrix,
    updateRoleMatrix,
    updateMemberRole,
    createCustomRole,
    deleteCustomRole
} from "../controllers/role/roleController.js";

const router = express.Router();

router.use(protect);

router.get("/workspace/:workspaceId", getRoleMatrix);
router.patch("/workspace/:workspaceId/matrix", updateRoleMatrix);
router.patch("/workspace/:workspaceId/member", updateMemberRole);
router.post("/workspace/:workspaceId/custom-role", createCustomRole);
router.delete("/workspace/:workspaceId/custom-role/:roleKey", deleteCustomRole);

export default router;
