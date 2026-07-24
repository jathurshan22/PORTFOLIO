"use strict";

const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// Deletes a file that was stored as "/uploads/<name>".
// Safe to call with empty / external / malformed values — it simply does nothing.
// Never throws: a failed cleanup must not break the API response.
function removeUploadedFile(url) {
    if (!url || typeof url !== "string") return;
    if (!url.startsWith("/uploads/")) return;

    const filename = path.basename(url);
    if (!filename || filename === ".gitkeep") return;

    const target = path.join(UPLOADS_DIR, filename);

    // Guard against path traversal — the resolved path must stay inside uploads/
    if (!target.startsWith(UPLOADS_DIR + path.sep)) return;

    fs.promises.unlink(target).catch(() => {
        // File already gone or never existed — nothing to do.
    });
}

// Removes the old file only when it is actually being replaced by a new one.
function replaceUploadedFile(oldUrl, newUrl) {
    if (!oldUrl || oldUrl === newUrl) return;
    removeUploadedFile(oldUrl);
}

module.exports = { removeUploadedFile, replaceUploadedFile, UPLOADS_DIR };
