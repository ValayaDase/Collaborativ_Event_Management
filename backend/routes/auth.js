// backend/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { auth } from "../middleware/auth.js";  // ✅ Import auth middleware

const router = express. Router();

// ✅ SIGNUP
router. post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.json({ success: false, error: "User already exists" });  // ✅ Added success:  false

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password:  hashed
    });

    res.json({ success: true, message: "Signup successful" });  // ✅ Added success:  true
  } catch (error) {
    res.json({ success: false, error: error.message });  // ✅ Added success: false
  }
});

// ✅ LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, error: "User not found" });  // ✅ Added success: false

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, error: "Incorrect password" });  // ✅ Added success: false

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      userId: user._id,  // ✅ Added userId for localStorage
      username: user.username,  // ✅ Added username for localStorage
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    res.json({ success: false, error: error.message });  // ✅ Added success: false
  }
});

// ✅ VERIFY TOKEN (For Protected Routes)
router.get("/verify", auth, (req, res) => {
  res.json({ success: true, userId: req.userId });
});

// ✅ FORGOT PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, error: "Email not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

    await user.save();

    res.json({ success: true, message: "Password updated!" });
  } catch (error) {
    res.json({ success: false, error: error. message });  // ✅ Added error handling
  }
});

export default router;