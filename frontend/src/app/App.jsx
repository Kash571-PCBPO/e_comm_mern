import React, { useEffect, useState } from 'react';

// Runtime value (set by docker-entrypoint.sh at container start) takes
// priority so the same built image works in dev/qa/production unchanged.
// The Vite build-time var is only a fallback for `npm run dev` locally.
const API_BASE_URL = window.__ENV__?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL;

function App() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.success ? 'API reachable' : 'API responded with error'))
      .catch(() => setStatus('API not reachable'));
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>MERN E-Commerce</h1>
      <p>Backend status: {status}</p>
    </div>
  );
}

export default App;