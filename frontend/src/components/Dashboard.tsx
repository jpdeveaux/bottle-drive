import { useState, useEffect } from 'react';
import { authFetch } from '../api'; // Your helper that includes the JWT
import type { Address, Role, User } from '@shared/types';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../context/UseAuth';
import { AddressStatus } from '@shared/types';

export const Dashboard = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [bulkInput, setBulkInput] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const TITLE= import.meta.env.VITE_TITLE;

  // 1. Fetch users on mount
  const fetchUsers = async () => {
    const res = await authFetch('/users');
    if (res.ok) setUsers(await res.json());
  };

  // 2. Handle Bulk Add (Comma or Space delimited)
  const handleBulkAdd = async () => {
    const emails = bulkInput.split(/[\s,]+/).filter(e => e.includes('@'));
    const res = await authFetch('/users/bulk-add', {
      method: 'POST',
      body: JSON.stringify({ emails })
    });

    if (res.ok) {
      setBulkInput('');
      setMessage(`Added ${emails.length} users!`);
      fetchUsers(); // Refresh list
    }
  };

  // 3. Toggle Approval or Role
  const updateUser = async (id: string, updates: Partial<User>) => {
    const res = await authFetch(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    if (res.ok) fetchUsers();
  };

  const fetchAddresses = async () => {
    const res = await authFetch('/addresses');
    if (res.ok) setAddresses(await res.json());
  };

  useTitle(import.meta.env.VITE_TITLE+' - Admin Dashboard');

  useEffect(() => { 
    fetchUsers();  
    fetchAddresses(); 
  }, []);

  const handleLocationChange = async (id: string, data: Partial<Address>) => {
    try {
      console.log('updating to '+data.street);

      const update = await authFetch(`/addresses/${id}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (update.ok) {  
        setAddresses([await update.json()]);
      }
    } catch (err) {
      console.error("Location update failed", err);
    }
  };  

  const handleAction = async (id: string, data: Partial<Address> ) => {
    setLoading(true);
    try {
      const res = await authFetch(`/addresses/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      if (res.ok) fetchAddresses();
    } finally {
      setLoading(false);
    }
  };

  const handleReGeocode = async (id: string) => {
    setLoading(true);
    try {
      const res = await authFetch(`/addresses/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ reGeocode: true })
      });
      if (res.ok) fetchAddresses();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this entry?")) return;
    const res = await authFetch(`/addresses/${id}`, { method: 'DELETE' });
    if (res.ok) fetchAddresses();
  };

  const statuses = Object.values(AddressStatus);

  return (
<div className="p-6 max-w-6xl mx-auto">
  <div className="flex justify-between">
    <h1 className="text-2xl font-bold mb-6 text-gray-800">{TITLE} - Admin Control Panel</h1>
    <button 
        onClick={logout}
        className="bg-blue-600 text-white px-4 mb-4 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
      >
        Logout
    </button>
  </div>

  {/* Bulk Add Section */}
  <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
    <h2 className="font-semibold mb-3 text-gray-700">Add Volunteers (Comma-delimited Email list)</h2>
    <textarea 
      className="w-full p-3 border border-gray-300 rounded-md h-24 mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      placeholder="email1@example.com, email2@example.ca..."
      value={bulkInput}
      onChange={(e) => setBulkInput(e.target.value)}
    />
    <button 
      onClick={handleBulkAdd}
      className="bg-blue-600 text-white px-5 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
    >
      Pre-Approve Volunteers
    </button>
    {message && <p className="text-green-600 mt-3 text-sm font-medium">{message}</p>}
  </div>

  {/* User Management Table */}
  <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden mb-10">
    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-betweeen">
      <h2 className="text-lg font-semibold text-gray-800">Volunteer Access Control</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map(u => (
            <tr key={u.id} className="hover:bg-blue-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{u.email}</td>
              <td className="px-4 py-3">
                <select 
                  value={u.role} 
                  onChange={(e) => updateUser(u.id, { role: e.target.value as Role })}
                  className="bg-gray-50 border border-gray-300 rounded p-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="volunteer">Volunteer</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {u.isApproved ? 'Approved' : 'Pending'}
                </span>
              </td>
              <td className="px-4 py-3">
                <button 
                  onClick={() => updateUser(u.id, { isApproved: !u.isApproved })}
                  className={`text-xs font-bold uppercase tracking-wider ${u.isApproved ? 'text-red-600 hover:text-red-800' : 'text-blue-600 hover:text-blue-800'}`}
                >
                  {u.isApproved ? 'Revoke' : 'Approve'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>

  {/* Address Database Table */}
  <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Address Database Review</h2>
        <button 
          onClick={fetchAddresses}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-1 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <svg 
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
        {addresses.length} Entries
      </span>
    </div>    
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3">Street / Submission</th>
            <th className="px-4 py-3">Geocode Status</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {addresses.map((addr: Address) => (
            <tr key={addr.id} className="hover:bg-blue-50 transition-colors">
              <td className="px-4 py-3">
                <input 
                  className="w-full bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none py-0.5 font-medium text-gray-900"
                  defaultValue={addr.street}
                  onBlur={(e) => {
                    if (e.target.value !== addr.street) handleLocationChange(addr.id, { street: e.target.value });
                  }}
                />
                <input 
                  className="w-full bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none text-xs text-gray-500 italic mt-1"
                  defaultValue={addr.notes || ''}
                  placeholder="Add notes..."
                  onBlur={(e) => {
                    if (e.target.value !== (addr.notes || '')) handleAction(addr.id, { notes: e.target.value });
                  }}
                />
              </td>
              <td className="px-4 py-3">
                {!addr.lat ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    ⚠️ MISSING
                  </span>
                ) : (
                  <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                    {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <select 
                  value={addr.status}
                  onChange={(e) => handleAction(addr.id, { status: e.target.value })}
                  className="cap bg-gray-50 border border-gray-300 rounded p-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                >
                 {statuses.map((status) => (
                    <option value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 space-x-3 whitespace-nowrap">
                <button 
                  onClick={() => handleReGeocode(addr.id)}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 text-xs font-bold uppercase"
                >
                  Re-Geo
                </button>
                <button 
                  onClick={() => handleDelete(addr.id)}
                  className="cursor-pointer text-red-600 hover:text-red-800 text-xs font-bold uppercase"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</div>
  );
};