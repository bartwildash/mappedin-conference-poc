import React from 'react';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: 'bold'
    }}>
      <div>
        <h1>🗺️ Mappedin Conference Map - React</h1>
        <p style={{ fontSize: '16px', fontWeight: 'normal', textAlign: 'center' }}>
          React version is loading...
        </p>
        <p style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
          The HTML version is fully working at <a href="http://localhost:5173" target="_blank">localhost:5173</a>
        </p>
      </div>
    </div>
  );
};

export default App;
