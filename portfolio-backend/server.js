"use strict";

require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");
const projectRoutes = require("./routes/projectRoutes");
const siteRoutes = require("./routes/siteRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

connectDB();

// Behind a hosting proxy (Render / Railway / Nginx) so express-rate-limit
// sees the real client IP instead of the proxy IP.
app.set("trust proxy", 1);

// ---------- Security & parsing ----------
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// The backend serves the frontend from the same origin, so cross-origin
// requests are only needed if CLIENT_ORIGINS is set in .env
// (comma separated list, e.g. https://mysite.com,https://www.mysite.com)
const allowedOrigins = (process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

if (allowedOrigins.length) {
    app.use(cors({ origin: allowedOrigins, credentials: true }));
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// Global API rate limit: 300 requests / 15 min per IP
app.use(
    "/api",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false
    })
);

// ---------- API routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/site", siteRoutes);

app.get("/api/health", (req, res) => {
    res.json({ success: true, status: "ok" });
});

// ---------- Static files ----------
// Uploaded blog/project images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Frontend (put your portfolio files in ../portfolio or change this path)
const FRONTEND_DIR = path.join(__dirname, "..", "portfolio");
app.use(express.static(FRONTEND_DIR));

app.get("/", (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// ---------- Errors ----------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
