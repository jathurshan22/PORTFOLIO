"use strict";

const Contact = require("../models/Contact");

// POST /api/contact  (public)
async function createContact(req, res, next) {
    try {
        const { name, email, subject, message } = req.body;

        const contact = await Contact.create({ name, email, subject, message });

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            id: contact._id
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/contact?page=1&unread=true  (admin)
async function getContacts(req, res, next) {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

        const filter = {};
        if (req.query.unread === "true") filter.isRead = false;

        const [items, total, unreadCount] = await Promise.all([
            Contact.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Contact.countDocuments(filter),
            Contact.countDocuments({ isRead: false })
        ]);

        res.json({
            success: true,
            page,
            totalPages: Math.ceil(total / limit),
            total,
            unreadCount,
            items
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/contact/:id/read  (admin)
async function markAsRead(req, res, next) {
    try {
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        res.json({ success: true, item: contact });
    } catch (error) {
        next(error);
    }
}

// DELETE /api/contact/:id  (admin)
async function deleteContact(req, res, next) {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);

        if (!contact) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        res.json({ success: true, message: "Message deleted" });
    } catch (error) {
        next(error);
    }
}

module.exports = { createContact, getContacts, markAsRead, deleteContact };
