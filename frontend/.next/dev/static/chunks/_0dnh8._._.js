(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/crypto.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/crypto.js
// Browser-compatible encryption wrappers using Web Crypto API
__turbopack_context__.s([
    "decryptData",
    ()=>decryptData,
    "deriveKey",
    ()=>deriveKey,
    "encryptData",
    ()=>encryptData,
    "generateSalt",
    ()=>generateSalt,
    "generateUserId",
    ()=>generateUserId
]);
async function generateSalt() {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    return Array.from(salt).map((b)=>b.toString(16).padStart(2, '0')).join('');
}
async function generateUserId(masterPassword) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(masterPassword), {
        name: 'PBKDF2'
    }, false, [
        'deriveBits'
    ]);
    // Deterministic salt for userId derivation
    const salt = enc.encode("securevault-userid-salt");
    const hashBuffer = await window.crypto.subtle.deriveBits({
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
    }, keyMaterial, 256);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b)=>b.toString(16).padStart(2, '0')).join('');
}
async function deriveKey(masterPassword, saltHex) {
    const enc = new TextEncoder();
    const saltBuffer = new Uint8Array(saltHex.match(/[\da-f]{2}/gi).map((h)=>parseInt(h, 16)));
    const keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(masterPassword), {
        name: 'PBKDF2'
    }, false, [
        'deriveBits',
        'deriveKey'
    ]);
    return window.crypto.subtle.deriveKey({
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
    }, keyMaterial, {
        name: 'AES-CBC',
        length: 256
    }, false, [
        'encrypt',
        'decrypt'
    ]);
}
async function encryptData(plaintext, cryptoKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const enc = new TextEncoder();
    const ciphertextBuffer = await window.crypto.subtle.encrypt({
        name: 'AES-CBC',
        iv: iv
    }, cryptoKey, enc.encode(plaintext));
    const cipherHex = Array.from(new Uint8Array(ciphertextBuffer)).map((b)=>b.toString(16).padStart(2, '0')).join('');
    const ivHex = Array.from(iv).map((b)=>b.toString(16).padStart(2, '0')).join('');
    return {
        cipherHex,
        ivHex
    };
}
async function decryptData(cipherHex, ivHex, cryptoKey) {
    try {
        const cipherBuffer = new Uint8Array(cipherHex.match(/[\da-f]{2}/gi).map((h)=>parseInt(h, 16)));
        const ivBuffer = new Uint8Array(ivHex.match(/[\da-f]{2}/gi).map((h)=>parseInt(h, 16)));
        const decryptedBuffer = await window.crypto.subtle.decrypt({
            name: 'AES-CBC',
            iv: ivBuffer
        }, cryptoKey, cipherBuffer);
        return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
        console.error("Decryption failed. Wrong password?");
        return null;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/context/VaultContext.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VaultProvider",
    ()=>VaultProvider,
    "useVault",
    ()=>useVault
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$crypto$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/crypto.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
const VaultContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])();
function VaultProvider({ children }) {
    _s();
    const [encryptionKey, setEncryptionKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [userId, setUserId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isUnlocked, setIsUnlocked] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    // Auto-lock timer logic
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "VaultProvider.useEffect": ()=>{
            let timeout;
            const resetTimer = {
                "VaultProvider.useEffect.resetTimer": ()=>{
                    clearTimeout(timeout);
                    if (isUnlocked) {
                        // 5 minutes auto-lock
                        timeout = setTimeout({
                            "VaultProvider.useEffect.resetTimer": ()=>{
                                lockVault();
                            }
                        }["VaultProvider.useEffect.resetTimer"], 5 * 60 * 1000);
                    }
                }
            }["VaultProvider.useEffect.resetTimer"];
            if (isUnlocked) {
                window.addEventListener('mousemove', resetTimer);
                window.addEventListener('keypress', resetTimer);
                resetTimer();
            }
            return ({
                "VaultProvider.useEffect": ()=>{
                    clearTimeout(timeout);
                    window.removeEventListener('mousemove', resetTimer);
                    window.removeEventListener('keypress', resetTimer);
                }
            })["VaultProvider.useEffect"];
        }
    }["VaultProvider.useEffect"], [
        isUnlocked
    ]);
    const unlockVault = async (masterPassword)=>{
        const currentUserId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$crypto$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateUserId"])(masterPassword);
        setEncryptionKey(masterPassword); // Storing the password in memory to derive per-credential keys
        setUserId(currentUserId);
        setIsUnlocked(true);
    };
    const lockVault = ()=>{
        setEncryptionKey(null);
        setUserId(null);
        setIsUnlocked(false);
        router.push('/');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(VaultContext.Provider, {
        value: {
            encryptionKey,
            userId,
            isUnlocked,
            unlockVault,
            lockVault
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/context/VaultContext.js",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
_s(VaultProvider, "mGC5segpeGcPJlhHeYLrAD/HwwU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = VaultProvider;
function useVault() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(VaultContext);
    if (!context) {
        throw new Error('useVault must be used within a VaultProvider');
    }
    return context;
}
_s1(useVault, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "VaultProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/Navbar.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "brand": "Navbar-module__nuAbfa__brand",
  "container": "Navbar-module__nuAbfa__container",
  "icon": "Navbar-module__nuAbfa__icon",
  "link": "Navbar-module__nuAbfa__link",
  "lockBtn": "Navbar-module__nuAbfa__lockBtn",
  "navLinks": "Navbar-module__nuAbfa__navLinks",
  "navbar": "Navbar-module__nuAbfa__navbar",
});
}),
"[project]/components/Navbar.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Navbar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$VaultContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/context/VaultContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Navbar$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/Navbar.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function Navbar() {
    _s();
    const { isUnlocked, lockVault } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$VaultContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useVault"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Navbar$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].navbar,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Navbar$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].container,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    href: "/",
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Navbar$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].brand,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Navbar$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].icon,
                            children: "🔐"
                        }, void 0, false, {
                            fileName: "[project]/components/Navbar.js",
                            lineNumber: 14,
                            columnNumber: 11
                        }, this),
                        "SecureVault"
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/Navbar.js",
                    lineNumber: 13,
                    columnNumber: 9
                }, this),
                isUnlocked && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Navbar$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].navLinks,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/dashboard",
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Navbar$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].link,
                            children: "Dashboard"
                        }, void 0, false, {
                            fileName: "[project]/components/Navbar.js",
                            lineNumber: 20,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: lockVault,
                            className: `btn btn-danger ${__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Navbar$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].lockBtn}`,
                            children: "🔒 Lock Vault"
                        }, void 0, false, {
                            fileName: "[project]/components/Navbar.js",
                            lineNumber: 23,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/Navbar.js",
                    lineNumber: 19,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/Navbar.js",
            lineNumber: 12,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/Navbar.js",
        lineNumber: 11,
        columnNumber: 5
    }, this);
}
_s(Navbar, "omXt3+R/opZDteZB7a0oxDLGwPQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$VaultContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useVault"]
    ];
});
_c = Navbar;
var _c;
__turbopack_context__.k.register(_c, "Navbar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_0dnh8._._.js.map