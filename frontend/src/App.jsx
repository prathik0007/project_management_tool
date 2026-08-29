import { useState } from 'react';

function App() {
  // State to store the message received from backend
  const [responseMessage, setResponseMessage] = useState('');
  // State to track loading or error status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to call the backend API endpoint
  const handleTestBackend = async () => {
    setLoading(true);
    setError('');
    setResponseMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/test');
      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }
      const data = await res.json();
      // Store the message from backend response
      setResponseMessage(data.message);
    } catch (err) {
      console.error('Error connecting to backend:', err);
      setError('Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Project Management Tool</h1>
        <p className="status-badge">Frontend is working</p>
      </header>

      <main className="content-card">
        <h2>Backend Connection Test</h2>
        <p className="description">
          Click the button below to send a <code>GET /api/test</code> request to the Node.js / Express backend.
        </p>

        <button className="test-btn" onClick={handleTestBackend} disabled={loading}>
          {loading ? 'Testing...' : 'Test Backend'}
        </button>

        {/* Display success response */}
        {responseMessage && (
          <div className="response-box success">
            <span className="label">Backend Response:</span>
            <p className="message">{responseMessage}</p>
          </div>
        )}

        {/* Display error message if connection fails */}
        {error && (
          <div className="response-box error">
            <span className="label">Error:</span>
            <p className="message">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
