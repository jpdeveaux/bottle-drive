import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { PublicRequest } from './PublicRequest';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/request" element={<PublicRequest />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
