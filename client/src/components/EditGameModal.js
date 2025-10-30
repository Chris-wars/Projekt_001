import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';

export default function EditGameModal({ isOpen, onClose, gameId, user, onGameUpdated }) {
  const [gameData, setGameData] = useState({
    title: '',
    description: '',
    genre: '',
    platform: 'Windows',
    price: '',
    is_free: true,
    download_url: '',
    image_url: '',
    usk_rating: 'USK 0',
    version: '',
    tags: '',
    is_published: false
  });
  
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const genres = [
    "Action", "Adventure", "RPG", "Strategy", "Simulation", 
    "Sports", "Racing", "Puzzle", "Platform", "Shooter",
    "Indie", "Casual", "Arcade", "Horror", "Survival"
  ];

  const uskRatings = ["USK 0", "USK 6", "USK 12", "USK 16", "USK 18"];

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

  // Lade Spiel-Daten beim Öffnen
  const loadGameData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/games/${gameId}`);
      
      if (response.ok) {
        const game = await response.json();
        setGameData({
          title: game.title || '',
          description: game.description || '',
          genre: game.genre || '',
          platform: game.platform || 'Windows',
          price: game.price ? game.price.toString() : '',
          is_free: game.is_free || false,
          download_url: game.download_url || '',
          image_url: game.image_url || '',
          usk_rating: game.usk_rating || 'USK 0',
          version: game.version || '',
          tags: game.tags || '',
          is_published: game.is_published || false
        });
      } else {
        const errorResponse = await response.text();
        console.error('Server error response:', errorResponse);
        console.log(`👑 Admin ${user?.username} konnte Spiel ID ${gameId} nicht laden`);
        showModal('Fehler beim Laden', 'Spiel-Daten konnten nicht geladen werden.', 'error');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spiel-Daten:', error);
      console.log(`👑 Admin ${user?.username} hatte Verbindungsfehler beim Laden von Spiel ${gameId}`);
      showModal('Verbindungsfehler', 'Backend ist nicht erreichbar.', 'error');
    } finally {
      setLoading(false);
    }
  }, [gameId, user?.username]);

  useEffect(() => {
    if (isOpen && gameId) {
      loadGameData();
    }
  }, [isOpen, gameId, loadGameData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGameData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!gameData.title.trim()) {
      showModal('Validierungsfehler', 'Spieltitel ist erforderlich.', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showModal('Authentifizierung erforderlich', 'Bitte loggen Sie sich ein.', 'error');
        return;
      }

      const updateData = { ...gameData };
      
      // Konvertiere Preis zu Number falls nicht kostenlos
      if (!updateData.is_free && updateData.price) {
        updateData.price = parseFloat(updateData.price);
      }

      const response = await fetch(`http://localhost:8000/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedGame = await response.json();
        const isAdmin = user?.is_admin;
        const isOwnGame = user?.is_developer && updatedGame.developer_id === user.id;
        
        if (isAdmin && !isOwnGame) {
          showModal('Admin-Update erfolgreich', `👑 "${updatedGame.title}" wurde als Administrator aktualisiert.`, 'success');
        } else {
          showModal('Spiel aktualisiert', `"${updatedGame.title}" wurde erfolgreich aktualisiert.`, 'success');
        }
        
        // Callback für Parent-Komponente
        if (onGameUpdated) {
          onGameUpdated(updatedGame);
        }
        
        // Modal nach kurzer Zeit schließen
        setTimeout(() => {
          onClose();
        }, 1500);
        
      } else if (response.status === 403) {
        showModal('Keine Berechtigung', 'Sie haben keine Berechtigung, dieses Spiel zu bearbeiten.', 'error');
      } else if (response.status === 404) {
        showModal('Spiel nicht gefunden', 'Das Spiel konnte nicht gefunden werden.', 'error');
      } else {
        const errorData = await response.json();
        showModal('Fehler beim Speichern', errorData.detail || 'Spiel konnte nicht aktualisiert werden.', 'error');
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Spiels:', error);
      showModal('Verbindungsfehler', 'Backend ist nicht erreichbar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">
              {user?.is_admin ? '👑 Spiel bearbeiten (Admin)' : '🎮 Spiel bearbeiten'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Lade Spiel-Daten...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Grunddaten */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Spieltitel *</label>
                  <input
                    type="text"
                    name="title"
                    value={gameData.title}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Genre</label>
                  <select
                    name="genre"
                    value={gameData.genre}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <option value="">Genre auswählen</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Beschreibung</label>
                <textarea
                  name="description"
                  value={gameData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              {/* Plattform und Version */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Plattform</label>
                  <select
                    name="platform"
                    value={gameData.platform}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <option value="Windows">Windows</option>
                    <option value="Mac">Mac</option>
                    <option value="Linux">Linux</option>
                    <option value="All">Alle Plattformen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Version</label>
                  <input
                    type="text"
                    name="version"
                    value={gameData.version}
                    onChange={handleInputChange}
                    placeholder="z.B. 1.0.0"
                    className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
              </div>

              {/* Preis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-gray-300 mb-2">
                    <input
                      type="checkbox"
                      name="is_free"
                      checked={gameData.is_free}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Kostenlos
                  </label>
                </div>

                {!gameData.is_free && (
                  <div>
                    <label className="block text-gray-300 mb-2">Preis (€)</label>
                    <input
                      type="number"
                      name="price"
                      value={gameData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                )}
              </div>

              {/* USK und URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">USK-Bewertung</label>
                  <select
                    name="usk_rating"
                    value={gameData.usk_rating}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    {uskRatings.map(rating => (
                      <option key={rating} value={rating}>{rating}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center text-gray-300 mb-2">
                    <input
                      type="checkbox"
                      name="is_published"
                      checked={gameData.is_published}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Veröffentlicht
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Download-URL</label>
                <input
                  type="url"
                  name="download_url"
                  value={gameData.download_url}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Bild-URL</label>
                <input
                  type="url"
                  name="image_url"
                  value={gameData.image_url}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Tags (kommagetrennt)</label>
                <input
                  type="text"
                  name="tags"
                  value={gameData.tags}
                  onChange={handleInputChange}
                  placeholder="z.B. Multiplayer, Singleplayer, Story"
                  className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded transition disabled:opacity-50"
                >
                  {loading ? 'Speichere...' : '💾 Speichern'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded transition disabled:opacity-50"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

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