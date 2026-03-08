import * as React from 'react';
import { useState } from 'react';

export const PublicRequest = () => {
  const [street, setStreet] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const BACKEND = import.meta.env.VITE_API_URL;
  const ADDRESS_PLACEHOLDER = import.meta.env.ADDRESS_PLACEHOLDER || '123 Main St, Halifax, NS';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch(`${BACKEND}/api/public/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ street, notes }),
      });

      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Thank you!</h2>
      <p>Your request has been added to our volunteer map.</p>
    </div>;
  }

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Request a Pickup</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block' }}>Street Address</label>
          <input 
            type="text" 
            required 
            placeholder={ADDRESS_PLACEHOLDER}
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block' }}>Notes for Volunteer</label>
          <textarea 
            placeholder="e.g., Bags are behind the gate"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', height: '80px' }}
          />
        </div>
        <button 
          type="submit" 
          disabled={status === 'loading'}
          style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {status === 'loading' ? 'Submitting...' : 'Submit Request'}
        </button>
        {status === 'error' && <p style={{ color: 'red' }}>Something went wrong. Please try again.</p>}
      </form>
    </div>
  );
};