import React, { useEffect, useState } from 'react';
import zoomSdk from '@zoom/appssdk';
import './App.css';

function App() {
  const [status, setStatus] = useState('Initializing...');
  const [zoomContext, setZoomContext] = useState(null);
  const [error, setError] = useState(null);

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
        
        console.log('Zoom SDK configured:', configResponse);

        // Get meeting context
        const context = await zoomSdk.getMeetingContext();
        setZoomContext(context);
        
        setStatus('Welcome to ZoomQuest! Zoom SDK Loaded.');
        console.log('Meeting context:', context);
      } catch (error) {
        setStatus('Error: Unable to load Zoom SDK');
        setError(error.message);
        console.error('Zoom SDK Error:', error);
      }
    }

    initializeZoomSDK();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="logo-container">
          <h1 className="app-title">🎮 ZoomQuest</h1>
          <p className="subtitle">Educational SDK Adventure</p>
        </div>
        
        <div className="status-card">
          <div className={`status-indicator ${error ? 'error' : 'success'}`}>
            {error ? '❌' : '✅'}
          </div>
          <p className="status-text">{status}</p>
          {error && <p className="error-text">Error: {error}</p>}
        </div>

        {zoomContext && (
          <div className="context-info">
            <h3>Meeting Information</h3>
            <p>Meeting ID: {zoomContext.meetingID || 'N/A'}</p>
            <p>Status: Connected to Zoom</p>
          </div>
        )}

        <div className="info-section">
          <p className="description">
            An interactive educational game that teaches developers about Zoom SDKs 
            through immersive gameplay.
          </p>
          <p className="next-steps">
            🚀 Next: Unity WebGL integration coming soon!
          </p>
        </div>
      </header>
    </div>
  );
}

export default App;
