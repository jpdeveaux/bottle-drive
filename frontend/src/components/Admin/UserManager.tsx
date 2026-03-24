import { useState, useEffect } from 'react';
import { authFetch } from '@auth'; 
import { socket } from "@hooks/useSocket";
import type { Role, User } from '@types';
import { useZones } from '@hooks/useZones';

export const UserManager = () => {
  const [bulkInput, setBulkInput] = useState('');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const { zones } = useZones();
 
  const handleBulkAdd = async () => {
    const emails = bulkInput.split(/[\s,]+/).filter(e => e.includes('@'));
    const res = await authFetch('/users/bulk-add', {
      method: 'POST',
      body: JSON.stringify({ emails })
    });
  
    if (res.ok) {
      setBulkInput('');
      setMessage(`Added ${emails.length} users!`);
      const users = await authFetch('/users');
      if (users.ok) setUsers(await users.json());
    };
  };
  
  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      await authFetch(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    }
    catch(err) {
      console.error('Update user failed: '+err);
    }
  };

  const approveUser = async(userId: string) => {
    try {
      console.log('approving user '+userId);
      await authFetch(`/users/${userId}/approve`, {
        method: 'PATCH'
      });
    }
    catch (err) {
      console.error('Approve failed: '+err);
    }
  };

  const deleteUser = async(userId: string) => {
    if (!window.confirm("Delete this user?")) return;
    
    try {
      console.log('Deleting user '+userId);
      await authFetch(`/users/${userId}`, {
        method: 'DELETE'
      });
    }
    catch (err) {
      console.error('Approve failed: '+err);
    }
  };

  const assignZones = async (userId: string, zoneIds: string[]) => {
    try {
      await authFetch(`/users/${userId}/zones`, {
        method: 'POST',
        body: JSON.stringify({ zoneIds })
      });
    }
    catch (err) {
      console.error('Assign zones failed: '+err);
    }
  };
  
  useEffect(()=>{
    const fetchUsers = async () => {
      const res = await authFetch('/users');
      if (res.ok) setUsers(await res.json());
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const handleUpdatedUser = (updatedUser: User) => {
      console.log("Updated user received - %s ", JSON.stringify(updatedUser));
      setUsers(currentUsers => currentUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleDeletedUser = (userId: string) => {
      console.log('User deleted - '+userId);
      setUsers(curUsers => curUsers.filter(u => u.id !== userId));
    };

    socket.on("userUpdated", handleUpdatedUser);
    socket.on("userDeleted", handleDeletedUser);
    console.log('userUpdated and userDeleted listeners added');

    return () => {
      socket.off("userUpdated", handleUpdatedUser);
      socket.off("userDeleted", handleDeletedUser);
      console.log("useEffect cleanup: userUpdated/userDeleted removed");
    };
  }, []);

  return (
  <div>
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
              <th className="px-4 py-3">Zones</th>
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
                  {/* Simple Multi-select for assigning zones */}
                  <select 
                    multiple
                    value={u.zones?.map(z => z.id)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      assignZones(u.id, selected);
                    }}
                    className="text-xs border rounded p-1"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {u.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button 
                    onClick={() => approveUser(u.id)}
                    disabled={u.isApproved}
                    className={`text-white px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${u.isApproved ? 'bg-gray-400' : 'bg-blue-600 text-white active:bg-blue-800 hover:bg-blue-400'}`}
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => deleteUser(u.id)}
                    className={'ml-5 cursor-pointer text-red-600 hover:text-red-800 text-xs font-bold uppercase'}
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
  </div>  
  );
};