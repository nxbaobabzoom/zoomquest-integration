import React, { useEffect, useState } from 'react';
import zoomSdk from '@zoom/appssdk';
import UnityGame from './UnityGame';
import ErrorBoundary from './ErrorBoundary';
import { logger } from './utils/logger';
import './App.css';

function App() {
  const [zoomContext, setZoomContext] = useState(null);
  const [error, setError] = useState(null);
  const [showUnityGame, setShowUnityGame] = useState(false);

  useEffect(() => {
    async function initializeZoomSDK() {
      try {
        // Configure Zoom SDK with required capabilities
        const configResponse = await zoomSdk.config({
          capabilities: [
            'expandApp',
            'openUrl',
            'getMeetingContext',
            'getMeetingParticipants'
          ],
          version: '0.16.0'
        });
        
        logger.log('Zoom SDK configured:', configResponse);

        // Get meeting context
        const context = await zoomSdk.getMeetingContext();
        setZoomContext(context);
        
        logger.log('Meeting context:', context);
      } catch (error) {
        setError(error.message);
        logger.error('Zoom SDK Error:', error);
      }
    }

    initializeZoomSDK();
  }, []);

  return (
    <div className="App">
      {!showUnityGame ? (
        <div className="App-header">
          <div className="header-content">
            <div className="logo-container">
              <h1 className="app-title">ZoomQuest</h1>
              <p className="subtitle">Learn Zoom SDKs through interactive gameplay</p>
            </div>
            
            <div className="main-content">
              <div className="welcome-card">
                <div className="status-badge">
                  <span className={`status-dot ${error ? 'error' : 'success'}`}></span>
                  <span className="status-label">
                    {error ? 'SDK Not Available' : 'Ready to Play'}
                  </span>
                </div>
                
                <p className="description">
                  Embark on an educational adventure that teaches Zoom SDK concepts 
                  through an immersive side-scrolling game experience.
                </p>

                <button 
                  className="start-game-button"
                  onClick={() => setShowUnityGame(true)}
                >
                  <span className="button-icon">🎮</span>
                  <span>Start Game</span>
                </button>
              </div>

              {zoomContext && (
                <div className="meeting-info">
                  <div className="info-item">
                    <span className="info-label">Meeting ID</span>
                    <span className="info-value">{zoomContext.meetingID || 'N/A'}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="error-notice">
                  <span className="error-icon">⚠️</span>
                  <span className="error-message">
                    Running outside Zoom environment. Game will work in Zoom App.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="game-view">
          <button 
            className="back-button-overlay"
            onClick={() => setShowUnityGame(false)}
            aria-label="Back to Menu"
          >
            <span className="back-icon">←</span>
          </button>
          <ErrorBoundary>
            <UnityGame />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}

export default App;
