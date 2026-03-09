import { useState, useEffect } from 'react';
import { authFetch } from '../api'; // Your helper that includes the JWT
import type { User } from '@shared/types';

export const Dashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [bulkInput, setBulkInput] = useState('');
  const [message, setMessage] = useState('');
  const BACKEND = import.meta.env.VITE_API_URL;

  // 1. Fetch users on mount
  const fetchUsers = async () => {
    const res = await authFetch(`${BACKEND}/api/admin/users`);
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => { fetchUsers(); }, []);

  // 2. Handle Bulk Add (Comma or Space delimited)
  const handleBulkAdd = async () => {
    const emails = bulkInput.split(/[\s,]+/).filter(e => e.includes('@'));
    const res = await authFetch(`${BACKEND}/api/admin/users/bulk-add`, {
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
    const res = await authFetch(`${BACKEND}/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    if (res.ok) fetchUsers();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Control Panel</h1>

      {/* Bulk Add Section */}
      <div className="bg-white p-4 rounded shadow mb-8">
        <h2 className="font-semibold mb-2">Add Volunteers (Email list)</h2>
        <textarea 
          className="w-full p-2 border rounded h-24 mb-2"
          placeholder="email1@example.com, email2@nscc.ca..."
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
        />
        <button 
          onClick={handleBulkAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Pre-Approve Volunteers
        </button>
        {message && <p className="text-green-600 mt-2">{message}</p>}
      </div>

      {/* User Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{u.email}</td>
                <td className="p-3">
                  <select 
                    value={u.role} 
                    onChange={(e) => updateUser(u.id, { role: e.target.value as string })}
                    className="border rounded p-1"
                  >
                    <option value="volunteer">Volunteer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${u.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {u.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="p-3">
                  <button 
                    onClick={() => updateUser(u.id, { isApproved: !u.isApproved })}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {u.isApproved ? 'Revoke Access' : 'Approve Now'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};