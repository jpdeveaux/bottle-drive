import { useNavigate } from 'react-router-dom';

interface AccessDeniedProps {
  code?: string | number;
  message?: string;
}

export const AccessDenied = ({ 
  code = "403", 
  message = "You do not have permission to view this page." 
}: AccessDeniedProps) => {
  const navigate = useNavigate();
  const TITLE = import.meta.env.VITE_TITLE;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {TITLE}
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-4 shadow-xl rounded-lg border border-gray-200 sm:px-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-50 p-3">
              <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">{code} - Access Denied</h2>
          <p className="mt-4 text-sm text-gray-500 leading-relaxed">
            {message}
          </p>

          <div className="mt-10 space-y-3">
            <button
              onClick={() => navigate(-1)}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};