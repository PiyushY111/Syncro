import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { checkProjectAccessMiddleware } from "../middlewares/projectAccessCheck.js";
import {
    createSprint,
    getProjectSprints,
    startSprint,
    completeSprint,
    updateSprint,
    deleteSprint,
    updateCapacity
} from "../controllers/sprint/sprintController.js";

const router = express.Router();

router.use(protect);

router.post("/projects/:projectId", checkProjectAccessMiddleware, createSprint);
router.get("/projects/:projectId", checkProjectAccessMiddleware, getProjectSprints);
router.put("/:sprintId", updateSprint);
router.put("/:sprintId/start", startSprint);
router.put("/:sprintId/complete", completeSprint);
router.delete("/:sprintId", deleteSprint);
router.put("/:sprintId/capacity", updateCapacity);

export default router;
