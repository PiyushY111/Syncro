import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    initializeRetro,
    getSprintRetro,
    addRetroItem,
    voteRetroItem,
    deleteRetroItem
} from "../controllers/retro/retroController.js";

const router = express.Router();

router.use(protect);

router.post("/sprints/:sprintId/initialize", initializeRetro);
router.get("/sprints/:sprintId", getSprintRetro);
router.post("/columns/:columnId/items", addRetroItem);
router.put("/items/:itemId/vote", voteRetroItem);
router.delete("/items/:itemId", deleteRetroItem);

export default router;
