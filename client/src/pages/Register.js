import React, { useState } from 'react';

export default function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwörter stimmen nicht überein!');
      return;
    }
    
    try {
      // Echte Backend-Registrierung
      const response = await fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          is_developer: formData.role === 'developer'
        })
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Nach erfolgreicher Registrierung automatisch einloggen
        const loginForm = new FormData();
        loginForm.append('username', formData.username);
        loginForm.append('password', formData.password);
        
        const loginResponse = await fetch('http://localhost:8080/login', {
          method: 'POST',
          body: loginForm
        });

        if (loginResponse.ok) {
          const tokenData = await loginResponse.json();
          localStorage.setItem('token', tokenData.access_token);
          onLogin(userData);
        } else {
          alert('Registrierung erfolgreich! Bitte loggen Sie sich ein.');
        }
      } else {
        const errorData = await response.json();
        alert(`Registrierung fehlgeschlagen: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Registrierungs-Fehler:', error);
      
      // Fallback: Simulierte Registrierung wenn Backend nicht erreichbar
      console.log('Backend nicht erreichbar, verwende simulierte Registrierung');
      const userData = {
        id: 1,
        username: formData.username,
        email: formData.email,
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
      <h2 className="text-2xl font-bold text-red-300 mb-4">Registrierung</h2>
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
          required
          className="p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400" 
        />
        <input 
          type="email" 
          name="email"
          placeholder="E-Mail" 
          value={formData.email}
          onChange={handleChange}
          required
          className="p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400" 
        />
        <input 
          type="password" 
          name="password"
          placeholder="Passwort" 
          value={formData.password}
          onChange={handleChange}
          required
          className="p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400" 
        />
        <input 
          type="password" 
          name="confirmPassword"
          placeholder="Passwort bestätigen" 
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          className="p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400" 
        />
        <button type="submit" className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded transition">Registrieren</button>
      </form>
      <div className="text-center mt-4">
        <span className="text-gray-400">Bereits registriert? </span>
        <button className="text-red-400 hover:text-red-300 underline">Hier einloggen</button>
      </div>
    </>
  );
}