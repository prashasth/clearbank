import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transfer from './pages/Transfer.jsx';
import AccountBalance from './pages/AccountBalance.jsx';
import AdminInbox from './pages/AdminInbox.jsx';
import Wizard from './pages/Wizard.jsx';

export default function App() {
  return (
    <NotificationProvider>
    <AuthProvider>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/transfer" element={
            <ProtectedRoute><Transfer /></ProtectedRoute>
          } />
          <Route path="/balance" element={
            <ProtectedRoute><AccountBalance /></ProtectedRoute>
          } />
          <Route path="/admin/inbox" element={<AdminInbox />} />
          <Route path="/admin/wizard" element={<Wizard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </NotificationProvider>
  );
}
