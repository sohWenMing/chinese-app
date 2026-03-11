import React from 'react';
import './HelpModal.css';

// Safely convert markdown bold (**text**) to HTML bold tags
const parseMarkdownBold = (text) => {
  if (!text) return '';
  
  // First, escape HTML special characters to prevent XSS
  const escapeHtml = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  // Escape HTML first
  let escaped = escapeHtml(text);
  
  // Convert **text** to <strong>text</strong>
  // Using a non-greedy match to handle multiple bold sections
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  return escaped;
};

const HelpModal = ({ isOpen, onClose, response, isLoading, error }) => {
  if (!isOpen) return null;

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2 className="help-modal-title">🐻 Bobo's Help</h2>
          <button 
            className="help-modal-close" 
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="help-modal-body">
          {isLoading && (
            <div className="help-modal-loading">
              <div className="help-modal-spinner">🤔</div>
              <p className="help-modal-loading-text">
                Bobo is thinking...<br />
                <span className="help-modal-loading-subtext">This may take a few seconds</span>
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="help-modal-error">
              <div className="help-modal-error-icon">😅</div>
              <p className="help-modal-error-text">{error}</p>
              <button 
                className="help-modal-retry-button"
                onClick={onClose}
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && response && (
            <div 
              className="help-modal-response"
              dangerouslySetInnerHTML={{ __html: parseMarkdownBold(response) }}
            />
          )}
        </div>

        <div className="help-modal-footer">
          <button 
            className="help-modal-done-button" 
            onClick={onClose}
          >
            👍 Done!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
