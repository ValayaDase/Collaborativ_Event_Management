import express from "express";
import { auth } from "../middleware/auth.js";
import { getMessages, sendMessage } from "../controllers/chatController.js";

const router = express.Router();

router.get("/:eventId", auth, getMessages);
router.post("/:eventId", auth, sendMessage);

export default router;