document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const unlockBtn = document.getElementById('unlock-btn');
    const lockBtn = document.getElementById('lock-btn');
    const toggle = document.getElementById('extension-toggle');

    // 1. Handle Unlock
    unlockBtn.addEventListener('click', () => {
        const masterKey = document.getElementById('master-key').value;
        if (masterKey.length < 4) {
            alert("Master Key must be at least 4 characters!");
            return;
        }
        
        // Save state locally
        chrome.storage.local.set({ isLocked: false, key: masterKey }, () => {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
        });
    });

    // 2. Handle Lock
    lockBtn.addEventListener('click', () => {
        chrome.storage.local.set({ isLocked: true, key: null }, () => {
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
        });
    });

    // 3. Handle On/Off Toggle
    toggle.addEventListener('change', () => {
        chrome.storage.local.set({ extensionActive: toggle.checked });
    });

    // 4. Check initial state on open
    chrome.storage.local.get(['isLocked', 'extensionActive'], (data) => {
        if (data.isLocked === false) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
        }
        if (data.extensionActive !== undefined) {
            toggle.checked = data.extensionActive;
        }
    });
});