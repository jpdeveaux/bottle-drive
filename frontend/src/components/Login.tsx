import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/UseAuth';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const BACKEND = import.meta.env.VITE_API_URL;

  const handleSuccess = async (response) => {
    const res = await fetch(`${BACKEND}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: response.credential }),
    });

    if (res.ok) {
      const data = await res.json();
      login(data.token, data.user); // Store string ID and Role
      navigate('/map'); // Go to the map
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
      <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #ccc' }}>
        <h2>Volunteer Portal</h2>
        <GoogleLogin onSuccess={handleSuccess} onError={() => console.log('Login Failed')} />
      </div>
    </div>
  );
};