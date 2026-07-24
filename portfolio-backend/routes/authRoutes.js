"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const { login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many login attempts, try again later" }
});

router.post("/login", loginLimiter, login);
router.get("/me", protect, getMe);

module.exports = router;
