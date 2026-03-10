import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/UseAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTitle } from '../hooks/useTitle';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/map';

  const BACKEND = import.meta.env.VITE_API_URL;
  const TITLE = import.meta.env.VITE_TITLE;

  useTitle(`${TITLE} - Login`);

  const handleSuccess = async (response) => {
    const res = await fetch(`${BACKEND}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: response.credential }),
    });

    if (res.ok) {
      const data = await res.json();
      login(data.token, data.user); // Store string ID and Role
      navigate(redirectTo);
    }
  };

  return (
<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div className="sm:mx-auto sm:w-full sm:max-w-md">
    {/* You could place a small bottle drive logo here */}
    <h1 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
      {TITLE}
    </h1>
    <p className="mt-2 text-center text-sm text-gray-600">
      Volunteer & Organizer Portal
    </p>
  </div>

  <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div className="bg-white py-8 px-4 shadow-xl rounded-lg border border-gray-200 sm:px-10">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-700">Welcome Back</h2>
        <p className="text-xs text-gray-500 mt-1">Please sign in with your Google account to continue.</p>
      </div>

      <div className="flex justify-center">
        {/* The Google button handles its own internal styling, but we wrap it for alignment */}
        <div className="transform hover:scale-[1.02] transition-transform">
          <GoogleLogin 
            onSuccess={handleSuccess} 
            onError={() => console.log('Login Failed')} 
            useOneTap
            shape="rectangular"
            width="250"
          />
        </div>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-6">
        <div className="text-xs text-center text-gray-400">
          Authorized personnel only. Access is logged and monitored.
        </div>
      </div>
    </div>
    
    <div className="mt-6 text-center">
      <a href="/" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
        ← Go to Pickup Request Form
      </a>
    </div>
  </div>
</div>
  );
};