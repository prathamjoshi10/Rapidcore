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
'use client';
;
;
;
;
const VaultContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])();
function VaultProvider({ children }) {
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
function useVault() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(VaultContext);
    if (!context) {
        throw new Error('useVault must be used within a VaultProvider');
    }
    return context;
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$VaultContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/context/VaultContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Navbar$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/components/Navbar.module.css [app-client] (css module)");
'use client';
;
;
;
;
function Navbar() {
    const { isUnlocked, lockVault } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$VaultContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useVault"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Navbar$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].navbar,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Navbar$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].container,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
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
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react.development.js [app-client] (ecmascript)", (() => {{

throw new Error("An error occurred while generating the chunk item [project]/node_modules/next/dist/compiled/react/cjs/react.development.js [app-client] (ecmascript)\n\nCaused by:\n- the chunking context (unknown) does not support external modules (request: node:process)\n\nDebug info:\n- An error occurred while generating the chunk item [project]/node_modules/next/dist/compiled/react/cjs/react.development.js [app-client] (ecmascript)\n- Execution of <EcmascriptModuleAsset as EcmascriptChunkPlaceable>::chunk_item_content failed\n- Execution of *EcmascriptChunkItemContent::new failed\n- Execution of EcmascriptModuleContent::new failed\n- the chunking context (unknown) does not support external modules (request: node:process)");

}}),
"[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)", (() => {{

throw new Error("An error occurred while generating the chunk item [project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)\n\nCaused by:\n- the chunking context (unknown) does not support external modules (request: node:process)\n\nDebug info:\n- An error occurred while generating the chunk item [project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)\n- Execution of <EcmascriptModuleAsset as EcmascriptChunkPlaceable>::chunk_item_content failed\n- Execution of *EcmascriptChunkItemContent::new failed\n- Execution of EcmascriptModuleContent::new failed\n- the chunking context (unknown) does not support external modules (request: node:process)");

}}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", (() => {{

throw new Error("An error occurred while generating the chunk item [project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)\n\nCaused by:\n- the chunking context (unknown) does not support external modules (request: node:process)\n\nDebug info:\n- An error occurred while generating the chunk item [project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)\n- Execution of <EcmascriptModuleAsset as EcmascriptChunkPlaceable>::chunk_item_content failed\n- Execution of *EcmascriptChunkItemContent::new failed\n- Execution of EcmascriptModuleContent::new failed\n- the chunking context (unknown) does not support external modules (request: node:process)");

}}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", (() => {{

throw new Error("An error occurred while generating the chunk item [project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)\n\nCaused by:\n- the chunking context (unknown) does not support external modules (request: node:process)\n\nDebug info:\n- An error occurred while generating the chunk item [project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)\n- Execution of <EcmascriptModuleAsset as EcmascriptChunkPlaceable>::chunk_item_content failed\n- Execution of *EcmascriptChunkItemContent::new failed\n- Execution of EcmascriptModuleContent::new failed\n- the chunking context (unknown) does not support external modules (request: node:process)");

}}),
"[project]/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = (()=>{
    const e = new Error("Cannot find module './dist/client/components/navigation'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
}),
"[project]/node_modules/next/link.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = (()=>{
    const e = new Error("Cannot find module './dist/client/link'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
}),
"[project]/node_modules/next/dist/client/components/layout-router.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const e = new Error("Could not parse module '[project]/node_modules/next/dist/client/components/layout-router.js', file not found");
e.code = 'MODULE_UNPARSABLE';
throw e;
}),
"[project]/node_modules/next/dist/client/components/render-from-template-context.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const e = new Error("Could not parse module '[project]/node_modules/next/dist/client/components/render-from-template-context.js', file not found");
e.code = 'MODULE_UNPARSABLE';
throw e;
}),
"[project]/node_modules/next/dist/client/components/client-page.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const e = new Error("Could not parse module '[project]/node_modules/next/dist/client/components/client-page.js', file not found");
e.code = 'MODULE_UNPARSABLE';
throw e;
}),
"[project]/node_modules/next/dist/client/components/client-segment.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const e = new Error("Could not parse module '[project]/node_modules/next/dist/client/components/client-segment.js', file not found");
e.code = 'MODULE_UNPARSABLE';
throw e;
}),
"[project]/node_modules/next/dist/client/components/http-access-fallback/error-boundary.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const e = new Error("Could not parse module '[project]/node_modules/next/dist/client/components/http-access-fallback/error-boundary.js', file not found");
e.code = 'MODULE_UNPARSABLE';
throw e;
}),
"[project]/node_modules/next/dist/lib/framework/boundary-constants.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    METADATA_BOUNDARY_NAME: null,
    OUTLET_BOUNDARY_NAME: null,
    ROOT_LAYOUT_BOUNDARY_NAME: null,
    VIEWPORT_BOUNDARY_NAME: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    METADATA_BOUNDARY_NAME: function() {
        return METADATA_BOUNDARY_NAME;
    },
    OUTLET_BOUNDARY_NAME: function() {
        return OUTLET_BOUNDARY_NAME;
    },
    ROOT_LAYOUT_BOUNDARY_NAME: function() {
        return ROOT_LAYOUT_BOUNDARY_NAME;
    },
    VIEWPORT_BOUNDARY_NAME: function() {
        return VIEWPORT_BOUNDARY_NAME;
    }
});
const METADATA_BOUNDARY_NAME = '__next_metadata_boundary__';
const VIEWPORT_BOUNDARY_NAME = '__next_viewport_boundary__';
const OUTLET_BOUNDARY_NAME = '__next_outlet_boundary__';
const ROOT_LAYOUT_BOUNDARY_NAME = '__next_root_layout_boundary__';
}),
"[project]/node_modules/next/dist/lib/framework/boundary-components.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    MetadataBoundary: null,
    OutletBoundary: null,
    RootLayoutBoundary: null,
    ViewportBoundary: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    MetadataBoundary: function() {
        return MetadataBoundary;
    },
    OutletBoundary: function() {
        return OutletBoundary;
    },
    RootLayoutBoundary: function() {
        return RootLayoutBoundary;
    },
    ViewportBoundary: function() {
        return ViewportBoundary;
    }
});
const _boundaryconstants = __turbopack_context__.r("[project]/node_modules/next/dist/lib/framework/boundary-constants.js [app-client] (ecmascript)");
// We use a namespace object to allow us to recover the name of the function
// at runtime even when production bundling/minification is used.
const NameSpace = {
    [_boundaryconstants.METADATA_BOUNDARY_NAME]: function({ children }) {
        return children;
    },
    [_boundaryconstants.VIEWPORT_BOUNDARY_NAME]: function({ children }) {
        return children;
    },
    [_boundaryconstants.OUTLET_BOUNDARY_NAME]: function({ children }) {
        return children;
    },
    [_boundaryconstants.ROOT_LAYOUT_BOUNDARY_NAME]: function({ children }) {
        return children;
    }
};
const MetadataBoundary = // so it retains the name inferred from the namespace object
NameSpace[_boundaryconstants.METADATA_BOUNDARY_NAME.slice(0)];
const ViewportBoundary = // so it retains the name inferred from the namespace object
NameSpace[_boundaryconstants.VIEWPORT_BOUNDARY_NAME.slice(0)];
const OutletBoundary = // so it retains the name inferred from the namespace object
NameSpace[_boundaryconstants.OUTLET_BOUNDARY_NAME.slice(0)];
const RootLayoutBoundary = // so it retains the name inferred from the namespace object
NameSpace[_boundaryconstants.ROOT_LAYOUT_BOUNDARY_NAME.slice(0)];
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-runtime.development.js [app-client] (ecmascript)", (() => {{

throw new Error("An error occurred while generating the chunk item [project]/node_modules/next/dist/compiled/react/cjs/react-jsx-runtime.development.js [app-client] (ecmascript)\n\nCaused by:\n- the chunking context (unknown) does not support external modules (request: node:process)\n\nDebug info:\n- An error occurred while generating the chunk item [project]/node_modules/next/dist/compiled/react/cjs/react-jsx-runtime.development.js [app-client] (ecmascript)\n- Execution of <EcmascriptModuleAsset as EcmascriptChunkPlaceable>::chunk_item_content failed\n- Execution of *EcmascriptChunkItemContent::new failed\n- Execution of EcmascriptModuleContent::new failed\n- the chunking context (unknown) does not support external modules (request: node:process)");

}}),
"[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)", (() => {{

throw new Error("An error occurred while generating the chunk item [project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)\n\nCaused by:\n- the chunking context (unknown) does not support external modules (request: node:process)\n\nDebug info:\n- An error occurred while generating the chunk item [project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)\n- Execution of <EcmascriptModuleAsset as EcmascriptChunkPlaceable>::chunk_item_content failed\n- Execution of *EcmascriptChunkItemContent::new failed\n- Execution of EcmascriptModuleContent::new failed\n- the chunking context (unknown) does not support external modules (request: node:process)");

}}),
"[project]/node_modules/next/dist/lib/metadata/generate/icon-mark.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "IconMark", {
    enumerable: true,
    get: function() {
        return IconMark;
    }
});
const _jsxruntime = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
const IconMark = ()=>{
    if (typeof window !== 'undefined') {
        return null;
    }
    return /*#__PURE__*/ (0, _jsxruntime.jsx)("meta", {
        name: "\xabnxt-icon\xbb"
    });
};
}),
"[project]/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js [app-client] (ecmascript)", (() => {{

throw new Error("An error occurred while generating the chunk item [project]/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js [app-client] (ecmascript)\n\nCaused by:\n- the chunking context (unknown) does not support external modules (request: node:process)\n\nDebug info:\n- An error occurred while generating the chunk item [project]/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js [app-client] (ecmascript)\n- Execution of <EcmascriptModuleAsset as EcmascriptChunkPlaceable>::chunk_item_content failed\n- Execution of *EcmascriptChunkItemContent::new failed\n- Execution of EcmascriptModuleContent::new failed\n- the chunking context (unknown) does not support external modules (request: node:process)");

}}),
"[project]/node_modules/next/dist/next-devtools/userspace/app/segment-explorer-node.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    SEGMENT_EXPLORER_SIMULATED_ERROR_MESSAGE: null,
    SegmentBoundaryTriggerNode: null,
    SegmentStateProvider: null,
    SegmentViewNode: null,
    SegmentViewStateNode: null,
    useSegmentState: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    SEGMENT_EXPLORER_SIMULATED_ERROR_MESSAGE: function() {
        return SEGMENT_EXPLORER_SIMULATED_ERROR_MESSAGE;
    },
    SegmentBoundaryTriggerNode: function() {
        return SegmentBoundaryTriggerNode;
    },
    SegmentStateProvider: function() {
        return SegmentStateProvider;
    },
    SegmentViewNode: function() {
        return SegmentViewNode;
    },
    SegmentViewStateNode: function() {
        return SegmentViewStateNode;
    },
    useSegmentState: function() {
        return useSegmentState;
    }
});
const _jsxruntime = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
const _react = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
const _nextdevtools = (()=>{
    const e = new Error("Cannot find module 'next/dist/compiled/next-devtools'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _approutercontextsharedruntime = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js [app-client] (ecmascript)");
const _notfound = (()=>{
    const e = new Error("Cannot find module '../../../client/components/not-found'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const SEGMENT_EXPLORER_SIMULATED_ERROR_MESSAGE = 'NEXT_DEVTOOLS_SIMULATED_ERROR';
function SegmentTrieNode({ type, pagePath }) {
    const { boundaryType, setBoundaryType } = useSegmentState();
    const nodeState = (0, _react.useMemo)(()=>{
        return {
            type,
            pagePath,
            boundaryType,
            setBoundaryType
        };
    }, [
        type,
        pagePath,
        boundaryType,
        setBoundaryType
    ]);
    // Use `useLayoutEffect` to ensure the state is updated during suspense.
    // `useEffect` won't work as the state is preserved during suspense.
    (0, _react.useLayoutEffect)(()=>{
        _nextdevtools.dispatcher.segmentExplorerNodeAdd(nodeState);
        return ()=>{
            _nextdevtools.dispatcher.segmentExplorerNodeRemove(nodeState);
        };
    }, [
        nodeState
    ]);
    return null;
}
function NotFoundSegmentNode() {
    (0, _notfound.notFound)();
}
function ErrorSegmentNode() {
    throw Object.defineProperty(new Error(SEGMENT_EXPLORER_SIMULATED_ERROR_MESSAGE), "__NEXT_ERROR_CODE", {
        value: "E716",
        enumerable: false,
        configurable: true
    });
}
const forever = new Promise(()=>{});
function LoadingSegmentNode() {
    (0, _react.use)(forever);
    return null;
}
function SegmentViewStateNode({ page }) {
    const { tree } = (0, _react.useContext)(_approutercontextsharedruntime.GlobalLayoutRouterContext);
    (0, _react.useLayoutEffect)(()=>{
        _nextdevtools.dispatcher.segmentExplorerUpdateRouteState(page, tree);
        return ()=>{
            _nextdevtools.dispatcher.segmentExplorerUpdateRouteState('', null);
        };
    }, [
        page,
        tree
    ]);
    return null;
}
function SegmentBoundaryTriggerNode() {
    const { boundaryType } = useSegmentState();
    let segmentNode = null;
    if (boundaryType === 'loading') {
        segmentNode = /*#__PURE__*/ (0, _jsxruntime.jsx)(LoadingSegmentNode, {});
    } else if (boundaryType === 'not-found') {
        segmentNode = /*#__PURE__*/ (0, _jsxruntime.jsx)(NotFoundSegmentNode, {});
    } else if (boundaryType === 'error') {
        segmentNode = /*#__PURE__*/ (0, _jsxruntime.jsx)(ErrorSegmentNode, {});
    }
    return segmentNode;
}
function SegmentViewNode({ type, pagePath, children }) {
    const segmentNode = /*#__PURE__*/ (0, _jsxruntime.jsx)(SegmentTrieNode, {
        type: type,
        pagePath: pagePath
    }, type);
    return /*#__PURE__*/ (0, _jsxruntime.jsxs)(_jsxruntime.Fragment, {
        children: [
            segmentNode,
            children
        ]
    });
}
const SegmentStateContext = /*#__PURE__*/ (0, _react.createContext)({
    boundaryType: null,
    setBoundaryType: ()=>{}
});
function SegmentStateProvider({ children }) {
    const [boundaryType, setBoundaryType] = (0, _react.useState)(null);
    const [errorBoundaryKey, setErrorBoundaryKey] = (0, _react.useState)(0);
    const reloadBoundary = (0, _react.useCallback)(()=>setErrorBoundaryKey((prev)=>prev + 1), []);
    const setBoundaryTypeAndReload = (0, _react.useCallback)((type)=>{
        if (type === null) {
            reloadBoundary();
        }
        setBoundaryType(type);
    }, [
        reloadBoundary
    ]);
    return /*#__PURE__*/ (0, _jsxruntime.jsx)(SegmentStateContext.Provider, {
        value: {
            boundaryType,
            setBoundaryType: setBoundaryTypeAndReload
        },
        children: children
    }, errorBoundaryKey);
}
function useSegmentState() {
    return (0, _react.useContext)(SegmentStateContext);
}
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
]);

//# sourceMappingURL=_136r6u_._.js.map