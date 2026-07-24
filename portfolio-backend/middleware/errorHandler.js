"use strict";

function notFound(req, res, next) {
    res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
    console.error(err);

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ success: false, message: messages.join(", ") });
    }

    // Bad ObjectId
    if (err.name === "CastError") {
        return res.status(400).json({ success: false, message: "Invalid id format" });
    }

    // Duplicate key
    if (err.code === 11000) {
        return res.status(409).json({ success: false, message: "Duplicate value not allowed" });
    }

    // Multer file size / type errors
    if (err.name === "MulterError") {
        return res.status(400).json({ success: false, message: err.message });
    }

    const status = err.statusCode || 500;
    res.status(status).json({
        success: false,
        message: err.message || "Server error"
    });
}

module.exports = { notFound, errorHandler };
