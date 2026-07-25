"use strict";

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const crypto = require("crypto");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
        folder: "portfolio/cv",
        resource_type: "raw",
        public_id: `cv-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.pdf`
    })
});

const uploadCv = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") cb(null, true);
        else cb(new Error("Only PDF files are allowed for the CV"));
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = uploadCv;