import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getRoleMatrix,
    updateRoleMatrix,
    updateMemberRole,
    createCustomRole,
    deleteCustomRole
} from "../controllers/role/roleController.js";
import { validate } from "../middlewares/validate.js";
import { 
    validateRoleMatrix, 
    validateUpdateMemberRole, 
    validateCustomRole 
} from "../validators/roleValidators.js";

const router = express.Router();

router.use(protect);

router.get("/workspace/:workspaceId", getRoleMatrix);
router.patch("/workspace/:workspaceId/matrix", validate(validateRoleMatrix), updateRoleMatrix);
router.patch("/workspace/:workspaceId/member", validate(validateUpdateMemberRole), updateMemberRole);
router.post("/workspace/:workspaceId/custom-role", validate(validateCustomRole), createCustomRole);
router.delete("/workspace/:workspaceId/custom-role/:roleKey", deleteCustomRole);

export default router;

