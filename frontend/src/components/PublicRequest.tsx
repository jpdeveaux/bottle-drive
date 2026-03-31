import { useState, SubmitEvent } from 'react';
import { useTitle } from '@hooks/useTitle';
import { format, compareAsc } from 'date-fns';

export const PublicRequest = () => {
  const [street, setStreet] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const BACKEND = import.meta.env.VITE_API_URL;
  const ADDRESS_PLACEHOLDER = import.meta.env.VITE_ADDRESS_PLACEHOLDER;
  const TITLE = import.meta.env.VITE_TITLE;
  const EVENT_DATE = new Date(import.meta.env.VITE_DATE_TIME);
  const EVENT_DATE_STR: string = format(EVENT_DATE, 'cccc, MMMM do, yyyy @ haaa');
  const EVENT_DATE_SHORT: string = format(EVENT_DATE, 'MMM do, yyyy');
  const EVENT_IN_PAST: boolean = compareAsc(EVENT_DATE, new Date()) == -1;

  useTitle(`${TITLE}`);
  
  interface RequestPayload {
    street: string;
    notes: string;
  }

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (EVENT_IN_PAST && !window.confirm("The bottle drive has already started/happened.  Submit this address?")) {
      return;
    }

    setStatus('loading');

    try {
      const payload: RequestPayload = { street, notes };
      const res = await fetch(`${BACKEND}/api/public/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  };

  return (
<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
    <h1 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
      {TITLE}
    </h1> 
    <h2 className={`text-center text-2xl ${EVENT_IN_PAST ? 'text-red-800 font-bold' : 'text-gray-900'} tracking-tight mb-5`}>
      {EVENT_DATE_STR}
    </h2> 
    <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Request a Pickup</h1>
    
    {status === 'success' ? (
      <div className="text-center py-4">
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-4 font-medium">
          ✅ Request submitted successfully!
        </div>
        <div className="text-gray-700">
          Please have your refundables ready for pickup on {EVENT_DATE_SHORT}!
        </div>
      </div>
    ) : (
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Street Address
          </label>
          <input 
            type="text" 
            required 
            placeholder={ADDRESS_PLACEHOLDER}
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Optional Notes for Volunteer
          </label>
          <textarea 
            placeholder="e.g., Bags are behind the gate"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
          />
        </div>

        <button 
          type="submit" 
          disabled={status === 'loading'}
          className={`w-full py-3 px-4 rounded-md font-bold text-white shadow-sm transition-all ${
            status === 'loading' 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
          }`}
        >
          {status === 'loading' ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </span>
          ) : 'Submit Request'}
        </button>

        {status === 'error' && (
          <p className="text-red-600 text-sm font-medium text-center mt-2">
            ⚠️ Something went wrong. Please try again.
          </p>
        )}
      </form>
    )}
  </div>
</div>
  );
};