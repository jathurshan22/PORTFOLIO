"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const {
    createContact,
    getContacts,
    markAsRead,
    deleteContact
} = require("../controllers/contactController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Max 5 contact submissions per hour per IP (spam protection)
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many messages sent, try again later" }
});

router.post("/", contactLimiter, createContact);

router.get("/", protect, getContacts);
router.patch("/:id/read", protect, markAsRead);
router.delete("/:id", protect, deleteContact);

module.exports = router;
