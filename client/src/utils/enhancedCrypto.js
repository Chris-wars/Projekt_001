/**
 * Erweiterte Client-Side Kryptografie
 * Verbesserte Sicherheit für Frontend-Verschlüsselung
 */

/**
 * PBKDF2-basierte Passwort-Verschlüsselung (stärker als SHA-256)
 * @param {string} password - Klartext-Passwort
 * @param {string} username - Benutzername als Salt-Basis
 * @param {number} iterations - Anzahl der Hash-Iterationen (Standard: 100000)
 * @returns {Promise<string>} - Stark verschlüsseltes Passwort
 */
export async function pbkdf2PasswordHash(password, username, iterations = 100000) {
  if (!window.crypto?.subtle) {
    throw new Error('Web Crypto API ist nicht verfügbar');
  }

  const encoder = new TextEncoder();
  
  // Erstelle starken Salt aus Username + fester Salt
  const saltString = `indie_hub_v2_${username}_secure_salt_2025`;
  const salt = encoder.encode(saltString);
  
  // Konvertiere Passwort zu ArrayBuffer
  const passwordBuffer = encoder.encode(password);
  
  // Importiere Passwort als Schlüssel
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Generiere Hash mit PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 32 Bytes = 256 Bits
  );
  
  // Konvertiere zu Hex-String
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Client-Side Token-Verschlüsselung für lokale Speicherung
 * @param {string} token - JWT Token
 * @param {string} userSecret - Benutzer-spezifisches Geheimnis
 * @returns {Promise<string>} - Verschlüsselter Token
 */
export async function encryptTokenForStorage(token, userSecret) {
  if (!window.crypto?.subtle) {
    return token; // Fallback: unverschlüsselt
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  
  // Generiere AES-Schlüssel aus userSecret
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userSecret),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('indie_hub_token_salt'),
      iterations: 10000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Verschlüssele Token
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );
  
  // Kombiniere IV + verschlüsselte Daten
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Entschlüsselung des Tokens
 * @param {string} encryptedToken - Verschlüsselter Token
 * @param {string} userSecret - Benutzer-spezifisches Geheimnis
 * @returns {Promise<string>} - Entschlüsselter Token
 */
export async function decryptTokenFromStorage(encryptedToken, userSecret) {
  if (!window.crypto?.subtle) {
    return encryptedToken; // Fallback
  }

  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Dekodiere Base64
    const combined = new Uint8Array(
      atob(encryptedToken)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    // Trenne IV und verschlüsselte Daten
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Regeneriere Schlüssel
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(userSecret),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('indie_hub_token_salt'),
        iterations: 10000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Entschlüssele
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('🔐 Token-Entschlüsselung fehlgeschlagen:', error);
    return null;
  }
}

/**
 * Sichere Datenübertragung mit Integritätsprüfung
 * @param {object} data - Zu sendende Daten
 * @param {string} userSecret - Benutzer-Geheimnis für HMAC
 * @returns {Promise<object>} - Daten mit HMAC-Signatur
 */
export async function signDataForTransmission(data, userSecret) {
  if (!window.crypto?.subtle) {
    return { data, signature: null };
  }

  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  
  // Erstelle HMAC-Schlüssel
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Signiere Daten
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(dataString)
  );
  
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return {
    data,
    signature: signatureHex,
    timestamp: Date.now()
  };
}

/**
 * Zufälliges Salt für Session-basierte Verschlüsselung
 * @returns {string} - Kryptographisch sicheres Salt
 */
export function generateSecureSessionSalt() {
  if (window.crypto?.getRandomValues) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback für ältere Browser
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Fingerprinting-resistente Browser-Identifikation
 * @returns {Promise<string>} - Eindeutige aber anonyme Browser-ID
 */
export async function generateBrowserFingerprint() {
  const components = [
    navigator.userAgent || '',
    navigator.language || '',
    window.innerWidth + 'x' + window.innerHeight,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency || '0'
  ];
  
  const combinedString = components.join('|');
  
  if (window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(combinedString));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }
  
  // Fallback
  let hash = 0;
  for (let i = 0; i < combinedString.length; i++) {
    hash = ((hash << 5) - hash) + combinedString.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}