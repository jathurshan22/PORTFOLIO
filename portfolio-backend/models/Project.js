"use strict";

const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: 150
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            maxlength: 1000
        },
        techStack: {
            type: [String],
            default: []
        },
        role: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ""
        },
        features: {
            type: [String],
            default: []
        },
        status: {
            type: String,
            enum: ["completed", "in-progress"],
            default: "completed"
        },
        image: {
            type: String,
            default: ""
        },
        liveUrl: {
            type: String,
            trim: true,
            default: ""
        },
        githubUrl: {
            type: String,
            trim: true,
            default: ""
        },
        featured: {
            type: Boolean,
            default: false
        },
        order: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
