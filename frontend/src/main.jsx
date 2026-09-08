import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Browse from './pages/Browse.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/"                      element={<App />} />
        <Route path="/forgot-password"       element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/browse"                element={<Browse />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)