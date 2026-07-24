"use strict";

const mongoose = require("mongoose");

const skillItemSchema = new mongoose.Schema(
    {
        mark: { type: String, trim: true, maxlength: 4, default: "" },
        name: { type: String, trim: true, maxlength: 60, default: "" },
        detail: { type: String, trim: true, maxlength: 100, default: "" }
    },
    { _id: false }
);

const skillCategorySchema = new mongoose.Schema(
    {
        key: {
            type: String,
            enum: ["frontend", "backend", "database", "languages", "tools"],
            required: true
        },
        heading: { type: String, trim: true, maxlength: 80, default: "" },
        description: { type: String, trim: true, maxlength: 300, default: "" },
        items: { type: [skillItemSchema], default: [] }
    },
    { _id: false }
);

const miniCardSchema = new mongoose.Schema(
    {
        label: { type: String, trim: true, maxlength: 30, default: "" },
        value: { type: String, trim: true, maxlength: 80, default: "" }
    },
    { _id: false }
);

const educationItemSchema = new mongoose.Schema(
    {
        year: { type: String, trim: true, maxlength: 40, default: "" },
        status: { type: String, enum: ["ongoing", "done"], default: "done" },
        statusLabel: { type: String, trim: true, maxlength: 30, default: "" },
        degree: { type: String, trim: true, maxlength: 150, default: "" },
        place: { type: String, trim: true, maxlength: 150, default: "" },
        institute: { type: String, trim: true, maxlength: 150, default: "" },
        note: { type: String, trim: true, maxlength: 400, default: "" },
        tags: { type: [String], default: [] }
    },
    { _id: false }
);

const certificateItemSchema = new mongoose.Schema(
    {
        title: { type: String, trim: true, maxlength: 150, default: "" },
        issuer: { type: String, trim: true, maxlength: 150, default: "" },
        year: { type: String, trim: true, maxlength: 40, default: "" },
        credentialId: { type: String, trim: true, maxlength: 120, default: "" },
        url: { type: String, trim: true, maxlength: 400, default: "" },
        image: { type: String, trim: true, maxlength: 400, default: "" },
        note: { type: String, trim: true, maxlength: 400, default: "" },
        tags: { type: [String], default: [] }
    },
    { _id: false }
);

const siteContentSchema = new mongoose.Schema(
    {
        hero: {
            badge: { type: String, trim: true, maxlength: 80, default: "" },
            titleLine1: { type: String, trim: true, maxlength: 60, default: "" },
            titleLine2: { type: String, trim: true, maxlength: 60, default: "" },
            titleHighlight: { type: String, trim: true, maxlength: 60, default: "" },
            description: { type: String, trim: true, maxlength: 300, default: "" }
        },
        about: {
            story: { type: String, trim: true, maxlength: 3000, default: "" },
            miniCards: { type: [miniCardSchema], default: [] }
        },
        skills: { type: [skillCategorySchema], default: [] },
        education: { type: [educationItemSchema], default: [] },
        certificates: { type: [certificateItemSchema], default: [] },
        settings: {
            email: { type: String, trim: true, maxlength: 120, default: "" },
            location: { type: String, trim: true, maxlength: 80, default: "" },
            statusText: { type: String, trim: true, maxlength: 120, default: "" },
            available: { type: Boolean, default: true },
            linkedinUrl: { type: String, trim: true, maxlength: 300, default: "" },
            githubUrl: { type: String, trim: true, maxlength: 300, default: "" },
            cvUrl: { type: String, trim: true, maxlength: 300, default: "" }
        }
    },
    { timestamps: true }
);

// Defaults mirror the current hardcoded index.html content, so the site
// looks identical the first time the document is created.
const EDUCATION_DEFAULTS = [
    {
        year: "2023 \u2014 Present",
        status: "ongoing",
        statusLabel: "Ongoing",
        degree: "BSc (Hons) in Information & Communication Technology",
        place: "Department of ICT, Faculty of Technology",
        institute: "Rajarata University of Sri Lanka",
        note:
            "Studying software engineering, databases, networking and system design, alongside hands-on full-stack projects.",
        tags: ["Software Engineering", "Databases", "Web Development"]
    },
    {
        year: "20XX \u2014 20XX",
        status: "done",
        statusLabel: "Completed",
        degree: "G.C.E. Advanced Level",
        place: "Physical Science Stream",
        institute: "Your School Name",
        note:
            "Built a strong base in mathematics and logical problem solving, which led me towards technology.",
        tags: ["Combined Maths", "Physics", "Chemistry"]
    },
    {
        year: "20XX",
        status: "done",
        statusLabel: "Completed",
        degree: "G.C.E. Ordinary Level",
        place: "Secondary Education",
        institute: "Your School Name",
        note: "Where my interest in computers and building things on a screen first started.",
        tags: ["ICT", "Mathematics", "Science"]
    }
];

const SITE_CONTENT_DEFAULTS = {
    hero: {
        badge: "SOFTWARE ENGINEERING STUDENT",
        titleLine1: "Building Digital",
        titleLine2: "Experiences",
        titleHighlight: "That Matter.",
        description:
            "ICT Undergraduate & Aspiring Software Engineer crafting practical, user-focused digital solutions."
    },
    about: {
        story: [
            "I\u2019m Jathurshan, an ICT undergraduate with a strong interest in Full-Stack Development.",
            "",
            "I enjoy building complete web applications, from creating responsive and user-friendly front-end interfaces to developing back-end systems and working with databases. I\u2019m focused on improving my skills through practical projects and real-world development experience.",
            "",
            "My goal is to become a professional Full-Stack Developer and build modern, reliable, and useful digital solutions. I\u2019m continuously learning new technologies and expanding my skills to grow as a developer."
        ].join("\n"),
        miniCards: [
            { label: "ROLE", value: "ICT Undergraduate" },
            { label: "FOCUS", value: "Software Engineering" },
            { label: "MINDSET", value: "Build \u00b7 Learn \u00b7 Improve" }
        ]
    },
    skills: [
        {
            key: "frontend",
            heading: "Frontend Development",
            description:
                "Creating clean, responsive interfaces with strong visual structure, smooth interactions, and a focus on usability.",
            items: [
                { mark: "H5", name: "HTML5", detail: "Semantic page structure" },
                { mark: "C3", name: "CSS3", detail: "Modern layouts & animation" },
                { mark: "JS", name: "JavaScript", detail: "Interactive web experiences" },
                { mark: "RD", name: "Responsive Design", detail: "Mobile-first interfaces" }
            ]
        },
        {
            key: "backend",
            heading: "Backend Development",
            description:
                "Developing server-side logic, APIs, and application workflows for reliable and maintainable web applications.",
            items: [
                { mark: "NJ", name: "Node.js", detail: "JavaScript runtime" },
                { mark: "EX", name: "Express.js", detail: "Web server framework" }
            ]
        },
        {
            key: "database",
            heading: "Database",
            description:
                "Structuring, storing, and managing application data for useful, organized, and scalable digital systems.",
            items: [
                { mark: "MG", name: "MongoDB", detail: "NoSQL database" },
                { mark: "MY", name: "MySQL", detail: "Relational database" }
            ]
        },
        {
            key: "languages",
            heading: "Languages",
            description:
                "Using programming fundamentals and problem-solving skills to create software logic and practical solutions.",
            items: [
                { mark: "JV", name: "Java", detail: "Object-oriented programming" },
                { mark: "PY", name: "Python", detail: "Problem solving & scripting" },
                { mark: "JS", name: "JavaScript", detail: "Web application logic" }
            ]
        },
        {
            key: "tools",
            heading: "Tools & Design",
            description:
                "Using development, version-control, and design tools to plan, build, improve, and present digital products.",
            items: [
                { mark: "GT", name: "Git & GitHub", detail: "Version control" },
                { mark: "VS", name: "VS Code", detail: "Development environment" },
                { mark: "FG", name: "Figma", detail: "UI/UX design" },
                { mark: "CV", name: "Canva", detail: "Visual content design" }
            ]
        }
    ],
    education: EDUCATION_DEFAULTS,
    certificates: [],
    settings: {
        email: "jathurshanjohn2217@gmail.com",
        location: "Sri Lanka",
        statusText: "Available for projects & collaboration",
        available: true,
        linkedinUrl: "",
        githubUrl: "",
        cvUrl: ""
    }
};

const SiteContent = mongoose.model("SiteContent", siteContentSchema);

module.exports = { SiteContent, SITE_CONTENT_DEFAULTS, EDUCATION_DEFAULTS };
