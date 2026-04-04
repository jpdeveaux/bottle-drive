import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicRequest } from './components/PublicRequest';
import { Admin } from '@components/Admin';
import { Login } from '@components/Login';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthProvider';
import { ProtectedRoute } from '@components/ProtectedRoute'; 
import { CaptchaWrapper } from '@components/Captcha';
import Map from './components/Map';
import './assets/map.css'

const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CaptchaWrapper>
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
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <Admin /> 
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </GoogleOAuthProvider>
    </CaptchaWrapper>
  </StrictMode>
)