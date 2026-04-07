<div align="center">
  <img src="https://img.shields.io/badge/Security-Zero%20Knowledge-6C63FF?style=for-the-badge" alt="Zero-Knowledge Security" />
  <img src="https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Backend-Node%20Express-3982CE?style=for-the-badge&logo=nodedotjs" alt="Node.js Express" />
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  
  <br />
  <br />
  
  <h1>🛡️ SecureVault</h1>
  <p><b>A modern, zero-knowledge encrypted password manager.</b></p>
</div>

<br />

SecureVault is not just another password manager—it is a secure, decentralized digital vault built on absolute **Zero-Knowledge principles**. 

Your master password never leaves your device. Your data is encrypted mathematically strictly inside your browser. By the time it reaches the server, it is nothing more than an opaque, indistinguishable binary blob. If the database is ever compromised, the attacker gains absolutely nothing.

---

## ✨ Features

- **Zero-Knowledge Encryption**: We don't know your password. The database doesn't know your password. Only you do.
- **Binary-Packed Vault Engine**: Credentials, salts, and initialization vectors are intricately packed into a single binary format before Base64 upload.
- **Client-Side Cryptography**: Powered strictly by the native Web Crypto API (`PBKDF2`, `AES-256-GCM`). 
- **Aether Crypt Design System**: Featuring a high-end "digital obsidian" aesthetic, glassmorphism, ambient glows, and fluid micro-animations. No jarring borders or utilitarian grids.
- **Auto-Sync Mechanism**: Changes are mapped to a central in-memory state and auto-saved iteratively.
- **Recovery Key System**: Cryptographically sound emergency fallback to reset forgotten master passwords.

---

## 🏗️ The Architecture 

### The Ultimate "Blind Backend"
The backend has been aggressively pruned. Mongoose does not map your data. It does not possess a `password` field, a `username` field, or even a `platform` field. 

**The Single Database Document:**
```json
{
  "_id": "ObjectId",
  "userId": "Derived SHA-256 Hash",
  "recoveryKeyHash": "Derived SHA-256 Hash",
  "vault": "AQAAAAAAAAAAAAAAAAAAAAA..." // The entire binary blob
}
```

### 🔒 Cryptographic Lifecycle
1. **PBKDF2 Derivation**: A 256-bit encryption key is squeezed from your master password using 100,000 algorithmic iterations and a 16-byte cryptographically secure random salt.
2. **AES-GCM Encryption**: The JSON-stringified array of your entire vault is encrypted. A fresh 12-byte IV (Initialization Vector) prevents nonce-reuse attacks.
3. **Binary Serialization**: The `[Version | Salt | IV | Ciphertext]` sequence is stitched into a single raw `Uint8Array`.
4. **Base64 Transport**: The array is encoded to Base64, bypassing JSON serialization limits, and thrust safely up to the backend via a single `POST /store` route.

---

## 🚀 Getting Started

To run SecureVault locally, you need two terminal instances.

### 1. Start the Secure Backend (Port 5000)
Ensure your `.env` is configured with `MONGO_URI`.
```bash
cd backend
npm install
npm run dev
```

### 2. Start the Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to create your initial vault and begin adding credentials. 

*(Note: Data created prior to the binary migration is incompatible with this engine schema).*

---

## 🎨 Design Philosophy: "Aether Crypt"
The interface ignores traditional security software standards (thick padlocks, heavy borders, utilitarian tables). Data lives as a precious commodity resting inside an atmospheric "Digital Obsidian".
* **Layering over Lines**: Depth is demonstrated via surface-tier stacking, not 1px borders.
* **Gradients**: Elements use strict linear-accents of `#c4c0ff` to `#8781ff` for visual weight.
* **Glassmorphism**: Modals interact cleanly with blurred deep environments. 

---

<div align="center">
  <p><i>Your master password is never sent to the server. All encryption happens locally in your browser.</i></p>
</div>
