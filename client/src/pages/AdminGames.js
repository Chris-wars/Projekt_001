import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import EditGameModal from '../components/EditGameModal';

export default function AdminGames({ user }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [editGameModal, setEditGameModal] = useState({
    isOpen: false,
    gameId: null
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

  const openEditModal = (gameId) => {
    setEditGameModal({
      isOpen: true,
      gameId
    });
  };

  const closeEditModal = () => {
    setEditGameModal({
      isOpen: false,
      gameId: null
    });
  };

  const onGameUpdated = () => {
    loadAllGames();
    closeEditModal();
  };

  const loadAllGames = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showModal('Anmeldung erforderlich', 'Bitte loggen Sie sich ein.', 'warning');
        return;
      }

      const response = await fetch('http://localhost:8000/admin/games/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const gamesData = await response.json();
        setGames(gamesData);
      } else if (response.status === 403) {
        showModal('Zugriff verweigert', 'Nur Administratoren können alle Spiele verwalten.', 'error');
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

  const deleteGame = async (gameId, gameTitle, developerName) => {
    const confirmMessage = `⚠️ ADMIN-LÖSCHUNG ⚠️\n\nSpiel: "${gameTitle}"\nEntwickler: ${developerName}\n\nMöchten Sie dieses Spiel wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showModal('Admin-Löschung erfolgreich', `👑 "${gameTitle}" wurde gelöscht.`, 'success');
        loadAllGames();
      } else if (response.status === 403) {
        showModal('Keine Berechtigung', 'Sie haben keine Berechtigung für diese Aktion.', 'error');
      } else if (response.status === 404) {
        showModal('Spiel nicht gefunden', 'Das Spiel konnte nicht gefunden werden.', 'error');
      } else {
        showModal('Fehler beim Löschen', 'Spiel konnte nicht gelöscht werden.', 'error');
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Spiels:', error);
      showModal('Verbindungsfehler', 'Backend ist nicht erreichbar.', 'error');
    }
  };

  useEffect(() => {
    if (user && user.is_admin) {
      loadAllGames();
    } else {
      setLoading(false);
    }
  }, [user, loadAllGames]);

  if (!user) {
    return (
      <>
        <h2 className="text-2xl font-bold text-red-300 mb-4">👑 Admin: Spiele verwalten</h2>
        <p className="mb-6 text-gray-200">Bitte loggen Sie sich ein, um auf die Admin-Funktionen zuzugreifen.</p>
      </>
    );
  }

  if (!user.is_admin) {
    return (
      <>
        <h2 className="text-2xl font-bold text-red-300 mb-4">👑 Admin: Spiele verwalten</h2>
        <p className="mb-6 text-gray-200">Nur Administratoren haben Zugriff auf diese Funktion.</p>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <h2 className="text-2xl font-bold text-red-300 mb-4">👑 Admin: Spiele verwalten</h2>
        <p className="mb-6 text-gray-200">Lade alle Spiele...</p>
      </>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-red-300">👑 Admin: Spiele verwalten</h2>
          <div className="text-sm text-gray-400">
            {games.length} {games.length === 1 ? 'Spiel' : 'Spiele'} insgesamt
          </div>
        </div>

        {games.length === 0 ? (
          <div className="text-center p-12 bg-gray-800 rounded-lg">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Keine Spiele vorhanden</h3>
            <p className="text-gray-500">
              Es sind noch keine Spiele in der Datenbank vorhanden.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <div key={game.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      {game.image_url && (
                        <img 
                          src={game.image_url} 
                          alt={game.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                          <div>
                            <span className="text-gray-500">ID:</span> {game.id}
                          </div>
                          <div>
                            <span className="text-gray-500">Entwickler-ID:</span> {game.developer_id}
                          </div>
                          <div>
                            <span className="text-gray-500">Genre:</span> {game.genre || 'Nicht angegeben'}
                          </div>
                          <div>
                            <span className="text-gray-500">Plattform:</span> {game.platform || 'Nicht angegeben'}
                          </div>
                          <div>
                            <span className="text-gray-500">Preis:</span> 
                            {game.is_free ? (
                              <span className="text-green-400 ml-2">Kostenlos</span>
                            ) : (
                              <span className="text-yellow-400 ml-2">€{game.price}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span> 
                            <span className={`ml-2 ${game.is_published ? 'text-green-400' : 'text-yellow-400'}`}>
                              {game.is_published ? 'Veröffentlicht' : 'Entwurf'}
                            </span>
                          </div>
                        </div>

                        {game.description && (
                          <p className="text-gray-400 mt-3 line-clamp-2">
                            {game.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {game.download_url && (
                      <a
                        href={game.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded transition text-sm"
                      >
                        📥 Download
                      </a>
                    )}

                    <button
                      onClick={() => openEditModal(game.id)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded transition text-sm"
                      title="Spiel als Administrator bearbeiten"
                    >
                      👑✏️ Admin-Bearbeitung
                    </button>

                    <button
                      onClick={() => deleteGame(game.id, game.title, `Entwickler-ID: ${game.developer_id}`)}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition text-sm"
                      title="Spiel als Administrator löschen"
                    >
                      👑🗑️ Admin-Löschung
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-900 bg-opacity-50 rounded-lg border border-yellow-600">
          <h4 className="text-yellow-300 font-semibold mb-2">⚠️ Administrator-Hinweis</h4>
          <p className="text-yellow-200 text-sm">
            Als Administrator können Sie alle Spiele bearbeiten und löschen, unabhängig vom Entwickler. 
            Seien Sie vorsichtig, da Änderungen sofort gespeichert und gelöschte Spiele nicht wiederhergestellt werden können.
          </p>
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      <EditGameModal
        isOpen={editGameModal.isOpen}
        onClose={closeEditModal}
        gameId={editGameModal.gameId}
        user={user}
        onGameUpdated={onGameUpdated}
      />
    </>
  );
}