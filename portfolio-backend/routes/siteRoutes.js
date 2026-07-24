"use strict";

const express = require("express");
const {
    getSiteContent,
    updateSiteContent,
    uploadCv,
    removeCv
} = require("../controllers/siteController");
const { protect } = require("../middleware/auth");
const uploadCvFile = require("../middleware/uploadCv");

const router = express.Router();

router.get("/", getSiteContent);
router.put("/", protect, updateSiteContent);

router.post("/cv", protect, uploadCvFile.single("cv"), uploadCv);
router.delete("/cv", protect, removeCv);

module.exports = router;
