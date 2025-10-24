import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';

export default function GameLibrary({ user, isStorePage = false }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const loadGames = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/games/');
      
      if (response.ok) {
        const gamesData = await response.json();
        setGames(gamesData);
      } else {
        showModal('Fehler beim Laden', 'Spiele konnten nicht geladen werden.', 'error');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spiele:', error);
      showModal('Verbindungsfehler', 'Backend ist nicht erreichbar.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const deleteGame = async (gameId, gameTitle) => {
    if (!window.confirm(`Möchten Sie "${gameTitle}" wirklich löschen?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showModal('Authentifizierung erforderlich', 'Bitte loggen Sie sich ein.', 'error');
        return;
      }

      const response = await fetch(`http://localhost:8080/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showModal('Spiel gelöscht', `"${gameTitle}" wurde erfolgreich gelöscht.`, 'success');
        loadGames();
      } else {
        showModal('Fehler beim Löschen', 'Spiel konnte nicht gelöscht werden.', 'error');
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Spiels:', error);
      showModal('Verbindungsfehler', 'Backend ist nicht erreichbar.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">
          {isStorePage ? 'Lade Spiele-Store...' : 'Lade Wunschliste...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-red-300">
          {isStorePage ? ' Game Store' : 'Meine Wunschliste'}
        </h2>
        <div className="text-sm text-gray-400">
          {games.length} {games.length === 1 ? 'Spiel' : 'Spiele'} verfügbar
        </div>
      </div>

      {games.length === 0 ? (
        <div className="text-center p-12 bg-gray-800 rounded-lg">
          <div className="text-6xl mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Keine Spiele gefunden</h3>
          <p className="text-gray-500">
            {isStorePage ? 'Es wurden noch keine Spiele veröffentlicht.' : 
             (user && user.is_developer 
              ? 'Entwickler können hier ihre Spiele verwalten!' 
              : 'Ihre Wunschliste ist noch leer. Besuchen Sie den Store um Spiele hinzuzufügen!')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
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
                  <span> {game.platform}</span>
                  <span>
                    {game.is_free ? (
                      <span className="text-green-400 font-bold"> Kostenlos</span>
                    ) : (
                      <span className="text-yellow-400 font-bold"> {game.price}€</span>
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
                       Download
                    </a>
                  )}

                  {isStorePage ? (
                    <button
                      className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition"
                      onClick={() => showModal('Wunschliste', `"${game.title}" zur Wunschliste hinzugefügt!`, 'success')}
                    >
                      Zur Wunschliste
                    </button>
                  ) : (
                    user && user.is_developer && game.developer_id === user.id && (
                      <button
                        onClick={() => deleteGame(game.id, game.title)}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition"
                        title="Spiel löschen"
                      >
                        
                      </button>
                    )
                  )}
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
  );
}
