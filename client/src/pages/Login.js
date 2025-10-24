import React, { useState } from 'react';
import Modal from '../components/Modal';

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
    
    try {
      // JSON-basierte Backend-Authentifizierung (kompatibler Endpoint)
      const response = await fetch('http://localhost:8080/login-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Token im localStorage speichern
        localStorage.setItem('token', data.access_token);
        
        // User-Daten sind bereits in der Response enthalten
        onLogin(data.user);
      } else {
        const errorData = await response.json();
        showModal('Login fehlgeschlagen', errorData.detail, 'error');
      }
    } catch (error) {
      console.error('Login-Fehler:', error);
      showModal('Verbindungsfehler', 'Backend ist nicht erreichbar. Bitte stellen Sie sicher, dass das Backend läuft.', 'error');
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
