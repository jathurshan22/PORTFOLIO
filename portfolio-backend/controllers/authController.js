"use strict";

const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

function signToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    });
}

// POST /api/auth/login
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select("+password");

        if (!admin || !(await admin.comparePassword(password))) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = signToken(admin._id);

        res.json({
            success: true,
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email }
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/auth/me  (protected)
async function getMe(req, res) {
    res.json({
        success: true,
        admin: { id: req.admin._id, name: req.admin.name, email: req.admin.email }
    });
}

module.exports = { login, getMe };
