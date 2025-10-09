import React from 'react';

export default function Modal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info', 
  isConfirm = false,
  confirmText = 'Ja',
  cancelText = 'Nein'
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'question':
        return '❓';
      default:
        return 'ℹ️';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-500 bg-green-900/20';
      case 'error':
        return 'border-red-500 bg-red-900/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-900/20';
      case 'question':
        return 'border-purple-500 bg-purple-900/20';
      default:
        return 'border-blue-500 bg-blue-900/20';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border-2 ${getTypeColor()}`}>
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">{getIcon()}</span>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        
        <p className="text-gray-300 mb-6 leading-relaxed whitespace-pre-line">
          {message}
        </p>
        
        <div className="flex justify-end gap-3">
          {isConfirm ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium"
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}