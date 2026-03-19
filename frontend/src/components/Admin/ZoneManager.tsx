import { authFetch } from "@auth";
import { useZones } from '@hooks/useZones';

export const ZoneManager = () => {
  const { zones } = useZones();

  const handleDeleteZone = async (id: string) => {
    if (!window.confirm("Delete this zone? This will unassign it from all addresses.")) return;
    try {
      await authFetch(`/zones/${id}`, { method: 'DELETE' });
    }
    catch (err) {
      console.error('Zone delete failed: ', err);
    }
  };
  
  return (
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
  <h3 className="text-lg font-bold mb-4">Active Zones</h3>
  <div className="space-y-3">
    {zones.map(zone => (
      <div key={zone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: zone.color }} />
          <span className="font-medium text-gray-700">{zone.name}</span>
        </div>
        <button 
          onClick={() => handleDeleteZone(zone.id)}
          className="text-red-500 hover:text-red-700 text-sm font-semibold p-2"
        >
          Delete
        </button>
      </div>
    ))}
  </div>
</div>
  );
};