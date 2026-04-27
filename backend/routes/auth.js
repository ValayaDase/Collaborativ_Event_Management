import express from "express";
import { auth } from "../middleware/auth.js";
import { signup, login, verify, resetPassword } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/verify", auth, verify);
router.post("/reset-password", resetPassword);

export default router;