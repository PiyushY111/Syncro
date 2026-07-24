import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { createMilestone } from "../controllers/milestone/createMilestone.js";
import { getMilestones } from "../controllers/milestone/getMilestones.js";
import { updateMilestone } from "../controllers/milestone/updateMilestone.js";
import { deleteMilestone } from "../controllers/milestone/deleteMilestone.js";
import { linkTasksToMilestone } from "../controllers/milestone/linkTasks.js";

const router = express.Router();

router.use(protect);

router.post("/", createMilestone);
router.get("/project/:projectId", getMilestones);
router.patch("/:id", updateMilestone);
router.delete("/:id", deleteMilestone);
router.post("/:id/tasks", linkTasksToMilestone);

export default router;
