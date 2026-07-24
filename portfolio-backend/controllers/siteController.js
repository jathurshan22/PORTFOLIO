"use strict";

const {
    SiteContent,
    SITE_CONTENT_DEFAULTS,
    EDUCATION_DEFAULTS
} = require("../models/SiteContent");
const { removeUploadedFile, replaceUploadedFile } = require("../utils/fileCleanup");

// The site content is a single document. Create it from defaults the
// first time it is requested.
async function getOrCreateSiteContent() {
    let doc = await SiteContent.findOne();
    if (!doc) {
        doc = await SiteContent.create(SITE_CONTENT_DEFAULTS);
        return doc;
    }

    // Older documents were created before the education section existed —
    // seed them once so the admin panel never opens empty.
    if (!Array.isArray(doc.education) || doc.education.length === 0) {
        doc.education = EDUCATION_DEFAULTS;
        await doc.save();
    }

    return doc;
}

// GET /api/site — public, used by the main site
async function getSiteContent(req, res, next) {
    try {
        const doc = await getOrCreateSiteContent();
        res.json({ success: true, item: doc });
    } catch (error) {
        next(error);
    }
}

// PUT /api/site — admin only. Accepts any of: hero, about, skills, settings.
// Only the sections present in the body are updated.
async function updateSiteContent(req, res, next) {
    try {
        const doc = await getOrCreateSiteContent();
        const { hero, about, skills, education, certificates, settings } = req.body || {};

        if (hero && typeof hero === "object") {
            doc.hero = Object.assign(doc.hero.toObject(), hero);
        }

        if (about && typeof about === "object") {
            const next_ = doc.about.toObject();
            if (typeof about.story === "string") next_.story = about.story;
            if (Array.isArray(about.miniCards)) next_.miniCards = about.miniCards;
            doc.about = next_;
        }

        if (Array.isArray(skills)) {
            doc.skills = skills;
        }

        if (Array.isArray(education)) {
            doc.education = education;
        }

        if (Array.isArray(certificates)) {
            // Any certificate image that is no longer referenced can be
            // dropped from disk.
            const oldImages = (doc.certificates || [])
                .map((item) => item.image)
                .filter(Boolean);
            const newImages = new Set(
                certificates.map((item) => item && item.image).filter(Boolean)
            );

            oldImages
                .filter((image) => !newImages.has(image))
                .forEach(removeUploadedFile);

            doc.certificates = certificates;
        }

        if (settings && typeof settings === "object") {
            doc.settings = Object.assign(doc.settings.toObject(), settings);
        }

        await doc.save();
        res.json({ success: true, item: doc });
    } catch (error) {
        next(error);
    }
}

// POST /api/site/cv — admin only. Multer handles the PDF file.
// Saves the URL onto settings.cvUrl and returns it.
async function uploadCv(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No CV file received" });
        }

        const doc = await getOrCreateSiteContent();
        const previousCv = doc.settings.cvUrl;
        const url = req.file.path;

        doc.settings.cvUrl = url;
        await doc.save();

        replaceUploadedFile(previousCv, url);

        res.status(201).json({ success: true, url });
    } catch (error) {
        next(error);
    }
}

// DELETE /api/site/cv — admin only. Clears the stored CV link.
async function removeCv(req, res, next) {
    try {
        const doc = await getOrCreateSiteContent();
        const previousCv = doc.settings.cvUrl;

        doc.settings.cvUrl = "";
        await doc.save();

        removeUploadedFile(previousCv);

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
}

module.exports = { getSiteContent, updateSiteContent, uploadCv, removeCv };
