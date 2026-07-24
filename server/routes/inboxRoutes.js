import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getInbox,
    markNotificationRead,
    markAllNotificationsRead,
    archiveNotification,
    handleInboxAction
} from "../controllers/inbox/inboxController.js";

const router = express.Router();

router.use(protect);

router.get("/", getInbox);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
router.patch("/:id/archive", archiveNotification);
router.post("/action", handleInboxAction);

export default router;
