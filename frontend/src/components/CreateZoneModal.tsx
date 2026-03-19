import { useState } from 'react';
import { X, MapPin } from 'lucide-react';

interface ZoneModalProps {
  selectedCount: number;
  onSave: (name: string, color: string) => void;
  onClose: () => void;
}

export const CreateZoneModal = ({ selectedCount, onSave, onClose }: ZoneModalProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6'); // Default Tailwind Blue-500

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm" >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Create New Zone</h3>
          <button onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Zone Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., North End Sector 1"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Theme Color</label>
              <p className="text-xs text-gray-500">How this zone appears on the map</p>
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-20 cursor-pointer rounded border-none bg-transparent"
            />
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MapPin size={18} className="text-blue-500" />
            <span>Capturing <strong>{selectedCount}</strong> existing addresses</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name, color)}
            disabled={!name.trim()}
            className="flex-[2] px-4 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
          >
            Save Zone
          </button>
        </div>
      </div>
    </div>
  );
};