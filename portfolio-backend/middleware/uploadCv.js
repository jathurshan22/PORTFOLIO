"use strict";

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "portfolio/cv",
        resource_type: "raw",
        allowed_formats: ["pdf"]
    }
});

const uploadCv = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = uploadCv;