/**
 * SecureVault — Popup Logic
 * ==========================
 * Handles: unlock flow, website detection, credential fetching,
 * client-side AES-GCM decryption, autofill messaging, copy-to-clipboard
 */

// ─── Configuration ─────────────────────────────────────────────────
const API_BASE = "http://localhost:5000";

// ─── DOM Elements ──────────────────────────────────────────────────
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const masterPasswordInput = document.getElementById("master-password");
const unlockBtn = document.getElementById("unlock-btn");
const lockBtn = document.getElementById("lock-btn");
const showPasswordBtn = document.getElementById("show-password-btn");
const loginError = document.getElementById("login-error");
const detectedSite = document.getElementById("detected-site");
const autofillToggle = document.getElementById("autofill-toggle");
const loadingState = document.getElementById("loading-state");
const errorState = document.getElementById("error-state");
const emptyState = document.getElementById("empty-state");
const errorMessage = document.getElementById("error-message");
const retryBtn = document.getElementById("retry-btn");
const credentialsList = document.getElementById("credentials-list");
const allCredentialsList = document.getElementById("all-credentials-list");
const allPasswordsSection = document.getElementById("all-passwords-section");
const toggleAllBtn = document.getElementById("toggle-all-btn");
const credentialTemplate = document.getElementById("credential-template");

// ─── State ─────────────────────────────────────────────────────────
let currentDomain = "";
let currentTabId = null;
let decryptedCredentials = []; // Temporary — cleared on lock
let allDecryptedCredentials = [];
let showingAll = false;

// ═══════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async () => {
    // Detect current tab
    await detectCurrentSite();

    // Check if already unlocked
    chrome.storage.session.get(["unlocked", "masterPassword", "userId"], async (data) => {
        if (data.unlocked && data.masterPassword && data.userId) {
            showDashboard();
            await fetchAndDisplayCredentials(data.masterPassword, data.userId);
        } else {
            showLogin();
        }
    });

    // Listen for auto-lock message from background
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "AUTO_LOCKED") {
            showLogin();
            showToast("🔒 Vault auto-locked");
        }
    });

    // Set up event listeners
    setupEventListeners();
});

// ═══════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════

function setupEventListeners() {
    // Unlock
    unlockBtn.addEventListener("click", handleUnlock);
    masterPasswordInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleUnlock();
    });

    // Lock
    lockBtn.addEventListener("click", handleLock);

    // Show/hide password
    showPasswordBtn.addEventListener("click", () => {
        const isPassword = masterPasswordInput.type === "password";
        masterPasswordInput.type = isPassword ? "text" : "password";
        showPasswordBtn.textContent = isPassword ? "🙈" : "👁️";
    });

    // Retry
    retryBtn.addEventListener("click", () => {
        chrome.storage.session.get(["masterPassword", "userId"], async (data) => {
            if (data.masterPassword && data.userId) {
                await fetchAndDisplayCredentials(data.masterPassword, data.userId);
            }
        });
    });

    // Toggle all passwords
    toggleAllBtn.addEventListener("click", () => {
        showingAll = !showingAll;
        if (showingAll) {
            allPasswordsSection.style.display = "block";
            toggleAllBtn.textContent = "Hide All Passwords";
        } else {
            allPasswordsSection.style.display = "none";
            toggleAllBtn.textContent = "Show All Passwords";
        }
    });

    // Autofill toggle
    autofillToggle.addEventListener("change", () => {
        chrome.storage.local.set({ extensionActive: autofillToggle.checked });
    });

    // Load toggle state
    chrome.storage.local.get(["extensionActive"], (data) => {
        if (data.extensionActive !== undefined) {
            autofillToggle.checked = data.extensionActive;
        }
    });
}

// ═══════════════════════════════════════════════════════════════════
// WEBSITE DETECTION
// ═══════════════════════════════════════════════════════════════════

async function detectCurrentSite() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url) {
                try {
                    const url = new URL(tabs[0].url);
                    currentDomain = url.hostname.replace(/^www\./, "");
                    currentTabId = tabs[0].id;
                    detectedSite.textContent = currentDomain;
                } catch {
                    currentDomain = "";
                    detectedSite.textContent = "Unknown";
                }
            }
            resolve();
        });
    });
}

// ═══════════════════════════════════════════════════════════════════
// UNLOCK / LOCK
// ═══════════════════════════════════════════════════════════════════

async function handleUnlock() {
    const masterPassword = masterPasswordInput.value.trim();

    if (masterPassword.length < 4) {
        showError("Master password must be at least 4 characters.");
        return;
    }

    // Show loading
    unlockBtn.querySelector(".btn-text").style.display = "none";
    unlockBtn.querySelector(".btn-loader").style.display = "inline-block";
    unlockBtn.disabled = true;
    hideError();

    try {
        // Generate userId (SHA-256 of master password)
        const userId = await SecureVaultCrypto.generateUserId(masterPassword);

        // Store in session (memory only — never persisted to disk)
        await chrome.storage.session.set({
            unlocked: true,
            masterPassword: masterPassword,
            userId: userId
        });

        // Notify background to start auto-lock timer
        chrome.runtime.sendMessage({ type: "UNLOCK" });

        // Clear the input
        masterPasswordInput.value = "";

        // Switch to dashboard
        showDashboard();
        await fetchAndDisplayCredentials(masterPassword, userId);

    } catch (err) {
        showError("Failed to derive encryption key. Please try again.");
        console.error("Unlock error:", err);
    } finally {
        unlockBtn.querySelector(".btn-text").style.display = "inline";
        unlockBtn.querySelector(".btn-loader").style.display = "none";
        unlockBtn.disabled = false;
    }
}

function handleLock() {
    // Clear all sensitive data
    decryptedCredentials = [];
    allDecryptedCredentials = [];
    credentialsList.innerHTML = "";
    allCredentialsList.innerHTML = "";

    // Clear session
    chrome.storage.session.set({
        unlocked: false,
        masterPassword: null,
        userId: null
    });

    // Notify background to stop timer
    chrome.runtime.sendMessage({ type: "LOCK" });

    showLogin();
    showToast("🔒 Vault locked");
}

// ═══════════════════════════════════════════════════════════════════
// FETCH & DECRYPT CREDENTIALS
// ═══════════════════════════════════════════════════════════════════

async function fetchAndDisplayCredentials(masterPassword, userId) {
    showState("loading");

    // Reset auto-lock timer on activity
    chrome.runtime.sendMessage({ type: "RESET_TIMER" });

    try {
        // Fetch ALL credentials for this user
        const response = await fetch(`${API_BASE}/api/credentials?userId=${userId}`);

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        const allCredentials = data.credentials || [];

        if (allCredentials.length === 0) {
            showState("empty");
            return;
        }

        // Decrypt all credentials
        allDecryptedCredentials = [];
        for (const cred of allCredentials) {
            try {
                const decrypted = await decryptCredential(cred, masterPassword);
                allDecryptedCredentials.push(decrypted);
            } catch (err) {
                console.warn(`Failed to decrypt credential ${cred._id}:`, err.message);
            }
        }

        if (allDecryptedCredentials.length === 0) {
            showError("Decryption failed for all credentials. Wrong master password?");
            showState("error");
            errorMessage.textContent = "Decryption failed. Check your master password.";
            return;
        }

        // Filter credentials matching current site
        decryptedCredentials = allDecryptedCredentials.filter((cred) => {
            const platform = (cred.platform || "").toLowerCase();
            const url = (cred.platformUrl || "").toLowerCase();
            const domain = currentDomain.toLowerCase();

            return (
                platform.includes(domain) ||
                domain.includes(platform.replace(/\.(com|org|net|io|dev)$/i, "")) ||
                url.includes(domain)
            );
        });

        // Display matched credentials
        showState("none");
        credentialsList.innerHTML = "";
        allCredentialsList.innerHTML = "";

        if (decryptedCredentials.length > 0) {
            decryptedCredentials.forEach((cred) => {
                credentialsList.appendChild(createCredentialCard(cred));
            });
        } else {
            emptyState.style.display = "block";
        }

        // Show "All Passwords" toggle if there are more credentials
        const otherCredentials = allDecryptedCredentials.filter(
            (c) => !decryptedCredentials.includes(c)
        );

        if (otherCredentials.length > 0) {
            toggleAllBtn.style.display = "block";
            otherCredentials.forEach((cred) => {
                allCredentialsList.appendChild(createCredentialCard(cred));
            });
        }

    } catch (err) {
        console.error("Fetch error:", err);
        showState("error");
        if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
            errorMessage.textContent = "Cannot connect to server. Is the backend running?";
        } else {
            errorMessage.textContent = err.message;
        }
    }
}

async function decryptCredential(cred, masterPassword) {
    // Derive key using this credential's salt
    const cryptoKey = await SecureVaultCrypto.deriveKey(masterPassword, cred.salt);

    // Decrypt password
    const password = await SecureVaultCrypto.decryptData(
        cred.encryptedPassword,
        cred.iv,
        cryptoKey
    );

    // Decrypt username if encrypted, otherwise use plaintext
    let username = cred.username || "";
    if (cred.encryptedUsername && cred.usernameIv) {
        try {
            username = await SecureVaultCrypto.decryptData(
                cred.encryptedUsername,
                cred.usernameIv,
                cryptoKey
            );
        } catch {
            // Fall back to plaintext username
        }
    }

    return {
        id: cred._id,
        platform: cred.platform,
        platformUrl: cred.platformUrl || "",
        username: username,
        password: password
    };
}

// ═══════════════════════════════════════════════════════════════════
// CREDENTIAL CARD RENDERING
// ═══════════════════════════════════════════════════════════════════

function createCredentialCard(cred) {
    const clone = credentialTemplate.content.cloneNode(true);
    const card = clone.querySelector(".credential-card");

    // Platform & URL
    card.querySelector(".credential-platform").textContent = cred.platform;
    card.querySelector(".credential-url").textContent = cred.platformUrl || "";

    // Username
    card.querySelector(".username-value").textContent = cred.username || "—";

    // Password (blurred by default)
    const passwordEl = card.querySelector(".password-value");
    passwordEl.textContent = cred.password;
    passwordEl.classList.add("blurred");

    // Reveal button
    card.querySelector(".reveal-btn").addEventListener("click", () => {
        passwordEl.classList.toggle("blurred");
        passwordEl.classList.toggle("revealed");
    });

    // Copy buttons
    card.querySelectorAll(".copy-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const field = btn.dataset.copy;
            const value = field === "username" ? cred.username : cred.password;
            copyToClipboard(value, btn);

            // Track usage
            if (cred.id) {
                fetch(`${API_BASE}/api/credentials/${cred.id}/track`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: null // We'll get it from session
                    })
                }).catch(() => {});

                chrome.storage.session.get(["userId"], (data) => {
                    if (data.userId) {
                        fetch(`${API_BASE}/api/credentials/${cred.id}/track`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: data.userId })
                        }).catch(() => {});
                    }
                });
            }

            // Reset auto-lock timer
            chrome.runtime.sendMessage({ type: "RESET_TIMER" });
        });
    });

    // Autofill button
    card.querySelector(".autofill-btn").addEventListener("click", () => {
        if (currentTabId) {
            chrome.tabs.sendMessage(currentTabId, {
                type: "AUTOFILL",
                username: cred.username,
                password: cred.password
            }, (response) => {
                if (response && response.ok) {
                    showToast("✅ Credentials autofilled!");
                } else {
                    showToast("⚠️ Could not detect login form. Use copy instead.");
                }
            });

            // Track usage
            chrome.storage.session.get(["userId"], (data) => {
                if (data.userId && cred.id) {
                    fetch(`${API_BASE}/api/credentials/${cred.id}/track`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: data.userId })
                    }).catch(() => {});
                }
            });
        }

        chrome.runtime.sendMessage({ type: "RESET_TIMER" });
    });

    // Open URL button
    const openBtn = card.querySelector(".open-url-btn");
    if (cred.platformUrl) {
        openBtn.addEventListener("click", () => {
            let url = cred.platformUrl;
            if (!url.startsWith("http")) url = "https://" + url;
            chrome.tabs.create({ url: url });
        });
    } else {
        openBtn.style.display = "none";
    }

    return card;
}

// ═══════════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════════

function showLogin() {
    loginSection.style.display = "block";
    dashboardSection.style.display = "none";
    lockBtn.style.display = "none";
    masterPasswordInput.focus();
}

function showDashboard() {
    loginSection.style.display = "none";
    dashboardSection.style.display = "block";
    lockBtn.style.display = "flex";
}

function showState(state) {
    loadingState.style.display = state === "loading" ? "block" : "none";
    errorState.style.display = state === "error" ? "block" : "none";
    emptyState.style.display = state === "empty" ? "block" : "none";
    if (state !== "none") {
        credentialsList.innerHTML = "";
        toggleAllBtn.style.display = "none";
        allPasswordsSection.style.display = "none";
    }
}

function showError(msg) {
    loginError.textContent = msg;
    loginError.style.display = "block";
}

function hideError() {
    loginError.style.display = "none";
}

function copyToClipboard(text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
        const original = btnElement.textContent;
        btnElement.textContent = "✅";
        btnElement.classList.add("copied");
        setTimeout(() => {
            btnElement.textContent = original;
            btnElement.classList.remove("copied");
        }, 1500);
        showToast("📋 Copied!");
    });
}

function showToast(message) {
    // Remove existing toast
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}