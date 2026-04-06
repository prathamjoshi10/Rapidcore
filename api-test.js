// api-test.js
// Run this from your terminal using: node api-test.js

const API_BASE = "http://localhost:5000/api";
const testUser = `hacker_${Date.now()}`; // Unique user every run
const mockSalt = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"; // Fake 16-byte hex salt

async function runEndToEndTest() {
    console.log("🚀 Starting SecureVault E2E API Test...\n");

    try {
        // ==========================================
        // 1. TEST: Register a New User
        // ==========================================
        console.log(`[1] Registering new user: ${testUser}...`);
        const regRes = await fetch(`${API_BASE}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: testUser, salt: mockSalt })
        });
        const regData = await regRes.json();
        
        if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
        console.log("✅ User registered successfully in MongoDB.\n");

        // ==========================================
        // 2. TEST: Fetch User Salt (Login Simulation)
        // ==========================================
        console.log(`[2] Fetching salt for user: ${testUser}...`);
        const saltRes = await fetch(`${API_BASE}/users/${testUser}/salt`);
        const saltData = await saltRes.json();
        
        if (!saltRes.ok) throw new Error(`Salt fetch failed: ${JSON.stringify(saltData)}`);
        if (saltData.salt !== mockSalt) throw new Error("Returned salt does not match!");
        console.log("✅ Salt retrieved successfully.\n");

        // ==========================================
        // 3. TEST: Store a Credential
        // ==========================================
        console.log("[3] Storing a new encrypted credential...");
        const mockCredential = {
            userId: testUser, // Using username as the ID for this MVP
            platform: "github",
            url: "https://github.com/login",
            encryptedUsername: "deadbeef12345678", // Fake AES ciphertext
            usernameIv: "1234567890abcdef1234567890abcdef", // Fake 16-byte IV
            encryptedPassword: "cafebabe87654321", // Fake AES ciphertext
            passwordIv: "fedcba0987654321fedcba0987654321"  // Fake 16-byte IV
        };

        const storeRes = await fetch(`${API_BASE}/credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockCredential)
        });
        const storeData = await storeRes.json();
        
        if (!storeRes.ok) throw new Error(`Store credential failed: ${JSON.stringify(storeData)}`);
        console.log("✅ Credential securely saved to vault.\n");

        // ==========================================
        // 4. TEST: Retrieve Credentials
        // ==========================================
        console.log(`[4] Fetching vault for: ${testUser}...`);
        const getRes = await fetch(`${API_BASE}/credentials?userId=${testUser}`);
        const getData = await getRes.json();
        
        if (!getRes.ok) throw new Error(`Retrieve failed: ${JSON.stringify(getData)}`);
        if (getData.length === 0) throw new Error("Vault is empty but shouldn't be!");
        console.log(`✅ Retrieved ${getData.length} credential(s) from vault.`);
        console.log("   Sample Platform:", getData[0].platform);
        console.log("   Sample Encrypted Password:", getData[0].encryptedPassword, "\n");

        console.log("🎉 ALL TESTS PASSED! The API is 100% ready for the frontend.");

    } catch (error) {
        console.error("\n❌ TEST FAILED:");
        console.error(error.message);
    }
}

// Execute the test
runEndToEndTest();