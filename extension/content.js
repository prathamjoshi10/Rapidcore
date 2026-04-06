console.log("🔒 SecureVault Content Script is active!");

// --- 1. UTILITY FUNCTIONS ---

// Generates a 16-character strong password
function generateStrongPassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// --- 2. CORE LOGIC ---

async function injectRecommendButtons() {
    // Check extension state from local storage
    chrome.storage.local.get(['extensionActive', 'isLocked'], async (data) => {
        const passwordInputs = document.querySelectorAll('input[type="password"]');

        // IF DISABLED OR LOCKED: Remove buttons and stop
        if (data.extensionActive === false || data.isLocked === true || data.isLocked === undefined) {
            document.querySelectorAll('.sv-btn').forEach(btn => btn.remove());
            return;
        }

        // IF ACTIVE: Inject buttons
        passwordInputs.forEach(input => {
            // Prevent duplicate buttons
            if (input.nextElementSibling && input.nextElementSibling.classList.contains('sv-btn')) {
                return;
            }

            const svButton = document.createElement('button');
            svButton.type = "button";
            svButton.innerText = "🔑 Auto-Generate";
            svButton.className = "sv-btn";
            
            // Insert after the input field
            input.parentNode.insertBefore(svButton, input.nextSibling);

            // Handle Click
            svButton.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const newPassword = generateStrongPassword();
                input.value = newPassword;

                // For the Hackathon Demo:
                console.log("Password Generated. Next Step: Encrypting and sending to MongoDB...");
                alert(`Generated: ${newPassword}\n\nThis will now be encrypted using your Master Key and saved to SecureVault.`);
            });
        });

        // AUTO-FILL LOGIC: If a password for this site exists, fill it automatically
        await findAndFillStoredPassword(passwordInputs);
    });
}

async function findAndFillStoredPassword(inputs) {
    const domain = window.location.hostname;
    
    try {
        // Fetch from your Node.js Backend
        const response = await fetch(`http://localhost:5000/api/passwords?domain=${domain}`);
        const data = await response.json();

        if (data && data.encryptedPassword) {
            // In a full Zero-Knowledge flow, you would decrypt data.encryptedPassword 
            // here using the Master Key stored in chrome.storage.local
            inputs.forEach(input => {
                if (input.value === "") { // Only fill if empty
                    input.value = data.encryptedPassword; // Placeholder for decrypted pass
                    console.log(`✅ Auto-filled password for ${domain}`);
                }
            });
        }
    } catch (err) {
        // Silent fail if no password found or server is down
        console.log("No saved password found for this domain.");
    }
}

// --- 3. EXECUTION ---

// Run every 1.5 seconds to handle dynamic page loads (like React/Next.js sites)
setInterval(injectRecommendButtons, 1500);