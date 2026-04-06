# 🔐 SecureVault

A zero-knowledge encrypted password manager. Designed with security at its core, this application ensures that your passwords are encrypted on the client side before ever reaching the server.

![SecureVault UI Preview](https://via.placeholder.com/800x400.png?text=SecureVault+Zero+Knowledge+Manager)

## 🧠 Problem Statement
Users reuse weak passwords across multiple sites because they cannot remember all of them. Existing solutions often store user passwords on centralized servers, creating massive honeypots for hackers.

## 🎯 Solution
**SecureVault** is a **zero-knowledge** password manager. Your master password is never sent over the internet. Instead, your master password is used locally in your browser to derive an AES-256 encryption key.

## ⚙️ Core Architecture & Security Flow

1. **PBKDF2 Key Derivation**: When you sign in, your master password undergoes 100,000 iterations of PBKDF2 hashing with a unique salt to generate your client-side encryption key.
2. **AES-256-CBC Encryption**: When adding a credential, your password is encrypted using this derived key along with a randomly generated Initialization Vector (IV).
3. **Zero Knowledge Server**: The backend (Express/MongoDB) only receives the ciphertext and IV. It has absolutely no way to read your actual passwords.

## 🧰 Tech Stack
- **Frontend**: Next.js (React), Web Crypto API, Vanilla CSS.
- **Backend**: Node.js, Express, MongoDB Atlas.

## 🚀 Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file with your specific variables (e.g., MONGODB_URI)
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000` and the backend on `http://localhost:5000`.

## 🗄️ API Endpoints

- `GET /api/credentials?userId=<hash>` — Get all vault credentials for user
- `POST /api/credentials` — Store a new AES encrypted credential
- `GET /api/credentials/:id` — View a specific credential
- `PUT /api/credentials/:id` — Update/Re-encrypt a credential
- `DELETE /api/credentials/:id` — Delete a credential
- `PATCH /api/credentials/:id/track` — Track usage 

## 🔒 Special Project Features 
- **Auto-Lock**: The vault locks itself automatically after 5 minutes of inactivity.
- **Panic Lock Button**: A prominent 🔒 Lock Vault button is always present. Clicking it purges the derived encryption keys from the browser's memory and forces a re-login.
- **Copy-to-Clipboard Memory Cleansing**: Passwords can be copied, securely clearing from memory when no longer needed.
- **No LocalStorage Persistence**: For maximum security, encryption keys only live in React Context State. A page refresh requires re-authentication by design.
