"use strict";

// =========================================================
// AUTH GUARD + API HELPER
// =========================================================

const TOKEN_KEY = "admin_token";

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("admin_name");
    window.location.replace("/admin/login.html");
}

if (!getToken()) {
    logout();
}

async function api(path, options = {}) {
    const headers = Object.assign(
        { Authorization: `Bearer ${getToken()}` },
        options.headers || {}
    );

    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(options.body);
    }

    const response = await fetch(path, Object.assign({}, options, { headers }));

    if (response.status === 401) {
        logout();
        throw new Error("Session expired");
    }

    const data = await response.json();

    if (!response.ok || data.success === false) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}

function esc(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
}

function formatDate(value) {
    return new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


// =========================================================
// TOASTS + CONFIRM MODAL
// =========================================================

const toastStack = document.getElementById("toastStack");

function toast(message, type = "") {
    const el = document.createElement("div");
    el.className = `toast ${type ? `is-${type}` : ""}`;
    el.textContent = message;
    toastStack.appendChild(el);

    window.setTimeout(() => {
        el.classList.add("is-leaving");
        window.setTimeout(() => el.remove(), 350);
    }, 3200);
}

const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmText = document.getElementById("confirmText");
const confirmOk = document.getElementById("confirmOk");
const confirmCancel = document.getElementById("confirmCancel");

let confirmAction = null;

function askConfirm(title, text, action) {
    confirmTitle.textContent = title;
    confirmText.textContent = text;
    confirmAction = action;
    confirmModal.hidden = false;
}

confirmCancel.addEventListener("click", () => {
    confirmModal.hidden = true;
    confirmAction = null;
});

confirmModal.addEventListener("click", (event) => {
    if (event.target === confirmModal) {
        confirmModal.hidden = true;
        confirmAction = null;
    }
});

confirmOk.addEventListener("click", async () => {
    confirmModal.hidden = true;
    if (confirmAction) {
        const action = confirmAction;
        confirmAction = null;
        await action();
    }
});


// =========================================================
// VIEW SWITCHING
// =========================================================

const VIEW_TITLES = {
    dashboard: "Dashboard",
    inbox: "Inbox",
    projects: "Projects",
    site: "Site content"
};

const navLinks = document.querySelectorAll(".admin-nav-link[data-view]");
const viewTitle = document.getElementById("viewTitle");

function showView(name) {
    document.querySelectorAll(".admin-view").forEach((view) => {
        const shouldShow = view.id === `view-${name}`;
        view.classList.remove("is-visible");
        if (shouldShow) {
            void view.offsetWidth; // restart the enter animation
            view.classList.add("is-visible");
        }
    });

    navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.view === name);
    });

    viewTitle.textContent = VIEW_TITLES[name] || name;

    if (name === "dashboard") loadDashboard();
    if (name === "inbox") loadInbox();
    if (name === "projects") loadProjectList();
    if (name === "site") loadSiteContent();
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => showView(link.dataset.view));
});


// ---------- Mobile 3-dot menu ----------

const adminSidebar = document.querySelector(".admin-sidebar");
const adminMenuButton = document.getElementById("adminMenuButton");

function setMenu(open) {
    adminSidebar.classList.toggle("menu-open", open);
    adminMenuButton.classList.toggle("is-open", open);
    adminMenuButton.setAttribute("aria-expanded", String(open));
    adminMenuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

adminMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenu(!adminSidebar.classList.contains("menu-open"));
});

// Pick a link → menu closes
adminSidebar.querySelectorAll(".admin-nav-link").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
});

// Tap outside or press Escape → menu closes
document.addEventListener("click", (event) => {
    if (!adminSidebar.contains(event.target)) setMenu(false);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
});

document.querySelectorAll("[data-view-jump]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewJump));
});

document.getElementById("logoutButton").addEventListener("click", logout);

const adminName = localStorage.getItem("admin_name");
if (adminName) {
    
}


// =========================================================
// DASHBOARD
// =========================================================

const navUnreadBadge = document.getElementById("navUnreadBadge");

function updateUnreadBadge(count) {
    navUnreadBadge.hidden = !count;
    navUnreadBadge.textContent = count;
}

function countUp(el, target) {
    const value = Number(target) || 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || value <= 0) {
        el.textContent = value;
        return;
    }

    const duration = 700;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(value * eased);
        if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

async function loadDashboard() {
    const recentBox = document.getElementById("dashboardRecent");

    try {
        const [contacts, projects] = await Promise.all([
            api("/api/contact?page=1&limit=5"),
            api("/api/projects")
        ]);

        countUp(document.getElementById("statMessages"), contacts.total);
        document.getElementById("statUnread").textContent = `${contacts.unreadCount} unread`;
        updateUnreadBadge(contacts.unreadCount);

        const featured = projects.items.filter((p) => p.featured).length;
        countUp(document.getElementById("statProjects"), projects.items.length);
        document.getElementById("statFeatured").textContent = `${featured} featured`;

        if (!contacts.items.length) {
            recentBox.innerHTML = `<p class="empty-note">No messages yet. When someone uses the contact form, it shows up here.</p>`;
            return;
        }

        recentBox.innerHTML = contacts.items
            .map(
                (item) => `
                <div class="row-item">
                    <div class="row-main">
                        <strong>${esc(item.name)} ${item.isRead ? "" : "· <span style='color:var(--gold-bright)'>new</span>"}</strong>
                        <small>${esc(item.subject || "No subject")} — ${formatDate(item.createdAt)}</small>
                    </div>
                </div>`
            )
            .join("");
    } catch (error) {
        recentBox.innerHTML = `<p class="empty-note">${esc(error.message)}</p>`;
    }
}


// =========================================================
// INBOX
// =========================================================

const inboxList = document.getElementById("inboxList");
const unreadOnlyToggle = document.getElementById("unreadOnlyToggle");

const inboxState = { unreadOnly: false };

unreadOnlyToggle.addEventListener("change", () => {
    inboxState.unreadOnly = unreadOnlyToggle.checked;
    loadInbox();
});

async function loadInbox() {
    inboxList.innerHTML = `<p class="empty-note">Loading...</p>`;

    try {
        const query = `page=1&limit=100${inboxState.unreadOnly ? "&unread=true" : ""}`;
        const data = await api(`/api/contact?${query}`);

        updateUnreadBadge(data.unreadCount);

        if (!data.items.length) {
            inboxList.innerHTML = `<p class="empty-note">${
                inboxState.unreadOnly ? "No unread messages." : "Inbox is empty."
            }</p>`;
            return;
        }

        inboxList.innerHTML = data.items.map(renderMailItem).join("");

        bindMailItems();
    } catch (error) {
        inboxList.innerHTML = `<p class="empty-note">${esc(error.message)}</p>`;
    }
}

function renderMailItem(item) {
    return `
        <article class="mail-item ${item.isRead ? "" : "is-unread"}" data-id="${item._id}">
            <button class="mail-head" type="button">
                <span class="mail-dot" aria-hidden="true"></span>
                <span class="mail-meta">
                    <strong>${esc(item.name)}</strong>
                    <small>${esc(item.subject || "No subject")} · ${esc(item.email)}</small>
                </span>
                <span class="mail-date">${formatDate(item.createdAt)}</span>
            </button>
            <div class="mail-body">
                <div class="mail-body-inner">
                <p class="mail-message">${esc(item.message)}</p>
                <div class="mail-actions">
                    <a class="admin-button" href="mailto:${esc(item.email)}?subject=Re: ${encodeURIComponent(item.subject || "your message")}">
                        Reply by email
                    </a>
                    <button class="admin-button admin-button-danger mail-delete" type="button">
                        Delete
                    </button>
                </div>
                </div>
            </div>
        </article>`;
}

function bindMailItems() {
    inboxList.querySelectorAll(".mail-item").forEach((item) => {
        const id = item.dataset.id;

        item.querySelector(".mail-head").addEventListener("click", async () => {
            const opening = !item.classList.contains("is-open");
            item.classList.toggle("is-open", opening);

            if (opening && item.classList.contains("is-unread")) {
                try {
                    const data = await api(`/api/contact/${id}/read`, { method: "PATCH" });
                    item.classList.remove("is-unread");

                    // Refresh unread badge quietly
                    const fresh = await api("/api/contact?page=1&limit=1");
                    updateUnreadBadge(fresh.unreadCount);
                } catch (error) {
                    toast(error.message, "error");
                }
            }
        });

        item.querySelector(".mail-delete").addEventListener("click", () => {
            const sender = item.querySelector(".mail-meta strong").textContent;

            askConfirm(
                "Delete message?",
                `The message from ${sender} will be permanently deleted.`,
                async () => {
                    try {
                        await api(`/api/contact/${id}`, { method: "DELETE" });
                        toast("Message deleted", "success");
                        loadInbox();
                    } catch (error) {
                        toast(error.message, "error");
                    }
                }
            );
        });
    });
}


// =========================================================
// PROJECTS
// =========================================================

const projectListPanel = document.getElementById("projectListPanel");
const projectEditorPanel = document.getElementById("projectEditorPanel");
const projectList = document.getElementById("projectList");
const projectForm = document.getElementById("projectForm");
const projectImagePreview = document.getElementById("projectImagePreview");
const projectImagePreviewImg = document.getElementById("projectImagePreviewImg");

let currentProjectImageUrl = "";
let currentCvUrl = "";

function openProjectEditor(project = null) {
    projectListPanel.hidden = true;
    projectEditorPanel.hidden = false;

    document.getElementById("projectEditorTitle").textContent = project ? "Edit project" : "New project";
    document.getElementById("projectId").value = project ? project._id : "";
    document.getElementById("projectTitle").value = project ? project.title : "";
    document.getElementById("projectDescription").value = project ? project.description : "";
    document.getElementById("projectTech").value = project ? project.techStack.join(", ") : "";
    document.getElementById("projectOrder").value = project ? project.order : 0;
    document.getElementById("projectRole").value = project ? project.role || "" : "";
    const statusSelect = document.getElementById("projectStatus");
    statusSelect.value = project ? project.status || "completed" : "completed";
    statusSelect.dispatchEvent(new Event("change"));
    document.getElementById("projectFeatures").value = project ? (project.features || []).join("\n") : "";
    document.getElementById("projectLive").value = project ? project.liveUrl : "";
    document.getElementById("projectGithub").value = project ? project.githubUrl : "";
    document.getElementById("projectFeatured").checked = project ? project.featured : false;
    document.getElementById("projectImageFile").value = "";

    currentProjectImageUrl = project ? project.image || "" : "";
    updateProjectImagePreview();
}

function closeProjectEditor() {
    projectEditorPanel.hidden = true;
    projectListPanel.hidden = false;
}

function updateProjectImagePreview() {
    const uploadZone = document.getElementById("projectUploadZone");
    if (currentProjectImageUrl) {
        projectImagePreviewImg.src = currentProjectImageUrl;
        projectImagePreview.hidden = false;
        uploadZone.hidden = true;
    } else {
        projectImagePreview.hidden = true;
        projectImagePreviewImg.removeAttribute("src");
        projectImagePreviewImg.closest(".cover-preview-frame").classList.remove("is-broken");
        uploadZone.hidden = false;
    }
}

document.getElementById("newProjectButton").addEventListener("click", () => openProjectEditor());
document.getElementById("closeProjectEditorButton").addEventListener("click", closeProjectEditor);

document.getElementById("removeProjectImageButton").addEventListener("click", () => {
    currentProjectImageUrl = "";
    document.getElementById("projectImageFile").value = "";
    updateProjectImagePreview();
});

document.getElementById("changeProjectImageButton").addEventListener("click", () => {
    document.getElementById("projectImageFile").click();
});

// Custom stepper for DISPLAY ORDER
document.querySelectorAll(".stepper-btn").forEach((button) => {
    button.addEventListener("click", () => {
        const input = document.getElementById("projectOrder");
        if (button.dataset.step === "up") input.stepUp();
        else input.stepDown();
    });
});

// Custom dropdown for PROJECT STATUS
(function initStatusSelect() {
    const wrap = document.getElementById("projectStatusSelect");
    const native = wrap.querySelector("select");
    const trigger = wrap.querySelector(".custom-select-trigger");
    const valueLabel = wrap.querySelector(".custom-select-value");
    const list = wrap.querySelector(".custom-select-options");

    function close() {
        wrap.classList.remove("is-open");
        list.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
    }

    function open() {
        wrap.classList.add("is-open");
        list.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
    }

    function sync() {
        const selected = native.options[native.selectedIndex];
        valueLabel.textContent = selected ? selected.textContent : "";
        list.querySelectorAll(".custom-select-option").forEach((item) => {
            item.classList.toggle("is-selected", item.dataset.value === native.value);
        });
    }

    // Build styled options from the native select
    Array.from(native.options).forEach((option) => {
        const item = document.createElement("li");
        item.className = "custom-select-option";
        item.setAttribute("role", "option");
        item.dataset.value = option.value;
        item.textContent = option.textContent;
        item.addEventListener("click", () => {
            native.value = option.value;
            native.dispatchEvent(new Event("change"));
            close();
        });
        list.appendChild(item);
    });

    trigger.addEventListener("click", () => (list.hidden ? open() : close()));
    document.addEventListener("click", (event) => {
        if (!wrap.contains(event.target)) close();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
    });
    native.addEventListener("change", sync);

    sync();
})();

// Image preview — styled fallback instead of broken image icon
const coverPreviewFrame = projectImagePreviewImg.closest(".cover-preview-frame");
projectImagePreviewImg.addEventListener("error", () => {
    coverPreviewFrame.classList.add("is-broken");
});
projectImagePreviewImg.addEventListener("load", () => {
    coverPreviewFrame.classList.remove("is-broken");
});

document.getElementById("projectImageFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
        toast("Uploading image...");
        const data = await api("/api/projects/upload", { method: "POST", body: formData });
        currentProjectImageUrl = data.url;
        updateProjectImagePreview();
        toast("Image uploaded", "success");
    } catch (error) {
        toast(error.message, "error");
        event.target.value = "";
    }
});

async function loadProjectList() {
    closeProjectEditor();
    projectList.innerHTML = `<p class="empty-note">Loading...</p>`;

    try {
        const data = await api("/api/projects");

        if (!data.items.length) {
            projectList.innerHTML = `<p class="empty-note">No projects yet. Add your first project.</p>`;
            return;
        }

        projectList.innerHTML = data.items
            .map(
                (project) => `
                <div class="row-item" data-id="${project._id}">
                    <div class="row-main">
                        <strong>${esc(project.title)}</strong>
                        <small>${esc(project.techStack.join(" · "))}</small>
                    </div>
                    ${project.featured ? `<span class="status-pill is-featured">FEATURED</span>` : ""}
                    <div class="row-actions">
                        <button class="admin-button project-edit" type="button">Edit</button>
                        <button class="admin-button admin-button-danger project-delete" type="button">Delete</button>
                    </div>
                </div>`
            )
            .join("");

        projectList.querySelectorAll(".row-item").forEach((row) => {
            const id = row.dataset.id;
            const project = data.items.find((p) => p._id === id);

            row.querySelector(".project-edit").addEventListener("click", () => openProjectEditor(project));

            row.querySelector(".project-delete").addEventListener("click", () => {
                askConfirm(
                    "Delete project?",
                    `"${project.title}" will be permanently deleted.`,
                    async () => {
                        try {
                            await api(`/api/projects/${id}`, { method: "DELETE" });
                            toast("Project deleted", "success");
                            loadProjectList();
                        } catch (error) {
                            toast(error.message, "error");
                        }
                    }
                );
            });
        });
    } catch (error) {
        projectList.innerHTML = `<p class="empty-note">${esc(error.message)}</p>`;
    }
}

projectForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = document.getElementById("projectId").value;
    const title = document.getElementById("projectTitle").value.trim();
    const description = document.getElementById("projectDescription").value.trim();

    if (!title || !description) {
        toast("Title and description are required", "error");
        return;
    }

    const payload = {
        title,
        description,
        techStack: document.getElementById("projectTech").value
            .split(",")
            .map((tech) => tech.trim())
            .filter(Boolean),
        order: Number(document.getElementById("projectOrder").value) || 0,
        role: document.getElementById("projectRole").value.trim(),
        status: document.getElementById("projectStatus").value,
        features: document.getElementById("projectFeatures").value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        liveUrl: document.getElementById("projectLive").value.trim(),
        githubUrl: document.getElementById("projectGithub").value.trim(),
        featured: document.getElementById("projectFeatured").checked,
        image: currentProjectImageUrl
    };

    const saveButton = document.getElementById("saveProjectButton");
    saveButton.disabled = true;

    try {
        if (id) {
            await api(`/api/projects/${id}`, { method: "PUT", body: payload });
            toast("Project updated", "success");
        } else {
            await api("/api/projects", { method: "POST", body: payload });
            toast("Project created", "success");
        }
        loadProjectList();
    } catch (error) {
        toast(error.message, "error");
    } finally {
        saveButton.disabled = false;
    }
});


// =========================================================
// SITE CONTENT
// =========================================================

const SKILL_CATEGORY_ORDER = ["frontend", "backend", "database", "languages", "tools"];
const SKILL_CATEGORY_LABELS = {
    frontend: "FRONTEND",
    backend: "BACKEND",
    database: "DATABASE",
    languages: "LANGUAGES",
    tools: "TOOLS & DESIGN"
};

const skillsEditor = document.getElementById("skillsEditor");

// "A | B | C" lines → array of objects with the given keys
function parsePipeLines(text, keys) {
    return String(text || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const parts = line.split("|").map((part) => part.trim());
            const item = {};
            keys.forEach((key, index) => {
                item[key] = parts[index] || "";
            });
            return item;
        });
}

function joinPipeLines(items, keys) {
    return (items || [])
        .map((item) => keys.map((key) => item[key] || "").join(" | "))
        .join("\n");
}

function renderSkillsEditor(skills) {
    skillsEditor.innerHTML = "";

    SKILL_CATEGORY_ORDER.forEach((key) => {
        const category = (skills || []).find((entry) => entry.key === key) || {
            key,
            heading: "",
            description: "",
            items: []
        };

        const block = document.createElement("div");
        block.className = "skills-editor-category";
        block.dataset.skillKey = key;

        const title = document.createElement("div");
        title.className = "skills-editor-category-title";
        title.textContent = SKILL_CATEGORY_LABELS[key];
        block.appendChild(title);

        const headingField = document.createElement("div");
        headingField.className = "admin-field";
        headingField.innerHTML = `<label>HEADING</label>`;
        const headingInput = document.createElement("input");
        headingInput.type = "text";
        headingInput.maxLength = 80;
        headingInput.dataset.skillField = "heading";
        headingInput.value = category.heading || "";
        headingField.appendChild(headingInput);
        block.appendChild(headingField);

        const descField = document.createElement("div");
        descField.className = "admin-field";
        descField.innerHTML = `<label>DESCRIPTION</label>`;
        const descArea = document.createElement("textarea");
        descArea.rows = 2;
        descArea.maxLength = 300;
        descArea.dataset.skillField = "description";
        descArea.value = category.description || "";
        descField.appendChild(descArea);
        block.appendChild(descField);

        const itemsField = document.createElement("div");
        itemsField.className = "admin-field";
        itemsField.innerHTML = `<label>SKILLS (one per line — MARK | Name | Detail)</label>`;
        const itemsArea = document.createElement("textarea");
        itemsArea.rows = 4;
        itemsArea.dataset.skillField = "items";
        itemsArea.placeholder = "H5 | HTML5 | Semantic page structure";
        itemsArea.value = joinPipeLines(category.items, ["mark", "name", "detail"]);
        itemsField.appendChild(itemsArea);
        const hint = document.createElement("p");
        hint.className = "field-hint";
        hint.textContent = "Format: MARK | Name | Detail";
        itemsField.appendChild(hint);
        block.appendChild(itemsField);

        skillsEditor.appendChild(block);
    });
}

// ---------------- Education editor ----------------

const educationEditor = document.getElementById("educationEditor");

function educationRowMarkup(item, index) {
    const status = item.status === "ongoing" ? "ongoing" : "done";
    const label = item.statusLabel || (status === "ongoing" ? "Ongoing" : "Completed");

    return `
        <div class="edu-row-head">
            <span class="edu-row-title">ENTRY ${index + 1}</span>
            <div class="edu-row-actions">
                <button type="button" class="edu-icon-btn" data-edu-move="up" aria-label="Move up">
                    <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 4.5 5 1.5 9 4.5"/></svg>
                </button>
                <button type="button" class="edu-icon-btn" data-edu-move="down" aria-label="Move down">
                    <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1.5 5 4.5 9 1.5"/></svg>
                </button>
                <button type="button" class="edu-icon-btn edu-icon-danger" data-edu-remove aria-label="Remove entry">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5"/></svg>
                </button>
            </div>
        </div>

        <div class="admin-form-row">
            <div class="admin-field">
                <label>YEAR / PERIOD</label>
                <input type="text" maxlength="40" data-edu-field="year" value="${esc(item.year)}" placeholder="2023 \u2014 Present">
            </div>

            <div class="admin-field">
                <label>STATUS</label>
                <div class="edu-status-toggle" data-edu-field="status" data-value="${status}">
                    <button type="button" data-status="ongoing" class="${status === "ongoing" ? "is-active" : ""}">Ongoing</button>
                    <button type="button" data-status="done" class="${status === "done" ? "is-active" : ""}">Completed</button>
                </div>
            </div>
        </div>

        <div class="admin-field">
            <label>DEGREE / QUALIFICATION</label>
            <input type="text" maxlength="150" data-edu-field="degree" value="${esc(item.degree)}" placeholder="BSc (Hons) in Information & Communication Technology">
        </div>

        <div class="admin-form-row">
            <div class="admin-field">
                <label>DEPARTMENT / STREAM</label>
                <input type="text" maxlength="150" data-edu-field="place" value="${esc(item.place)}" placeholder="Department of ICT, Faculty of Technology">
            </div>

            <div class="admin-field">
                <label>INSTITUTE (GOLD LINE)</label>
                <input type="text" maxlength="150" data-edu-field="institute" value="${esc(item.institute)}" placeholder="Rajarata University of Sri Lanka">
            </div>
        </div>

        <div class="admin-field">
            <label>NOTE</label>
            <textarea rows="2" maxlength="400" data-edu-field="note" placeholder="What you studied / why it mattered.">${esc(item.note)}</textarea>
        </div>

        <div class="admin-field">
            <label>TAGS (comma separated)</label>
            <input type="text" data-edu-field="tags" value="${esc((item.tags || []).join(", "))}" placeholder="Software Engineering, Databases, Web Development">
        </div>

        <div class="admin-field">
            <label>STATUS LABEL (optional)</label>
            <input type="text" maxlength="30" data-edu-field="statusLabel" value="${esc(item.statusLabel)}" placeholder="Ongoing">
            <p class="field-hint">Leave empty to use the status name</p>
        </div>
    `;
}

function renumberEducationRows() {
    educationEditor.querySelectorAll(".edu-row").forEach((row, index) => {
        const title = row.querySelector(".edu-row-title");
        if (title) title.textContent = `ENTRY ${index + 1}`;
    });
}

function appendEducationRow(item) {
    const empty = educationEditor.querySelector(".empty-note");
    if (empty) empty.remove();

    const row = document.createElement("div");
    row.className = "edu-row";
    row.innerHTML = educationRowMarkup(item, educationEditor.querySelectorAll(".edu-row").length);
    educationEditor.appendChild(row);
    return row;
}

function renderEducationEditor(education) {
    educationEditor.innerHTML = "";

    const list = Array.isArray(education) ? education : [];

    if (!list.length) {
        educationEditor.innerHTML = `<p class="empty-note">No education entries yet — add one.</p>`;
        return;
    }

    list.forEach((item) => appendEducationRow(item || {}));
}

function collectEducation() {
    return Array.from(educationEditor.querySelectorAll(".edu-row")).map((row) => {
        const get = (field) => {
            const el = row.querySelector(`[data-edu-field="${field}"]`);
            return el ? el.value.trim() : "";
        };

        const toggle = row.querySelector('[data-edu-field="status"]');
        const status = toggle?.dataset.value === "ongoing" ? "ongoing" : "done";

        return {
            year: get("year"),
            status,
            statusLabel: get("statusLabel") || (status === "ongoing" ? "Ongoing" : "Completed"),
            degree: get("degree"),
            place: get("place"),
            institute: get("institute"),
            note: get("note"),
            tags: get("tags")
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
        };
    });
}

// Add / remove / reorder / status toggle — all through delegation
document.getElementById("addEducationButton").addEventListener("click", () => {
    const row = appendEducationRow({ status: "done", statusLabel: "Completed", tags: [] });
    renumberEducationRows();
    row.scrollIntoView({ behavior: "smooth", block: "center" });
});

educationEditor.addEventListener("click", (event) => {
    const row = event.target.closest(".edu-row");
    if (!row) return;

    const statusBtn = event.target.closest("[data-status]");
    if (statusBtn) {
        const toggle = statusBtn.parentElement;
        toggle.dataset.value = statusBtn.dataset.status;
        toggle.querySelectorAll("button").forEach((btn) => {
            btn.classList.toggle("is-active", btn === statusBtn);
        });

        // Keep the optional label in sync while it is still a default value
        const labelInput = row.querySelector('[data-edu-field="statusLabel"]');
        if (labelInput && (!labelInput.value.trim() || ["Ongoing", "Completed"].includes(labelInput.value.trim()))) {
            labelInput.value = statusBtn.dataset.status === "ongoing" ? "Ongoing" : "Completed";
        }
        return;
    }

    if (event.target.closest("[data-edu-remove]")) {
        row.remove();
        renumberEducationRows();
        if (!educationEditor.querySelector(".edu-row")) {
            educationEditor.innerHTML = `<p class="empty-note">No education entries yet — add one.</p>`;
        }
        return;
    }

    const moveBtn = event.target.closest("[data-edu-move]");
    if (moveBtn) {
        if (moveBtn.dataset.eduMove === "up" && row.previousElementSibling) {
            row.parentElement.insertBefore(row, row.previousElementSibling);
        } else if (moveBtn.dataset.eduMove === "down" && row.nextElementSibling) {
            row.parentElement.insertBefore(row.nextElementSibling, row);
        }
        renumberEducationRows();
    }
});



// ---------------- Certificates editor ----------------

const certificatesEditor = document.getElementById("certificatesEditor");

function certificateRowMarkup(item, index) {
    const image = item.image || "";

    return `
        <div class="edu-row-head">
            <span class="edu-row-title">CERTIFICATE ${index + 1}</span>
            <div class="edu-row-actions">
                <button type="button" class="edu-icon-btn" data-cert-move="up" aria-label="Move up">
                    <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 4.5 5 1.5 9 4.5"/></svg>
                </button>
                <button type="button" class="edu-icon-btn" data-cert-move="down" aria-label="Move down">
                    <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1.5 5 4.5 9 1.5"/></svg>
                </button>
                <button type="button" class="edu-icon-btn edu-icon-danger" data-cert-remove aria-label="Remove certificate">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5"/></svg>
                </button>
            </div>
        </div>

        <div class="admin-field">
            <label>CERTIFICATE TITLE</label>
            <input type="text" maxlength="150" data-cert-field="title" value="${esc(item.title)}" placeholder="Responsive Web Design">
        </div>

        <div class="admin-form-row">
            <div class="admin-field">
                <label>ISSUER</label>
                <input type="text" maxlength="150" data-cert-field="issuer" value="${esc(item.issuer)}" placeholder="freeCodeCamp">
            </div>

            <div class="admin-field">
                <label>YEAR</label>
                <input type="text" maxlength="40" data-cert-field="year" value="${esc(item.year)}" placeholder="2025">
            </div>
        </div>

        <div class="admin-field">
            <label>CERTIFICATE IMAGE</label>
            <div class="cert-image-row">
                <div class="cert-image-preview ${image ? "" : "is-empty"}" data-cert-preview>
                    ${image ? `<img src="${esc(image)}" alt="">` : `<span>NO IMAGE</span>`}
                </div>
                <div class="cert-image-actions">
                    <label class="admin-button cert-upload-label">
                        Upload image
                        <input type="file" accept="image/*" data-cert-file hidden>
                    </label>
                    <button type="button" class="admin-button" data-cert-image-clear>Remove</button>
                </div>
            </div>
            <input type="hidden" data-cert-field="image" value="${esc(image)}">
        </div>

        <div class="admin-field">
            <label>CREDENTIAL URL (optional)</label>
            <input type="text" maxlength="400" data-cert-field="url" value="${esc(item.url)}" placeholder="https://...">
        </div>

        <div class="admin-field">
            <label>CREDENTIAL ID (optional)</label>
            <input type="text" maxlength="120" data-cert-field="credentialId" value="${esc(item.credentialId)}" placeholder="ABC-1234">
        </div>

        <div class="admin-field">
            <label>NOTE</label>
            <textarea rows="2" maxlength="400" data-cert-field="note" placeholder="What the course covered.">${esc(item.note)}</textarea>
        </div>

        <div class="admin-field">
            <label>TAGS (comma separated)</label>
            <input type="text" data-cert-field="tags" value="${esc((item.tags || []).join(", "))}" placeholder="HTML, CSS, Accessibility">
        </div>
    `;
}

function renumberCertificateRows() {
    certificatesEditor.querySelectorAll(".edu-row").forEach((row, index) => {
        const title = row.querySelector(".edu-row-title");
        if (title) title.textContent = `CERTIFICATE ${index + 1}`;
    });
}

function appendCertificateRow(item) {
    const empty = certificatesEditor.querySelector(".empty-note");
    if (empty) empty.remove();

    const row = document.createElement("div");
    row.className = "edu-row";
    row.innerHTML = certificateRowMarkup(item, certificatesEditor.querySelectorAll(".edu-row").length);
    certificatesEditor.appendChild(row);
    return row;
}

function renderCertificatesEditor(certificates) {
    certificatesEditor.innerHTML = "";

    const list = Array.isArray(certificates) ? certificates : [];

    if (!list.length) {
        certificatesEditor.innerHTML = `<p class="empty-note">No certificates yet — add one.</p>`;
        return;
    }

    list.forEach((item) => appendCertificateRow(item || {}));
}

function collectCertificates() {
    return Array.from(certificatesEditor.querySelectorAll(".edu-row")).map((row) => {
        const get = (field) => {
            const el = row.querySelector(`[data-cert-field="${field}"]`);
            return el ? el.value.trim() : "";
        };

        return {
            title: get("title"),
            issuer: get("issuer"),
            year: get("year"),
            credentialId: get("credentialId"),
            url: get("url"),
            image: get("image"),
            note: get("note"),
            tags: get("tags")
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
        };
    });
}

function updateCertPreview(row, url) {
    const preview = row.querySelector("[data-cert-preview]");
    if (!preview) return;

    if (url) {
        preview.classList.remove("is-empty");
        preview.innerHTML = `<img src="${esc(url)}" alt="">`;
    } else {
        preview.classList.add("is-empty");
        preview.innerHTML = `<span>NO IMAGE</span>`;
    }
}

document.getElementById("addCertificateButton").addEventListener("click", () => {
    const row = appendCertificateRow({ tags: [] });
    renumberCertificateRows();
    row.scrollIntoView({ behavior: "smooth", block: "center" });
});

certificatesEditor.addEventListener("click", (event) => {
    const row = event.target.closest(".edu-row");
    if (!row) return;

    if (event.target.closest("[data-cert-remove]")) {
        row.remove();
        renumberCertificateRows();
        if (!certificatesEditor.querySelector(".edu-row")) {
            certificatesEditor.innerHTML = `<p class="empty-note">No certificates yet — add one.</p>`;
        }
        return;
    }

    if (event.target.closest("[data-cert-image-clear]")) {
        const hidden = row.querySelector('[data-cert-field="image"]');
        if (hidden) hidden.value = "";
        updateCertPreview(row, "");
        return;
    }

    const moveBtn = event.target.closest("[data-cert-move]");
    if (moveBtn) {
        if (moveBtn.dataset.certMove === "up" && row.previousElementSibling) {
            row.parentElement.insertBefore(row, row.previousElementSibling);
        } else if (moveBtn.dataset.certMove === "down" && row.nextElementSibling) {
            row.parentElement.insertBefore(row.nextElementSibling, row);
        }
        renumberCertificateRows();
    }
});

// Image upload — reuses the existing project image endpoint
certificatesEditor.addEventListener("change", async (event) => {
    const input = event.target.closest("[data-cert-file]");
    if (!input) return;

    const row = input.closest(".edu-row");
    const file = input.files[0];
    if (!file || !row) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
        toast("Uploading image...");
        const data = await api("/api/projects/upload", { method: "POST", body: formData });
        const hidden = row.querySelector('[data-cert-field="image"]');
        if (hidden) hidden.value = data.url;
        updateCertPreview(row, data.url);
        toast("Image uploaded", "success");
    } catch (error) {
        toast(error.message, "error");
    } finally {
        input.value = "";
    }
});


async function loadSiteContent() {
    try {
        const data = await api("/api/site");
        const item = data.item;

        // Hero
        document.getElementById("siteHeroBadge").value = item.hero?.badge || "";
        document.getElementById("siteHeroLine1").value = item.hero?.titleLine1 || "";
        document.getElementById("siteHeroLine2").value = item.hero?.titleLine2 || "";
        document.getElementById("siteHeroHighlight").value = item.hero?.titleHighlight || "";
        document.getElementById("siteHeroDescription").value = item.hero?.description || "";

        // About
        document.getElementById("siteAboutStory").value = item.about?.story || "";
        document.getElementById("siteAboutCards").value = joinPipeLines(item.about?.miniCards, ["label", "value"]);

        // Skills
        renderSkillsEditor(item.skills);

        // Education
        renderEducationEditor(item.education);
        renderCertificatesEditor(item.certificates);

        // Contact & social
        document.getElementById("siteEmail").value = item.settings?.email || "";
        document.getElementById("siteLocation").value = item.settings?.location || "";
        document.getElementById("siteStatusText").value = item.settings?.statusText || "";
        document.getElementById("siteAvailable").checked = Boolean(item.settings?.available);
        document.getElementById("siteLinkedin").value = item.settings?.linkedinUrl || "";
        document.getElementById("siteGithub").value = item.settings?.githubUrl || "";

        currentCvUrl = item.settings?.cvUrl || "";
        renderCvState();
    } catch (error) {
        toast(error.message, "error");
    }
}

function renderCvState() {
    const link = document.getElementById("siteCvLink");
    const removeBtn = document.getElementById("siteCvRemove");
    const hint = document.getElementById("siteCvHint");
    const hasCv = Boolean(currentCvUrl);

    if (link) {
        link.hidden = !hasCv;
        if (hasCv) link.href = currentCvUrl;
    }
    if (removeBtn) removeBtn.hidden = !hasCv;
    if (hint) hint.textContent = hasCv ? "CV is live on the site." : "No CV uploaded yet.";
}

function collectSiteSection(section) {
    if (section === "hero") {
        return {
            hero: {
                badge: document.getElementById("siteHeroBadge").value.trim(),
                titleLine1: document.getElementById("siteHeroLine1").value.trim(),
                titleLine2: document.getElementById("siteHeroLine2").value.trim(),
                titleHighlight: document.getElementById("siteHeroHighlight").value.trim(),
                description: document.getElementById("siteHeroDescription").value.trim()
            }
        };
    }

    if (section === "about") {
        return {
            about: {
                story: document.getElementById("siteAboutStory").value.trim(),
                miniCards: parsePipeLines(document.getElementById("siteAboutCards").value, ["label", "value"])
            }
        };
    }

    if (section === "skills") {
        const skills = Array.from(skillsEditor.querySelectorAll(".skills-editor-category")).map((block) => ({
            key: block.dataset.skillKey,
            heading: block.querySelector('[data-skill-field="heading"]').value.trim(),
            description: block.querySelector('[data-skill-field="description"]').value.trim(),
            items: parsePipeLines(
                block.querySelector('[data-skill-field="items"]').value,
                ["mark", "name", "detail"]
            )
        }));
        return { skills };
    }

    if (section === "certificates") {
        return { certificates: collectCertificates() };
    }

    if (section === "education") {
        return { education: collectEducation() };
    }

    if (section === "settings") {
        return {
            settings: {
                email: document.getElementById("siteEmail").value.trim(),
                location: document.getElementById("siteLocation").value.trim(),
                statusText: document.getElementById("siteStatusText").value.trim(),
                available: document.getElementById("siteAvailable").checked,
                linkedinUrl: document.getElementById("siteLinkedin").value.trim(),
                githubUrl: document.getElementById("siteGithub").value.trim(),
                cvUrl: currentCvUrl
            }
        };
    }

    return null;
}

document.querySelectorAll("[data-save-section]").forEach((button) => {
    button.addEventListener("click", async () => {
        const payload = collectSiteSection(button.dataset.saveSection);
        if (!payload) return;

        button.disabled = true;
        try {
            await api("/api/site", { method: "PUT", body: payload });
            toast("Saved — site updated", "success");
        } catch (error) {
            toast(error.message, "error");
        } finally {
            button.disabled = false;
        }
    });
});

// CV upload — PDF only, persisted immediately by the backend
document.getElementById("siteCvFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("cv", file);

    try {
        toast("Uploading CV...");
        const data = await api("/api/site/cv", { method: "POST", body: formData });
        currentCvUrl = data.url;
        renderCvState();
        toast("CV uploaded", "success");
    } catch (error) {
        toast(error.message, "error");
    } finally {
        event.target.value = "";
    }
});

// CV remove — clears the stored link
document.getElementById("siteCvRemove").addEventListener("click", () => {
    askConfirm("Remove CV?", "The download button will be hidden on the site.", async () => {
        try {
            await api("/api/site/cv", { method: "DELETE" });
            currentCvUrl = "";
            renderCvState();
            toast("CV removed", "success");
        } catch (error) {
            toast(error.message, "error");
        }
    });
});


// =========================================================
// INITIAL LOAD
// =========================================================

// Verify token is still valid, then load dashboard
api("/api/auth/me")
    .then(() => loadDashboard())
    .catch(() => {});