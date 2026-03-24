import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@context/UseAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTitle } from '@hooks/useTitle';
import { useState, useEffect } from 'react';
import { socket } from "@hooks/useSocket";
import { User } from '@types';

interface NotApprovedType {
  name: string;
  id: string;
};

export const Login = () => {
  const { login, clearState, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [notApproved, setNotApproved] = useState<NotApprovedType>(null);
  
  const BACKEND = import.meta.env.VITE_API_URL;
  const TITLE = import.meta.env.VITE_TITLE;
  const redirectTo = searchParams.get('redirectTo') || '/map';

  useTitle(`${TITLE} - Login`);

  const handleSuccess = async (response) => {
    const res = await fetch(`${BACKEND}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: response.credential }),
    });

    if (res.ok) {
      console.log('Google - login ok');
      const data = await res.json();
      const user = data.user as User;
      login(data.token, user); 

      if(user.isApproved) {
        console.log('Google - login ok');
        navigate(redirectTo);
      }
      else {
        console.log('unverified login -- %s %s', user.name, user.id);
        setNotApproved({name: user.name, id: user.id});
      }
    } 
    else {
      const err = await res.json();
      window.alert('Login Error.');
      console.log('Login error: '+err);
    }
  };

  useEffect(() => {
    console.log('main useEffect called');
    if (!notApproved) return;

    console.log('adding not approved hooks');

    // connect with a random number as the user ID
    const userId = notApproved.id;
    console.log(`Connecting to server as ${userId}...`);

    socket.io.opts.query = { userId };
    socket.connect();
    console.log('-> connected ');

    socket.on('disconnect', () => {
      socket.io.opts.query = null;
      console.log(` ==> User ${userId} disconnected.`);
    });

    // Listen for the specific approval event for this user
    socket.on('account_approved', () => {
      console.log('approval received.');

      // log the user in, and navigate to the wherever they were going.
      refreshUser().then(() => {
        console.log('refreshed');
        console.log('token: '+localStorage.getItem('token'));
        console.log('user: '+localStorage.getItem('user')); 
        socket.io.opts.query = {};
        setNotApproved(null);
        socket.disconnect();
        console.log(' after disconnect');
        navigate('/map'); // Forward to the volunteer map
      });
    });

    socket.on('approval_timeout', () => {
      console.log(`User ${userId} approval connection timed out`);
      window.alert('Approval has timed out.  Log in again!');
      setNotApproved(null);
      socket.disconnect();
    });

    return () => {
      socket.off('account_approved');
      socket.off('approval_timeout');
    };
  }, [notApproved, navigate, refreshUser]);

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

  { /* if this user has not been approved yet, show this segment and wait for notification. */}
  {notApproved ? (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow-xl rounded-lg border border-gray-200 sm:px-10">
        <div className="text-center mb-8">
          {/* Pulsing clock icon to show activity */}
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-50 p-3 animate-pulse">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-lg font-semibold text-gray-700">Account Pending</h2>
          <p className="text-sm text-gray-500 mt-2">
            Hi, <span className="font-medium text-gray-900">{notApproved.name}</span>. <br />Please wait while an administrator grants you access.           
          </p>
          <div className="font-bold mt-3">Do not refresh your page!</div>
          <button
              onClick={clearState}
              className="mt-5 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Logout
            </button>
        </div>

      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">
          Need immediate help? Contact the Drive Coordinator.
        </p>
      </div>
    </div>

    ) : (

    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow-xl rounded-lg border border-gray-200 sm:px-10">
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold text-gray-700">Hello!</h2>
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
      
        <div className="mt-6 text-center">
          <a href="/" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
            ← Go to Pickup Request Form
          </a>
        </div>
      </div>
    </div>
    )}
</div>
  );
};