import { authFetch } from '@auth'; 
import type { Address } from '@shared/types';
import { AddressStatus } from '@shared/types';
import { BlurInput } from './BlurInput';
import { useAddresses } from '@hooks/useAddresses';

export const AddressManager = () => {
  const { addresses } = useAddresses();  // this sets up addresses state variable, along with useEffect hooks.
 
  const handleLocationChange = async (id: string, data: Partial<Address>) => {
    try {
      console.log('Sending updated address data - '+data.street);
      await authFetch(`/addresses/${id}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error("Location update failed: ", err);
    }
  };  

  const handleUpdateStatus = async (id: string, data: Partial<Address> ) => {
    try {
      console.log('Updating address - ', data);
      await authFetch(`/addresses/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error("Location status update failed: ", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await authFetch(`/addresses/${id}`, { method: 'DELETE' });
    }
    catch (err) {
      console.error("Location delete failed: ", err);
    }
  };

  const statuses = Object.values(AddressStatus);

  return (  
  <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
      <h2 className="text-lg font-semibold text-gray-800">Address Database Review</h2>
      <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
        {addresses.length} Entries
      </span>
    </div>    
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3">Zone</th>
            <th className="px-4 py-3">Street / Submission</th>
            <th className="px-4 py-3">Geocode Status</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {addresses.map((addr) => (
            <tr key={addr.id} className="hover:bg-blue-50 transition-colors">
              <td className="px-4 py-3">
                <span>{addr.zone?.name || '---'}</span>
              </td>
              <td className="px-4 py-3">
                <BlurInput 
                  className="w-full bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none py-0.5 font-medium text-gray-900"
                  value={addr.street}
                  onCommit={(street) => { handleLocationChange(addr.id, { street }); }}
                />
                <BlurInput 
                  className="w-full bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none text-xs text-gray-500 italic mt-1"
                  value={addr.notes || ''}
                  placeholder="Add notes..."
                  onCommit={(notes) => { handleUpdateStatus(addr.id, { notes }) }}
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
                  onChange={(e) => handleUpdateStatus(addr.id, { status: e.target.value })}
                  className="cap bg-gray-50 border border-gray-300 rounded p-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                >
                 {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 space-x-3 whitespace-nowrap">
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
  );
};