import React, { useState } from 'react';

function App() {
  const [status, setStatus] = useState('Idle');

  const handleTransaction = async () => {
    setStatus('Processing...');
    try {
      const response = await fetch('http://localhost:5000/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1500.50,
          userId: "550e8400-e29b-41d4-a716-446655440000",
          metadata: { ip: "127.0.0.1", device: "Chrome-Vite-App" }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setStatus(`Success! Txn ID: ${result.transaction_id}`);
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus('Network Error: Check if Backend is running.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
      <h1 className="text-3xl font-bold mb-4">LogSync Transaction Portal</h1>
      <button 
        onClick={handleTransaction}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
      >
        Execute Secure Transaction
      </button>
      <p className="mt-4 text-slate-400">Status: {status}</p>
    </div>
  );
}

export default App;