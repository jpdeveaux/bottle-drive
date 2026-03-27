import { MousePointer2, Square, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/UseAuth';
import { Role } from '@types';

export const Toolbar = ({ mode, setMode }: { mode: string, setMode: (m: string) => void }) => {

  const navigate = useNavigate();
  const { authState, logout } = useAuth();

  const goToDashboard = () => {
    console.log('Going to dashboard...');
    navigate('/admin');
  }

  return (
    <div className="z-[1000] flex flex-col bg-white p-2 rounded-xl shadow-2xl border border-gray-200">
      <button 
        onClick={logout}
        className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-gray-600 hover:bg-gray-300'>
        <LogOut size={18} />
        <span>Logout</span>
      </button>

      {/* Go to Dashboard (admin only) */}
      {authState.user?.role === Role.admin && (
        <button 
          onClick={goToDashboard}
          className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-gray-600 hover:bg-gray-300'>
          <Square size={18} />
          <span>Admin</span>
        </button>
      )}

      {/* Draw Zone Mode (admin only) */}
      {authState.user?.role === Role.admin && (
        <button 
          onClick={() => setMode(mode === 'idle' ? 'draw-zone' : 'idle')}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'draw-zone' 
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-300'
          }`}
        >
          <MousePointer2 size={18} />
          <span>Create Zone</span>
        </button>
      )}
    </div>
  );
};