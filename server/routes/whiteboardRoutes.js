import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getProjectWhiteboards,
    getWorkspaceWhiteboards,
    getWhiteboard,
    createWhiteboard,
    deleteWhiteboard,
    saveWhiteboard,
    shareWhiteboard,
    starWhiteboard
} from "../controllers/whiteboardController.js";
import { validate } from "../middlewares/validate.js";
import { validateCreateWhiteboard, validateUpdateWhiteboard } from "../validators/whiteboardValidators.js";

const router = express.Router();

router.use(protect);

router.post("/", validate(validateCreateWhiteboard), createWhiteboard);
router.post("/:id/share", shareWhiteboard);
router.put("/:id/star", starWhiteboard);
router.get("/project/:projectId", getProjectWhiteboards);
router.get("/workspace/:workspaceId", getWorkspaceWhiteboards);
router.get("/:id", getWhiteboard);
router.put("/:id", validate(validateUpdateWhiteboard), saveWhiteboard);
router.delete("/:id", deleteWhiteboard);

export default router;
