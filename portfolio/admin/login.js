"use strict";
const loginForm = document.getElementById("loginForm");
        const loginStatus = document.getElementById("loginStatus");

        // Already signed in? Go straight to the panel.
        if (localStorage.getItem("admin_token")) {
            window.location.replace("/admin/");
        }

        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value;

            if (!email || !password) {
                loginStatus.textContent = "Enter your email and password.";
                loginStatus.className = "login-status is-error";
                return;
            }

            const button = loginForm.querySelector("button");
            button.disabled = true;
            loginStatus.textContent = "Signing in...";
            loginStatus.className = "login-status";

            try {
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    localStorage.setItem("admin_token", data.token);
                    localStorage.setItem("admin_name", data.admin.name);
                    window.location.replace("/admin/");
                } else {
                    loginStatus.textContent = data.message || "Sign in failed.";
                    loginStatus.className = "login-status is-error";
                }
            } catch (error) {
                loginStatus.textContent = "Could not reach the server.";
                loginStatus.className = "login-status is-error";
            } finally {
                button.disabled = false;
            }
        });
