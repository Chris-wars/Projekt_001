import React, { useState } from 'react';
import Modal from '../components/Modal';
import { pbkdf2PasswordHash, generateBrowserFingerprint, signDataForTransmission } from '../utils/enhancedCrypto';
import { validatePassword } from '../utils/crypto';

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user'
  });

  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showModal = (title, message, type = 'info') => {
    setModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      title: '',
      message: '',
      type: 'info'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔐 Starte erweiterte Login-Verschlüsselung...');
    
    try {
      // 1. Generiere Browser-Fingerprint für zusätzliche Sicherheit
      const browserFingerprint = await generateBrowserFingerprint();
      console.log('🔍 Browser-Fingerprint generiert');
      
      // 2. Starke PBKDF2-Verschlüsselung (100.000 Iterationen)
      console.log('🔐 Verschlüssele Passwort mit PBKDF2...');
      const hashedPassword = await pbkdf2PasswordHash(
        formData.password, 
        formData.username, 
        100000
      );
      console.log('✅ Passwort sicher verschlüsselt');
      
      // 3. Signiere Daten für Integritätsprüfung
      const userSecret = `${formData.username}_${browserFingerprint}`;
      const signedData = await signDataForTransmission({
        username: formData.username,
        password: hashedPassword,
        is_hashed: true,
        client_fingerprint: browserFingerprint,
        encryption_method: 'PBKDF2-SHA256-100k'
      }, userSecret);
      console.log('🔏 Daten signiert für Übertragung');

      // 4. Sende sichere Anfrage an Backend
      const response = await fetch('http://localhost:8000/login-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Signature': signedData.signature || '',
          'X-Client-Timestamp': signedData.timestamp.toString(),
          'X-Encryption-Version': '2.0'
        },
        body: JSON.stringify(signedData.data)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login erfolgreich mit verbesserter Sicherheit');
        
        // Token im localStorage speichern
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          username: data.user.username,
          is_admin: data.user.is_admin,
          fingerprint: browserFingerprint
        }));
        
        // User-Daten sind bereits in der Response enthalten
        onLogin(data.user);
      } else {
        const errorData = await response.json();
        console.error('❌ Login fehlgeschlagen:', errorData);
        showModal('Login fehlgeschlagen', errorData.detail, 'error');
      }
    } catch (error) {
      console.error('💥 Verschlüsselungsfehler:', error);
      showModal('Verschlüsselungsfehler', 'Ein Verschlüsselungsfehler ist aufgetreten. Bitte versuchen Sie es erneut.', 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-red-300 mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto mt-8">
        <select 
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option value="user">User</option>
          <option value="developer">Entwickler</option>
        </select>
        <input 
          type="text" 
          name="username"
          placeholder="Benutzername" 
          value={formData.username}
          onChange={handleChange}
          className="p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400" 
        />
        <input 
          type="password" 
          name="password"
          placeholder="Passwort" 
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
          className="p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400" 
        />
        <button type="submit" className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded transition">Login</button>
      </form>
      
      {/* Modal für Nachrichten */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </>
  );
}
