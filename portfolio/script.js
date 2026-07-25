"use strict";

const homeSection = document.getElementById("home");
const aboutSection = document.getElementById("about");
const navbar = document.getElementById("glassNavbar");
const homeContent = document.getElementById("homeContent");
const homeVisual = document.getElementById("homeVisual");
const scrollIndicator = document.getElementById("scrollIndicator");
const menuButton = document.getElementById("menuButton");
const navLinksContainer = document.getElementById("navLinks");
const navLinks = document.querySelectorAll(".nav-link");

const aboutTypedText = document.getElementById("aboutTypedText");
const aboutProgressFill = document.getElementById("aboutProgressFill");
const aboutProgressValue = document.getElementById("aboutProgressValue");
const aboutDone = document.getElementById("aboutDone");
const aboutCursor = document.getElementById("aboutCursor");

let ABOUT_TEXT = `I’m Jathurshan, an ICT undergraduate with a strong interest in Full-Stack Development.

I enjoy building complete web applications, from creating responsive and user-friendly front-end interfaces to developing back-end systems and working with databases. I’m focused on improving my skills through practical projects and real-world development experience.

My goal is to become a professional Full-Stack Developer and build modern, reliable, and useful digital solutions. I’m continuously learning new technologies and expanding my skills to grow as a developer.`;

/* Phone + tablet = "compact" mode (no scroll typing, no entrance animation) */
const compactViewport = window.matchMedia("(max-width: 1024px)");

function isCompact() {
    return compactViewport.matches;
}

function clamp(value, min = 0, max = 1) {
    return Math.min(Math.max(value, min), max);
}

function smoothStep(edge0, edge1, value) {
    const x = clamp((value - edge0) / Math.max(edge1 - edge0, 0.0001));
    return x * x * (3 - 2 * x);
}

let targetAboutProgress = 0;
let currentAboutProgress = 0;
let lastCharacterCount = -1;

function getAboutProgress() {
    if (!aboutSection) return 0;

    const rect = aboutSection.getBoundingClientRect();
    const scrollableDistance = Math.max(
        aboutSection.offsetHeight - window.innerHeight,
        1
    );

    return clamp(-rect.top / scrollableDistance);
}

function updatePageUI() {
    const y = window.scrollY;
    const homeTop = homeSection ? homeSection.offsetTop : window.innerHeight;
    const progress = clamp(y / Math.max(homeTop, 1));

    navbar?.classList.toggle("nav-visible", progress >= 0.60);
    homeContent?.classList.toggle("content-visible", progress >= 0.64);

    // Home right-side image remains a normal single image.
    homeVisual?.classList.toggle("visual-visible", progress >= 0.40);

    scrollIndicator?.classList.toggle("hidden", progress > 0.10);

    targetAboutProgress = getAboutProgress();
}

function renderAboutTyping(progress) {
    if (!aboutTypedText) return;

    // Phone / tablet: about content is already loaded, no scroll typing.
    if (isCompact()) {
        if (lastCharacterCount !== ABOUT_TEXT.length) {
            aboutTypedText.textContent = ABOUT_TEXT;
            lastCharacterCount = ABOUT_TEXT.length;
        }

        aboutDone?.classList.add("visible");

        if (aboutCursor) {
            aboutCursor.style.opacity = "0";
        }

        return;
    }

    // Small intro pause, then map scroll progress directly to character count.
    // Typing finishes at 82% of the scroll runway, leaving a pinned buffer
    // afterwards so the section never moves on before typing completes.
    const typingProgress = smoothStep(0.05, 0.82, progress);
    const characterCount = Math.floor(ABOUT_TEXT.length * typingProgress);

    if (characterCount !== lastCharacterCount) {
        aboutTypedText.textContent = ABOUT_TEXT.slice(0, characterCount);
        lastCharacterCount = characterCount;
    }

    const percentage = Math.round(typingProgress * 100);

    if (aboutProgressFill) {
        aboutProgressFill.style.width = `${percentage}%`;
    }

    if (aboutProgressValue) {
        aboutProgressValue.textContent = String(percentage).padStart(2, "0") + "%";
    }

    const complete = typingProgress >= 0.999;
    aboutDone?.classList.toggle("visible", complete);

    if (aboutCursor) {
        aboutCursor.style.opacity = complete ? "0" : "1";
    }
}

function animationLoop() {
    currentAboutProgress +=
        (targetAboutProgress - currentAboutProgress) * 0.18;

    if (Math.abs(targetAboutProgress - currentAboutProgress) < 0.0001) {
        currentAboutProgress = targetAboutProgress;
    }

    renderAboutTyping(currentAboutProgress);
    requestAnimationFrame(animationLoop);
}

window.addEventListener("scroll", updatePageUI, { passive: true });
window.addEventListener("resize", updatePageUI);

compactViewport.addEventListener("change", () => {
    lastCharacterCount = -1;
});


// ---------------------------------------------------------
// 3-DOT MENU
// ---------------------------------------------------------

function setMenuOpen(open) {
    navLinksContainer?.classList.toggle("menu-open", open);
    menuButton?.classList.toggle("is-open", open);
    menuButton?.setAttribute("aria-expanded", String(open));
}

if (menuButton && navLinksContainer) {
    menuButton.addEventListener("click", (event) => {
        event.stopPropagation();
        setMenuOpen(!navLinksContainer.classList.contains("menu-open"));
    });

    document.addEventListener("click", (event) => {
        if (!navLinksContainer.contains(event.target) && event.target !== menuButton) {
            setMenuOpen(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setMenuOpen(false);
    });
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
});

const sections = document.querySelectorAll(
    "#home, #about, #education, #certificates, #projects, #skills, #contact"
);

const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navLinks.forEach((link) => link.classList.remove("active"));

        const currentLink = document.querySelector(
            `.nav-link[href="#${entry.target.id}"]`
        );

        currentLink?.classList.add("active");
    });
}, {
    threshold: 0.01,
    rootMargin: "-42% 0px -48% 0px"
});

sections.forEach((section) => activeObserver.observe(section));


// =========================================================
// PROJECTS ARROW NAVIGATION
// =========================================================

const projectsTrack = document.querySelector(".projects-track");
const projectPrevBtn = document.getElementById("projectPrevBtn");
const projectNextBtn = document.getElementById("projectNextBtn");

function getProjectScrollStep() {
    if (!projectsTrack) return 0;

    const firstCard = projectsTrack.querySelector(".project-card");
    if (!firstCard) return 0;

    const trackStyles = window.getComputedStyle(projectsTrack);
    const gap = parseFloat(trackStyles.columnGap || trackStyles.gap || "0") || 0;

    return firstCard.getBoundingClientRect().width + gap;
}

function updateProjectNavButtons() {
    if (!projectsTrack || !projectPrevBtn || !projectNextBtn) return;

    const maxScrollLeft = projectsTrack.scrollWidth - projectsTrack.clientWidth;
    const currentScroll = projectsTrack.scrollLeft;

    projectPrevBtn.disabled = currentScroll <= 2;
    projectNextBtn.disabled = currentScroll >= maxScrollLeft - 2;
}

projectPrevBtn?.addEventListener("click", () => {
    projectsTrack?.scrollBy({
        left: -getProjectScrollStep(),
        behavior: "smooth"
    });
});

projectNextBtn?.addEventListener("click", () => {
    projectsTrack?.scrollBy({
        left: getProjectScrollStep(),
        behavior: "smooth"
    });
});

projectsTrack?.addEventListener("scroll", updateProjectNavButtons, { passive: true });
window.addEventListener("resize", updateProjectNavButtons);

updatePageUI();
renderAboutTyping(0);
animationLoop();
updateProjectNavButtons();


// =========================================================
// SKILLS CATEGORY TABS
// =========================================================

const skillTabs = Array.from(document.querySelectorAll(".skills-tab"));
const skillPanels = Array.from(document.querySelectorAll(".skills-panel"));

function activateSkillTab(tab, moveFocus = false) {
    if (!tab) return;

    const targetId = tab.dataset.skillTarget;
    const targetPanel = document.getElementById(targetId);

    if (!targetPanel) return;

    skillTabs.forEach((item) => {
        const selected = item === tab;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-selected", String(selected));
        item.tabIndex = selected ? 0 : -1;
    });

    skillPanels.forEach((panel) => {
        const selected = panel === targetPanel;
        panel.hidden = !selected;
        panel.classList.toggle("active", selected);
    });

    if (moveFocus) {
        tab.focus();
    }
}

skillTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateSkillTab(tab));

    tab.addEventListener("keydown", (event) => {
        const lastIndex = skillTabs.length - 1;
        let nextIndex = index;

        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            nextIndex = index === lastIndex ? 0 : index + 1;
        } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
            nextIndex = index === 0 ? lastIndex : index - 1;
        } else if (event.key === "Home") {
            nextIndex = 0;
        } else if (event.key === "End") {
            nextIndex = lastIndex;
        } else {
            return;
        }

        event.preventDefault();
        activateSkillTab(skillTabs[nextIndex], true);
    });
});


// =========================================================
// CONTACT FORM
// Sends the message to the backend inbox via POST /api/contact.
// =========================================================

const contactForm = document.getElementById("contactForm");
const contactFormStatus = document.getElementById("contactFormStatus");
const contactSocialLinks = document.querySelectorAll('.contact-social-link[href="#"]');

function showContactFieldError(field, message = "") {
    const fieldWrap = field.closest(".contact-field");
    const errorText = fieldWrap?.querySelector(".contact-field-error");

    fieldWrap?.classList.toggle("has-error", Boolean(message));

    if (errorText) {
        errorText.textContent = message;
    }
}

function validateContactField(field) {
    const value = field.value.trim();

    if (!value) {
        showContactFieldError(field, "This field is required.");
        return false;
    }

    if (field.type === "email") {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(value)) {
            showContactFieldError(field, "Enter a valid email address.");
            return false;
        }
    }

    showContactFieldError(field);
    return true;
}

contactForm?.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", () => {
        if (field.closest(".contact-field")?.classList.contains("has-error")) {
            validateContactField(field);
        }
    });

    field.addEventListener("change", () => validateContactField(field));
});

// Custom dropdown for PROJECT TYPE
(function initContactSelect() {
    const wrap = document.getElementById("contactServiceSelect");
    if (!wrap) return;

    const native = wrap.querySelector("select");
    const trigger = wrap.querySelector(".contact-select-trigger");
    const valueLabel = wrap.querySelector(".contact-select-value");
    const list = wrap.querySelector(".contact-select-options");

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
        const isPlaceholder = !native.value;

        valueLabel.textContent = selected ? selected.textContent : "";
        valueLabel.classList.toggle("is-placeholder", isPlaceholder);

        list.querySelectorAll(".contact-select-option").forEach((item) => {
            item.classList.toggle("is-selected", item.dataset.value === native.value);
        });
    }

    // Build styled options from the native select (skip the disabled placeholder)
    Array.from(native.options).forEach((option) => {
        if (option.disabled) return;

        const item = document.createElement("li");
        item.className = "contact-select-option";
        item.setAttribute("role", "option");
        item.dataset.value = option.value;
        item.textContent = option.textContent;
        item.addEventListener("click", () => {
            native.value = option.value;
            native.dispatchEvent(new Event("change"));
            sync();
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

    // Re-sync after the form resets (post successful send)
    contactForm.addEventListener("reset", () => setTimeout(sync, 0));

    sync();
})();

contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const requiredFields = Array.from(
        contactForm.querySelectorAll("input[required], select[required], textarea[required]")
    );

    const formIsValid = requiredFields
        .map((field) => validateContactField(field))
        .every(Boolean);

    if (!formIsValid) {
        if (contactFormStatus) {
            contactFormStatus.textContent = "Please complete the highlighted fields.";
            contactFormStatus.style.color = "#ef8b8b";
        }

        const errorField = contactForm.querySelector(".has-error input, .has-error select, .has-error textarea");
        if (errorField?.tagName === "SELECT") {
            errorField.closest(".contact-select-wrap")?.querySelector(".contact-select-trigger")?.focus();
        } else {
            errorField?.focus();
        }
        return;
    }

    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const service = String(formData.get("service") || "").trim();
    const message = String(formData.get("message") || "").trim();

    const submitButton = contactForm.querySelector(".contact-submit-button");
    const submitLabel = submitButton?.querySelector("span");
    const originalLabel = submitLabel?.textContent;

    if (submitButton) submitButton.disabled = true;
    if (submitLabel) submitLabel.textContent = "SENDING...";

    if (contactFormStatus) {
        contactFormStatus.textContent = "Sending your message...";
        contactFormStatus.style.color = "#d8b943";
    }

    try {
        const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                email,
                subject: service,
                message
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (contactFormStatus) {
                contactFormStatus.textContent = "Message sent successfully. I'll reply within 24–48 hours!";
                contactFormStatus.style.color = "#9cd6ae";
            }

            contactForm.reset();
        } else if (response.status === 429) {
            if (contactFormStatus) {
                contactFormStatus.textContent = "Too many messages sent. Please try again later.";
                contactFormStatus.style.color = "#ef8b8b";
            }
        } else {
            if (contactFormStatus) {
                contactFormStatus.textContent = data.message || "Something went wrong. Please try again.";
                contactFormStatus.style.color = "#ef8b8b";
            }
        }
    } catch (error) {
        if (contactFormStatus) {
            contactFormStatus.textContent = "Could not reach the server. Please try again later.";
            contactFormStatus.style.color = "#ef8b8b";
        }
    } finally {
        if (submitButton) submitButton.disabled = false;
        if (submitLabel && originalLabel) submitLabel.textContent = originalLabel;
    }
});

// Placeholder social links stay inactive until personal profile URLs are added.
contactSocialLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
        if (link.getAttribute("href") && link.getAttribute("href") !== "#") return;

        event.preventDefault();

        if (contactFormStatus) {
            contactFormStatus.textContent = "Add your profile URL in the admin panel (Site content).";
            contactFormStatus.style.color = "#d8b943";
        }
    });
});


// =========================================================
// INTRO SOFTWARE ICON PARALLAX
// Icons drift automatically in CSS and react softly to the mouse.
// =========================================================

const softwareIconsLayer = document.getElementById("softwareIconsLayer");
const softwareIcons = Array.from(
    softwareIconsLayer?.querySelectorAll(".software-icon") || []
);

const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let softwarePointerX = 0;
let softwarePointerY = 0;
let softwareParallaxFrame = 0;

function applySoftwareIconParallax() {
    softwareParallaxFrame = 0;

    softwareIcons.forEach((icon) => {
        const depth = Number(icon.dataset.depth || 0.7);
        const direction = Number(icon.dataset.direction || 1);
        const moveX = softwarePointerX * depth * direction;
        const moveY = softwarePointerY * depth;

        icon.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
    });
}

function queueSoftwareIconParallax() {
    if (softwareParallaxFrame) return;
    softwareParallaxFrame = window.requestAnimationFrame(applySoftwareIconParallax);
}

function resetSoftwareIconParallax() {
    softwarePointerX = 0;
    softwarePointerY = 0;
    queueSoftwareIconParallax();
}

if (softwareIconsLayer && softwareIcons.length && finePointer.matches && !reducedMotion.matches) {
    const introParallaxArea = softwareIconsLayer.closest(".intro-section");

    introParallaxArea?.addEventListener("pointermove", (event) => {
        const bounds = introParallaxArea.getBoundingClientRect();
        const normalizedX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        const normalizedY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

        // Intentionally subtle so the hero remains professional and calm.
        softwarePointerX = normalizedX * 13;
        softwarePointerY = normalizedY * 9;
        queueSoftwareIconParallax();
    }, { passive: true });

    introParallaxArea?.addEventListener("pointerleave", resetSoftwareIconParallax, { passive: true });
}


// =========================================================
// HOME ENTRANCE — TYPING HEADLINE + STAGGER TRIGGER
// =========================================================

const homeTitle = document.querySelector(".home-title");
let HOME_TITLE_LINES = ["Building Digital", "Experiences", "That Matter."];

function typeHomeTitle() {
    if (!homeTitle) return;

    // Keep layout height stable + keep full text for screen readers
    homeTitle.setAttribute("aria-label", HOME_TITLE_LINES.join(" "));
    homeTitle.style.minHeight = `${homeTitle.offsetHeight}px`;
    homeTitle.textContent = "";

    const lineNodes = [
        document.createTextNode(""),
        document.createTextNode(""),
        document.createTextNode("")
    ];

    const goldSpan = document.createElement("span");
    goldSpan.appendChild(lineNodes[2]);

    const cursor = document.createElement("i");
    cursor.className = "home-typing-cursor";
    cursor.setAttribute("aria-hidden", "true");

    homeTitle.appendChild(lineNodes[0]);
    homeTitle.appendChild(cursor);

    let lineIndex = 0;
    let charIndex = 0;

    function typeNextChar() {
        const text = HOME_TITLE_LINES[lineIndex];

        if (charIndex < text.length) {
            lineNodes[lineIndex].textContent = text.slice(0, charIndex + 1);
            charIndex += 1;
            window.setTimeout(typeNextChar, 42);
            return;
        }

        lineIndex += 1;
        charIndex = 0;

        if (lineIndex === 1) {
            homeTitle.insertBefore(document.createElement("br"), cursor);
            homeTitle.insertBefore(lineNodes[1], cursor);
            window.setTimeout(typeNextChar, 280);
        } else if (lineIndex === 2) {
            homeTitle.insertBefore(document.createElement("br"), cursor);
            homeTitle.insertBefore(goldSpan, cursor);
            window.setTimeout(typeNextChar, 280);
        } else {
            cursor.classList.add("cursor-done");
            goldSpan.classList.add("title-gold-pop");
        }
    }

    window.setTimeout(typeNextChar, 250);
}

const homeEntranceObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        homeSection?.classList.add("home-animate");

        // Phone / tablet: second page loads plain, no entrance animation.
        if (!reducedMotion.matches && !isCompact()) {
            typeHomeTitle();
        }

        homeEntranceObserver.disconnect();
    });
}, { threshold: 0.3 });

if (homeSection) {
    homeEntranceObserver.observe(homeSection);
}


// =========================================================
// HOME MOUSE PARALLAX (photo + dot patterns)
// =========================================================

const homeParallaxTargets = [
    { el: document.querySelector("#homeWorkPhoto img"), depthX: 7, depthY: 5 },
    { el: document.querySelector(".dot-pattern-one"), depthX: -16, depthY: 11 },
    { el: document.querySelector(".dot-pattern-two"), depthX: 20, depthY: -13 }
];

let homePointerX = 0;
let homePointerY = 0;
let homeParallaxFrame = 0;

function applyHomeParallax() {
    homeParallaxFrame = 0;

    homeParallaxTargets.forEach((target) => {
        if (!target.el) return;

        const moveX = homePointerX * target.depthX;
        const moveY = homePointerY * target.depthY;

        target.el.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
    });
}

function queueHomeParallax() {
    if (homeParallaxFrame) return;
    homeParallaxFrame = window.requestAnimationFrame(applyHomeParallax);
}

if (homeSection && finePointer.matches && !reducedMotion.matches) {
    homeSection.addEventListener("pointermove", (event) => {
        const bounds = homeSection.getBoundingClientRect();
        const normalizedX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        const normalizedY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

        // Subtle depth movement, same calm style as the intro icons
        homePointerX = normalizedX;
        homePointerY = normalizedY;
        queueHomeParallax();
    }, { passive: true });

    homeSection.addEventListener("pointerleave", () => {
        homePointerX = 0;
        homePointerY = 0;
        queueHomeParallax();
    }, { passive: true });
}


// =========================================================
// PROJECTS — LOAD FROM BACKEND
// Projects added in the admin panel appear here automatically.
// If the API is unreachable or empty, the static cards stay.
// =========================================================

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
}

function renderProjectCard(project, index) {
    const number = String(index + 1).padStart(2, "0");

    const imageBlock = project.image
        ? `
        <div class="project-image">
            <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} project screenshot">
            <span class="project-number">${number}</span>
        </div>`
        : `
        <div class="project-image project-image-placeholder">
            <div class="placeholder-copy">
                <small>PROJECT SCREENSHOT</small>
                <strong>${escapeHtml(project.title.toUpperCase())}</strong>
            </div>
            <span class="project-number">${number}</span>
        </div>`;

    const roleBlock = project.role
        ? `
        <div class="project-info-group">
            <span class="project-label">YOUR ROLE</span>
            <p>${escapeHtml(project.role)}</p>
        </div>`
        : "";

    const techBlock = project.techStack && project.techStack.length
        ? `
        <div class="project-info-group">
            <span class="project-label">TECHNOLOGIES USED</span>
            <div class="project-tech">
                ${project.techStack.map((tech) => `<span>${escapeHtml(tech)}</span>`).join("")}
            </div>
        </div>`
        : "";

    const featuresBlock = project.features && project.features.length
        ? `
        <div class="project-info-group">
            <span class="project-label">MAIN FEATURES</span>
            <ul class="project-features">
                ${project.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}
            </ul>
        </div>`
        : "";

    const isCompleted = project.status !== "in-progress";
    const statusBlock = `
        <div class="project-status-row">
            <span class="project-label">PROJECT STATUS</span>
            <span class="project-status ${isCompleted ? "completed" : "progress"}">
                <i></i>${isCompleted ? "Completed" : "In Progress"}
            </span>
        </div>`;

    const liveButton = project.liveUrl
        ? `<a href="${escapeHtml(project.liveUrl)}" class="project-btn project-btn-primary" target="_blank" rel="noopener" aria-label="Open ${escapeHtml(project.title)} live demo">Live Demo <span>↗</span></a>`
        : "";

    const githubButton = project.githubUrl
        ? `<a href="${escapeHtml(project.githubUrl)}" class="project-btn project-btn-secondary" target="_blank" rel="noopener" aria-label="Open ${escapeHtml(project.title)} GitHub repository">GitHub <span>↗</span></a>`
        : "";

    const buttonsBlock = liveButton || githubButton
        ? `<div class="project-buttons">${liveButton}${githubButton}</div>`
        : "";

    return `
        <article class="project-card">
            ${imageBlock}
            <div class="project-content">
                <h3 class="project-name">${escapeHtml(project.title)}</h3>

                <div class="project-info-group">
                    <span class="project-label">SHORT DESCRIPTION</span>
                    <p>${escapeHtml(project.description)}</p>
                </div>
                ${roleBlock}
                ${techBlock}
                ${featuresBlock}
                ${statusBlock}
                ${buttonsBlock}
            </div>
        </article>`;
}

async function loadProjectsFromBackend() {
    if (!projectsTrack) return;

    try {
        const response = await fetch("/api/projects");
        const data = await response.json();

        if (!response.ok || !data.success || !data.items.length) return;

        projectsTrack.innerHTML = data.items
            .map((project, index) => renderProjectCard(project, index))
            .join("");

        projectsTrack.scrollLeft = 0;
    } catch (error) {
        // Backend not running — static cards stay as fallback
    }
}

loadProjectsFromBackend();


// =========================================================
// SITE CONTENT — hero / about / skills / contact from admin CMS
// =========================================================

function applyHeroContent(hero) {
    if (!hero) return;

    const badgeText = document.getElementById("heroBadgeText");
    if (badgeText && hero.badge) badgeText.textContent = hero.badge;

    const heroDescription = document.getElementById("heroDescription");
    if (heroDescription && hero.description) heroDescription.textContent = hero.description;

    if (hero.titleLine1 || hero.titleLine2 || hero.titleHighlight) {
        HOME_TITLE_LINES = [
            hero.titleLine1 || HOME_TITLE_LINES[0],
            hero.titleLine2 || HOME_TITLE_LINES[1],
            hero.titleHighlight || HOME_TITLE_LINES[2]
        ];
        homeTitle?.setAttribute("aria-label", HOME_TITLE_LINES.join(" "));
    }
}

function applyAboutContent(about) {
    if (!about) return;

    if (about.story) {
        ABOUT_TEXT = about.story;
        lastCharacterCount = -1;
    }

    const cardsBox = document.getElementById("aboutMiniCards");
    if (cardsBox && Array.isArray(about.miniCards) && about.miniCards.length) {
        cardsBox.innerHTML = about.miniCards
            .map(
                (card) => `
                <div class="about-mini-card">
                    <span class="mini-label">${escapeHtml(card.label)}</span>
                    <strong>${escapeHtml(card.value)}</strong>
                </div>`
            )
            .join("");
    }
}

function applySkillsContent(skills) {
    if (!Array.isArray(skills)) return;

    skills.forEach((category) => {
        const panel = document.getElementById(`skill-${category.key}`);
        if (!panel) return;

        const heading = panel.querySelector(".skill-category-heading h3");
        if (heading && category.heading) heading.textContent = category.heading;

        const description = panel.querySelector(".skill-category-description");
        if (description && category.description) description.textContent = category.description;

        const grid = panel.querySelector(".skill-list-grid");
        if (grid && Array.isArray(category.items) && category.items.length) {
            grid.innerHTML = category.items
                .map(
                    (item) => `
                    <article class="skill-item">
                        <span class="skill-item-mark">${escapeHtml(item.mark)}</span>
                        <div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.detail)}</small></div>
                    </article>`
                )
                .join("");
        }
    });
}

function applyEducationContent(education) {
    const timeline = document.getElementById("educationTimeline");
    if (!timeline || !Array.isArray(education) || !education.length) return;

    timeline.innerHTML = education
        .map((item) => {
            const status = item.status === "ongoing" ? "ongoing" : "done";
            const statusLabel =
                item.statusLabel || (status === "ongoing" ? "Ongoing" : "Completed");

            const tags = Array.isArray(item.tags) && item.tags.length
                ? `<div class="education-tags">${item.tags
                      .map((tag) => `<span>${escapeHtml(tag)}</span>`)
                      .join("")}</div>`
                : "";

            const institute = item.institute
                ? `<span>${escapeHtml(item.institute)}</span>`
                : "";

            const place = item.place || item.institute
                ? `<p class="education-place">${escapeHtml(item.place)}${institute}</p>`
                : "";

            const note = item.note
                ? `<p class="education-note">${escapeHtml(item.note)}</p>`
                : "";

            return `
                <article class="education-item">

                    <span class="education-marker" aria-hidden="true"></span>

                    <div class="education-card">

                        <div class="education-card-top">
                            <span class="education-year">${escapeHtml(item.year)}</span>
                            <span class="education-status ${status}"><i></i>${escapeHtml(statusLabel)}</span>
                        </div>

                        <h3 class="education-degree">${escapeHtml(item.degree)}</h3>

                        ${place}
                        ${note}
                        ${tags}

                    </div>

                </article>`;
        })
        .join("");
}

function applyCertificatesContent(certificates) {
    const grid = document.getElementById("certificatesGrid");
    const section = document.getElementById("certificates");
    if (!grid) return;

    const list = Array.isArray(certificates) ? certificates : [];

    // No certificates yet -> hide the whole section
    if (!list.length) {
        if (section) section.style.display = "none";
        grid.innerHTML = "";
        return;
    }

    if (section) section.style.display = "";

    grid.innerHTML = list
        .map((item) => {
            const media = item.image
                ? `<div class="certificate-media" data-cert-img="${escapeHtml(item.image)}" data-cert-title="${escapeHtml(item.title)}" role="button" tabindex="0" aria-label="View full certificate">
                       <img class="certificate-media-bg" src="${escapeHtml(item.image)}" alt="" aria-hidden="true">
                       <img class="certificate-media-fg" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">
                       <span class="certificate-zoom-hint">VIEW FULL</span>
                   </div>`
                : `<div class="certificate-media certificate-media-empty" aria-hidden="true"><span>CERTIFICATE</span></div>`;

            const year = item.year
                ? `<span class="certificate-year">${escapeHtml(item.year)}</span>`
                : "";

            const issuer = item.issuer
                ? `<p class="certificate-issuer">${escapeHtml(item.issuer)}</p>`
                : "";

            const note = item.note
                ? `<p class="certificate-note">${escapeHtml(item.note)}</p>`
                : "";

            const credential = item.credentialId
                ? `<p class="certificate-credential">ID: ${escapeHtml(item.credentialId)}</p>`
                : "";

            const tags = Array.isArray(item.tags) && item.tags.length
                ? `<div class="certificate-tags">${item.tags
                      .map((tag) => `<span>${escapeHtml(tag)}</span>`)
                      .join("")}</div>`
                : "";

            const link = item.url
                ? `<a class="certificate-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">View credential &#8599;</a>`
                : "";

            return `
                <article class="certificate-card">

                    ${media}

                    <div class="certificate-body">

                        <div class="certificate-card-top">
                            <h3 class="certificate-title">${escapeHtml(item.title)}</h3>
                            ${year}
                        </div>

                        ${issuer}
                        ${note}
                        ${tags}
                        ${credential}
                        ${link}

                    </div>

                </article>`;
        })
        .join("");

    initCertLightbox();
    initCertSlider();
}

function initCertSlider() {
    const grid = document.getElementById("certificatesGrid");
    const prev = document.getElementById("certPrev");
    const next = document.getElementById("certNext");
    const nav = document.querySelector(".certificates-nav");
    if (!grid || !prev || !next) return;

    const cards = grid.querySelectorAll(".certificate-card");

    function step() {
        const card = grid.querySelector(".certificate-card");
        if (!card) return grid.clientWidth;
        const gap = parseFloat(getComputedStyle(grid).columnGap || "26") || 26;
        return card.getBoundingClientRect().width + gap;
    }

    function updateButtons() {
        const max = grid.scrollWidth - grid.clientWidth;
        prev.disabled = grid.scrollLeft <= 4;
        next.disabled = grid.scrollLeft >= max - 4;
    }

    // Hide arrows when everything already fits
    function updateNavVisibility() {
        const overflowing = grid.scrollWidth > grid.clientWidth + 4;
        if (nav) nav.style.display = overflowing ? "flex" : "none";
    }

    if (!grid.dataset.sliderBound) {
        grid.dataset.sliderBound = "1";

        prev.addEventListener("click", () => {
            grid.scrollBy({ left: -step(), behavior: "smooth" });
        });

        next.addEventListener("click", () => {
            grid.scrollBy({ left: step(), behavior: "smooth" });
        });

        grid.addEventListener("scroll", updateButtons, { passive: true });
        window.addEventListener("resize", () => {
            updateButtons();
            updateNavVisibility();
        });
    }

    requestAnimationFrame(() => {
        updateButtons();
        updateNavVisibility();
    });

    void cards;
}

function initCertLightbox() {
    const box = document.getElementById("certLightbox");
    const img = document.getElementById("certLightboxImg");
    const caption = document.getElementById("certLightboxCaption");
    const closeBtn = document.getElementById("certLightboxClose");
    if (!box || !img || !caption || !closeBtn) return;

    let lastFocused = null;

    function openBox(src, title) {
        lastFocused = document.activeElement;
        img.src = src;
        img.alt = title || "";
        caption.textContent = title || "";
        box.classList.add("is-open");
        box.setAttribute("aria-hidden", "false");
        document.body.classList.add("cert-lightbox-open");
        closeBtn.focus();
    }

    function closeBox() {
        box.classList.remove("is-open");
        box.setAttribute("aria-hidden", "true");
        document.body.classList.remove("cert-lightbox-open");
        if (lastFocused) lastFocused.focus();
        setTimeout(() => {
            if (!box.classList.contains("is-open")) img.src = "";
        }, 450);
    }

    document.querySelectorAll(".certificate-media[data-cert-img]").forEach((el) => {
        el.addEventListener("click", () => {
            openBox(el.dataset.certImg, el.dataset.certTitle);
        });
        el.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openBox(el.dataset.certImg, el.dataset.certTitle);
            }
        });
    });

    if (!box.dataset.bound) {
        box.dataset.bound = "1";

        closeBtn.addEventListener("click", closeBox);

        box.addEventListener("click", (e) => {
            if (e.target === box) closeBox();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && box.classList.contains("is-open")) closeBox();
        });
    }
}

function applySettingsContent(settings) {
    if (!settings) return;

    if (settings.email) {
        const emailLink = document.getElementById("contactEmailLink");
        const emailText = document.getElementById("contactEmailText");
        if (emailLink) emailLink.href = `mailto:${settings.email}`;
        if (emailText) emailText.textContent = settings.email;
    }

    if (settings.location) {
        const locationText = document.getElementById("contactLocationText");
        if (locationText) locationText.textContent = settings.location;
    }

    if (settings.statusText) {
        const statusText = document.getElementById("contactStatusText");
        if (statusText) statusText.textContent = settings.statusText;
    }

    const availability = document.getElementById("contactAvailability");
    availability?.classList.toggle("is-off", settings.available === false);

    if (settings.linkedinUrl) {
        const linkedin = document.getElementById("socialLinkedin");
        if (linkedin) {
            linkedin.href = settings.linkedinUrl;
            linkedin.target = "_blank";
            linkedin.rel = "noopener";
        }
    }

    if (settings.githubUrl) {
        const github = document.getElementById("socialGithub");
        if (github) {
            github.href = settings.githubUrl;
            github.target = "_blank";
            github.rel = "noopener";
        }
    }

    const cvButton = document.getElementById("heroDownloadCv");
    if (cvButton) {
        if (settings.cvUrl) {
            cvButton.href = settings.cvUrl;
            cvButton.hidden = false;
        } else {
            cvButton.hidden = true;
        }
    }
}

async function loadSiteContentFromBackend() {
    try {
        const response = await fetch("/api/site");
        const data = await response.json();

        if (!response.ok || !data.success || !data.item) return;

        applyHeroContent(data.item.hero);
        applyAboutContent(data.item.about);
        applySkillsContent(data.item.skills);
        applyEducationContent(data.item.education);
        applyCertificatesContent(data.item.certificates);
        applySettingsContent(data.item.settings);
    } catch (error) {
        // Backend not running — hardcoded content stays as fallback
    }
}

loadSiteContentFromBackend();