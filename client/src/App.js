

import React, { useState, useEffect } from 'react';
import Library from './pages/Library';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import UserList from './pages/UserList';
import UserExport from './pages/UserExport';
import GameLibrary from './pages/GameLibrary';
import AddGame from './pages/AddGame';

function App() {
  const [page, setPage] = useState('store');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Beim Laden prüfen, ob bereits ein Token vorhanden ist
  useEffect(() => {
    const checkExistingLogin = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('http://localhost:8080/users/me/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setIsLoggedIn(true);
            setUser(userData);
          } else {
            // Token ungültig, entfernen
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.log('Fehler beim Prüfen des Tokens:', error);
          // Bei Netzwerkfehlern Token behalten, aber nicht einloggen
        }
      }
      setIsLoading(false);
    };

    checkExistingLogin();
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    setPage('store'); // Zur Startseite nach Login
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('token'); // Token aus localStorage entfernen
    setPage('store'); // Zur Startseite nach Logout
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 text-gray-100 font-sans">
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-2xl text-red-300">Laden...</div>
        </div>
      ) : (
        <>
          <header className="bg-gradient-to-r from-red-800 via-gray-800 to-gray-900 shadow-lg p-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-red-400 tracking-widest drop-shadow-lg">INDIE HUB</h1>
            <nav className="flex gap-8">
              <button className={`text-gray-200 hover:text-red-400 font-semibold transition${page==='store' ? ' underline' : ''}`} onClick={() => setPage('store')}>Store</button>
              <button className={`text-gray-200 hover:text-red-400 font-semibold transition${page==='games' ? ' underline' : ''}`} onClick={() => setPage('games')}>🎮 Spiele</button>
              <button className={`text-gray-200 hover:text-red-400 font-semibold transition${page==='library' ? ' underline' : ''}`} onClick={() => setPage('library')}>Bibliothek</button>
              
              {/* Entwickler-Features */}
              {isLoggedIn && user && user.is_developer && (
                <button className={`text-green-200 hover:text-green-400 font-semibold transition${page==='add-game' ? ' underline' : ''}`} onClick={() => setPage('add-game')}>
                  ➕ Spiel hinzufügen
                </button>
              )}
              
              <button className={`text-gray-200 hover:text-red-400 font-semibold transition${page==='about' ? ' underline' : ''}`} onClick={() => setPage('about')}>Über Uns</button>
              
              {/* UserList nur für Administratoren anzeigen */}
              {isLoggedIn && user && user.is_admin && (
                <button className={`text-gray-200 hover:text-red-400 font-semibold transition${page==='users' ? ' underline' : ''}`} onClick={() => setPage('users')}>
                  👑 Nutzer verwalten
                </button>
              )}
              
              {/* UserExport nur für Administratoren anzeigen */}
              {isLoggedIn && user && user.is_admin && (
                <button className={`text-gray-200 hover:text-red-400 font-semibold transition${page==='export' ? ' underline' : ''}`} onClick={() => setPage('export')}>
                  📁 Export
                </button>
              )}
              
              {!isLoggedIn ? (
                <>
                  <button className={`text-gray-200 hover:text-red-400 font-semibold transition${page==='login' ? ' underline' : ''}`} onClick={() => setPage('login')}>Login</button>
                  <button className={`text-gray-200 hover:text-red-400 font-semibold transition${page==='register' ? ' underline' : ''}`} onClick={() => setPage('register')}>Registrieren</button>
                </>
              ) : (
                <button className={`text-gray-200 hover:text-red-400 font-semibold transition${page==='profile' ? ' underline' : ''}`} onClick={() => setPage('profile')}>Profil</button>
              )}
            </nav>
          </header>
      <main className="max-w-4xl mx-auto mt-12 bg-gray-800 bg-opacity-90 rounded-xl shadow-2xl p-10">
        {page === 'store' && <GameLibrary user={user} isStorePage={true} />}
        {page === 'games' && <GameLibrary user={user} />}
        {page === 'library' && <Library />}
        {page === 'add-game' && isLoggedIn && user && user.is_developer && <AddGame user={user} />}
        {page === 'about' && <About />}
        {page === 'users' && isLoggedIn && user && user.is_admin && <UserList user={user} />}
        {page === 'export' && isLoggedIn && user && user.is_admin && <UserExport user={user} />}
        {page === 'login' && !isLoggedIn && <Login onLogin={handleLogin} />}
        {page === 'register' && !isLoggedIn && <Register onLogin={handleLogin} />}
        {page === 'profile' && isLoggedIn && <Profile user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />}
      </main>
          <footer className="text-center text-gray-500 py-8 mt-12">© 2025 Indie Hub – Inspired by Steam and Sezuma</footer>
        </>
      )}
    </div>
  );
}export default App;
