"use strict";

const mongoose = require("mongoose");

async function connectDB() {
    try {
        // Use 127.0.0.1 (not localhost) in MONGO_URI — avoids IPv6 resolution issue in Node 18+
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;
