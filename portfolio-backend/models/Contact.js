"use strict";

const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: 100
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Invalid email address"]
        },
        subject: {
            type: String,
            trim: true,
            maxlength: 150,
            default: ""
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
            maxlength: 3000
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Contact", contactSchema);
