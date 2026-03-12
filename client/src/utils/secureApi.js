/**
 * Sichere API-Kommunikation mit verbesserter Verschlüsselung
 * Zentrale Funktionen für alle Backend-Anfragen
 */

import { generateBrowserFingerprint, signDataForTransmission, encryptTokenForStorage, decryptTokenFromStorage } from './enhancedCrypto';

/**
 * Sichere API-Anfrage mit automatischer Token-Verwaltung
 * @param {string} endpoint - API-Endpunkt (ohne Basis-URL)
 * @param {object} options - Fetch-Optionen
 * @returns {Promise<Response>} - HTTP-Response
 */
export const secureApiRequest = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      throw new Error('Kein Token verfügbar');
    }

    // Erweiterte Header für sichere Kommunikation
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Client-Version': '2.0',
      'X-Request-Time': Date.now().toString(),
      ...options.headers
    };

    // Füge Browser-Fingerprint hinzu wenn verfügbar
    try {
      const fingerprint = await generateBrowserFingerprint();
      headers['X-Client-Fingerprint'] = fingerprint;
      
      // Validiere gespeicherten Fingerprint
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.fingerprint && user.fingerprint !== fingerprint) {
          console.warn('🔐 Browser-Fingerprint hat sich geändert - möglicherweise unsichere Session');
          headers['X-Fingerprint-Changed'] = 'true';
        }
      }
    } catch (error) {
      console.warn('⚠️ Fingerprint-Generierung fehlgeschlagen:', error);
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Token abgelaufen - automatischer Logout
      console.log('🔐 Token abgelaufen - führe Logout durch');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return null;
    }

    return response;
  } catch (error) {
    console.error('🔐 Sichere API-Anfrage fehlgeschlagen:', error);
    throw error;
  }
};

/**
 * GET-Anfrage mit sicherer Authentifizierung
 * @param {string} endpoint - API-Endpunkt
 * @returns {Promise<object>} - JSON-Response
 */
export const secureGet = async (endpoint) => {
  const response = await secureApiRequest(endpoint, { method: 'GET' });
  if (!response) return null;
  
  if (response.ok) {
    return await response.json();
  } else {
    const error = await response.json();
    throw new Error(error.detail || 'GET-Anfrage fehlgeschlagen');
  }
};

/**
 * POST-Anfrage mit Datensignierung
 * @param {string} endpoint - API-Endpunkt
 * @param {object} data - Zu sendende Daten
 * @returns {Promise<object>} - JSON-Response
 */
export const securePost = async (endpoint, data) => {
  try {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const userSecret = `${user.username || 'anonymous'}_${user.fingerprint || 'no-fingerprint'}`;
    
    // Signiere Daten für Integrität
    const signedData = await signDataForTransmission(data, userSecret);
    
    const response = await secureApiRequest(endpoint, {
      method: 'POST',
      headers: {
        'X-Data-Signature': signedData.signature || '',
        'X-Data-Timestamp': signedData.timestamp.toString()
      },
      body: JSON.stringify(signedData.data)
    });
    
    if (!response) return null;
    
    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.detail || 'POST-Anfrage fehlgeschlagen');
    }
  } catch (error) {
    console.error('🔐 Sichere POST-Anfrage fehlgeschlagen:', error);
    throw error;
  }
};

/**
 * PUT-Anfrage mit Datensignierung
 * @param {string} endpoint - API-Endpunkt
 * @param {object} data - Zu sendende Daten
 * @returns {Promise<object>} - JSON-Response
 */
export const securePut = async (endpoint, data) => {
  try {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const userSecret = `${user.username || 'anonymous'}_${user.fingerprint || 'no-fingerprint'}`;
    
    // Signiere Daten für Integrität
    const signedData = await signDataForTransmission(data, userSecret);
    
    const response = await secureApiRequest(endpoint, {
      method: 'PUT',
      headers: {
        'X-Data-Signature': signedData.signature || '',
        'X-Data-Timestamp': signedData.timestamp.toString()
      },
      body: JSON.stringify(signedData.data)
    });
    
    if (!response) return null;
    
    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.detail || 'PUT-Anfrage fehlgeschlagen');
    }
  } catch (error) {
    console.error('🔐 Sichere PUT-Anfrage fehlgeschlagen:', error);
    throw error;
  }
};

/**
 * DELETE-Anfrage mit sicherer Authentifizierung
 * @param {string} endpoint - API-Endpunkt
 * @returns {Promise<object>} - JSON-Response
 */
export const secureDelete = async (endpoint) => {
  const response = await secureApiRequest(endpoint, { method: 'DELETE' });
  if (!response) return null;
  
  if (response.ok) {
    try {
      return await response.json();
    } catch {
      // DELETE könnte leere Response haben
      return { success: true };
    }
  } else {
    const error = await response.json();
    throw new Error(error.detail || 'DELETE-Anfrage fehlgeschlagen');
  }
};

/**
 * Sichere Token-Speicherung mit Verschlüsselung
 * @param {string} token - JWT Token
 * @param {object} user - Benutzerdaten
 */
export const secureTokenStorage = async (token, user) => {
  try {
    const fingerprint = await generateBrowserFingerprint();
    const userSecret = `${user.username}_${fingerprint}`;
    
    // Verschlüssele Token für lokale Speicherung
    const encryptedToken = await encryptTokenForStorage(token, userSecret);
    
    localStorage.setItem('secure_token', encryptedToken);
    localStorage.setItem('token', token); // Fallback für Kompatibilität
    localStorage.setItem('user', JSON.stringify({
      ...user,
      fingerprint
    }));
    
    console.log('🔐 Token sicher gespeichert');
  } catch (error) {
    console.error('⚠️ Token-Verschlüsselung fehlgeschlagen, verwende Fallback:', error);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * Sichere Token-Wiederherstellung mit Entschlüsselung
 * @returns {string|null} - Entschlüsselter Token oder null
 */
export const secureTokenRetrieval = async () => {
  try {
    const encryptedToken = localStorage.getItem('secure_token');
    const userStr = localStorage.getItem('user');
    
    if (!encryptedToken || !userStr) {
      return localStorage.getItem('token'); // Fallback
    }
    
    const user = JSON.parse(userStr);
    const userSecret = `${user.username}_${user.fingerprint}`;
    
    const decryptedToken = await decryptTokenFromStorage(encryptedToken, userSecret);
    
    if (decryptedToken) {
      console.log('🔓 Token erfolgreich entschlüsselt');
      return decryptedToken;
    } else {
      console.warn('⚠️ Token-Entschlüsselung fehlgeschlagen, verwende Fallback');
      return localStorage.getItem('token');
    }
  } catch (error) {
    console.error('⚠️ Sichere Token-Wiederherstellung fehlgeschlagen:', error);
    return localStorage.getItem('token');
  }
};

/**
 * Überprüfe Session-Sicherheit
 * @returns {Promise<boolean>} - True wenn Session sicher ist
 */
export const validateSessionSecurity = async () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    
    const user = JSON.parse(userStr);
    if (!user.fingerprint) return false;
    
    const currentFingerprint = await generateBrowserFingerprint();
    
    if (user.fingerprint !== currentFingerprint) {
      console.warn('🚨 Session-Sicherheit kompromittiert - Fingerprint geändert');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('⚠️ Session-Validierung fehlgeschlagen:', error);
    return false;
  }
};

/**
 * Sichere Session-Bereinigung
 */
export const secureLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('secure_token');
  localStorage.removeItem('user');
  
  // Zusätzliche Sicherheitsmaßnahmen
  try {
    // Lösche alle anderen potentiell sensiblen Daten
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('auth') || key.includes('session') || key.includes('user')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('⚠️ Vollständige Session-Bereinigung fehlgeschlagen:', error);
  }
  
  console.log('🔐 Sichere Session-Bereinigung abgeschlossen');
};