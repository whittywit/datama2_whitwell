import React, { useState } from 'react';

function App() {
  const [status, setStatus] = useState('Ready');

  const executeLogSync = async () => {
    setStatus('Processing...');
    try {
      const response = await fetch('http://localhost:5000/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1250.75,
          userId: "123e4567-e89b-12d3-a456-426614174000",
          metadata: { ip: "192.168.1.1", device: "Solo-Dev-Vite" }
        })
      });
      const result = await response.json();
      setStatus(result.success ? `Success: ${result.txnId}` : `Error: ${result.error}`);
    } catch (err) {
      setStatus('Backend Offline');
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white font-sans">
      <h1 className="text-4xl font-bold mb-6">LogSync Polyglot Portal</h1>
      <button 
        onClick={executeLogSync}
        className="bg-green-600 hover:bg-green-500 px-8 py-4 rounded-xl font-bold transition-all"
      >
        Run Dual-Database Write
      </button>
      <p className="mt-6 text-gray-400">System Status: {status}</p>
    </div>
  );
}

export default App;