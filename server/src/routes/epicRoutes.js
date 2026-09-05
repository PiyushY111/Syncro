import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { checkProjectAccessMiddleware } from "../middlewares/projectAccessCheck.js";
import { createEpic } from "../controllers/epic/createEpic.js";
import { getProjectEpics } from "../controllers/epic/getProjectEpics.js";
import { updateEpic, deleteEpic } from "../controllers/epic/epicManage.js";
import { validate } from "../middlewares/validate.js";
import { validateCreateEpic, validateUpdateEpic } from "../validators/epicValidators.js";

const router = express.Router();

router.use(protect);

router.post("/projects/:projectId", checkProjectAccessMiddleware, validate(validateCreateEpic), createEpic);
router.get("/projects/:projectId", checkProjectAccessMiddleware, getProjectEpics);
router.put("/:epicId", validate(validateUpdateEpic), updateEpic);
router.delete("/:epicId", deleteEpic);

export default router;

