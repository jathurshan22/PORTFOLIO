"use strict";

const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

async function protect(req, res, next) {
    try {
        const header = req.headers.authorization || "";

        if (!header.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Not authorized, no token" });
        }

        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ success: false, message: "Not authorized, admin not found" });
        }

        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
}

module.exports = { protect };
