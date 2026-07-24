"use strict";

const Project = require("../models/Project");
const { removeUploadedFile, replaceUploadedFile } = require("../utils/fileCleanup");

// GET /api/projects  (public)
async function getProjects(req, res, next) {
    try {
        const filter = {};
        if (req.query.featured === "true") filter.featured = true;

        const items = await Project.find(filter).sort({ order: 1, createdAt: -1 });
        res.json({ success: true, items });
    } catch (error) {
        next(error);
    }
}

// POST /api/projects  (admin)
async function createProject(req, res, next) {
    try {
        const project = await Project.create(req.body);
        res.status(201).json({ success: true, item: project });
    } catch (error) {
        next(error);
    }
}

// PUT /api/projects/:id  (admin)
async function updateProject(req, res, next) {
    try {
        const existing = await Project.findById(req.params.id);

        if (!existing) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        const previousImage = existing.image;

        const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // The image was swapped out — drop the old file from disk.
        replaceUploadedFile(previousImage, project.image);

        res.json({ success: true, item: project });
    } catch (error) {
        next(error);
    }
}

// DELETE /api/projects/:id  (admin)
async function deleteProject(req, res, next) {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        removeUploadedFile(project.image);

        res.json({ success: true, message: "Project deleted" });
    } catch (error) {
        next(error);
    }
}

// POST /api/projects/upload  (admin — multer handles the file)
async function uploadImage(req, res) {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No image file received" });
    }

    res.status(201).json({
        success: true,
        url: req.file.path
    });
}

module.exports = { getProjects, createProject, updateProject, deleteProject, uploadImage };
