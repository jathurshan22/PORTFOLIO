"use strict";

const express = require("express");
const {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    uploadImage
} = require("../controllers/projectController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", getProjects);

router.post("/upload", protect, upload.single("image"), uploadImage);
router.post("/", protect, createProject);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

module.exports = router;
