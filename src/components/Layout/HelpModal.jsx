import React from 'react';
import './HelpModal.css';

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
            <div className="help-modal-response">
              {response.split('\n').map((paragraph, index) => (
                <p key={index} className="help-modal-paragraph">
                  {paragraph}
                </p>
              ))}
            </div>
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
