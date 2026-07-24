"use strict";

// Usage: npm run create-admin
// Reads ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from .env

require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

async function run() {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.error("Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env first");
        process.exit(1);
    }

    if (ADMIN_PASSWORD.length < 8) {
        console.error("ADMIN_PASSWORD must be at least 8 characters");
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);

    const existing = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    if (existing) {
        existing.name = ADMIN_NAME;
        existing.password = ADMIN_PASSWORD; // re-hashed by pre-save hook
        await existing.save();
        console.log(`Admin updated: ${existing.email}`);
    } else {
        const admin = await Admin.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        console.log(`Admin created: ${admin.email}`);
    }

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
