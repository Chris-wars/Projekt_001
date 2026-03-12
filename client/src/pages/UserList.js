import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';

export default function UserList({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const closeModal = () => {
    setModal({
      isOpen: false,
      title: '',
      message: '',
      type: 'info',
      isConfirm: false
    });
  };

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showModal('Anmeldung erforderlich', 'Bitte loggen Sie sich ein, um die Nutzerliste zu sehen.', 'warning');
        setLoading(false);
        return;
      }

      // Prüfe zuerst Admin-Endpoint, dann Entwickler-Endpoint
      let response;
      const endpoint = '/admin/users/';
      
      // Nur Administratoren haben Zugriff
      if (!user || !user.is_admin) {
        showModal('Zugriff verweigert', 'Nur Administratoren können Benutzer verwalten.', 'error');
        setLoading(false);
        return;
      }

      response = await fetch(`/api${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else if (response.status === 403) {
        showModal('Zugriff verweigert', 'Sie haben nicht die erforderlichen Berechtigungen für diese Funktion.', 'error');
      } else {
        showModal('Fehler', 'Fehler beim Laden der Nutzerliste.', 'error');
      }
    } catch (error) {
      showModal('Verbindungsfehler', 'Fehler beim Verbinden mit dem Server.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const toggleUserRole = async (userId, roleType, newValue) => {
    // Nur Entwickler-Status kann über Frontend geändert werden
    if (roleType === 'is_admin') {
      showModal('Admin-Rechte', 'Admin-Rechte können nur direkt in der Datenbank vergeben werden, nicht über das Frontend.', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showModal('Anmeldung erforderlich', 'Bitte loggen Sie sich ein.', 'warning');
        return;
      }

      const roleUpdate = {};
      roleUpdate[roleType] = newValue;

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleUpdate)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Aktualisiere die lokale Liste
        setUsers(prevUsers => 
          prevUsers.map(u => u.id === userId ? updatedUser : u)
        );

        const roleNames = {
          is_admin: 'Administrator',
          is_developer: 'Entwickler'
        };
        
        showModal(
          'Rolle geändert', 
          `${updatedUser.username} ist ${newValue ? 'jetzt' : 'nicht mehr'} ${roleNames[roleType]}.`, 
          'success'
        );
      } else if (response.status === 403) {
        showModal('Zugriff verweigert', 'Nur Administratoren können Rollen ändern.', 'error');
      } else {
        showModal('Fehler', 'Fehler beim Ändern der Rolle.', 'error');
      }
    } catch (error) {
      showModal('Verbindungsfehler', 'Fehler beim Verbinden mit dem Server.', 'error');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unbekannt';
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-red-300 text-lg">Lade Nutzerliste...</div>
      </div>
    );
  }

  // Prüfe, ob der aktuelle Nutzer Zugriff hat (nur Administratoren)
  if (!user || !user.is_admin) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-gray-900 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-red-300 mb-4">⚠️ Zugriff verweigert</h2>
        <p className="text-gray-300">
          Nur Administratoren haben Zugriff auf die Nutzerverwaltung. 
          Diese Seite ist nur für Benutzer mit Administrator-Rechten zugänglich.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          👑 Administrator-Rechte können nur über das Terminal vergeben werden.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto mt-8 p-6 bg-gray-900 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-red-300">
            👑 Nutzerverwaltung ({users.length} Benutzer)
            <span className="text-sm text-yellow-400 ml-2">Administrator-Bereich</span>
          </h2>
          <button
            onClick={fetchUsers}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition"
          >
            🔄 Aktualisieren
          </button>
        </div>

        {users.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            Keine Nutzer gefunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-3 text-red-300 font-semibold">Avatar</th>
                  <th className="pb-3 text-red-300 font-semibold">ID</th>
                  <th className="pb-3 text-red-300 font-semibold">Benutzername</th>
                  <th className="pb-3 text-red-300 font-semibold">E-Mail</th>
                  <th className="pb-3 text-red-300 font-semibold">Geburtsdatum</th>
                  <th className="pb-3 text-red-300 font-semibold">Rollen</th>
                  <th className="pb-3 text-red-300 font-semibold">Registriert</th>
                  {user.is_admin && <th className="pb-3 text-red-300 font-semibold">Aktionen</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((userData, index) => (
                  <tr 
                    key={userData.id} 
                    className={`border-b border-gray-800 hover:bg-gray-800 transition ${
                      userData.id === user.id ? 'bg-gray-800 border-red-700' : ''
                    }`}
                  >
                    <td className="py-4">
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-lg overflow-hidden">
                        {userData.avatar_url ? (
                          <img 
                            src={`http://localhost:8000${userData.avatar_url}`} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          '👤'
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-gray-300">
                      {userData.id}
                      {userData.id === user.id && (
                        <span className="ml-2 text-xs bg-red-700 text-white px-2 py-1 rounded">Du</span>
                      )}
                    </td>
                    <td className="py-4 text-gray-100 font-medium">{userData.username}</td>
                    <td className="py-4 text-gray-300">{userData.email}</td>
                    <td className="py-4 text-gray-300">
                      {userData.birth_date || userData.birth_year ? (
                        <div className="space-y-1">
                          <div>
                            {userData.birth_date ? (
                              (() => {
                                const birthDate = new Date(userData.birth_date);
                                return `${birthDate.toLocaleDateString('de-DE')}`;
                              })()
                            ) : (
                              userData.birth_year
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {userData.is_admin 
                              ? '👑 Auto-18+' 
                              : userData.birth_date
                                ? `Alter: ${(() => {
                                    const birthDate = new Date(userData.birth_date);
                                    const today = new Date();
                                    let age = today.getFullYear() - birthDate.getFullYear();
                                    const monthDiff = today.getMonth() - birthDate.getMonth();
                                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                      age--;
                                    }
                                    return age;
                                  })()} Jahre`
                                : `Alter: ${new Date().getFullYear() - userData.birth_year} Jahre`
                            }
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm">
                          {userData.is_admin ? 'Auto-18+' : 'Nicht angegeben'}
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex gap-1 flex-wrap">
                        {userData.is_admin && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-600 text-white">
                            👑 Admin
                          </span>
                        )}
                        {userData.is_developer && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-700 text-white">
                            👨‍💻 Entwickler
                          </span>
                        )}
                        {!userData.is_developer && !userData.is_admin && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-700 text-white">
                            🎮 User
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-gray-400 text-sm">
                      {formatDate(userData.created_at)}
                    </td>
                    {user.is_admin && (
                      <td className="py-4">
                        {userData.id !== user.id && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => toggleUserRole(userData.id, 'is_developer', !userData.is_developer)}
                              className={`px-2 py-1 text-xs rounded transition ${
                                userData.is_developer 
                                  ? 'bg-red-600 hover:bg-red-500 text-white' 
                                  : 'bg-gray-600 hover:bg-gray-500 text-white'
                              }`}
                              title={userData.is_developer ? 'Entwickler-Rechte entziehen' : 'Zu Entwickler machen'}
                            >
                              👨‍💻
                            </button>
                          </div>
                        )}
                        {userData.id === user.id && (
                          <span className="text-xs text-gray-500">Eigener Account</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-800 rounded border border-gray-700">
          <h3 className="text-lg font-semibold text-red-300 mb-2">📊 Statistiken</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-gray-300">
              <span className="font-medium">Gesamt Nutzer:</span> {users.length}
            </div>
            <div className="text-gray-300">
              <span className="font-medium">👑 Administratoren:</span> {users.filter(u => u.is_admin).length}
            </div>
            <div className="text-gray-300">
              <span className="font-medium">👨‍💻 Entwickler:</span> {users.filter(u => u.is_developer && !u.is_admin).length}
            </div>
            <div className="text-gray-300">
              <span className="font-medium">🎮 Regular Users:</span> {users.filter(u => !u.is_developer && !u.is_admin).length}
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          ⚠️ Diese Seite ist nur für Entwickler zugänglich. Nutzerdaten sind vertraulich zu behandeln.
        </div>
      </div>

      {/* Modal für Nachrichten */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        isConfirm={modal.isConfirm}
      />
    </>
  );
}
