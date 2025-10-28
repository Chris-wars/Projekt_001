import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';

export default function Library({ user }) {
  const [wishlistGames, setWishlistGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
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

  const loadWishlist = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showModal('Anmeldung erforderlich', 'Bitte loggen Sie sich ein, um Ihre Wunschliste zu sehen.', 'warning');
        return;
      }

      // Lade Wunschliste
      const response = await fetch('http://localhost:8000/wishlist/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const games = await response.json();
        setWishlistGames(games);
        
        // Lade Statistiken
        const statsResponse = await fetch('http://localhost:8000/wishlist/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } else if (response.status === 401) {
        showModal('Sitzung abgelaufen', 'Bitte loggen Sie sich erneut ein.', 'warning');
      } else {
        showModal('Fehler beim Laden', 'Wunschliste konnte nicht geladen werden.', 'error');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Wunschliste:', error);
      showModal('Verbindungsfehler', 'Fehler beim Verbinden mit dem Server.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const removeFromWishlist = async (gameId, gameTitle) => {
    if (!window.confirm(`Möchten Sie "${gameTitle}" aus Ihrer Wunschliste entfernen?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/wishlist/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Entferne das Spiel aus der lokalen Liste
        setWishlistGames(prev => prev.filter(game => game.id !== gameId));
        showModal('Entfernt', `"${gameTitle}" wurde aus der Wunschliste entfernt.`, 'success');
        
        // Aktualisiere Statistiken
        loadWishlist();
      } else {
        showModal('Fehler beim Entfernen', 'Spiel konnte nicht aus der Wunschliste entfernt werden.', 'error');
      }
    } catch (error) {
      console.error('Fehler beim Entfernen aus der Wunschliste:', error);
      showModal('Verbindungsfehler', 'Fehler beim Verbinden mit dem Server.', 'error');
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  if (!user) {
    return (
      <>
        <h2 className="text-2xl font-bold text-red-300 mb-4">💜 Deine Wunschliste</h2>
        <p className="mb-6 text-gray-200">Bitte loggen Sie sich ein, um Ihre Wunschliste zu sehen.</p>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <h2 className="text-2xl font-bold text-red-300 mb-4">💜 Deine Wunschliste</h2>
        <p className="mb-6 text-gray-200">Lade Wunschliste...</p>
      </>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-red-300">💜 Deine Wunschliste</h2>
          {stats && (
            <div className="text-sm text-gray-400">
              {stats.total_games} {stats.total_games === 1 ? 'Spiel' : 'Spiele'} 
              {stats.paid_games > 0 && (
                <span className="ml-2">• Gesamtwert: {stats.total_value}€</span>
              )}
            </div>
          )}
        </div>

        {wishlistGames.length === 0 ? (
          <div className="text-center p-12 bg-gray-800 rounded-lg">
            <div className="text-6xl mb-4">💜</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Wunschliste ist leer</h3>
            <p className="text-gray-500">
              Besuchen Sie den Store oder die Spiele-Seite, um Spiele zu Ihrer Wunschliste hinzuzufügen!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistGames.map((game) => (
              <div key={game.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                {game.image_url && (
                  <img 
                    src={game.image_url} 
                    alt={game.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white">{game.title}</h3>
                  
                  {game.genre && (
                    <span className="inline-block bg-red-600 text-white text-xs px-2 py-1 rounded">
                      {game.genre}
                    </span>
                  )}

                  {game.description && (
                    <p className="text-gray-400 text-sm line-clamp-3">
                      {game.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>🖥️ {game.platform}</span>
                    <span>
                      {game.is_free ? (
                        <span className="text-green-400 font-bold">✨ Kostenlos</span>
                      ) : (
                        <span className="text-yellow-400 font-bold">€{game.price}</span>
                      )}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600">
                    Von: {game.developer?.username || 'Unbekannter Entwickler'}
                  </div>

                  <div className="flex space-x-2 pt-4">
                    {game.download_url && (
                      <a
                        href={game.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded transition"
                      >
                        📥 Download
                      </a>
                    )}

                    <button
                      onClick={() => removeFromWishlist(game.id, game.title)}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition"
                      title="Aus Wunschliste entfernen"
                    >
                      🗑️ Entfernen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={modal.isOpen}
          onClose={closeModal}
          title={modal.title}
          message={modal.message}
          type={modal.type}
        />
      </div>
    </>
  );
}
