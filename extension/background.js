/**
 * SecureVault — Background Service Worker
 * =========================================
 * Handles: auto-lock timer, session management, message routing
 */

const AUTO_LOCK_MINUTES = 5;
const ALARM_NAME = "securevault-autolock";

// ─── On Install ────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
    console.log("⚙️ SecureVault extension installed");
    chrome.storage.session.set({ unlocked: false });
});

// ─── Auto-Lock Alarm ───────────────────────────────────────────────
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        console.log("🔒 Auto-lock triggered after inactivity");
        chrome.storage.session.set({
            unlocked: false,
            masterPassword: null,
            userId: null
        });
        // Notify any open popup
        chrome.runtime.sendMessage({ type: "AUTO_LOCKED" }).catch(() => {});
    }
});

// ─── Reset auto-lock timer (called on user activity) ───────────────
function resetAutoLock() {
    chrome.alarms.clear(ALARM_NAME);
    chrome.alarms.create(ALARM_NAME, { delayInMinutes: AUTO_LOCK_MINUTES });
}

// ─── Message Handler ───────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "RESET_TIMER") {
        resetAutoLock();
        sendResponse({ ok: true });
    }

    if (message.type === "UNLOCK") {
        resetAutoLock();
        sendResponse({ ok: true });
    }

    if (message.type === "LOCK") {
        chrome.alarms.clear(ALARM_NAME);
        chrome.storage.session.set({
            unlocked: false,
            masterPassword: null,
            userId: null
        });
        sendResponse({ ok: true });
    }

    // Return true to keep the message channel open for async responses
    return true;
});