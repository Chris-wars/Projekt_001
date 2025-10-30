/**
 * Client-Side Kryptografie-Funktionen
 * Bietet Basis-Schutz für Passwörter vor Übertragung
 */

/**
 * SHA-256 Hash-Funktion (Browser-native)
 * @param {string} password - Klartext-Passwort
 * @returns {Promise<string>} - Gehashtes Passwort
 */
export async function hashPassword(password) {
  // Verwende Web Crypto API (moderne Browser)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Salt + Hash für bessere Sicherheit
 * @param {string} password - Klartext-Passwort
 * @param {string} username - Benutzername als Salt-Basis
 * @returns {Promise<string>} - Gesaltenes Hash
 */
export async function hashPasswordWithSalt(password, username) {
  const salt = `indie_hub_${username}_salt_2025`;
  const saltedPassword = `${salt}${password}${salt}`;
  return await hashPassword(saltedPassword);
}

/**
 * Fallback für ältere Browser (weniger sicher)
 * @param {string} input - Zu hashender String
 * @returns {string} - Einfacher Hash
 */
function simpleHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Prüft ob Web Crypto API verfügbar ist
 * @returns {boolean} - True wenn moderne Krypto verfügbar
 */
export function isWebCryptoAvailable() {
  return !!(window.crypto && window.crypto.subtle);
}

/**
 * Sicherer Passwort-Hash mit automatischem Fallback
 * @param {string} password - Klartext-Passwort
 * @param {string} username - Benutzername
 * @returns {Promise<string>} - Hash-String
 */
export async function securePasswordHash(password, username) {
  if (isWebCryptoAvailable()) {
    return await hashPasswordWithSalt(password, username);
  } else {
    // Fallback für ältere Browser
    console.warn('🔒 Web Crypto API nicht verfügbar, verwende Fallback-Hash');
    return simpleHash(`${username}_${password}_indie_hub_2025`);
  }
}

/**
 * Sichere Passwort-Validierung
 * @param {string} password - Passwort zu prüfen
 * @returns {object} - Validierungsergebnis
 */
export function validatePassword(password) {
  const result = {
    isValid: true,
    errors: [],
    strength: 'weak'
  };

  if (password.length < 8) {
    result.isValid = false;
    result.errors.push('Passwort muss mindestens 8 Zeichen lang sein');
  }

  if (!/[A-Z]/.test(password)) {
    result.errors.push('Passwort sollte mindestens einen Großbuchstaben enthalten');
  }

  if (!/[a-z]/.test(password)) {
    result.errors.push('Passwort sollte mindestens einen Kleinbuchstaben enthalten');
  }

  if (!/[0-9]/.test(password)) {
    result.errors.push('Passwort sollte mindestens eine Zahl enthalten');
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    result.errors.push('Passwort sollte mindestens ein Sonderzeichen enthalten');
  }

  // Berechne Stärke
  const criteriaCount = 5 - result.errors.length;
  if (criteriaCount >= 4) result.strength = 'strong';
  else if (criteriaCount >= 2) result.strength = 'medium';

  return result;
}