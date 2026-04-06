# [Cybersecurity / Blockchain - Project 2]

## 🚀 Project Title  
SecureVault — Zero-Knowledge Password Manager

## 🧠 Problem Statement  
Users reuse weak passwords across multiple platforms, leading to credential breaches.

## 🎯 Objective  
Build an encrypted password manager where all credentials are encrypted on the client side using AES-256-CBC, ensuring the server **never** sees plaintext passwords.

## 👥 Target Users  
Security-conscious users who want a self-hosted, zero-knowledge credential vault.

## ⚙️ Core Features (MVP - achievable in 24 hours)
- Store encrypted passwords (AES-256-CBC)
- Master password-based key derivation (PBKDF2)
- CRUD operations on credentials
- Search vault by platform name
- Lock Vault feature (clears key from memory)

## 🌟 Advanced Features (for top teams)
- Copy-based autofill (Copy button + "Open Website" button)
- Auto-lock after 5 min inactivity
- Per-credential unique IV

## 🔄 User Flow
```
Login (Master Password) → Derive AES Key (PBKDF2) → Dashboard
  → Add Credential → Encrypt (AES-256-CBC) → Store to Backend
  → View Credential → Fetch Encrypted → Decrypt → Display
  → Lock Vault → Clear Key from Memory → Back to Login
```

## 🏗️ System Design Overview
```
User → Master Password → PBKDF2 Key Derivation (client-side)
     → AES-256-CBC Encrypt/Decrypt (client-side)
     → Encrypted data only → Express API → MongoDB Atlas
```

## 🔌 API Design

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check (JSON) |
| `GET` | `/health` | Health check (simple text) |
| `POST` | `/api/credentials` | Store encrypted credential |
| `GET` | `/api/credentials?userId=xxx` | Get all credentials |
| `GET` | `/api/credentials/search?userId=xxx&q=github` | Search by platform |
| `GET` | `/api/credentials/:id` | Get single credential |
| `PUT` | `/api/credentials/:id` | Update credential |
| `DELETE` | `/api/credentials/:id` | Delete credential |

## 🗄️ Database Schema

### Credential Model (MongoDB)
```
{
  userId:            String (indexed)
  platform:          String (indexed, plaintext for search)
  url:               String (plaintext for "Open Website")
  encryptedUsername:  String (AES-256-CBC ciphertext, hex)
  usernameIv:        String (16-byte IV, hex)
  encryptedPassword: String (AES-256-CBC ciphertext, hex)
  passwordIv:        String (16-byte IV, hex)
  createdAt:         Date
  updatedAt:         Date
}
```

## ⚠️ Engineering Challenges
- Client-side encryption with Web Crypto API
- Key derivation must be deterministic (same master password → same key)
- Graceful failure on wrong master password
- Salt management (stored in localStorage)

## 🧪 Edge Cases
- Wrong master password → decryption fails gracefully (by design)
- Lost encryption key → warn user (unrecoverable)
- Duplicate entries → allowed (different accounts on same platform)
- Empty vault → friendly empty state UI

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (React) |
| Backend | Express.js + Node.js |
| Database | MongoDB Atlas |
| Encryption | Web Crypto API (AES-256-CBC, PBKDF2) |
| Security | Helmet, CORS, Input Validation |

## 📊 Evaluation Criteria
- Innovation  
- System Design  
- Code Quality  
- Completeness  
- UX  

## 📦 Deliverables (MANDATORY)
- Source code  
- README with setup  

## ⏱️ Constraints
- 24 hours  
- Focus on MVP first  

## 💡 Bonus Ideas
- AES-256-CBC zero-knowledge encryption
- Lock Vault button (security UX)
- Auto-lock on inactivity

---

# Implementation Progress

## ✅ Phase 1 — Backend (COMPLETED)

All files in `backend/`:

| File | Purpose | Status |
|------|---------|--------|
| `config/db.js` | MongoDB Atlas connection | ✅ Done |
| `models/Credential.js` | Mongoose schema with indexes on `userId` & `platform` | ✅ Done |
| `controllers/credential.controller.js` | CRUD + search + validation + `.select("-__v")` | ✅ Done |
| `routes/credential.routes.js` | API route definitions with validation middleware | ✅ Done |
| `middleware/errorHandler.js` | Centralized error handling (Mongoose errors, bad IDs) | ✅ Done |
| `middleware/validateRequest.js` | Reusable required-field validation | ✅ Done |
| `server.js` | Express app + Helmet + CORS + `/health` route | ✅ Done |
| `.env` / `.env.example` | MongoDB Atlas URI, port, CORS config | ✅ Done |
| `package.json` / `.gitignore` | Dependencies & git config | ✅ Done |

### Security Features Implemented
- ✅ Helmet (security headers)
- ✅ CORS restriction via `.env`
- ✅ Input validation (middleware + controller)
- ✅ Data exposure limits (`.select("-__v")`)
- ✅ Centralized error handling
- ✅ Database indexing for performance

---

## ✅ Phase 2 — Encryption Module (COMPLETED)

Location: `encryption/`

| File | Purpose | Status |
|------|---------|--------|
| `encryption/keyDerivation.js` | Derive AES-256 key from master password using PBKDF2 (100k iterations, SHA-256) | ✅ Done |
| `encryption/encrypt.js` | AES-256-CBC encryption with random 16-byte IV, outputs hex strings | ✅ Done |
| `encryption/decrypt.js` | AES-256-CBC decryption with graceful error handling on wrong password | ✅ Done |
| `encryption/index.js` | Barrel exports + `generateSalt()` + `encryptCredential()` + `decryptCredential()` helpers | ✅ Done |

### Encryption Data Flow
```
STORE:
  User input → deriveKey(masterPassword, salt) via PBKDF2
             → encryptCredential({ platform, url, username, password }, cryptoKey)
             → AES-256-CBC encrypt username & password (each gets unique IV)
             → Send { platform, url, encryptedUsername, usernameIv, encryptedPassword, passwordIv } to backend
             → Store in MongoDB

RETRIEVE:
  Fetch encrypted credential from backend
  → decryptCredential(encrypted, cryptoKey)
  → AES-256-CBC decrypt username & password using stored IVs
  → Display plaintext to user
```

### Key Technical Details
- **Master password** is **never** sent to the server
- **PBKDF2** key derivation: 100,000 iterations, SHA-256, 256-bit output
- **Each field** (username & password) gets its own **unique random IV**
- **Salt** is generated via `generateSalt()` (16-byte random, hex) and stored in `localStorage`
- **Wrong master password** → decryption throws error → caught gracefully
- **Platform & URL** stay as plaintext for search and "Open Website" functionality
- Uses **Web Crypto API** (`window.crypto.subtle`) — native browser crypto, no external libs

### Exported Functions
| Function | Signature | Description |
|----------|-----------|-------------|
| `deriveKey` | `(masterPassword, saltHex) → CryptoKey` | PBKDF2 key derivation |
| `encryptData` | `(plaintext, cryptoKey) → { cipherHex, ivHex }` | Low-level AES encrypt |
| `decryptData` | `(cipherHex, ivHex, cryptoKey) → plaintext` | Low-level AES decrypt |
| `generateSalt` | `() → saltHex` | Generate random 16-byte salt |
| `encryptCredential` | `(credential, cryptoKey) → encryptedObj` | Encrypt full credential |
| `decryptCredential` | `(encrypted, cryptoKey) → plaintextObj` | Decrypt full credential |

---

## 🔲 Phase 3 — Frontend (Next.js) — NOT STARTED

Location: `frontend/`

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/` | Master password entry |
| Dashboard | `/dashboard` | Vault overview with search |
| Add Credential | `/add` | Form to add new credential |
| View Credential | `/credential/:id` | View/edit single credential |

### UI Components

| Component | Features |
|-----------|----------|
| `MasterPasswordForm` | Login with master password, derive encryption key |
| `CredentialCard` | Platform name, username, Show/Copy/Open buttons |
| `SearchBar` | Filter credentials by platform name |
| `AddCredentialForm` | Platform, URL, username, password inputs |
| `VaultList` | Grid/list of credential cards |
| `Navbar` | Navigation + Lock Vault button |
| `LockVaultButton` | 🔒 Clears encryption key from memory, forces re-login |

### 🔒 Lock Vault Feature
- "Lock Vault" button visible in the Navbar at all times
- On click: clears AES key from memory, clears decrypted data, redirects to Login
- Auto-lock after inactivity (5 min timeout)

### Design Requirements
- Dark theme, card-based UI
- Minimal and clean layout
- Responsive (mobile + desktop)
- Copy-based autofill (Copy button + "Open Website" button)

---

## 🔲 Phase 4 — Integration & Testing — NOT STARTED

### API Testing
- Test all CRUD endpoints with sample encrypted data
- Test validation (missing fields, bad IDs)
- Test search functionality

### Security Testing
- Verify no plaintext passwords in MongoDB
- Verify wrong master password → graceful failure
- Verify CORS blocks unauthorized origins

---

## Architecture

```
    User
      │  Master Password
      ▼
  Frontend (Next.js)
      │  deriveKey(PBKDF2)
      ▼
  Encryption Module
      │  AES-256-CBC
      ▼
  Express API (Port 5000)
      │  Helmet · CORS · Validation
      ▼
  MongoDB Atlas
      (Encrypted Data Only)
```

---

## Git Commit History
1. ✅ `feat: add backend project setup (package.json, .env.example, .gitignore)`
2. ✅ `feat: add server entry point and database config`
3. ✅ `feat: add Credential model (Mongoose schema)`
4. ✅ `feat: add credential routes, controller, and wire up API endpoints`
5. ✅ `feat: add error handler and validation middleware`
6. ✅ `chore: add mongodb driver dependency`
7. ✅ `feat: add indexing, data exposure limits, and health route`
8. ✅ `feat: add encryption barrel export with salt generation and credential helpers`
