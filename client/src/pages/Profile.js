import React, { useState } from 'react';
import Modal from '../components/Modal';

export default function Profile({ user, onLogout, onUserUpdate }) {
  const [avatar, setAvatar] = useState(user.avatar_url || null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState({
    username: user.username,
    email: user.email,
    is_developer: user.is_developer,
    is_admin: user.is_admin || false,
    birth_date: user.birth_date
  });
  
  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    isConfirm: false
  });

  const showModal = (title, message, type = 'info') => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      isConfirm: false
    });
  };

  const showConfirm = (title, message, onConfirm, confirmText = 'Ja', cancelText = 'Nein') => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'question',
      isConfirm: true,
      onConfirm,
      confirmText,
      cancelText
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      title: '',
      message: '',
      type: 'info',
      isConfirm: false
    });
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showModal('Datei zu groß', 'Die Datei ist zu groß. Maximale Größe: 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showModal('Ungültiger Dateityp', 'Bitte wählen Sie eine Bilddatei aus.', 'error');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        showModal('Anmeldung erforderlich', 'Bitte loggen Sie sich ein, um einen Avatar hochzuladen.', 'warning');
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch('http://localhost:8080/upload-avatar/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          const updatedUser = await response.json();
          setAvatar(updatedUser.avatar_url);
          if (onUserUpdate) {
            onUserUpdate(updatedUser);
          }
          showModal('Erfolg', 'Avatar erfolgreich hochgeladen!', 'success');
        } else {
          showModal('Upload-Fehler', 'Fehler beim Hochladen des Avatars.', 'error');
        }
      } catch (error) {
        showModal('Netzwerkfehler', 'Netzwerkfehler beim Hochladen des Avatars.', 'error');
      }
    }
  };

  const removeAvatar = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showModal('Anmeldung erforderlich', 'Bitte loggen Sie sich ein, um den Avatar zu entfernen.', 'warning');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/users/me/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar_url: "" })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setAvatar(null);
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
        showModal('Erfolg', 'Avatar entfernt.', 'success');
      } else {
        showModal('Fehler', 'Fehler beim Entfernen des Avatars.', 'error');
      }
    } catch (error) {
      showModal('Netzwerkfehler', 'Netzwerkfehler beim Entfernen des Avatars.', 'error');
    }
  };

  const saveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showModal('Sitzung abgelaufen', 'Ihre Sitzung ist abgelaufen oder ungültig. Bitte loggen Sie sich erneut ein, um Ihr Profil zu speichern.', 'warning');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/users/me/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedUser)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        let successMessage = 'Profil erfolgreich aktualisiert!';
        if (editedUser.is_developer !== user.is_developer) {
          const newRole = updatedUser.is_developer ? 'Entwickler' : 'User';
          successMessage = `Profil aktualisiert! Ihre Entwickler-Rolle: ${newRole}`;
        }
        showModal('Profil gespeichert', successMessage, 'success');
        
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
        
        setIsEditingProfile(false);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || `Ein Fehler ist aufgetreten (Status: ${response.status})`;
        showModal('Speicherfehler', `Fehler beim Speichern: ${errorMessage}`, 'error');
      }
    } catch (error) {
      showModal('Verbindungsfehler', 'Backend nicht erreichbar. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.', 'error');
    }
  };

  const handleEditProfile = () => {
    if (isEditingProfile) {
      // Warnung bei Entwickler-Rollen-Änderung (Admin-Rolle bleibt unverändert)
      if (editedUser.is_developer !== user.is_developer) {
        const message = `Sind Sie sicher, dass Sie ${editedUser.is_developer ? 'Entwickler-Rechte erhalten' : 'Entwickler-Rechte verlieren'} möchten?\n\n${
          editedUser.is_developer 
            ? "Als Entwickler erhalten Sie Zugriff auf Upload-Funktionen für Spiele."
            : "Als User können Sie keine Spiele mehr hochladen, nur noch kaufen und bewerten."
        }\n\nHinweis: Administrator-Rechte können nur per Terminal geändert werden.`;
        
        showConfirm(
          'Entwickler-Rolle ändern', 
          message,
          saveProfile,
          'Rolle ändern',
          'Abbrechen'
        );
        return;
      }
      
      // Direkt speichern wenn keine Rollen-Änderung
      saveProfile();
    } else {
      setIsEditingProfile(true);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-red-300 mb-4">Mein Profil</h2>
      <div className="max-w-md mx-auto mt-8 bg-gray-900 rounded-lg p-6 shadow-lg">
        {/* Avatar Bereich */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-700 rounded-full mb-4 flex items-center justify-center text-gray-400 text-2xl overflow-hidden">
              {avatar ? (
                <img 
                  src={`http://localhost:8080${avatar}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                '👤'
              )}
            </div>
            {avatar && (
              <button
                onClick={removeAvatar}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                title="Avatar entfernen"
              >
                ×
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <label className="text-red-400 hover:text-red-300 text-sm underline cursor-pointer">
              Avatar ändern
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
            {avatar && (
              <button
                onClick={removeAvatar}
                className="text-gray-400 hover:text-gray-300 text-sm underline"
              >
                Entfernen
              </button>
            )}
          </div>
        </div>
        
        {/* Benutzer Informationen */}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Benutzername</label>
            {isEditingProfile ? (
              <input
                type="text"
                value={editedUser.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full p-3 bg-gray-800 rounded text-gray-100 border border-gray-600 focus:border-red-400 focus:outline-none"
              />
            ) : (
              <div className="p-3 bg-gray-800 rounded text-gray-100">{user.username}</div>
            )}
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-1">E-Mail</label>
            {isEditingProfile ? (
              <input
                type="email"
                value={editedUser.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full p-3 bg-gray-800 rounded text-gray-100 border border-gray-600 focus:border-red-400 focus:outline-none"
              />
            ) : (
              <div className="p-3 bg-gray-800 rounded text-gray-100">{user.email}</div>
            )}
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-1">Geburtsdatum</label>
            {isEditingProfile && !user.is_admin ? (
              <div className="space-y-1">
                <input
                  type="date"
                  value={editedUser.birth_date || ''}
                  onChange={(e) => handleInputChange('birth_date', e.target.value || null)}
                  max={(() => {
                    const date = new Date();
                    date.setFullYear(date.getFullYear() - 6);
                    return date.toISOString().split('T')[0];
                  })()}
                  min="1900-01-01"
                  className="w-full p-3 bg-gray-800 rounded text-gray-100 border border-gray-600 focus:border-red-400 focus:outline-none"
                />
                <p className="text-xs text-gray-500">🔒 USK-Konform: Für Altersverifikation erforderlich (TT.MM.JJJJ)</p>
              </div>
            ) : (
              <div className="p-3 bg-gray-800 rounded text-gray-100">
                {user.birth_date || user.birth_year ? (
                  <div className="space-y-1">
                    <div>
                      {user.birth_date ? (
                        (() => {
                          const birthDate = new Date(user.birth_date);
                          const today = new Date();
                          let age = today.getFullYear() - birthDate.getFullYear();
                          const monthDiff = today.getMonth() - birthDate.getMonth();
                          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                          }
                          return `${birthDate.toLocaleDateString('de-DE')} (Alter: ${age} Jahre)`;
                        })()
                      ) : (
                        `${user.birth_year} (Alter: ${new Date().getFullYear() - user.birth_year} Jahre)`
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.is_admin 
                        ? '👑 Admin: Automatisch 18+ berechtigt' 
                        : '🔒 USK-verifiziert'
                      }
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    {user.is_admin ? 'Automatisch 18+ (Admin)' : 'Nicht angegeben'}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-1">Rollen</label>
            {isEditingProfile ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editedUser.is_developer}
                      onChange={(e) => handleInputChange('is_developer', e.target.checked)}
                      className="mr-2 text-red-400 focus:ring-red-400"
                    />
                    <span className="text-gray-200">👨‍💻 Entwickler</span>
                  </label>
                </div>
                <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
                  <div className="space-y-1">
                    {user.is_admin && (
                      <div>👑 Administrator-Rechte können nur per Terminal geändert werden</div>
                    )}
                    {editedUser.is_developer && (
                      <div>👨‍💻 Als Entwickler können Sie Spiele hochladen und verkaufen</div>
                    )}
                    {!editedUser.is_developer && (
                      <div>🎮 Als User können Sie Spiele kaufen und bewerten</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-800 rounded text-gray-100">
                <div className="flex gap-2 flex-wrap">
                  {user.is_admin && (
                    <span className="px-2 py-1 rounded text-sm font-medium bg-yellow-600 text-white">
                      👑 Administrator
                    </span>
                  )}
                  {user.is_developer && (
                    <span className="px-2 py-1 rounded text-sm font-medium bg-red-700 text-white">
                      👨‍💻 Entwickler
                    </span>
                  )}
                  {!user.is_developer && !user.is_admin && (
                    <span className="px-2 py-1 rounded text-sm font-medium bg-blue-700 text-white">
                      🎮 User
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {user.is_admin && '👑 Sie haben Administrator-Rechte'}
                  {user.is_developer && !user.is_admin && '👨‍💻 Sie haben Entwickler-Rechte'}
                  {!user.is_developer && !user.is_admin && '🎮 Sie sind als User registriert'}
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-1">Mitglied seit</label>
            <div className="p-3 bg-gray-800 rounded text-gray-100">Oktober 2025</div>
          </div>
        </div>
        
        {/* Aktionen */}
        <div className="mt-6 space-y-3">
          <button 
            onClick={handleEditProfile}
            className={`w-full font-bold py-2 rounded transition ${
              isEditingProfile 
                ? 'bg-green-700 hover:bg-green-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {isEditingProfile ? 'Änderungen speichern' : 'Profil bearbeiten'}
          </button>
          
          {isEditingProfile && (
            <button 
              onClick={() => {
                setIsEditingProfile(false);
                setEditedUser({
                  username: user.username,
                  email: user.email,
                  is_developer: user.is_developer,
                  is_admin: user.is_admin || false,
                  birth_year: user.birth_year
                });
              }}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded transition"
            >
              Abbrechen
            </button>
          )}
          
          <button 
            onClick={onLogout}
            className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded transition"
          >
            Ausloggen
          </button>
        </div>
      </div>
      
      {/* Modal für Nachrichten */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        isConfirm={modal.isConfirm}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
      />
    </>
  );
}