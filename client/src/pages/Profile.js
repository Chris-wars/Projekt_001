import React, { useState } from 'react';

export default function Profile({ user, onLogout, onUserUpdate }) {
  const [avatar, setAvatar] = useState(user.avatar || null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState({
    username: user.username,
    email: user.email,
    is_developer: user.is_developer
  });

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validierung
      if (file.size > 5 * 1024 * 1024) { // 5MB Limit
        alert('Die Datei ist zu groß. Maximale Größe: 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Bitte wählen Sie eine Bilddatei aus.');
        return;
      }

      // File Reader für Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e.target.result);
        // Hier würde normalerweise der Upload zum Backend erfolgen
        console.log('Avatar würde zum Backend hochgeladen werden');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
    // Hier würde der Avatar im Backend gelöscht werden
    console.log('Avatar würde im Backend gelöscht werden');
  };

  const handleEditProfile = async () => {
    console.log('handleEditProfile aufgerufen, isEditingProfile:', isEditingProfile);
    console.log('Aktuelle Benutzerdaten:', user);
    console.log('Bearbeitete Daten:', editedUser);
    
    if (isEditingProfile) {
      // Warnung bei Rollen-Änderung
      if (editedUser.is_developer !== user.is_developer) {
        const roleChange = editedUser.is_developer ? 'Entwickler' : 'User';
        const confirmChange = window.confirm(
          `Sind Sie sicher, dass Sie Ihre Rolle zu "${roleChange}" ändern möchten?\n\n` +
          (editedUser.is_developer 
            ? "Als Entwickler erhalten Sie Zugriff auf Upload-Funktionen für Spiele."
            : "Als User können Sie keine Spiele mehr hochladen, nur noch kaufen und bewerten."
          )
        );
        
        if (!confirmChange) {
          console.log('Rollen-Änderung abgebrochen');
          return; // Abbruch ohne Änderung
        }
      }

      // Prüfe ob Token vorhanden ist
      const token = localStorage.getItem('token');
      console.log('Token vorhanden:', !!token);
      console.log('Token:', token);

      // Speichern der Änderungen
      try {
        console.log('Versuche Backend-Update...');
        
        // Versuche Backend-Update auch mit Fake Token
        const response = await fetch('http://localhost:8080/users/me/', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(editedUser)
        });

        console.log('Response Status:', response.status);
        console.log('Response Headers:', response.headers);

        if (response.ok) {
          const updatedUser = await response.json();
          console.log('Profil erfolgreich aktualisiert:', updatedUser);
          
          // Spezielle Erfolgs-Nachricht bei Rollen-Änderung
          let successMessage = 'Profil erfolgreich aktualisiert!';
          if (editedUser.is_developer !== user.is_developer) {
            const newRole = updatedUser.is_developer ? 'Entwickler' : 'User';
            successMessage = `Profil aktualisiert! Ihre neue Rolle: ${newRole}`;
          }
          alert(successMessage);
          
          // User-State in der App aktualisieren
          if (onUserUpdate) {
            console.log('Rufe onUserUpdate auf...');
            onUserUpdate(updatedUser);
          }
          
        } else {
          const errorText = await response.text();
          console.error('Backend-Fehler:', response.status, errorText);
          
          // Fallback zu lokaler Simulation bei Backend-Fehlern
          console.log('Backend-Fehler - verwende lokale Simulation als Fallback');
          const simulatedUpdatedUser = {
            ...user,
            ...editedUser
          };
          
          console.log('Simulierte Aktualisierung nach Backend-Fehler:', simulatedUpdatedUser);
          alert(`Backend-Fehler (${response.status}) - Änderungen wurden lokal gespeichert`);
          
          // User-State in der App aktualisieren
          if (onUserUpdate) {
            console.log('Rufe onUserUpdate mit Fallback-Daten auf...');
            onUserUpdate(simulatedUpdatedUser);
          }
        }
      } catch (error) {
        console.error('Netzwerk-Fehler beim Speichern des Profils:', error);
        
        // Fallback zu lokaler Simulation bei Netzwerkfehlern
        console.log('Backend nicht erreichbar - verwende lokale Simulation');
        const simulatedUpdatedUser = {
          ...user,
          ...editedUser
        };
        
        console.log('Simulierte Aktualisierung nach Netzwerkfehler:', simulatedUpdatedUser);
        alert('Backend nicht erreichbar - Änderungen wurden lokal gespeichert');
        
        // User-State in der App aktualisieren
        if (onUserUpdate) {
          console.log('Rufe onUserUpdate mit Fallback-Daten auf...');
          onUserUpdate(simulatedUpdatedUser);
        }
      }
    }
    
    console.log('Wechsel Edit-Modus von', isEditingProfile, 'zu', !isEditingProfile);
    setIsEditingProfile(!isEditingProfile);
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
                  src={avatar} 
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
            <label className="block text-gray-400 text-sm mb-1">Rolle</label>
            {isEditingProfile ? (
              <div className="space-y-2">
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      checked={!editedUser.is_developer}
                      onChange={() => handleInputChange('is_developer', false)}
                      className="mr-2 text-red-400 focus:ring-red-400"
                    />
                    <span className="text-gray-200">User</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      checked={editedUser.is_developer}
                      onChange={() => handleInputChange('is_developer', true)}
                      className="mr-2 text-red-400 focus:ring-red-400"
                    />
                    <span className="text-gray-200">Entwickler</span>
                  </label>
                </div>
                <div className="text-xs text-gray-500">
                  {editedUser.is_developer 
                    ? '👨‍💻 Als Entwickler können Sie Spiele hochladen und verkaufen'
                    : '🎮 Als User können Sie Spiele kaufen und bewerten'
                  }
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-800 rounded text-gray-100">
                <span className={`px-2 py-1 rounded text-sm ${user.is_developer ? 'bg-red-700 text-white' : 'bg-blue-700 text-white'}`}>
                  {user.is_developer ? 'Entwickler' : 'User'}
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  {user.is_developer 
                    ? '👨‍💻 Sie haben Entwickler-Rechte'
                    : '🎮 Sie sind als User registriert'
                  }
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-1">Mitglied seit</label>
            <div className="p-3 bg-gray-800 rounded text-gray-100">Oktober 2025</div>
          </div>
        </div>
        
        {/* Test-Bereich für Debugging */}
        <div className="mt-6 p-4 bg-gray-800 rounded border">
          <h3 className="text-lg font-semibold text-red-300 mb-2">🐛 Debug-Informationen</h3>
          <div className="text-sm text-gray-300 space-y-1">
            <div>Token vorhanden: {localStorage.getItem('token') ? '✅ Ja' : '❌ Nein'}</div>
            <div>Token Typ: {localStorage.getItem('token') === 'fake-token-for-testing' ? '🔄 Fake Token (Fallback wird verwendet)' : '🔑 Echtes Token'}</div>
            <div>User ID: {user?.id || 'Nicht verfügbar'}</div>
            <div>Aktueller Username: {user?.username || 'Nicht verfügbar'}</div>
            <div>Aktuelle E-Mail: {user?.email || 'Nicht verfügbar'}</div>
            <div>Aktuelle Rolle: {user?.is_developer ? 'Entwickler' : 'User'}</div>
            <div>Edit-Modus: {isEditingProfile ? '✅ Aktiv' : '❌ Inaktiv'}</div>
            <div>Bearbeiteter Username: {editedUser?.username || 'Nicht verfügbar'}</div>
            <div>Bearbeitete E-Mail: {editedUser?.email || 'Nicht verfügbar'}</div>
            <div>Bearbeitete Rolle: {editedUser?.is_developer ? 'Entwickler' : 'User'}</div>
            <div>onUserUpdate verfügbar: {onUserUpdate ? '✅ Ja' : '❌ Nein'}</div>
            
            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => {
                  console.log('=== DEBUG INFO ===');
                  console.log('User:', user);
                  console.log('EditedUser:', editedUser);
                  console.log('Token:', localStorage.getItem('token'));
                  console.log('isEditingProfile:', isEditingProfile);
                  console.log('onUserUpdate verfügbar:', !!onUserUpdate);
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded"
              >
                Console Debug
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:8080/', {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    });
                    const data = await response.json();
                    alert(`Backend Test: ${JSON.stringify(data)}`);
                  } catch (error) {
                    alert(`Backend Fehler: ${error.message}`);
                  }
                }}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded"
              >
                Backend Test
              </button>
              
              <button 
                onClick={() => {
                  const testUpdate = {
                    ...user,
                    username: 'TEST_UPDATE_' + Date.now(),
                    is_developer: !user.is_developer
                  };
                  console.log('Test-Update:', testUpdate);
                  if (onUserUpdate) {
                    onUserUpdate(testUpdate);
                    alert('Test-Update durchgeführt! Schauen Sie, ob sich die UI ändert.');
                  } else {
                    alert('❌ onUserUpdate nicht verfügbar!');
                  }
                }}
                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded"
              >
                Test UI-Update
              </button>
            </div>
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
                  is_developer: user.is_developer
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
    </>
  );
}