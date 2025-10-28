import React, { useState } from 'react';
import Modal from '../components/Modal';

export default function AddGame({ user, onGameAdded }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    platform: 'Windows',
    price: '',
    is_free: false,
    download_url: '',
    image_url: ''
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
    
    if (!user || !user.is_developer) {
      showModal('Berechtigung verweigert', 'Nur Entwickler können Spiele hinzufügen!', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showModal('Authentifizierung erforderlich', 'Bitte loggen Sie sich ein.', 'error');
        return;
      }

      const gameData = {
        title: formData.title,
        description: formData.description,
        genre: formData.genre,
        platform: formData.platform,
        price: formData.is_free ? 0.0 : parseFloat(formData.price) || 0.0,
        is_free: formData.is_free,
        download_url: formData.download_url,
        image_url: formData.image_url
      };

      const response = await fetch('http://localhost:8000/games/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gameData)
      });

      if (response.ok) {
        const newGame = await response.json();
        showModal('Spiel hinzugefügt', `"${newGame.title}" wurde erfolgreich zur Bibliothek hinzugefügt!`, 'success');
        
        // Form zurücksetzen
        setFormData({
          title: '',
          description: '',
          genre: '',
          platform: 'Windows',
          price: '',
          is_free: false,
          download_url: '',
          image_url: ''
        });

        // Parent über neues Spiel informieren
        if (onGameAdded) {
          onGameAdded(newGame);
        }
      } else {
        let errorMessage = 'Unbekannter Fehler';
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            } else if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
            } else {
              errorMessage = JSON.stringify(errorData.detail);
            }
          }
        } catch (e) {
          errorMessage = `HTTP ${response.status} - Serverfehler`;
        }
        showModal('Fehler beim Hinzufügen', errorMessage, 'error');
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Spiels:', error);
      showModal('Verbindungsfehler', 'Backend ist nicht erreichbar.', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Nur für Entwickler anzeigen
  if (!user || !user.is_developer) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-300 mb-4">🚫 Zugriff verweigert</h2>
        <p className="text-gray-400">Nur Entwickler können Spiele zur Bibliothek hinzufügen.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-red-300 mb-6">🎮 Neues Spiel hinzufügen</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titel */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Spieltitel *
          </label>
          <input 
            type="text" 
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="z.B. Mein Indie Game"
            className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400" 
          />
        </div>

        {/* Beschreibung */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Beschreibung
          </label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Beschreiben Sie Ihr Spiel..."
            className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400" 
          />
        </div>

        {/* Genre und Plattform */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Genre
            </label>
            <select 
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="">Genre wählen...</option>
              <option value="Action">Action</option>
              <option value="Adventure">Adventure</option>
              <option value="RPG">RPG</option>
              <option value="Strategy">Strategy</option>
              <option value="Puzzle">Puzzle</option>
              <option value="Platform">Platform</option>
              <option value="Racing">Racing</option>
              <option value="Simulation">Simulation</option>
              <option value="Sports">Sports</option>
              <option value="Indie">Indie</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Plattform
            </label>
            <select 
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="Windows">Windows</option>
              <option value="Mac">Mac</option>
              <option value="Linux">Linux</option>
              <option value="Web">Web Browser</option>
              <option value="Android">Android</option>
              <option value="iOS">iOS</option>
              <option value="Multi-Platform">Multi-Platform</option>
            </select>
          </div>
        </div>

        {/* Preis */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              name="is_free"
              checked={formData.is_free}
              onChange={handleChange}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label className="text-sm font-medium text-gray-300">
              🆓 Kostenloses Spiel
            </label>
          </div>
          
          {!formData.is_free && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preis (€)
              </label>
              <input 
                type="number" 
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="19.99"
                className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400" 
              />
            </div>
          )}
        </div>

        {/* URLs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Download-URL
            </label>
            <input 
              type="url" 
              name="download_url"
              value={formData.download_url}
              onChange={handleChange}
              placeholder="https://example.com/download"
              className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Spiel-Bild URL
            </label>
            <input 
              type="url" 
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://example.com/game-image.jpg"
              className="w-full p-3 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400" 
            />
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded transition duration-200 transform hover:scale-105"
        >
          🎮 Spiel zur Bibliothek hinzufügen
        </button>
      </form>

      {/* Modal für Nachrichten */}
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
