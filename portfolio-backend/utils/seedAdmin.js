"use strict";

const Admin = require("../models/Admin");

async function seedAdmin() {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) return;

    if (ADMIN_PASSWORD.length < 8) {
        console.error("ADMIN_PASSWORD must be at least 8 characters - admin not created");
        return;
    }

    try {
        const email = ADMIN_EMAIL.toLowerCase();
        const existing = await Admin.findOne({ email });

        if (existing) {
            console.log(`Admin already exists: ${email}`);
            return;
        }

        await Admin.create({ name: ADMIN_NAME, email, password: ADMIN_PASSWORD });
        console.log(`Admin created: ${email}`);
    } catch (error) {
        console.error(`Admin seed failed: ${error.message}`);
    }
}

module.exports = seedAdmin;