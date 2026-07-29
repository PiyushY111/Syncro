import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { checkProjectAccessMiddleware } from "../middlewares/projectAccessCheck.js";
import { createSprint } from "../controllers/sprint/createSprint.js";
import { getProjectSprints } from "../controllers/sprint/getProjectSprints.js";
import { startSprint, completeSprint } from "../controllers/sprint/sprintLifecycle.js";
import { updateSprint, deleteSprint } from "../controllers/sprint/sprintManage.js";
import { updateCapacity } from "../controllers/sprint/sprintCapacity.js";

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
