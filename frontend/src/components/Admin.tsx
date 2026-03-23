import { useState } from 'react';
import { useTitle } from '@hooks/useTitle';
import { useAuth } from '@context/UseAuth';
import { useNavigate } from 'react-router-dom';
import { useSocket } from "@hooks/useSocket";
import { format } from 'date-fns';

// Sub-components (we'll assume these are defined in separate files)
import { AddressManager } from './Admin/AddressManager';
import { ZoneManager } from './Admin/ZoneManager';
import { UserManager } from './Admin/UserManager';

export const Admin = () => {
  const EVENT_DATE = new Date(import.meta.env.VITE_DATE_TIME);
  const EVENT_DATE_STR: string = format(EVENT_DATE, 'cccc, MMMM do, yyyy @ haaa');
  
  const [activeTab, setActiveTab] = useState<'users' | 'addresses' | 'zones'>('addresses');
  const { logout } = useAuth();

  const navigate = useNavigate();

  const tabs = [
    { id: 'addresses', label: 'Addresses' },
    { id: 'zones', label: 'Zones' },
    { id: 'users', label: 'Users' },
  ] as const;

  const goToMap = () => {
    console.log('Going to map...');
    navigate('/map');
  }

  const TITLE= import.meta.env.VITE_TITLE;
  useTitle(TITLE+' - Admin Dashboard');
  useSocket();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{TITLE} - Admin Control Panel</h1>
            <h2>{EVENT_DATE_STR}</h2>
          </div>
          <div className='flex gap-2'>
            <button 
                onClick={goToMap}
                className="bg-blue-600 text-white px-4 mb-4 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
              View Map
            </button>
            <button 
                onClick={logout}
                className="bg-blue-600 text-white px-4 mb-4 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-xl mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {activeTab === 'addresses' && <AddressManager />}
          {activeTab === 'zones' && <ZoneManager />}
          {activeTab === 'users' && <UserManager />}
        </div>
      </div>
    </div>
  );
};