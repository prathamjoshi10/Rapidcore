/**
 * SecureVault — Content Script
 * =============================
 * Handles: autofill injection, form field detection, password generation,
 * and communication with the popup.
 * 
 * Injected into all pages via manifest content_scripts.
 */

console.log("🔒 SecureVault Content Script active");

// ═══════════════════════════════════════════════════════════════════
// 1. MESSAGE LISTENER — Receive autofill commands from popup
// ═══════════════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "AUTOFILL") {
        const result = performAutofill(message.username, message.password);
        sendResponse(result);
    }
    return true;
});

// ═══════════════════════════════════════════════════════════════════
// 2. AUTOFILL LOGIC
// ═══════════════════════════════════════════════════════════════════

function performAutofill(username, password) {
    const usernameField = findUsernameField();
    const passwordField = findPasswordField();

    let filled = false;

    if (usernameField && username) {
        setFieldValue(usernameField, username);
        filled = true;
    }

    if (passwordField && password) {
        setFieldValue(passwordField, password);
        filled = true;
    }

    if (filled) {
        showAutofillNotification("✅ SecureVault: Credentials filled!");
        return { ok: true };
    }

    return { ok: false, error: "No login fields detected" };
}

// ─── Smart Field Detection ─────────────────────────────────────────

function findUsernameField() {
    // Priority order for username detection
    const selectors = [
        'input[autocomplete="username"]',
        'input[autocomplete="email"]',
        'input[name="email"]',
        'input[name="username"]',
        'input[name="user"]',
        'input[name="login"]',
        'input[name="loginId"]',
        'input[id="email"]',
        'input[id="username"]',
        'input[id="login"]',
        'input[type="email"]',
        'input[name*="email" i]',
        'input[name*="user" i]',
        'input[name*="login" i]',
        'input[placeholder*="email" i]',
        'input[placeholder*="username" i]',
        'input[placeholder*="user" i]',
        'input[aria-label*="email" i]',
        'input[aria-label*="username" i]'
    ];

    for (const selector of selectors) {
        const field = document.querySelector(selector);
        if (field && isVisible(field)) return field;
    }

    // Fallback: find a visible text input near a password field
    const passwordField = findPasswordField();
    if (passwordField) {
        const form = passwordField.closest("form");
        if (form) {
            const textInputs = form.querySelectorAll('input[type="text"], input:not([type])');
            for (const input of textInputs) {
                if (isVisible(input)) return input;
            }
        }
    }

    // Last resort: any visible text/email input on page
    const allInputs = document.querySelectorAll('input[type="text"], input[type="email"], input:not([type])');
    for (const input of allInputs) {
        if (isVisible(input) && !input.readOnly && !input.disabled) return input;
    }

    return null;
}

function findPasswordField() {
    const selectors = [
        'input[autocomplete="current-password"]',
        'input[type="password"]',
        'input[name="password"]',
        'input[name="pass"]',
        'input[id="password"]'
    ];

    for (const selector of selectors) {
        const field = document.querySelector(selector);
        if (field && isVisible(field)) return field;
    }

    return null;
}

function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        el.offsetParent !== null
    );
}

// ─── Set Value (React/Framework Compatible) ─────────────────────

function setFieldValue(field, value) {
    // Use native input value setter to bypass React's synthetic events
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, "value"
    ).set;

    nativeInputValueSetter.call(field, value);

    // Dispatch events so React/Vue/Angular detect the change
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    field.dispatchEvent(new Event("blur", { bubbles: true }));
}

// ═══════════════════════════════════════════════════════════════════
// 3. PASSWORD GENERATOR BUTTONS
// ═══════════════════════════════════════════════════════════════════

function generateStrongPassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

function injectGenerateButtons() {
    chrome.storage.local.get(["extensionActive"], (data) => {
        // Default to active if not set
        if (data.extensionActive === false) {
            document.querySelectorAll(".sv-btn").forEach((btn) => btn.remove());
            return;
        }

        const passwordInputs = document.querySelectorAll('input[type="password"]');

        passwordInputs.forEach((input) => {
            // Skip if button already exists
            if (input.dataset.svInjected === "true") return;
            input.dataset.svInjected = "true";

            const btn = document.createElement("button");
            btn.type = "button";
            btn.innerText = "🔑 Generate";
            btn.className = "sv-btn";

            // Position near the input
            input.parentNode.insertBefore(btn, input.nextSibling);

            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const password = generateStrongPassword();
                setFieldValue(input, password);
                showAutofillNotification(`🔑 Password generated!`);
            });
        });
    });
}

// Check periodically for dynamically loaded password fields
setInterval(injectGenerateButtons, 2000);

// ═══════════════════════════════════════════════════════════════════
// 4. AUTOFILL NOTIFICATION
// ═══════════════════════════════════════════════════════════════════

function showAutofillNotification(message) {
    // Remove any existing notification
    const existing = document.getElementById("sv-notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.id = "sv-notification";
    notification.className = "sv-notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.classList.add("sv-notification-show");
    });

    // Remove after 2.5 seconds
    setTimeout(() => {
        notification.classList.remove("sv-notification-show");
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}