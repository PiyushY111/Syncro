import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { checkProjectAccessMiddleware } from "../middlewares/projectAccessCheck.js";
import { createEpic } from "../controllers/epic/createEpic.js";
import { getProjectEpics } from "../controllers/epic/getProjectEpics.js";
import { updateEpic, deleteEpic } from "../controllers/epic/epicManage.js";

const router = express.Router();

router.use(protect);

router.post("/projects/:projectId", checkProjectAccessMiddleware, createEpic);
router.get("/projects/:projectId", checkProjectAccessMiddleware, getProjectEpics);
router.put("/:epicId", updateEpic);
router.delete("/:epicId", deleteEpic);

export default router;
