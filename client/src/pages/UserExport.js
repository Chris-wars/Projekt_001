import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';

export default function UserExport({ user }) {
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const fetchExports = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showModal('Anmeldung erforderlich', 'Bitte loggen Sie sich ein.', 'warning');
        return;
      }

      const response = await fetch('http://localhost:8000/admin/export/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExports(data.exports);
      } else if (response.status === 403) {
        showModal('Zugriff verweigert', 'Nur Administratoren können Export-Listen einsehen.', 'error');
      } else {
        showModal('Fehler', 'Fehler beim Laden der Export-Liste.', 'error');
      }
    } catch (error) {
      showModal('Verbindungsfehler', 'Fehler beim Verbinden mit dem Server.', 'error');
    }
  }, []);

  const createExport = async (type, role = null) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showModal('Anmeldung erforderlich', 'Bitte loggen Sie sich ein.', 'warning');
        return;
      }

      let endpoint = '';
      let description = '';

      switch (type) {
        case 'json':
          endpoint = '/admin/export/users/json';
          description = 'JSON-Export aller Nutzer';
          break;
        case 'csv':
          endpoint = '/admin/export/users/csv';
          description = 'CSV-Export aller Nutzer';
          break;
        case 'role':
          endpoint = `/admin/export/users/by-role/${role}`;
          description = `Export für Rolle: ${role}`;
          break;
        case 'summary':
          endpoint = '/admin/export/report/summary';
          description = 'Zusammenfassungsreport';
          break;
        default:
          throw new Error('Unbekannter Export-Typ');
      }

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showModal('Export erstellt', `${description} wurde erfolgreich erstellt.`, 'success');
        fetchExports(); // Liste aktualisieren
      } else if (response.status === 403) {
        showModal('Zugriff verweigert', 'Nur Administratoren können Exports erstellen.', 'error');
      } else {
        showModal('Fehler', `Fehler beim Erstellen des Exports: ${description}`, 'error');
      }
    } catch (error) {
      showModal('Verbindungsfehler', 'Fehler beim Verbinden mit dem Server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filename) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showModal('Anmeldung erforderlich', 'Bitte loggen Sie sich ein.', 'warning');
        return;
      }

      const response = await fetch(`http://localhost:8000/admin/export/download/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showModal('Download gestartet', `Datei ${filename} wird heruntergeladen.`, 'success');
      } else if (response.status === 403) {
        showModal('Zugriff verweigert', 'Nur Administratoren können Dateien herunterladen.', 'error');
      } else {
        showModal('Fehler', 'Fehler beim Download der Datei.', 'error');
      }
    } catch (error) {
      showModal('Verbindungsfehler', 'Fehler beim Verbinden mit dem Server.', 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  useEffect(() => {
    if (user && user.is_admin) {
      fetchExports();
    }
  }, [user, fetchExports]);

  // Prüfe, ob der aktuelle Nutzer Admin ist
  if (!user || !user.is_admin) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-gray-900 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-red-300 mb-4">❌ Zugriff verweigert</h2>
        <p className="text-gray-300">
          Nur Administratoren haben Zugriff auf die Export-Funktionen.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto mt-8 p-6 bg-gray-900 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-red-300">
            📁 Nutzer-Daten Export
            <span className="text-sm text-yellow-400 ml-2">👑 Admin-Bereich</span>
          </h2>
          <button
            onClick={fetchExports}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition"
          >
            🔄 Aktualisieren
          </button>
        </div>

        {/* Export-Aktionen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-red-300 mb-2">📋 Kompletter Export</h3>
            <div className="space-y-2">
              <button
                onClick={() => createExport('json')}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-3 py-2 rounded transition text-sm"
              >
                JSON Export
              </button>
              <button
                onClick={() => createExport('csv')}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-3 py-2 rounded transition text-sm"
              >
                CSV Export
              </button>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-red-300 mb-2">👑 Nur Admins</h3>
            <button
              onClick={() => createExport('role', 'admin')}
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white px-3 py-2 rounded transition text-sm"
            >
              Admin Export
            </button>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-red-300 mb-2">👨‍💻 Nur Entwickler</h3>
            <button
              onClick={() => createExport('role', 'developer')}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white px-3 py-2 rounded transition text-sm"
            >
              Entwickler Export
            </button>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-red-300 mb-2">📊 Reports</h3>
            <button
              onClick={() => createExport('summary')}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white px-3 py-2 rounded transition text-sm"
            >
              Zusammenfassung
            </button>
          </div>
        </div>

        {/* Export-Liste */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-red-300">📁 Verfügbare Export-Dateien</h3>
          </div>
          
          {exports.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              Keine Export-Dateien vorhanden. Erstellen Sie einen Export, um zu beginnen.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-3 text-red-300 font-semibold">Dateiname</th>
                    <th className="p-3 text-red-300 font-semibold">Typ</th>
                    <th className="p-3 text-red-300 font-semibold">Größe</th>
                    <th className="p-3 text-red-300 font-semibold">Erstellt</th>
                    <th className="p-3 text-red-300 font-semibold">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {exports.map((exportFile, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-700 transition">
                      <td className="p-3 text-gray-100 font-medium">{exportFile.filename}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          exportFile.type === 'JSON' 
                            ? 'bg-green-700 text-white' 
                            : 'bg-blue-700 text-white'
                        }`}>
                          {exportFile.type}
                        </span>
                      </td>
                      <td className="p-3 text-gray-300">{formatFileSize(exportFile.size)}</td>
                      <td className="p-3 text-gray-400 text-sm">{formatDate(exportFile.created)}</td>
                      <td className="p-3">
                        <button
                          onClick={() => downloadFile(exportFile.filename)}
                          className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm transition"
                        >
                          📥 Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          ⚠️ Export-Dateien enthalten sensible Nutzerdaten. Bitte verantwortungsvoll behandeln.
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-red-300 text-lg">Export wird erstellt...</div>
          </div>
        </div>
      )}

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
