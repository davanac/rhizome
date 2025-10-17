import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const algorithm = "aes-256-cbc";
const ivSize = 16;
const saltSize = 32;

// scrypt parameters (following OWASP recommendations)
const SCRYPT_N = 16384; // CPU/memory cost (2^14)
const SCRYPT_R = 8;     // Block size
const SCRYPT_P = 1;     // Parallelization
const SCRYPT_KEYLEN = 32; // Output key length (256 bits)

// Version identifiers for backward compatibility
const VERSION_LEGACY = 0; // Old SHA-256 based encryption
const VERSION_SCRYPT = 1; // New scrypt-based encryption

// Use configurable path from environment variable or fallback to secure default location
const getJsonPath = () => {
  if (process.env.CFR_FILE_PATH) {
    return path.resolve(process.env.CFR_FILE_PATH);
  }
  // Default to user's home directory for security (outside project)
  const homeDir = os.homedir();
  return path.join(homeDir, '.rhizome', 'cfr.json');
};

const jsonPath = getJsonPath();

/**
 * Derives a cryptographic key from a password using scrypt (secure method)
 * @param {string} password - The password to derive key from
 * @param {Buffer} salt - Random salt for key derivation
 * @returns {Buffer} Derived encryption key
 */
const deriveKeySecure = (password, salt) => {
  return crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
};

/**
 * Derives a key using legacy SHA-256 method (INSECURE - only for backward compatibility)
 * @deprecated Use deriveKeySecure instead
 * @param {string} password - The password to hash
 * @returns {Buffer} Derived key (insecure)
 */
const deriveKeyLegacy = (password) => {
  return crypto.createHash("sha256").update(password).digest();
};

/**
 * Encrypts text using scrypt-based key derivation (SECURE)
 * Format: [version:1][salt:32][iv:16][encrypted_data]
 * @param {string} password - Password for encryption
 * @param {string} text - Text to encrypt
 * @param {string} jsonKey - Optional key to store in JSON file
 * @returns {string} Base64-encoded encrypted data with version and salt
 */
const encrypt = (password, text, jsonKey) => {
  // Generate random salt and IV
  const salt = crypto.randomBytes(saltSize);
  const iv = crypto.randomBytes(ivSize);

  // Derive key using secure scrypt method
  const key = deriveKeySecure(password, salt);

  // Encrypt the data
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Create version byte
  const version = Buffer.from([VERSION_SCRYPT]);

  // Combine: version + salt + iv + encrypted_data
  const result = Buffer.concat([
    version,
    salt,
    iv,
    Buffer.from(encrypted, "base64")
  ]).toString("base64");

  if (jsonKey) {
    const dir = path.dirname(jsonPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let json = {};
    if (fs.existsSync(jsonPath)) {
      try {
        json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      } catch (e) {
        json = {};
      }
    }
    json[jsonKey] = result;
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), "utf8");
  }
  return result;
};

/**
 * Decrypts text with automatic detection of encryption version (legacy SHA-256 or new scrypt)
 * Provides backward compatibility with old encrypted data
 * @param {string} password - Password for decryption
 * @param {string} encryptedDataOrKey - Encrypted data or JSON key
 * @returns {string|null} Decrypted text or null on failure
 */
const decrypt = (password, encryptedDataOrKey) => {
  // Only log in development (passwords are sensitive data)
  if (process.env.NODE_ENV !== 'production') {
    console.log('=== keyutils.js decryption === key: 686816 ===');
    console.dir({ encryptedDataOrKey, jsonPath, jsonExists: fs.existsSync(jsonPath) }, { depth: null, colors: true })
    console.log('=================================');
  }

  try {
    // Try to load from JSON file if encryptedDataOrKey is a key name
    if (fs.existsSync(jsonPath)) {
      try {
        const json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

        console.log('=== json === keyutils.js === key: 614637 ===');
        console.dir(json, { depth: null, colors: true })
        console.log('=================================');

        if (Object.prototype.hasOwnProperty.call(json, encryptedDataOrKey)) {
          encryptedDataOrKey = json[encryptedDataOrKey];
        }
      } catch (e) {
        console.log("=== e === keyutils.js === key: 133218 ===");
        console.dir(e, { depth: null, colors: true });
        console.log("=================================");
      }
    }

    const data = Buffer.from(encryptedDataOrKey, "base64");

    // Detect version: if first byte is 0 or 1, it's versioned; otherwise legacy
    let version = VERSION_LEGACY;
    let offset = 0;

    if (data.length > 1 && (data[0] === VERSION_LEGACY || data[0] === VERSION_SCRYPT)) {
      version = data[0];
      offset = 1; // Skip version byte
    }

    console.log(`=== Detected encryption version: ${version === VERSION_LEGACY ? 'LEGACY (SHA-256)' : 'SCRYPT'} ===`);

    if (version === VERSION_SCRYPT) {
      // New format: [version:1][salt:32][iv:16][encrypted_data]
      if (data.length < 1 + saltSize + ivSize) {
        throw new Error('Invalid encrypted data format: too short for scrypt format');
      }

      const salt = data.subarray(offset, offset + saltSize);
      offset += saltSize;

      const iv = data.subarray(offset, offset + ivSize);
      offset += ivSize;

      const encryptedText = data.subarray(offset);

      // Derive key using scrypt
      const key = deriveKeySecure(password, salt);

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encryptedText, undefined, "utf8");
      decrypted += decipher.final("utf8");

      console.log('=== Successfully decrypted using SCRYPT ===');
      return decrypted;

    } else {
      // Legacy format: [iv:16][encrypted_data] (no version byte, no salt)
      console.warn('⚠️  WARNING: Decrypting using LEGACY SHA-256 method (INSECURE)');
      console.warn('⚠️  Please migrate this encrypted data using the migration utility');

      if (data.length < ivSize) {
        throw new Error('Invalid encrypted data format: too short for legacy format');
      }

      const iv = data.subarray(0, ivSize);
      const encryptedText = data.subarray(ivSize);

      // Derive key using legacy SHA-256
      const key = deriveKeyLegacy(password);

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encryptedText, undefined, "utf8");
      decrypted += decipher.final("utf8");

      console.log('=== Successfully decrypted using LEGACY method ===');
      return decrypted;
    }

  } catch (error) {
    console.log("=== error === keyutils.js === key: 037008 ===");
    console.dir(error, { depth: null, colors: true });
    console.log("=================================");
    return null;
  }
};

const KeyUtils = {
  setKey: encrypt,
  getKey: decrypt,
};

export { encrypt as setKey, decrypt as getKey };
export default KeyUtils;

/** ---------- Depuis un script .js -------- cmt 482653 ------------------
 *

//import KeyUtils from "path_to_directory/keyutils.js";

const start = () => {
  const password = "password"; //le mot de passe pour chiffrer/déchiffrer le texte
  const clearText = "Texte à chiffrer";
  const jsonKey = "cle.de.stockage"; //la clé qui permet de stocker/récuperer le texte chiffré dans un fichier JSON

  const encryptedText = KeyUtils.setKey(password, clearText, jsonKey);
  console.log("Texte chiffré :", encryptedText);

  const decryptedText1 = KeyUtils.getKey(
    password,
    jsonKey
  );
  console.log("Texte déchiffré  :", decryptedText1);
};

start()



// On peut déchiffrer le texte chiffré directement en le passant en paramètre
const decryptedText1 = getKey(password, encryptedText);
console.log("Texte déchiffré (direct) :", decryptedText1);

// On peut aussi déchiffrer le texte chiffré depuis le fichier JSON
const decryptedText2 = getKey(password, jsonKey);
console.log("Texte déchiffré (depuis fichier JSON) :", decryptedText2);
*-------------------------------------------------*/

/** ---------- Depuis le terminal -------- cmt 447768 ------------------
node -e "const { setKey, getKey } = require('./keyutils.js'); setKey('password', 'text', 'jsonKey') ; console.log(getKey('password', 'encryptedDataOrKey'));"

*-------------------------------------------------*/
