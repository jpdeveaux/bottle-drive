import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicRequest } from './PublicRequest';
import { Login } from './Login';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute'; 
import Map from './Map';
import './map.css'

const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log('ID is '+GOOGLE_ID);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicRequest />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/map" 
              element={
                <ProtectedRoute>
                  <Map /> 
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
)