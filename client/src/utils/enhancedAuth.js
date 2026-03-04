/**
 * Verbesserte Login-Implementierung mit stärkerer Verschlüsselung
 */
import { pbkdf2PasswordHash, generateBrowserFingerprint, signDataForTransmission } from '../utils/enhancedCrypto';

export const enhancedLogin = async (formData) => {
  try {
    // 1. Generiere Browser-Fingerprint für zusätzliche Sicherheit
    const browserFingerprint = await generateBrowserFingerprint();
    
    // 2. Starke PBKDF2-Verschlüsselung (100.000 Iterationen)
    console.log('🔐 Verschlüssele Passwort mit PBKDF2...');
    const hashedPassword = await pbkdf2PasswordHash(
      formData.password, 
      formData.username, 
      100000
    );
    
    // 3. Signiere Daten für Integritätsprüfung
    const userSecret = `${formData.username}_${browserFingerprint}`;
    const signedData = await signDataForTransmission({
      username: formData.username,
      password: hashedPassword,
      is_hashed: true,
      client_fingerprint: browserFingerprint
    }, userSecret);
    
    // 4. Sende sichere Anfrage an Backend
    const response = await fetch('/api/login-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Signature': signedData.signature,
        'X-Client-Timestamp': signedData.timestamp.toString()
      },
      body: JSON.stringify(signedData.data)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login erfolgreich mit verbesserter Sicherheit');
      return { success: true, data };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Login fehlgeschlagen' };
    }
    
  } catch (error) {
    console.error('❌ Login-Fehler:', error);
    return { success: false, error: 'Verschlüsselungsfehler aufgetreten' };
  }
};

/**
 * Sichere API-Anfrage mit Token-Verschlüsselung
 */
export const secureApiRequest = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');
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

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Token abgelaufen - automatischer Logout
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