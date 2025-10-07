import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Echte Backend-Authentifizierung
      const loginForm = new FormData();
      loginForm.append('username', formData.username);
      loginForm.append('password', formData.password);
      
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        body: loginForm
      });

      if (response.ok) {
        const tokenData = await response.json();
        
        // Token im localStorage speichern
        localStorage.setItem('token', tokenData.access_token);
        
        // User-Daten abrufen
        const userResponse = await fetch('http://localhost:8080/users/me/', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          onLogin(userData);
        } else {
          alert('Fehler beim Abrufen der Benutzerdaten');
        }
      } else {
        const errorData = await response.json();
        alert(`Login fehlgeschlagen: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Login-Fehler:', error);
      
      // Fallback: Simulierter Login wenn Backend nicht erreichbar
      console.log('Backend nicht erreichbar, verwende simulierten Login');
      const userData = {
        id: 1,
        username: formData.username,
        email: `${formData.username}@example.com`,
        is_developer: formData.role === 'developer',
        is_active: true
      };
      
      // Fake Token für Frontend-Tests
      localStorage.setItem('token', 'fake-token-for-testing');
      onLogin(userData);
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
      <div className="text-center mt-4">
        <span className="text-gray-400">Noch kein Account? </span>
        <button className="text-red-400 hover:text-red-300 underline">Hier registrieren</button>
      </div>
    </>
  );
}
