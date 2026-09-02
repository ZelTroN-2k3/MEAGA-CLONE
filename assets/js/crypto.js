// assets/js/crypto.js

// Derive Master Key from password
async function deriveMasterKey(password) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    
    // Hardcoded salt for MVP (in production, salt should be unique per user and stored in DB)
    const salt = encoder.encode("mega_clone_salt_2026");
    
    const masterKey = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
    
    // Export to raw for easy storage in sessionStorage
    const exported = await crypto.subtle.exportKey("raw", masterKey);
    return bufferToHex(exported);
}

// Import master key from hex
async function importMasterKey(hexString) {
    const raw = hexToBuffer(hexString);
    return await crypto.subtle.importKey(
        "raw",
        raw,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
}

// Generate random File Key (32 bytes = 256 bit) and IV (12 bytes)
function generateFileKeyAndIV() {
    const fileKey = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    return { fileKey, iv };
}

// Encrypt a file blob
async function encryptFile(fileBlob, fileKeyBytes, ivBytes) {
    const fileBuffer = await fileBlob.arrayBuffer();
    
    const key = await crypto.subtle.importKey(
        "raw",
        fileKeyBytes,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );
    
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: ivBytes },
        key,
        fileBuffer
    );
    
    return new Blob([ciphertext]);
}

// Decrypt a file blob
async function decryptFile(ciphertextBlob, fileKeyBytes, ivBytes) {
    const cipherBuffer = await ciphertextBlob.arrayBuffer();
    
    const key = await crypto.subtle.importKey(
        "raw",
        fileKeyBytes,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );
    
    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivBytes },
            key,
            cipherBuffer
        );
        return new Blob([decrypted]);
    } catch (e) {
        console.error("Decryption failed", e);
        throw new Error("Clé de déchiffrement invalide ou fichier corrompu.");
    }
}

// Encrypt the FileKey and IV with the MasterKey for server storage
async function encryptKeyData(fileKeyBytes, ivBytes, masterKeyHex) {
    const masterKey = await importMasterKey(masterKeyHex);
    // Combine fileKey (32) and iv (12) = 44 bytes
    const combined = new Uint8Array(44);
    combined.set(fileKeyBytes, 0);
    combined.set(ivBytes, 32);
    
    const masterIv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedKeyData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: masterIv },
        masterKey,
        combined
    );
    
    // Return format: masterIv:encryptedKeyData
    return bufferToHex(masterIv) + ':' + bufferToHex(encryptedKeyData);
}

// Decrypt the FileKey and IV using the MasterKey
async function decryptKeyData(encryptedString, masterKeyHex) {
    const parts = encryptedString.split(':');
    if (parts.length !== 2) throw new Error("Invalid encrypted key format");
    
    const masterIv = hexToBuffer(parts[0]);
    const encryptedKeyData = hexToBuffer(parts[1]);
    const masterKey = await importMasterKey(masterKeyHex);
    
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: masterIv },
        masterKey,
        encryptedKeyData
    );
    
    const decryptedBytes = new Uint8Array(decrypted);
    const fileKeyBytes = decryptedBytes.slice(0, 32);
    const ivBytes = decryptedBytes.slice(32, 44);
    
    return { fileKeyBytes, ivBytes };
}

// Utility: ArrayBuffer to Hex
function bufferToHex(buffer) {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Utility: Hex to ArrayBuffer
function hexToBuffer(hex) {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
}
