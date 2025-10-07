

import React, { useState, useEffect } from 'react';
import Library from './pages/Library';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

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
              <button className={`text-gray-200 hover:text-red-400 font-semibold transition${page==='library' ? ' underline' : ''}`} onClick={() => setPage('library')}>Bibliothek</button>
              <button className={`text-gray-200 hover:text-red-400 font-semibold transition${page==='about' ? ' underline' : ''}`} onClick={() => setPage('about')}>Über Uns</button>
              
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
        {page === 'store' && (
          <>
            <h2 className="text-2xl font-bold text-red-300 mb-4">Willkommen im Indie Game Store!</h2>
            <p className="mb-6 text-gray-200">Entdecke neue Indie-Spiele, stöbere durch Angebote und finde deine nächsten Favoriten – alles im modernen Steam-Look mit roten Akzenten.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
              {/* Beispielhafte GameCards */}
              <div className="bg-gray-900 rounded-lg shadow-lg p-4 flex flex-col items-center hover:bg-red-900 transition">
                <div className="w-32 h-40 bg-gray-700 rounded mb-3 flex items-center justify-center text-gray-400">Bild</div>
                <h3 className="text-lg font-bold text-red-300">Game Title</h3>
                <span className="text-gray-400 text-sm">Studio Name</span>
                <span className="mt-2 text-red-400 font-bold">19,99 €</span>
                <button className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition">Kaufen</button>
              </div>
              <div className="bg-gray-900 rounded-lg shadow-lg p-4 flex flex-col items-center hover:bg-red-900 transition">
                <div className="w-32 h-40 bg-gray-700 rounded mb-3 flex items-center justify-center text-gray-400">Bild</div>
                <h3 className="text-lg font-bold text-red-300">Game Title</h3>
                <span className="text-gray-400 text-sm">Studio Name</span>
                <span className="mt-2 text-red-400 font-bold">14,99 €</span>
                <button className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition">Kaufen</button>
              </div>
              <div className="bg-gray-900 rounded-lg shadow-lg p-4 flex flex-col items-center hover:bg-red-900 transition">
                <div className="w-32 h-40 bg-gray-700 rounded mb-3 flex items-center justify-center text-gray-400">Bild</div>
                <h3 className="text-lg font-bold text-red-300">Game Title</h3>
                <span className="text-gray-400 text-sm">Studio Name</span>
                <span className="mt-2 text-red-400 font-bold">9,99 €</span>
                <button className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition">Kaufen</button>
              </div>
            </div>
          </>
        )}
  {page === 'library' && <Library />}
  {page === 'about' && <About />}
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
