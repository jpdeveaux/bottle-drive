import { MousePointer2, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminToolbar = ({ mode, setMode }: { mode: string, setMode: (m: string) => void }) => {

  const navigate = useNavigate();

  const goToDashboard = () => {
    console.log('Going to dashboard...');
    navigate('/admin');
  }

  return (
    <div className="z-[1000] flex flex-col gap-2 bg-white p-2 rounded-xl shadow-2xl border border-gray-200">
     
      {/* Dashboard */}
      <button 
        onClick={goToDashboard}
        className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-gray-600 hover:bg-gray-300'>
        <Square size={18} />
        <span>Dashboard</span>
      </button>

      {/* Draw Zone Mode */}
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
    </div>
  );
};